/**
 * GL365 Brain Workers
 *
 * Background processors that run AFTER the main agent response is sent.
 * They handle memory writing, lead scoring, sentiment tracking, supplier
 * matching, and owner notifications — all fire-and-forget so the chat
 * response stays fast.
 *
 * Architecture:
 *   Main agent route → returns response to user → fires workers
 *   Workers run via Promise.allSettled (non-blocking, fault-tolerant)
 *
 * Every worker is idempotent and failure-safe. If a worker fails,
 * the user's conversation is NOT affected.
 */

import { callOpenRouterJSON } from '@/lib/openrouter';
import { notify } from '@/lib/notifications';

// ── Types ──────────────────────────────────────────────────────────

export interface WorkerContext {
  supabase: any;
  sessionId: string;
  agentId: string;
  mode: string;
  userMessage: string;
  assistantResponse: string;
  toolCalls: Array<{ name: string; arguments: Record<string, any>; result: any }>;
  session: any; // Full session record
  contactEmail?: string;
  contactName?: string;
  contactPhone?: string;
  businessId?: string;
}

// Owner email for critical notifications (payments, leads, subscribers)
const OWNER_EMAIL = 'jared.tucker13@gmail.com';

// Model for worker AI tasks (fast + cheap)
const WORKER_MODEL = 'anthropic/claude-haiku-4-5-20251001';

// ── Main Entry Point ───────────────────────────────────────────────

/**
 * Run all applicable Brain Workers after a conversation turn.
 * Call this fire-and-forget: `runBrainWorkers(ctx).catch(() => {})`
 */
export async function runBrainWorkers(ctx: WorkerContext): Promise<void> {
  const workers: Promise<void>[] = [];

  // Always run these
  workers.push(memoryWriter(ctx));
  workers.push(sentimentTracker(ctx));

  // Run if lead signals detected
  const hasLeadCall = ctx.toolCalls.some(t => t.name === 'create_lead' || t.name === 'create_qualified_lead');
  if (hasLeadCall) {
    workers.push(leadNotifier(ctx));
    workers.push(supplierMatcher(ctx));
  }

  // Run if transfer happened
  const hasTransfer = ctx.toolCalls.some(t => t.name === 'transfer_department');
  if (hasTransfer) {
    workers.push(transferNotifier(ctx));
  }

  await Promise.allSettled(workers);
}

// ── Worker 1: Memory Writer ────────────────────────────────────────

/**
 * Extracts key facts from the conversation and writes them to the
 * Brain's long-term memory (brain_people + brain_edges).
 *
 * Uses a fast AI model to extract structured data from natural
 * conversation — names, preferences, pain points, business details.
 */
