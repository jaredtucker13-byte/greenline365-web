import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  createTask,
  getRoleByName,
  getRolesByDepartment,
  logEvent,
  type Department,
  type TaskPriority,
} from '@/lib/swf/mcp-integration';

// ---------------------------------------------------------------------------
// Supabase admin client
// ---------------------------------------------------------------------------

function getAdminClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// ---------------------------------------------------------------------------
// Vibe Command parser — turns natural language into structured intent
// ---------------------------------------------------------------------------

interface ParsedVibeCommand {
  intent: string;
  department: Department | null;
  target_role: string | null;
  priority: TaskPriority;
  parameters: Record<string, unknown>;
}

const DEPARTMENT_KEYWORDS: Record<string, Department> = {
  // Executive
  ceo: 'executive', audit: 'executive', chief: 'executive', approve: 'executive', veto: 'executive',

  // Growth / Sales
  sales: 'growth_sales', lead: 'growth_sales', outreach: 'growth_sales', scrape: 'growth_sales',
  prospect: 'growth_sales', close: 'growth_sales', pipeline: 'growth_sales', research: 'growth_sales',

  // Operations
  booking: 'operations', schedule: 'operations', dispatch: 'operations', logistics: 'operations',
  inventory: 'operations', appointment: 'operations',

  // Customer Success
  support: 'success', customer: 'success', ticket: 'success', onboard: 'success',
  retention: 'success', feedback: 'success', complaint: 'success',

  // Dev / IT
  code: 'dev_it', deploy: 'dev_it', bug: 'dev_it', test: 'dev_it', security: 'dev_it',
  devops: 'dev_it', api: 'dev_it', database: 'dev_it', frontend: 'dev_it', backend: 'dev_it',

  // Creative
  content: 'creative', blog: 'creative', seo: 'creative', social: 'creative', design: 'creative',
  brand: 'creative', video: 'creative', email: 'creative', copy: 'creative', marketing: 'creative',
  newsletter: 'creative', campaign: 'creative',
};

const PRIORITY_KEYWORDS: Record<string, TaskPriority> = {
  urgent: 'critical', asap: 'critical', emergency: 'critical', critical: 'critical', immediately: 'critical',
  important: 'high', high: 'high', priority: 'high', soon: 'high',
  low: 'low', whenever: 'low', backlog: 'low', eventually: 'low',
};

const ROLE_KEYWORDS: Record<string, string> = {
  'write a blog': 'Content Writer',
  'write content': 'Content Writer',
  'create content': 'Content Writer',
  'seo audit': 'SEO Specialist',
  'seo analysis': 'SEO Specialist',
  'social media': 'Social Media Manager',
  'social post': 'Social Media Manager',
  'scrape leads': 'Lead Scraper',
  'find leads': 'Lead Scraper',
  'send email': 'Email Marketing Specialist',
  'email campaign': 'Email Marketing Specialist',
  'design': 'Brand Designer',
  'brand guide': 'Brand Designer',
  'video': 'Video Producer',
  'fix bug': 'Senior Developer',
  'deploy': 'DevOps Engineer',
  'security': 'Security Engineer',
  'test': 'QA Engineer',
  'frontend': 'Frontend Developer',
  'backend': 'Backend Developer',
  'support ticket': 'Support Agent L1',
  'onboard': 'Onboarding Specialist',
  'book appointment': 'Booking Manager',
  'schedule': 'Scheduling Coordinator',
  'analytics': 'Analytics Manager',
  'competitor': 'Market Researcher',
  'research': 'Market Researcher',
};

function parseVibeCommand(command: string): ParsedVibeCommand {
  const lower = command.toLowerCase();

  // Detect department
  let department: Department | null = null;
  for (const [keyword, dept] of Object.entries(DEPARTMENT_KEYWORDS)) {
    if (lower.includes(keyword)) {
      department = dept;
      break;
    }
  }

  // Detect priority
  let priority: TaskPriority = 'medium';
  for (const [keyword, p] of Object.entries(PRIORITY_KEYWORDS)) {
    if (lower.includes(keyword)) {
      priority = p;
      break;
    }
  }

  // Detect target role
  let targetRole: string | null = null;
  for (const [pattern, role] of Object.entries(ROLE_KEYWORDS)) {
    if (lower.includes(pattern)) {
      targetRole = role;
      break;
    }
  }

  return {
    intent: command,
    department,
    target_role: targetRole,
    priority,
    parameters: {},
  };
}

