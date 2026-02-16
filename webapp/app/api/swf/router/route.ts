import { NextRequest, NextResponse } from 'next/server';
import {
  getRole,
  getRoleByName,
  getTask,
  createTrace,
  completeTrace,
  updateTaskStatus,
  logEvent,
  runCompletion,
  callPlaywrightMCP,
  createTask,
  SWF_TOOLS,
  type TraceStatus,
  type SWFEventType,
  type TaskQueueItem,
  type WorkforceRole,
} from '@/lib/swf/mcp-integration';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Validate the incoming request carries the service role key. */
function isAuthorized(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization');
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return false;

  // Accept "Bearer <key>" or the raw key
  if (authHeader === `Bearer ${serviceKey}`) return true;
  if (authHeader === serviceKey) return true;

  // Also accept the key in the x-service-key header (used by Supabase pg_net)
  const xKey = req.headers.get('x-service-key');
  if (xKey === serviceKey) return true;

  return false;
}

/** Build the full prompt for an agent, injecting tool descriptions. */
function buildAgentPrompt(role: WorkforceRole, task: TaskQueueItem): string {
  const toolDescriptions = Object.entries(SWF_TOOLS)
    .map(([name, def]) => `- ${name}: ${def.description}`)
    .join('\n');

  return `${role.system_prompt}

═══════════════════════════════════════════════════════════════
AVAILABLE TOOLS
═══════════════════════════════════════════════════════════════
${toolDescriptions}

═══════════════════════════════════════════════════════════════
TASK
═══════════════════════════════════════════════════════════════
Task ID: ${task.id}
Priority: ${task.priority}
Command: ${task.vibe_command}
${task.parsed_intent ? `Parsed Intent: ${JSON.stringify(task.parsed_intent)}` : ''}
${task.parent_task_id ? `Parent Task: ${task.parent_task_id}` : ''}

Provide your analysis, reasoning, and final output. If you need to use a tool, respond with a JSON block:
\`\`\`tool
{ "tool": "<tool_name>", "args": { ... } }
\`\`\`

End your response with a clear RESULT section summarizing the outcome.`;
}

/** Parse tool calls from the agent's response text. */
function parseToolCalls(text: string): { tool: string; args: Record<string, unknown> }[] {
  const toolCalls: { tool: string; args: Record<string, unknown> }[] = [];
  const regex = /```tool\s*([\s\S]*?)```/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    try {
      const parsed = JSON.parse(match[1].trim());
      if (parsed.tool) {
        toolCalls.push({ tool: parsed.tool, args: parsed.args ?? {} });
      }
    } catch {
      // Skip malformed tool calls
    }
  }
  return toolCalls;
}

/** Execute a parsed tool call. */
async function executeTool(
  toolName: string,
  args: Record<string, unknown>,
  task: TaskQueueItem,
  role: WorkforceRole,
): Promise<Record<string, unknown>> {
  switch (toolName) {
    case 'search_web': {
      // Use Perplexity via OpenRouter for web search
      const result = await runCompletion({
        model: 'perplexity',
        systemPrompt: 'You are a research assistant. Provide factual, well-sourced answers.',
        userPrompt: args.query as string,
        temperature: 0.2,
        maxTokens: 1500,
      });
      return { success: true, content: result.content, cost_usd: result.cost_usd };
    }

    case 'browse_page':
      return await callPlaywrightMCP({ action: 'navigate', url: args.url as string });

    case 'screenshot_page':
      return await callPlaywrightMCP({ action: 'screenshot', url: args.url as string });

    case 'spawn_subtask': {
      const targetRole = await getRoleByName(args.target_role as string);
      const subtask = await createTask({
        vibe_command: args.vibe_command as string,
        assigned_role_id: targetRole?.id,
        priority: (args.priority as TaskQueueItem['priority']) ?? 'medium',
        parent_task_id: task.id,
      });
      await logEvent({
        event_type: 'task_spawned',
        task_id: subtask?.id,
        agent_role_id: role.id,
        payload: { parent_task_id: task.id, target_role: args.target_role },
      });
      return { success: !!subtask, subtask_id: subtask?.id };
    }

    case 'escalate': {
      await updateTaskStatus(task.id, 'escalated', args.reason as string);
      await logEvent({
        event_type: 'escalation',
        task_id: task.id,
        agent_role_id: role.id,
        payload: {
          reason: args.reason,
          target_department: args.target_department ?? 'executive',
        },
      });
      return { success: true, escalated: true };
    }

    case 'query_database': {
      const { createClient } = await import('@supabase/supabase-js');
      const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
      const supabase = createClient(url, key, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const table = args.table as string;
      const filters = (args.filters ?? {}) as Record<string, unknown>;
      const limit = (args.limit as number) ?? 20;

      let query = supabase.from(table).select('*').limit(limit);
      for (const [col, val] of Object.entries(filters)) {
        query = query.eq(col, val);
      }

      const { data, error } = await query;
      if (error) return { success: false, error: error.message };
      return { success: true, rows: data, count: data?.length ?? 0 };
    }

    case 'send_notification': {
      // Delegate to existing notification infrastructure
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://greenline365.com';
      const channel = args.channel as string;

      if (channel === 'sms') {
        const resp = await fetch(`${baseUrl}/api/twilio/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: args.recipient, message: args.message }),
        });
        const result = await resp.json();
        return { success: result.success };
      }

      if (channel === 'email') {
        const resp = await fetch(`${baseUrl}/api/email/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: args.recipient,
            subject: 'SWF Notification',
            body: args.message,
          }),
        });
        const result = await resp.json();
        return { success: result.success ?? !result.error };
      }

      return { success: false, error: `Unsupported channel: ${channel}` };
    }

    default:
      return { success: false, error: `Unknown tool: ${toolName}` };
  }
}