async function memoryWriter(ctx: WorkerContext): Promise<void> {
  try {
    // Only extract if we have enough conversation content
    if (ctx.userMessage.length < 10) return;

    // Use AI to extract structured facts from the exchange
    const extraction = await callOpenRouterJSON({
      model: WORKER_MODEL,
      messages: [
        {
          role: 'system',
          content: `You extract structured facts from conversation exchanges. Return a JSON object with:
{
  "name": string | null,
  "email": string | null,
  "phone": string | null,
  "business_name": string | null,
  "business_type": string | null,
  "pain_points": string[] (short phrases),
  "preferences": string[] (short phrases),
  "equipment_mentioned": { "type": string, "age": number | null }[] ,
  "intent_level": "none" | "browsing" | "interested" | "ready_to_buy",
  "key_facts": string[] (any other notable facts, max 3)
}
Only include fields where you found actual information. Use null/empty arrays for missing data.`,
        },
        {
          role: 'user',
          content: `Customer said: "${ctx.userMessage}"\n\nAgent responded: "${ctx.assistantResponse.substring(0, 300)}"`,
        },
      ],
      temperature: 0.1,
      max_tokens: 400,
      caller: 'GL365 Brain:memoryWriter',
    });

    if (!extraction) return;

    const facts = typeof extraction === 'string' ? JSON.parse(extraction) : extraction;

    // Write to brain_people if we have identifying info
    const contactId = ctx.contactEmail || ctx.contactPhone || ctx.session?.visitor_id;
    if (contactId && ctx.businessId) {
      const personData: Record<string, any> = {
        business_id: ctx.businessId,
        name: facts.name || ctx.contactName || 'Unknown',
        relationship: facts.intent_level === 'ready_to_buy' ? 'hot_lead' : 'contact',
        last_contact: new Date().toISOString(),
      };

      if (facts.pain_points?.length) {
        personData.notes = `Pain points: ${facts.pain_points.join(', ')}`;
      }
      if (facts.business_name || facts.business_type) {
        personData.context = [
          facts.business_name ? `Business: ${facts.business_name}` : '',
          facts.business_type ? `Type: ${facts.business_type}` : '',
          facts.preferences?.length ? `Preferences: ${facts.preferences.join(', ')}` : '',
        ].filter(Boolean).join('. ');
      }
      if (facts.email) personData.contact_info = { email: facts.email, phone: facts.phone };

      await ctx.supabase.from('brain_people').upsert(personData, {
        onConflict: 'business_id,name',
        ignoreDuplicates: false,
      });
    }

    // Write brain_edges for equipment mentions
    if (facts.equipment_mentioned?.length && contactId && ctx.businessId) {
      for (const equip of facts.equipment_mentioned) {
        await ctx.supabase.from('brain_edges').insert({
          business_id: ctx.businessId,
          source_type: 'contact',
          source_id: contactId,
          target_type: 'equipment',
          target_id: `${equip.type}${equip.age ? `_${equip.age}yr` : ''}`,
          relationship: 'has_equipment',
          strength: equip.age && equip.age > 10 ? 0.9 : 0.5,
          metadata: { type: equip.type, age: equip.age, session_id: ctx.sessionId },
          created_by: `brain:memoryWriter`,
        }).then(() => {}).catch(() => {});
      }
    }

    // Update session with extracted pain points
    if (facts.pain_points?.length) {
      const existingPainPoints = ctx.session?.pain_points || [];
      const merged = [...new Set([...existingPainPoints, ...facts.pain_points])];
      await ctx.supabase.from('agent_chat_sessions').update({
        pain_points: merged,
        updated_at: new Date().toISOString(),
      }).eq('id', ctx.sessionId);
    }
  } catch (error) {
    console.warn('[Brain Worker: memoryWriter] Non-fatal error:', error);
  }
}

// ── Worker 2: Sentiment Tracker ────────────────────────────────────

/**
 * Scores the user's message sentiment and updates the rolling session
 * sentiment. This is the lightweight version — pattern-based, no API call.
 *
 * The sentiment score is injected into the next agent prompt via
 * buildEnhancedSystemPrompt() to adjust tone in real time.
 */
async function sentimentTracker(ctx: WorkerContext): Promise<void> {
  try {
    const score = scoreSentiment(ctx.userMessage);

    // Update the latest user message
    await ctx.supabase.from('agent_chat_messages')
      .update({ sentiment_score: score })
      .eq('session_id', ctx.sessionId)
      .eq('role', 'user')
      .order('created_at', { ascending: false })
      .limit(1);

    // Update session rolling sentiment (exponential moving average)
    const currentScore = ctx.session?.sentiment_score ?? 0;
    const alpha = 0.4; // Weight toward new score
    const rollingScore = Math.round((alpha * score + (1 - alpha) * currentScore) * 100) / 100;

    await ctx.supabase.from('agent_chat_sessions').update({
      sentiment_score: rollingScore,
      updated_at: new Date().toISOString(),
    }).eq('id', ctx.sessionId);
  } catch (error) {
    console.warn('[Brain Worker: sentimentTracker] Non-fatal error:', error);
  }
}

// Lightweight sentiment scoring (same as agent route, extracted here for reuse)
const POSITIVE_SIGNALS = [
  /\b(love|great|awesome|amazing|perfect|excited|interested|sounds good|yes|yeah|absolutely|definitely|fantastic|wonderful|cool|nice|thanks|thank you|appreciate)\b/i,
  /!\s*$/,
  /😊|😃|👍|🙌|❤️|🔥|💪|✅/,
];

