/**
 * SWF MCP Integration Layer
 *
 * Provides tool definitions and execution wrappers for the
 * Sovereign Workforce Factory agent system. Agents call these
 * tools during task execution via the Smart Router.
 */

import { createClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ModelTier =
  | 'opus_4.6'
  | 'gpt_4o'
  | 'haiku'
  | 'perplexity'
  | 'dalle3'
  | 'nana_banana';

export type Department =
  | 'executive'
  | 'growth_sales'
  | 'operations'
  | 'success'
  | 'dev_it'
  | 'creative';

export type TraceStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'escalated'
  | 'vetoed'
  | 'signed_off';

export type SWFEventType =
  | 'vibe_command'
  | 'task_spawned'
  | 'worker_started'
  | 'worker_completed'
  | 'escalation'
  | 'audit_pass'
  | 'audit_fail'
  | 'action_committed'
  | 'system_error';

export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';

export interface WorkforceRole {
  id: string;
  role_name: string;
  department: Department;
  model_tier: ModelTier;
  system_prompt: string;
  permissions: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ReasoningTrace {
  id: string;
  task_id: string;
  agent_role_id: string;
  input_prompt: string;
  reasoning_text: string | null;
  tool_calls: Record<string, unknown>[] | null;
  output_result: string | null;
  status: TraceStatus;
  confidence_score: number | null;
  cost_usd: number | null;
  duration_ms: number | null;
  created_at: string;
}

export interface TaskQueueItem {
  id: string;
  vibe_command: string;
  parsed_intent: Record<string, unknown> | null;
  assigned_role_id: string | null;
  priority: TaskPriority;
  status: TraceStatus;
  parent_task_id: string | null;
  result_summary: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventLogEntry {
  id: string;
  event_type: SWFEventType;
  task_id: string | null;
  agent_role_id: string | null;
  payload: Record<string, unknown>;
  webhook_delivered: boolean;
  webhook_response_code: number | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// OpenRouter model mapping
// ---------------------------------------------------------------------------

const MODEL_MAP: Record<ModelTier, string> = {
  'opus_4.6': 'anthropic/claude-opus-4',
  gpt_4o: 'openai/gpt-4o',
  haiku: 'anthropic/claude-3.5-haiku',
  perplexity: 'perplexity/sonar-pro',
  dalle3: 'openai/dall-e-3',
  nana_banana: 'openai/dall-e-3', // placeholder until Nana Banana Pro 3 is configured
};

export function getOpenRouterModel(tier: ModelTier): string {
  return MODEL_MAP[tier] ?? MODEL_MAP['haiku'];
}

// ---------------------------------------------------------------------------
// Supabase admin client (service role — bypasses RLS)
// ---------------------------------------------------------------------------

function getAdminClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// ---------------------------------------------------------------------------
// Workforce Role helpers
// ---------------------------------------------------------------------------

export async function getRole(roleId: string): Promise<WorkforceRole | null> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('workforce_roles')
    .select('*')
    .eq('id', roleId)
    .single();

  if (error) {
    console.error('[SWF/MCP] getRole error:', error.message);
    return null;
  }
  return data as WorkforceRole;
}

export async function getRoleByName(roleName: string): Promise<WorkforceRole | null> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('workforce_roles')
    .select('*')
    .eq('role_name', roleName)
    .single();

  if (error) {
    console.error('[SWF/MCP] getRoleByName error:', error.message);
    return null;
  }
  return data as WorkforceRole;
}

export async function getRolesByDepartment(department: Department): Promise<WorkforceRole[]> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('workforce_roles')
    .select('*')
    .eq('department', department);

  if (error) {
    console.error('[SWF/MCP] getRolesByDepartment error:', error.message);
    return [];
  }
  return (data ?? []) as WorkforceRole[];
}

// ---------------------------------------------------------------------------
// Task Queue helpers
// ---------------------------------------------------------------------------

export async function createTask(params: {
  vibe_command: string;
  parsed_intent?: Record<string, unknown>;
  assigned_role_id?: string;
  priority?: TaskPriority;
  parent_task_id?: string;
}): Promise<TaskQueueItem | null> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('task_queue')
    .insert({
      vibe_command: params.vibe_command,
      parsed_intent: params.parsed_intent ?? null,
      assigned_role_id: params.assigned_role_id ?? null,
      priority: params.priority ?? 'medium',
      status: 'pending',
      parent_task_id: params.parent_task_id ?? null,
    })
    .select()
    .single();

  if (error) {
    console.error('[SWF/MCP] createTask error:', error.message);
    return null;
  }
  return data as TaskQueueItem;
}