// ---------------------------------------------------------------------------
// POST — Accept a vibe command, parse it, create a task
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { command, priority: overridePriority, target_role: overrideRole } = body;

    if (!command || typeof command !== 'string') {
      return NextResponse.json({ error: 'Missing "command" field' }, { status: 400 });
    }

    // Parse the vibe command
    const parsed = parseVibeCommand(command);

    // Allow overrides from the request body
    if (overridePriority) parsed.priority = overridePriority;
    if (overrideRole) parsed.target_role = overrideRole;

    // Resolve the target role to an ID
    let assignedRoleId: string | null = null;
    if (parsed.target_role) {
      const role = await getRoleByName(parsed.target_role);
      assignedRoleId = role?.id ?? null;
    }

    // If no specific role but we have a department, assign to the department lead
    if (!assignedRoleId && parsed.department) {
      const deptRoles = await getRolesByDepartment(parsed.department);
      // Look for a "Lead" role first, otherwise take the first role
      const leadRole = deptRoles.find(
        (r) => r.role_name.toLowerCase().includes('lead') || r.role_name.toLowerCase().includes('director'),
      );
      assignedRoleId = leadRole?.id ?? deptRoles[0]?.id ?? null;
    }

    // Create the task
    const task = await createTask({
      vibe_command: command,
      parsed_intent: {
        ...parsed,
        raw_command: command,
        parsed_at: new Date().toISOString(),
      },
      assigned_role_id: assignedRoleId ?? undefined,
      priority: parsed.priority,
    });

    if (!task) {
      return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
    }

    // Log the vibe command event
    await logEvent({
      event_type: 'vibe_command',
      task_id: task.id,
      agent_role_id: assignedRoleId ?? undefined,
      payload: {
        command,
        parsed_department: parsed.department,
        parsed_role: parsed.target_role,
        parsed_priority: parsed.priority,
      },
    });

    return NextResponse.json({
      success: true,
      task_id: task.id,
      assigned_role: parsed.target_role,
      department: parsed.department,
      priority: parsed.priority,
      status: assignedRoleId ? 'queued' : 'pending_assignment',
      message: assignedRoleId
        ? `Task assigned to ${parsed.target_role ?? parsed.department} and queued for processing`
        : 'Task created but no matching role found — assign manually or refine the command',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[SWF/Dashboard] Error:', message);
    return NextResponse.json({ error: 'Internal server error', details: message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// GET — Return dashboard data (tasks, traces, events)
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') ?? '50', 10);
    const status = url.searchParams.get('status');
    const department = url.searchParams.get('department');

    const supabase = getAdminClient();

    // Fetch recent tasks
    let tasksQuery = supabase
      .from('task_queue')
      .select('*, workforce_roles(role_name, department, model_tier)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) {
      tasksQuery = tasksQuery.eq('status', status);
    }

    const { data: tasks, error: tasksError } = await tasksQuery;

    if (tasksError) {
      console.error('[SWF/Dashboard] Tasks query error:', tasksError.message);
    }

    // Filter by department if requested (post-query since it's a join)
    let filteredTasks = tasks ?? [];
    if (department) {
      filteredTasks = filteredTasks.filter(
        (t: Record<string, unknown>) => {
          const role = t.workforce_roles as Record<string, unknown> | null;
          return role?.department === department;
        },
      );
    }

    // Fetch recent events
    const { data: events, error: eventsError } = await supabase
      .from('event_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (eventsError) {
      console.error('[SWF/Dashboard] Events query error:', eventsError.message);
    }

    // Fetch recent reasoning traces
    const { data: traces, error: tracesError } = await supabase
      .from('reasoning_traces')
      .select('*, workforce_roles(role_name, department)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (tracesError) {
      console.error('[SWF/Dashboard] Traces query error:', tracesError.message);
    }

    // Aggregate stats
    const { data: roleCount } = await supabase
      .from('workforce_roles')
      .select('id', { count: 'exact', head: true });

    const { data: pendingTasks } = await supabase
      .from('task_queue')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending');

    const { data: activeTasks } = await supabase
      .from('task_queue')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'in_progress');

    return NextResponse.json({
      tasks: filteredTasks,
      events: events ?? [],
      traces: traces ?? [],
      stats: {
        total_roles: roleCount ?? 0,
        pending_tasks: pendingTasks ?? 0,
        active_tasks: activeTasks ?? 0,
        recent_events: events?.length ?? 0,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[SWF/Dashboard] GET Error:', message);
    return NextResponse.json({ error: 'Internal server error', details: message }, { status: 500 });
  }
}