const NEGATIVE_SIGNALS = [
  /\b(frustrated|annoyed|angry|upset|disappointed|hate|terrible|awful|worst|waste|scam|ridiculous|unacceptable|cancel|stop|leave me alone|not interested|go away)\b/i,
  /\b(can't|won't|don't want|no way|forget it|never mind|nah|nope)\b/i,
  /😡|😤|👎|💀|🙄/,
];

const OVERWHELMED_SIGNALS = [
  /\b(overwhelmed|exhausted|burnt? out|stressed|drowning|too much|can't keep up|no time|swamped|buried)\b/i,
];

function scoreSentiment(message: string): number {
  let score = 0;
  for (const pattern of POSITIVE_SIGNALS) {
    if (pattern.test(message)) score += 0.3;
  }
  for (const pattern of NEGATIVE_SIGNALS) {
    if (pattern.test(message)) score -= 0.4;
  }
  for (const pattern of OVERWHELMED_SIGNALS) {
    if (pattern.test(message)) score -= 0.2;
  }
  return Math.max(-1.0, Math.min(1.0, Math.round(score * 100) / 100));
}

// ── Worker 3: Lead Notifier ────────────────────────────────────────

/**
 * When a lead is created by any agent, notify the business owner
 * via dashboard + email. For Verified Supplier leads, also notify
 * the platform owner (Jared).
 */
async function leadNotifier(ctx: WorkerContext): Promise<void> {
  try {
    const leadCall = ctx.toolCalls.find(
      t => t.name === 'create_lead' || t.name === 'create_qualified_lead'
    );
    if (!leadCall || !leadCall.result?.success) return;

    const leadArgs = leadCall.arguments;
    const leadName = leadArgs.name || leadArgs.homeowner_name || 'Unknown';
    const leadScore = leadArgs.intent_score || 50;
    const isVerified = leadCall.name === 'create_qualified_lead';

    // Notify the business owner (dashboard + email)
    if (ctx.businessId) {
      await notify({
        businessId: ctx.businessId,
        title: isVerified
          ? `Verified Lead: ${leadName} (Score: ${leadScore}/100)`
          : `New Lead: ${leadName}`,
        body: isVerified
          ? `Scout qualified a homeowner in ${leadArgs.property_zip || 'your area'}. Equipment: ${leadArgs.equipment_type || 'TBD'}. ${leadArgs.qualification_notes || ''}`
          : `${leadArgs.summary || leadArgs.pain_point || 'New lead from chat'}`,
        category: 'lead',
        severity: leadScore >= 80 ? 'critical' : leadScore >= 65 ? 'warning' : 'info',
        sourceType: 'lead',
        sourceId: leadCall.result.lead_id,
        actionUrl: '/admin-v2/leads',
        actionLabel: 'View Lead',
        channels: ['dashboard', 'email'],
      });
    }

    // Always notify platform owner for verified leads (revenue event)
    if (isVerified) {
      await sendOwnerEmail({
        supabase: ctx.supabase,
        subject: `GL365 Verified Lead: ${leadName} (Score: ${leadScore}/100)`,
        body: [
          `New verified lead created by ${ctx.agentId}.`,
          ``,
          `Homeowner: ${leadName}`,
          `Phone: ${leadArgs.homeowner_phone || 'N/A'}`,
          `Email: ${leadArgs.homeowner_email || 'N/A'}`,
          `ZIP: ${leadArgs.property_zip || 'N/A'}`,
          `Equipment: ${leadArgs.equipment_type || 'N/A'} (${leadArgs.equipment_age ? leadArgs.equipment_age + ' years old' : 'age unknown'})`,
          `Monthly waste: $${leadArgs.estimated_monthly_waste || 'TBD'}`,
          `Intent score: ${leadScore}/100`,
          `Notes: ${leadArgs.qualification_notes || 'None'}`,
          ``,
          `Session: ${ctx.sessionId}`,
          `Agent: ${ctx.agentId}/${ctx.mode}`,
        ].join('\n'),
      });
    }
  } catch (error) {
    console.warn('[Brain Worker: leadNotifier] Non-fatal error:', error);
  }
}

// ── Worker 4: Supplier Matcher ─────────────────────────────────────

/**
 * When a verified lead is created, match it to the top 3 Verified
 * Suppliers in the area and notify them.
 *
 * Matching algorithm:
 *   1. Filter by trade (equipment_type)
 *   2. Filter by ZIP code (service area)
 *   3. Rank by Verified Supplier Composite Score
 *   4. Take top 3
 *   5. Create supplier_lead_history entries
 *   6. Notify each supplier
 */
async function supplierMatcher(ctx: WorkerContext): Promise<void> {
  try {
    const leadCall = ctx.toolCalls.find(t => t.name === 'create_qualified_lead');
    if (!leadCall || !leadCall.result?.success) return;

    const leadId = leadCall.result.lead_id;
    const zip = leadCall.arguments.property_zip;
    const equipmentType = leadCall.arguments.equipment_type;

    if (!leadId || !zip) return;

    // Find top 3 Verified Suppliers for this trade + ZIP
    // Note: This query assumes the verified_suppliers table has a service_areas JSONB column
    // or we match on a broader geographic level. Start simple — match any active supplier.
    const { data: suppliers } = await ctx.supabase
      .from('verified_suppliers')
      .select('id, business_id, composite_score, subscription_tier')
      .eq('badge_status', 'active')
      .order('composite_score', { ascending: false })
      .limit(3);

    if (!suppliers?.length) {
      // No suppliers available — notify owner
      await sendOwnerEmail({
        supabase: ctx.supabase,
        subject: `GL365 Alert: Verified lead has no matching suppliers`,
        body: `Lead ${leadId} in ZIP ${zip} (${equipmentType}) has no matching Verified Suppliers. Manual routing needed.`,
      });
      return;
    }

    // Update the lead with the first matched supplier
    await ctx.supabase.from('verified_leads').update({
      matched_supplier_id: suppliers[0].id,
      matched_at: new Date().toISOString(),
      lead_status: 'matched',
    }).eq('id', leadId);

    // Create lead history entries for each supplier
    for (const supplier of suppliers) {
      await ctx.supabase.from('supplier_lead_history').insert({
        supplier_id: supplier.id,
        lead_id: leadId,
        action: 'offered',
        lead_fee_charged: supplier.subscription_tier === 'exclusive' ? 900 : 600,
      }).then(() => {}).catch(() => {});

      // Notify each supplier
      if (supplier.business_id) {
        await notify({
          businessId: supplier.business_id,
          title: `New Verified Lead in ${zip}`,
          body: `${equipmentType} lead — Score: ${leadCall.arguments.intent_score}/100. You have 4 hours to accept.`,
          category: 'lead',
          severity: 'critical',
          sourceType: 'verified_lead',
          sourceId: leadId,
          actionUrl: '/admin-v2/verified-leads',
          actionLabel: 'View Lead',
          channels: ['dashboard', 'email'],
        });
      }
    }

    // Notify platform owner
    await sendOwnerEmail({
      supabase: ctx.supabase,
      subject: `GL365 Lead Matched: ${suppliers.length} suppliers notified in ${zip}`,
      body: [
        `Lead ${leadId} matched to ${suppliers.length} Verified Suppliers.`,
        `Revenue: ${suppliers.length} × $600 = $${suppliers.length * 600}`,
        `ZIP: ${zip} | Trade: ${equipmentType}`,
        `Top supplier score: ${suppliers[0].composite_score}`,
      ].join('\n'),
    });
  } catch (error) {
    console.warn('[Brain Worker: supplierMatcher] Non-fatal error:', error);
  }
}

// ── Worker 5: Transfer Notifier ────────────────────────────────────

/**
 * When an agent transfer occurs, log it and optionally notify.
 */
async function transferNotifier(ctx: WorkerContext): Promise<void> {
  try {
    const transferCall = ctx.toolCalls.find(t => t.name === 'transfer_department');
    if (!transferCall) return;

    const department = transferCall.arguments.department;
    const reason = transferCall.arguments.context_summary;

    // Human escalations always notify the owner
    if (department === 'human') {
      if (ctx.businessId) {
        await notify({
          businessId: ctx.businessId,
          title: `Human escalation requested`,
          body: `Customer asked for a human. Agent: ${ctx.agentId}. Reason: ${reason || 'Customer request'}`,
          category: 'alert',
          severity: 'warning',
          sourceType: 'agent_session',
          sourceId: ctx.sessionId,
          actionUrl: '/admin-v2/chat',
          actionLabel: 'View Conversation',
          channels: ['dashboard', 'email'],
        });
      }

      await sendOwnerEmail({
        supabase: ctx.supabase,
        subject: `GL365 Escalation: Customer wants a human`,
        body: [
          `A customer requested human assistance.`,
          `Agent: ${ctx.agentId}/${ctx.mode}`,
          `Reason: ${reason || 'Customer request'}`,
          `Contact: ${ctx.contactName || 'Unknown'} (${ctx.contactEmail || ctx.contactPhone || 'no contact info'})`,
          `Session: ${ctx.sessionId}`,
        ].join('\n'),
      });
    }
  } catch (error) {
    console.warn('[Brain Worker: transferNotifier] Non-fatal error:', error);
  }
}

// ── Utility: Owner Email ───────────────────────────────────────────

/**
 * Send a notification email to the platform owner.
 * Uses the Supabase Edge Function or a simple email API.
 *
 * For now, logs to memory_event_journal with a "notify_owner" tag
 * so it appears in the Brain's event feed. The actual email send
 * will be wired when the email provider (Resend/SendGrid) is configured.
 */
async function sendOwnerEmail(params: {
  supabase: any;
  subject: string;
  body: string;
}): Promise<void> {
  try {
    // Log the notification event
    await params.supabase.from('memory_event_journal').insert({
      event_type: 'owner_notification',
      event_category: 'system',
      title: params.subject,
      description: params.body.substring(0, 500),
      metadata: {
        recipient: OWNER_EMAIL,
        full_body: params.body,
        channel: 'email',
      },
      tags: ['notify_owner', 'email'],
      search_text: `${params.subject} ${params.body}`,
      ai_generated: true,
    });

    // TODO: Wire actual email send via Resend/SendGrid
    // await resend.emails.send({
    //   from: 'GL365 Notifications <notifications@greenline365.com>',
    //   to: OWNER_EMAIL,
    //   subject: params.subject,
    //   text: params.body,
    // });

    console.log(`[Brain Worker: ownerEmail] Logged: ${params.subject}`);
  } catch (error) {
    console.warn('[Brain Worker: ownerEmail] Non-fatal error:', error);
  }
}

// ── Notification Event Catalog ─────────────────────────────────────

/**
 * Complete list of events that should generate notifications.
 * This serves as the source of truth for what gets notified and to whom.
 *
 * PAYMENT EVENTS (→ owner email + dashboard):
 * - New subscriber payment received
 * - Subscription renewal
 * - Lead fee charged to supplier
 * - Application fee received ($500)
 * - Audit fee received ($400)
 * - Report bundle purchased
 *
 * LEAD EVENTS (→ owner email + business dashboard):
 * - Verified lead created (Scout or Calculator)
 * - Lead matched to supplier(s)
 * - Lead accepted by supplier
 * - Lead declined by supplier
 * - Lead closed (won/lost + amount)
 * - Decay trigger fired (automated lead source)
 *
 * SUBSCRIBER EVENTS (→ owner email + dashboard):
 * - New contractor signs up (free listing)
 * - Contractor upgrades to paid tier
 * - Verified Supplier application submitted
 * - Verified Supplier badge activated
 * - Verified Supplier badge suspended
 *
 * AGENT EVENTS (→ dashboard, owner email for escalations):
 * - Human escalation requested
 * - Agent transfer completed
 * - High-intent conversation detected (score 85+)
 *
 * SYSTEM EVENTS (→ dashboard):
 * - Badge score recalculated
 * - Collusion pattern detected
 * - Feedback pattern detected
 */
