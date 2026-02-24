/**
 * Brain-Connected Agentic Chat API
 *
 * POST /api/chat/agent
 *
 * This is the core agent endpoint. Every agent (Aiden, Ada, Susan, Concierge)
 * runs through this route. Agents are:
 *
 * 1. BRAIN-CONNECTED — Before responding, they query past conversations,
 *    context graph, and knowledge base for relevant history.
 *
 * 2. AGENTIC — They can chain multiple tool calls in a single turn
 *    without waiting for user input (autonomous reasoning loop).
 *
 * 3. AUTO-JOURNALING — Every exchange is logged to the brain's memory
 *    system. Key insights (contacts, pain points, preferences) are
 *    written back to the context graph.
 *
 * 4. DEPARTMENT TRANSFERS — Agents can hand off to other departments
 *    with full conversation context preserved.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServerClient } from '@/lib/supabase/server';
import { callOpenRouter, callOpenRouterJSON, type ChatMessage } from '@/lib/openrouter';
import { getAgentPrompt, getAgentTools, resolveTransferAgent, type AgentId, type AgentMode } from '@/lib/agent-personalities';

// ── Types ──────────────────────────────────────────────────────────

interface AgentChatRequest {
  message: string;
  sessionId?: string;
  agentId?: AgentId;
  mode?: AgentMode;
  visitorId?: string;
  businessId?: string;
  // Existing contact info (from widget or previous session)
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
}

interface ToolCallResult {
  name: string;
  arguments: Record<string, any>;
  result: any;
}

// Max agentic loop iterations (prevents runaway)
const MAX_TOOL_ITERATIONS = 5;

// Model for agent conversations
const AGENT_MODEL = 'anthropic/claude-sonnet-4.6';

// Model for brain operations (cheaper, faster)
const BRAIN_MODEL = 'anthropic/claude-sonnet-4.6';

// ── Main Handler ───────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body: AgentChatRequest = await request.json();
    const { message, visitorId, businessId } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'message is required' }, { status: 400 });
    }

    const agentId = body.agentId || 'concierge';
    const mode = body.mode || 'concierge';
    const supabase = createServerClient(); // Service role for brain access

    // Try to get authenticated user
    let userId: string | null = null;
    try {
      const authClient = await createClient();
      const { data: { user } } = await authClient.auth.getUser();
      userId = user?.id || null;
    } catch {
      // Anonymous visitor — that's fine
    }

    // ── Step 1: Get or create session ──────────────────────────

    let sessionId = body.sessionId;
    let session: any = null;

    if (sessionId) {
      const { data } = await supabase
        .from('agent_chat_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();
      session = data;
    }

    if (!session) {
      const { data: newSession } = await supabase
        .from('agent_chat_sessions')
        .insert({
          business_id: businessId || null,
          visitor_id: visitorId || null,
          user_id: userId,
          agent_id: agentId,
          agent_mode: mode,
          contact_name: body.contactName || null,
          contact_email: body.contactEmail || null,
          contact_phone: body.contactPhone || null,
          source: 'widget',
        })
        .select()
        .single();

      session = newSession;
      sessionId = session?.id;
    }

    if (!session || !sessionId) {
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }

    // ── Step 2: Store user message ─────────────────────────────

    await supabase.from('agent_chat_messages').insert({
      session_id: sessionId,
      role: 'user',
      content: message,
      agent_id: agentId,
      agent_mode: mode,
    });

    // ── Step 3: Load brain context ─────────────────────────────

    const brainContext = await loadBrainContext(supabase, {
      sessionId,
      contactEmail: session.contact_email || body.contactEmail,
      contactPhone: session.contact_phone || body.contactPhone,
      visitorId: session.visitor_id || visitorId,
      businessId: session.business_id || businessId,
      userMessage: message,
    });

    // ── Step 4: Build the full message history ─────────────────

    const { data: history } = await supabase
      .from('agent_chat_messages')
      .select('role, content, tool_calls, tool_name, tool_result')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(30);

    const systemPrompt = buildEnhancedSystemPrompt(agentId, mode, brainContext);

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...(history || [])
        .filter((m: any) => m.role !== 'system')
        .map((m: any) => ({
          role: m.role as ChatMessage['role'],
          content: m.content,
        })),
    ];

    // ── Step 5: Agentic tool execution loop ────────────────────

    const tools = getAgentTools(agentId);
    const allToolCalls: ToolCallResult[] = [];
    let finalContent = '';
    let iterations = 0;

    while (iterations < MAX_TOOL_ITERATIONS) {
      iterations++;

      const result = await callOpenRouter({
        model: AGENT_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 1000,
        caller: `GL365 Agent:${agentId}/${mode}`,
        // Pass tools for function calling
        ...(tools.length > 0 ? { tools } : {}),
      } as any);

      // Check if the response includes tool calls
      // OpenRouter returns tool_calls in the raw response
      const rawContent = result.content;

      // Parse for tool call patterns in the response
      const toolCallMatch = rawContent.match(/\{"tool_calls":\s*\[/);

      // For OpenRouter with function calling, we check the raw response
      // If no tool calls, this is the final response
      if (!toolCallMatch && !rawContent.includes('"function_call"')) {
        finalContent = rawContent;
        break;
      }

      // If we detect the model wants to call a tool, extract and execute it
      // Note: In production with proper OpenRouter function calling support,
      // tool_calls come as structured data. Here we handle both patterns.
      try {
        const toolCalls = extractToolCalls(rawContent);
        if (toolCalls.length === 0) {
          finalContent = rawContent;
          break;
        }

        for (const call of toolCalls) {
          const toolResult = await executeToolCall(call.name, call.arguments, supabase, session);
          allToolCalls.push({ name: call.name, arguments: call.arguments, result: toolResult });

          // Add tool result to message history for next iteration
          messages.push({
            role: 'assistant',
            content: `I called ${call.name}(${JSON.stringify(call.arguments)})`,
          });
          messages.push({
            role: 'user',
            content: `[Tool Result for ${call.name}]: ${JSON.stringify(toolResult)}`,
          });

          // Handle special tool results
          if (call.name === 'transfer_department') {
            // Update session with transfer
            const targetAgent = resolveTransferAgent(call.arguments.department);
            const transferEntry = {
              from: agentId,
              to: call.arguments.department,
              reason: call.arguments.context_summary,
              at: new Date().toISOString(),
            };

            const currentChain = session.transfer_chain || [];
            currentChain.push(transferEntry);

            await supabase
              .from('agent_chat_sessions')
              .update({
                transfer_chain: currentChain,
                agent_id: targetAgent || agentId,
                status: call.arguments.department === 'human' ? 'escalated' : 'transferred',
                updated_at: new Date().toISOString(),
              })
              .eq('id', sessionId);
          }

          if (call.name === 'create_lead') {
            // Update session with lead info
            await supabase
              .from('agent_chat_sessions')
              .update({
                lead_created: true,
                contact_name: call.arguments.name || session.contact_name,
                contact_email: call.arguments.email || session.contact_email,
                contact_phone: call.arguments.phone || session.contact_phone,
                contact_business_type: call.arguments.business_type,
                intent_score: call.arguments.intent_score || 80,
                pain_points: call.arguments.pain_point ? [call.arguments.pain_point] : [],
                updated_at: new Date().toISOString(),
              })
              .eq('id', sessionId);
          }
        }
      } catch {
        // If tool parsing fails, treat the response as the final answer
        finalContent = rawContent;
        break;
      }
    }

    // If we exhausted iterations, use the last response
    if (!finalContent) {
      const lastResult = await callOpenRouter({
        model: AGENT_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 1000,
        caller: `GL365 Agent:${agentId}/${mode} (final)`,
      });
      finalContent = lastResult.content;
    }

    // ── Step 6: Store assistant response ───────────────────────

    await supabase.from('agent_chat_messages').insert({
      session_id: sessionId,
      role: 'assistant',
      content: finalContent,
      agent_id: agentId,
      agent_mode: mode,
      tool_calls: allToolCalls.length > 0 ? allToolCalls : null,
      brain_context_used: brainContext.contextUsed,
      model_used: AGENT_MODEL,
    });

    // ── Step 7: Auto-journal to brain ──────────────────────────

    await autoJournal(supabase, {
      sessionId,
      agentId,
      mode,
      userMessage: message,
      assistantResponse: finalContent,
      toolCalls: allToolCalls,
      contactEmail: session.contact_email || body.contactEmail,
      contactName: session.contact_name || body.contactName,
      businessId: session.business_id || businessId,
    });

    // ── Step 8: Extract and update contact info ────────────────

    await updateContactInfo(supabase, sessionId, message, finalContent, session);

    // ── Return response ────────────────────────────────────────

    return NextResponse.json({
      reply: finalContent,
      sessionId,
      agentId: session.agent_id,
      agentMode: session.agent_mode,
      toolCalls: allToolCalls.length > 0 ? allToolCalls.map(t => t.name) : undefined,
      transferred: session.status === 'transferred' || session.status === 'escalated'
        ? session.agent_id
        : undefined,
    });

  } catch (error: any) {
    console.error('[Agent Chat] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ── Brain Context Loading ──────────────────────────────────────────

interface BrainContextParams {
  sessionId: string;
  contactEmail?: string;
  contactPhone?: string;
  visitorId?: string;
  businessId?: string;
  userMessage: string;
}

interface BrainContext {
  pastConversations: any[];
  knowledgeChunks: any[];
  graphConnections: any[];
  recentEvents: any[];
  contextUsed: Record<string, any>;
}

async function loadBrainContext(supabase: any, params: BrainContextParams): Promise<BrainContext> {
  const context: BrainContext = {
    pastConversations: [],
    knowledgeChunks: [],
    graphConnections: [],
    recentEvents: [],
    contextUsed: {},
  };

  try {
    // Run all brain queries in parallel
    const queries = [];

    // 1. Past conversations with this contact
    if (params.contactEmail || params.contactPhone || params.visitorId) {
      queries.push(
        supabase.rpc('get_contact_history', {
          p_email: params.contactEmail || null,
          p_phone: params.contactPhone || null,
          p_visitor_id: params.visitorId || null,
          p_limit: 5,
        }).then((res: any) => {
          context.pastConversations = res.data || [];
          if (context.pastConversations.length > 0) {
            context.contextUsed.pastConversations = context.pastConversations.length;
          }
        })
      );
    }

    // 2. Relevant knowledge chunks (text search on user message)
    if (params.userMessage && params.businessId) {
      queries.push(
        supabase
          .from('memory_knowledge_chunks')
          .select('category, title, content')
          .ilike('content', `%${params.userMessage.split(' ').slice(0, 3).join('%')}%`)
          .eq('is_active', true)
          .order('priority', { ascending: false })
          .limit(3)
          .then((res: any) => {
            context.knowledgeChunks = res.data || [];
            if (context.knowledgeChunks.length > 0) {
              context.contextUsed.knowledge = context.knowledgeChunks.length;
            }
          })
      );
    }

    // 3. Context graph connections (if we know a contact)
    if (params.contactEmail && params.businessId) {
      queries.push(
        supabase
          .from('brain_edges')
          .select('target_type, target_id, relationship, metadata')
          .eq('business_id', params.businessId)
          .eq('source_type', 'contact')
          .eq('source_id', params.contactEmail)
          .order('strength', { ascending: false })
          .limit(5)
          .then((res: any) => {
            context.graphConnections = res.data || [];
            if (context.graphConnections.length > 0) {
              context.contextUsed.graph = context.graphConnections.length;
            }
          })
      );
    }

    // 4. Recent brain events for the business
    if (params.businessId) {
      queries.push(
        supabase
          .from('memory_event_journal')
          .select('event_type, title, description, occurred_at')
          .order('occurred_at', { ascending: false })
          .limit(5)
          .then((res: any) => {
            context.recentEvents = res.data || [];
            if (context.recentEvents.length > 0) {
              context.contextUsed.events = context.recentEvents.length;
            }
          })
      );
    }

    await Promise.allSettled(queries);
  } catch (error) {
    console.warn('[Agent Chat] Brain context loading error (non-fatal):', error);
  }

  return context;
}

// ── Enhanced System Prompt with Brain Context ──────────────────────

function buildEnhancedSystemPrompt(agentId: AgentId, mode: AgentMode, brain: BrainContext): string {
  let prompt = getAgentPrompt(agentId, mode);

  // Inject past conversation memory
  if (brain.pastConversations.length > 0) {
    prompt += `\n\n═══ MEMORY: PAST CONVERSATIONS WITH THIS PERSON ═══\n`;
    prompt += `You have spoken with this person before. Here's what you know:\n`;
    for (const conv of brain.pastConversations) {
      const date = new Date(conv.created_at).toLocaleDateString();
      prompt += `- ${date}: ${conv.agent_id} (${conv.agent_mode}) — `;
      if (conv.conversation_summary) {
        prompt += conv.conversation_summary;
      } else {
        prompt += `${conv.message_count} messages exchanged`;
      }
      if (conv.pain_points?.length) {
        prompt += ` | Pain points: ${conv.pain_points.join(', ')}`;
      }
      if (conv.lead_created) {
        prompt += ` | Lead was created`;
      }
      if (conv.contact_name) {
        prompt += ` | Name: ${conv.contact_name}`;
      }
      prompt += `\n`;
    }
    prompt += `IMPORTANT: Reference this history naturally. Don't repeat questions you've already asked. Pick up where you left off.\n`;
  }

  // Inject relevant knowledge
  if (brain.knowledgeChunks.length > 0) {
    prompt += `\n\n═══ KNOWLEDGE BASE ═══\n`;
    for (const chunk of brain.knowledgeChunks) {
      prompt += `[${chunk.category}${chunk.title ? ': ' + chunk.title : ''}] ${chunk.content.substring(0, 300)}\n`;
    }
  }

  // Inject graph connections
  if (brain.graphConnections.length > 0) {
    prompt += `\n\n═══ CONTEXT GRAPH ═══\n`;
    prompt += `This contact is connected to:\n`;
    for (const edge of brain.graphConnections) {
      prompt += `- ${edge.relationship} → ${edge.target_type}:${edge.target_id}\n`;
    }
  }

  // Inject recent events
  if (brain.recentEvents.length > 0) {
    prompt += `\n\n═══ RECENT BUSINESS EVENTS ═══\n`;
    for (const event of brain.recentEvents) {
      const date = new Date(event.occurred_at).toLocaleDateString();
      prompt += `- ${date}: ${event.title || event.event_type}${event.description ? ' — ' + event.description.substring(0, 100) : ''}\n`;
    }
  }

  return prompt;
}

// ── Tool Execution ─────────────────────────────────────────────────

function extractToolCalls(content: string): Array<{ name: string; arguments: Record<string, any> }> {
  // Try to find function call patterns in the response
  const calls: Array<{ name: string; arguments: Record<string, any> }> = [];

  // Pattern 1: JSON tool_calls array
  const jsonMatch = content.match(/\{"tool_calls":\s*(\[[\s\S]*?\])\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1]);
      for (const call of parsed) {
        calls.push({
          name: call.function?.name || call.name,
          arguments: call.function?.arguments
            ? (typeof call.function.arguments === 'string'
                ? JSON.parse(call.function.arguments)
                : call.function.arguments)
            : call.arguments || {},
        });
      }
      return calls;
    } catch { /* fall through */ }
  }

  // Pattern 2: Single function_call
  const funcMatch = content.match(/\{"function_call":\s*\{[\s\S]*?"name":\s*"([^"]+)"[\s\S]*?"arguments":\s*(\{[\s\S]*?\})\s*\}\}/);
  if (funcMatch) {
    try {
      calls.push({
        name: funcMatch[1],
        arguments: JSON.parse(funcMatch[2]),
      });
      return calls;
    } catch { /* fall through */ }
  }

  return calls;
}