// ---------------------------------------------------------------------------
// Webhook event types from Supabase triggers
// ---------------------------------------------------------------------------

type WebhookEventType =
  | 'task_insert'
  | 'task_update'
  | 'trace_complete'
  | 'escalation';

interface WebhookPayload {
  type: WebhookEventType;
  table: string;
  record: Record<string, unknown>;
  old_record?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Core routing logic
// ---------------------------------------------------------------------------

async function processTask(task: TaskQueueItem): Promise<{
  success: boolean;
  result?: string;
  traceId?: string;
  error?: string;
}> {
  // 1. Resolve the assigned role
  if (!task.assigned_role_id) {
    return { success: false, error: 'Task has no assigned role' };
  }

  const role = await getRole(task.assigned_role_id);
  if (!role) {
    return { success: false, error: `Role not found: ${task.assigned_role_id}` };
  }

  // 2. Mark the task as in-progress
  await updateTaskStatus(task.id, 'in_progress');
  await logEvent({
    event_type: 'worker_started',
    task_id: task.id,
    agent_role_id: role.id,
    payload: { model_tier: role.model_tier },
  });

  // 3. Create a reasoning trace
  const agentPrompt = buildAgentPrompt(role, task);
  const trace = await createTrace({
    task_id: task.id,
    agent_role_id: role.id,
    input_prompt: agentPrompt,
  });

  if (!trace) {
    return { success: false, error: 'Failed to create reasoning trace' };
  }

  // 4. Run the AI completion
  const startMs = Date.now();
  let traceStatus: TraceStatus = 'completed';
  let outputResult = '';
  let toolCallRecords: Record<string, unknown>[] = [];
  let costUsd = 0;

  try {
    const completion = await runCompletion({
      model: role.model_tier,
      systemPrompt: role.system_prompt,
      userPrompt: agentPrompt,
      temperature: role.department === 'creative' ? 0.7 : 0.4,
      maxTokens: task.priority === 'critical' ? 4000 : 2000,
    });

    outputResult = completion.content;
    costUsd = completion.cost_usd;

    // 5. Parse and execute any tool calls in the response
    const toolCalls = parseToolCalls(completion.content);
    if (toolCalls.length > 0) {
      for (const tc of toolCalls) {
        const toolResult = await executeTool(tc.tool, tc.args, task, role);
        toolCallRecords.push({ tool: tc.tool, args: tc.args, result: toolResult });

        // Accumulate costs from tool sub-calls
        if (typeof toolResult.cost_usd === 'number') {
          costUsd += toolResult.cost_usd;
        }
      }
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    traceStatus = 'failed';
    outputResult = `Error: ${message}`;
    console.error(`[SWF/Router] Task ${task.id} failed:`, message);
  }

  const durationMs = Date.now() - startMs;

  // 6. Complete the reasoning trace
  await completeTrace(trace.id, {
    reasoning_text: outputResult,
    tool_calls: toolCallRecords.length > 0 ? toolCallRecords : undefined,
    output_result: outputResult.slice(0, 5000),
    status: traceStatus,
    confidence_score: traceStatus === 'completed' ? 85 : 0,
    cost_usd: costUsd,
    duration_ms: durationMs,
  });

  // 7. Update the task status
  const finalStatus: TraceStatus = traceStatus === 'completed' ? 'completed' : 'failed';
  await updateTaskStatus(task.id, finalStatus, outputResult.slice(0, 1000));

  // 8. Log completion event
  const eventType: SWFEventType = traceStatus === 'completed' ? 'worker_completed' : 'system_error';
  await logEvent({
    event_type: eventType,
    task_id: task.id,
    agent_role_id: role.id,
    payload: {
      duration_ms: durationMs,
      cost_usd: costUsd,
      tool_calls_count: toolCallRecords.length,
      status: traceStatus,
    },
  });

  return {
    success: traceStatus === 'completed',
    result: outputResult.slice(0, 2000),
    traceId: trace.id,
  };
}

// ---------------------------------------------------------------------------
// POST handler — receives Supabase webhook events and direct API calls
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    // Authorize the request
    if (!isAuthorized(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    // Detect if this is a Supabase webhook event or a direct API call
    const isWebhook = body.type && body.table && body.record;

    if (isWebhook) {
      const payload = body as WebhookPayload;
      console.log(`[SWF/Router] Webhook: ${payload.type} on ${payload.table}`);

      switch (payload.type) {
        case 'task_insert': {
          // New task inserted — process it
          const taskId = payload.record.id as string;
          const task = await getTask(taskId);
          if (!task) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
          }

          // Only process tasks that have an assigned role
          if (!task.assigned_role_id) {
            console.log(`[SWF/Router] Task ${taskId} has no assigned role — skipping`);
            return NextResponse.json({ status: 'skipped', reason: 'no_assigned_role' });
          }

          const result = await processTask(task);
          return NextResponse.json(result);
        }

        case 'task_update': {
          // Task status changed — log it
          const newStatus = payload.record.status as string;
          const oldStatus = payload.old_record?.status as string | undefined;
          console.log(`[SWF/Router] Task ${payload.record.id} status: ${oldStatus} → ${newStatus}`);
          return NextResponse.json({ status: 'acknowledged' });
        }

        case 'trace_complete': {
          // Reasoning trace completed — audit if needed
          const traceStatus = payload.record.status as string;
          if (traceStatus === 'completed') {
            const confidence = payload.record.confidence_score as number;
            if (confidence < 50) {
              await logEvent({
                event_type: 'audit_fail',
                task_id: payload.record.task_id as string,
                agent_role_id: payload.record.agent_role_id as string,
                payload: { confidence, reason: 'Low confidence score' },
              });
            } else {
              await logEvent({
                event_type: 'audit_pass',
                task_id: payload.record.task_id as string,
                agent_role_id: payload.record.agent_role_id as string,
                payload: { confidence },
              });
            }
          }
          return NextResponse.json({ status: 'audited' });
        }

        case 'escalation': {
          // Escalation event — notify executive department
          await logEvent({
            event_type: 'escalation',
            task_id: payload.record.task_id as string ?? payload.record.id as string,
            payload: { reason: payload.record.result_summary ?? 'Escalated by agent' },
          });
          return NextResponse.json({ status: 'escalation_logged' });
        }

        default:
          return NextResponse.json({ status: 'unhandled_event', type: payload.type });
      }
    }

    // Direct API call — process a task by ID or inline
    const { task_id, vibe_command, assigned_role_id, priority } = body;

    if (task_id) {
      const task = await getTask(task_id);
      if (!task) {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 });
      }
      const result = await processTask(task);
      return NextResponse.json(result);
    }

    if (vibe_command) {
      // Create and immediately process an inline task
      const task = await createTask({
        vibe_command,
        assigned_role_id,
        priority: priority ?? 'medium',
      });

      if (!task) {
        return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
      }

      if (!task.assigned_role_id) {
        return NextResponse.json({
          task_id: task.id,
          status: 'pending',
          message: 'Task created but no role assigned — awaiting manual assignment',
        });
      }

      const result = await processTask(task);
      return NextResponse.json({ task_id: task.id, ...result });
    }

    return NextResponse.json({ error: 'Missing task_id or vibe_command' }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[SWF/Router] Error:', message);
    return NextResponse.json({ error: 'Internal server error', details: message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// GET handler — health check & status
// ---------------------------------------------------------------------------

export async function GET() {
  return NextResponse.json({
    service: 'SWF Smart Router',
    version: '1.0.0',
    status: 'operational',
    endpoints: {
      POST: 'Process webhook events or direct task execution',
      GET: 'Health check (this response)',
    },
    webhook_types: ['task_insert', 'task_update', 'trace_complete', 'escalation'],
    tools: Object.keys(SWF_TOOLS),
  });
}