export async function updateTaskStatus(
  taskId: string,
  status: TraceStatus,
  resultSummary?: string,
): Promise<boolean> {
  const supabase = getAdminClient();
  const update: Record<string, unknown> = { status };
  if (resultSummary !== undefined) update.result_summary = resultSummary;

  const { error } = await supabase
    .from('task_queue')
    .update(update)
    .eq('id', taskId);

  if (error) {
    console.error('[SWF/MCP] updateTaskStatus error:', error.message);
    return false;
  }
  return true;
}

export async function getTask(taskId: string): Promise<TaskQueueItem | null> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('task_queue')
    .select('*')
    .eq('id', taskId)
    .single();

  if (error) {
    console.error('[SWF/MCP] getTask error:', error.message);
    return null;
  }
  return data as TaskQueueItem;
}

// ---------------------------------------------------------------------------
// Reasoning Trace helpers
// ---------------------------------------------------------------------------

export async function createTrace(params: {
  task_id: string;
  agent_role_id: string;
  input_prompt: string;
}): Promise<ReasoningTrace | null> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('reasoning_traces')
    .insert({
      task_id: params.task_id,
      agent_role_id: params.agent_role_id,
      input_prompt: params.input_prompt,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    console.error('[SWF/MCP] createTrace error:', error.message);
    return null;
  }
  return data as ReasoningTrace;
}