async function executeToolCall(
  name: string,
  args: Record<string, any>,
  supabase: any,
  session: any
): Promise<any> {
  try {
    switch (name) {
      case 'create_lead':
        return await toolCreateLead(supabase, args, session);

      case 'web_search':
        return await toolWebSearch(args.query);

      case 'query_pricing':
        return toolQueryPricing(args.business_type);

      case 'transfer_department':
        return toolTransferDepartment(args, session);

      case 'check_availability':
        return { available: true, message: 'Calendar availability check — feature coming soon. Please ask the prospect for their preferred time and we will confirm.' };

      case 'book_appointment':
        return { booked: true, message: `Appointment request noted for ${args.customer_name}. The team will confirm within 24 hours.` };

      default:
        return { error: `Unknown tool: ${name}` };
    }
  } catch (error: any) {
    console.error(`[Agent Tool] ${name} error:`, error);
    return { error: error.message };
  }
}

async function toolCreateLead(supabase: any, args: Record<string, any>, session: any): Promise<any> {
  const { data: lead, error } = await supabase
    .from('leads')
    .insert({
      tenant_id: session.business_id || null,
      source: `agent:${session.agent_id}`,
      email: args.email,
      phone: args.phone,
      stage: 'new',
      lead_score: args.intent_score || 50,
      intent: args.pain_point || 'social media help',
      metadata: {
        name: args.name,
        business_type: args.business_type,
        pain_point: args.pain_point,
        summary: args.summary,
        agent_session_id: session.id,
        created_by_agent: session.agent_id,
      },
    })
    .select('id')
    .single();

  if (error) {
    // Try alternate table name if leads doesn't exist
    const { data: crmLead, error: crmError } = await supabase
      .from('crm_leads')
      .insert({
        business_id: session.business_id || null,
        first_name: args.name?.split(' ')[0] || '',
        last_name: args.name?.split(' ').slice(1).join(' ') || '',
        email: args.email,
        phone: args.phone,
        source: `agent:${session.agent_id}`,
        status: 'new',
        notes: `${args.summary}\n\nPain point: ${args.pain_point}`,
        metadata: {
          intent_score: args.intent_score,
          business_type: args.business_type,
          agent_session_id: session.id,
        },
      })
      .select('id')
      .single();

    if (crmError) {
      return { success: false, error: 'Could not create lead — will follow up manually' };
    }
    return { success: true, lead_id: crmLead.id, message: 'Lead created successfully' };
  }

  return { success: true, lead_id: lead.id, message: 'Lead created successfully' };
}