export async function completeTrace(
  traceId: string,
  params: {
    reasoning_text?: string;
    tool_calls?: Record<string, unknown>[];
    output_result?: string;
    status: TraceStatus;
    confidence_score?: number;
    cost_usd?: number;
    duration_ms?: number;
  },
): Promise<boolean> {
  const supabase = getAdminClient();
  const { error } = await supabase
    .from('reasoning_traces')
    .update({
      reasoning_text: params.reasoning_text ?? null,
      tool_calls: params.tool_calls ?? null,
      output_result: params.output_result ?? null,
      status: params.status,
      confidence_score: params.confidence_score ?? null,
      cost_usd: params.cost_usd ?? null,
      duration_ms: params.duration_ms ?? null,
    })
    .eq('id', traceId);

  if (error) {
    console.error('[SWF/MCP] completeTrace error:', error.message);
    return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Event Log helpers
// ---------------------------------------------------------------------------

export async function logEvent(params: {
  event_type: SWFEventType;
  task_id?: string;
  agent_role_id?: string;
  payload?: Record<string, unknown>;
}): Promise<EventLogEntry | null> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('event_log')
    .insert({
      event_type: params.event_type,
      task_id: params.task_id ?? null,
      agent_role_id: params.agent_role_id ?? null,
      payload: params.payload ?? {},
      webhook_delivered: false,
    })
    .select()
    .single();

  if (error) {
    console.error('[SWF/MCP] logEvent error:', error.message);
    return null;
  }
  return data as EventLogEntry;
}

// ---------------------------------------------------------------------------
// AI Completion (OpenRouter)
// ---------------------------------------------------------------------------

export interface CompletionResult {
  content: string;
  model: string;
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  cost_usd: number;
}

export async function runCompletion(params: {
  model: ModelTier;
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
}): Promise<CompletionResult> {
  const openRouterModel = getOpenRouterModel(params.model);

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://greenline365.com',
      'X-Title': 'GreenLine365 SWF',
    },
    body: JSON.stringify({
      model: openRouterModel,
      messages: [
        { role: 'system', content: params.systemPrompt },
        { role: 'user', content: params.userPrompt },
      ],
      temperature: params.temperature ?? 0.4,
      max_tokens: params.maxTokens ?? 2000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error (${response.status}): ${errorText}`);
  }

  const json = await response.json();
  const choice = json.choices?.[0];
  const usage = json.usage ?? { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

  // Rough cost estimate based on model (per 1M tokens pricing)
  const costPerMillionInput: Record<string, number> = {
    'anthropic/claude-opus-4': 15,
    'openai/gpt-4o': 2.5,
    'anthropic/claude-3.5-haiku': 0.8,
    'perplexity/sonar-pro': 3,
  };
  const costPerMillionOutput: Record<string, number> = {
    'anthropic/claude-opus-4': 75,
    'openai/gpt-4o': 10,
    'anthropic/claude-3.5-haiku': 4,
    'perplexity/sonar-pro': 15,
  };

  const inputCost = ((usage.prompt_tokens || 0) / 1_000_000) * (costPerMillionInput[openRouterModel] ?? 1);
  const outputCost = ((usage.completion_tokens || 0) / 1_000_000) * (costPerMillionOutput[openRouterModel] ?? 5);

  return {
    content: choice?.message?.content ?? '',
    model: openRouterModel,
    usage,
    cost_usd: parseFloat((inputCost + outputCost).toFixed(6)),
  };
}

// ---------------------------------------------------------------------------
// MCP Playwright integration (stub for future server)
// ---------------------------------------------------------------------------

export async function callPlaywrightMCP(params: {
  action: 'navigate' | 'screenshot' | 'click' | 'fill' | 'extract';
  url?: string;
  selector?: string;
  value?: string;
}): Promise<{ success: boolean; data?: unknown; error?: string }> {
  const mcpUrl = process.env.MCP_PLAYWRIGHT_URL;
  if (!mcpUrl) {
    return { success: false, error: 'MCP_PLAYWRIGHT_URL not configured' };
  }

  try {
    const response = await fetch(mcpUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      return { success: false, error: `Playwright MCP returned ${response.status}` };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[SWF/MCP] Playwright error:', message);
    return { success: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// SWF Tool Definitions (exposed to agents)
// ---------------------------------------------------------------------------

export const SWF_TOOLS = {
  search_web: {
    description: 'Search the web using Perplexity for real-time information',
    parameters: {
      query: { type: 'string', required: true, description: 'Search query' },
    },
  },
  browse_page: {
    description: 'Navigate to a URL and extract content using Playwright MCP',
    parameters: {
      url: { type: 'string', required: true, description: 'URL to browse' },
    },
  },
  screenshot_page: {
    description: 'Take a screenshot of a web page',
    parameters: {
      url: { type: 'string', required: true, description: 'URL to screenshot' },
    },
  },
  spawn_subtask: {
    description: 'Spawn a sub-task and assign it to another agent role',
    parameters: {
      vibe_command: { type: 'string', required: true, description: 'Natural language description of the sub-task' },
      target_role: { type: 'string', required: true, description: 'Role name to assign' },
      priority: { type: 'string', description: 'critical, high, medium, or low' },
    },
  },
  escalate: {
    description: 'Escalate the current task to a supervisor or the executive department',
    parameters: {
      reason: { type: 'string', required: true, description: 'Why the task is being escalated' },
      target_department: { type: 'string', description: 'Department to escalate to (defaults to executive)' },
    },
  },
  query_database: {
    description: 'Run a read-only query against Supabase tables relevant to the task',
    parameters: {
      table: { type: 'string', required: true, description: 'Table name to query' },
      filters: { type: 'object', description: 'Column filters as key-value pairs' },
      limit: { type: 'number', description: 'Max rows to return (default 20)' },
    },
  },
  send_notification: {
    description: 'Send a notification (email, SMS, or Slack) to a human team member',
    parameters: {
      channel: { type: 'string', required: true, description: 'email, sms, or slack' },
      recipient: { type: 'string', required: true, description: 'Recipient identifier' },
      message: { type: 'string', required: true, description: 'Notification content' },
    },
  },
} as const;

export type SWFToolName = keyof typeof SWF_TOOLS;