async function toolWebSearch(query: string): Promise<any> {
  try {
    // Use Perplexity via OpenRouter for real-time web search
    const result = await callOpenRouter({
      model: 'perplexity/sonar-pro',
      messages: [{ role: 'user', content: query }],
      temperature: 0.3,
      max_tokens: 500,
      caller: 'GL365 Agent WebSearch',
    });

    return { results: result.content };
  } catch (error: any) {
    return { error: 'Search unavailable', fallback: 'I can share general industry knowledge instead.' };
  }
}

function toolQueryPricing(businessType?: string): any {
  return {
    plans: [
      {
        name: 'Starter',
        price: '$297/mo',
        description: 'Perfect for single-location businesses just getting started with consistent social media.',
        includes: ['3 posts/week', 'AI content creation', 'Basic analytics', '1 platform'],
      },
      {
        name: 'Growth',
        price: '$497/mo',
        description: 'For businesses ready to scale their online presence and drive real bookings.',
        includes: ['5 posts/week', 'AI content + video', 'Advanced analytics', '3 platforms', 'Monthly strategy call'],
      },
      {
        name: 'Premium',
        price: '$797/mo',
        description: 'The full GreenLine365 experience — done-for-you marketing that drives revenue.',
        includes: ['Daily posts', 'Full content suite', 'Lead tracking', 'All platforms', 'Weekly strategy calls', 'Dedicated account manager'],
      },
    ],
    note: businessType
      ? `These are our standard plans. For ${businessType} businesses, we often recommend starting with Growth to see real results fast.`
      : 'We customize based on your specific needs. The call is to figure out the right fit.',
  };
}

function toolTransferDepartment(args: Record<string, any>, session: any): any {
  const targetAgent = resolveTransferAgent(args.department);
  return {
    transferred: true,
    department: args.department,
    new_agent: targetAgent,
    context_preserved: true,
    message: args.department === 'human'
      ? 'Escalating to a human team member. They will have full context of this conversation.'
      : `Transferring to ${args.department}. The ${args.department} team will have full context.`,
  };
}

// ── Auto-Journaling ────────────────────────────────────────────────

interface JournalParams {
  sessionId: string;
  agentId: string;
  mode: string;
  userMessage: string;
  assistantResponse: string;
  toolCalls: ToolCallResult[];
  contactEmail?: string;
  contactName?: string;
  businessId?: string;
}

async function autoJournal(supabase: any, params: JournalParams): Promise<void> {
  try {
    // 1. Log the exchange to memory_event_journal
    await supabase.from('memory_event_journal').insert({
      event_type: 'agent_conversation',
      event_category: 'chat',
      title: `${params.agentId}/${params.mode} chat${params.contactName ? ` with ${params.contactName}` : ''}`,
      description: params.userMessage.substring(0, 200),
      metadata: {
        session_id: params.sessionId,
        agent_id: params.agentId,
        agent_mode: params.mode,
        contact_email: params.contactEmail,
        contact_name: params.contactName,
        tool_calls: params.toolCalls.map(t => t.name),
        user_message_preview: params.userMessage.substring(0, 100),
        assistant_response_preview: params.assistantResponse.substring(0, 100),
      },
      tags: [
        `agent:${params.agentId}`,
        `mode:${params.mode}`,
        ...(params.toolCalls.map(t => `tool:${t.name}`)),
      ],
      search_text: [
        params.userMessage,
        params.contactName,
        params.contactEmail,
        params.agentId,
      ].filter(Boolean).join(' '),
      ai_generated: true,
      ai_model_used: AGENT_MODEL,
    }).then(() => {}).catch(() => {});  // Fire and forget

    // 2. If lead was created, add to brain_people
    const leadCall = params.toolCalls.find(t => t.name === 'create_lead');
    if (leadCall && params.businessId) {
      await supabase.from('brain_people').upsert({
        business_id: params.businessId,
        name: leadCall.arguments.name,
        relationship: 'lead',
        contact_info: {
          email: leadCall.arguments.email,
          phone: leadCall.arguments.phone,
        },
        notes: leadCall.arguments.summary,
        context: `Lead created by ${params.agentId}. Pain point: ${leadCall.arguments.pain_point}`,
        last_contact: new Date().toISOString(),
      }, {
        onConflict: 'business_id,name',
        ignoreDuplicates: true,
      }).then(() => {}).catch(() => {});

      // 3. Create brain edge: contact → session
      await supabase.from('brain_edges').insert({
        business_id: params.businessId,
        source_type: 'contact',
        source_id: leadCall.arguments.email,
        target_type: 'agent_session',
        target_id: params.sessionId,
        relationship: 'created_lead_via',
        strength: 1.0,
        metadata: {
          agent: params.agentId,
          intent_score: leadCall.arguments.intent_score,
          pain_point: leadCall.arguments.pain_point,
        },
        created_by: `agent:${params.agentId}`,
      }).then(() => {}).catch(() => {});
    }

    // 4. If transfer happened, log it
    const transferCall = params.toolCalls.find(t => t.name === 'transfer_department');
    if (transferCall && params.businessId) {
      await supabase.from('brain_edges').insert({
        business_id: params.businessId,
        source_type: 'agent_session',
        source_id: params.sessionId,
        target_type: 'department',
        target_id: transferCall.arguments.department,
        relationship: 'transferred_to',
        strength: 1.0,
        metadata: {
          from_agent: params.agentId,
          reason: transferCall.arguments.context_summary,
        },
        created_by: `agent:${params.agentId}`,
      }).then(() => {}).catch(() => {});
    }
  } catch (error) {
    // Auto-journaling is non-critical — never let it break the response
    console.warn('[Agent Chat] Auto-journal error (non-fatal):', error);
  }
}

// ── Contact Info Extraction ────────────────────────────────────────

async function updateContactInfo(
  supabase: any,
  sessionId: string,
  userMessage: string,
  _assistantResponse: string,
  session: any
): Promise<void> {
  try {
    const updates: Record<string, any> = { updated_at: new Date().toISOString() };

    // Extract name
    if (!session.contact_name) {
      const nameMatch = userMessage.match(
        /(?:(?:my name is|i'm|i am|this is|call me)\s+)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i
      );
      if (nameMatch) updates.contact_name = nameMatch[1];
    }

    // Extract email
    if (!session.contact_email) {
      const emailMatch = userMessage.match(/[\w.-]+@[\w.-]+\.\w+/);
      if (emailMatch) updates.contact_email = emailMatch[0];
    }

    // Extract phone
    if (!session.contact_phone) {
      const phoneMatch = userMessage.match(/(?:\+1)?[\s.-]?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/);
      if (phoneMatch) updates.contact_phone = phoneMatch[0];
    }

    // Only update if we found something new
    if (Object.keys(updates).length > 1) {
      await supabase
        .from('agent_chat_sessions')
        .update(updates)
        .eq('id', sessionId);
    }
  } catch {
    // Non-critical
  }
}
