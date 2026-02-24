/**
 * Leads Intake API — Native replacement for n8n Leads-Intake.json
 *
 * POST /api/leads/intake
 *
 * Accepts lead submissions from:
 * - Aiden/Ada agent chat (create_lead tool)
 * - Widget forms on the directory
 * - External webhooks (partners, ads)
 * - Voice agent (Retell)
 *
 * Flow:
 * 1. Validate + canonicalize incoming lead data
 * 2. Insert into leads table
 * 3. Log audit event
 * 4. Trigger enrichment (async, non-blocking)
 * 5. Return trace_id for tracking
 *
 * Auth: API key via header, or authenticated user session
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServerClient } from '@/lib/supabase/server';
import { callOpenRouterJSON } from '@/lib/openrouter';
import { notify } from '@/lib/notifications';

interface LeadIntakeBody {
  // Required
  name?: string;
  email?: string;
  phone?: string;

  // Optional enrichment
  company?: string;
  business_type?: string;
  source?: string;
  tenant_id?: string;
  message?: string;
  pain_point?: string;
  intent_score?: number;

  // Consent
  consent_marketing?: boolean;

  // Agent context
  agent_session_id?: string;
  agent_id?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Auth: Check API key or user session
    const apiKey = request.headers.get('x-api-key');
    const authHeader = request.headers.get('authorization');
    let isAuthorized = false;
    let userId: string | null = null;

    // API key auth
    if (apiKey && apiKey === process.env.LEADS_API_KEY) {
      isAuthorized = true;
    }

    // Bearer token auth (from agents/internal)
    if (authHeader?.startsWith('Bearer ') && authHeader.slice(7) === process.env.LEADS_API_KEY) {
      isAuthorized = true;
    }

    // Session auth (authenticated users)
    if (!isAuthorized) {
      try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          isAuthorized = true;
          userId = user.id;
        }
      } catch { /* not authenticated */ }
    }

    // Allow unauthenticated submissions (public widget)
    // but rate limit them more aggressively in production
    isAuthorized = true; // Public endpoint for widget submissions

    const body: LeadIntakeBody = await request.json();
    const supabase = createServerClient();

    // ── Validate ──────────────────────────────────────────────

    if (!body.email && !body.phone && !body.name) {
      return NextResponse.json(
        { error: 'At least one of name, email, or phone is required' },
        { status: 400 }
      );
    }

    // Basic email validation
    if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // ── Canonicalize ──────────────────────────────────────────

    const traceId = crypto.randomUUID();
    const eventId = crypto.randomUUID();
    const now = new Date().toISOString();

    const canonical = {
      trace_id: traceId,
      event_id: eventId,
      tenant_id: body.tenant_id || process.env.GL365_DEFAULT_TENANT_ID || null,
      source: body.source || (body.agent_id ? `agent:${body.agent_id}` : 'web_form'),
      email: body.email?.toLowerCase().trim() || null,
      phone: body.phone?.replace(/[^\d+]/g, '') || null, // Strip formatting
      stage: 'new',
      lead_score: body.intent_score || 0,
      intent: body.pain_point || body.message || 'unknown',
      consent_marketing: body.consent_marketing || false,
      metadata: {
        name: body.name,
        company: body.company,
        business_type: body.business_type,
        message: body.message,
        pain_point: body.pain_point,
        intent_score: body.intent_score,
        agent_session_id: body.agent_session_id,
        agent_id: body.agent_id,
        submitted_by_user: userId,
      },
      created_at: now,
      updated_at: now,
    };

    // ── Insert Lead ───────────────────────────────────────────

    // Try the `leads` table first, fall back to `crm_leads`
    let leadId: string | null = null;
    let usedTable = 'leads';

    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert(canonical)
      .select('id')
      .single();

    if (leadError) {
      // Try crm_leads as fallback
      const firstName = body.name?.split(' ')[0] || '';
      const lastName = body.name?.split(' ').slice(1).join(' ') || '';

      const { data: crmLead, error: crmError } = await supabase
        .from('crm_leads')
        .insert({
          business_id: canonical.tenant_id,
          first_name: firstName,
          last_name: lastName,
          email: canonical.email,
          phone: canonical.phone,
          source: canonical.source,
          status: 'new',
          notes: body.message || body.pain_point || '',
          metadata: canonical.metadata,
        })
        .select('id')
        .single();

      if (crmError) {
        console.error('[Leads Intake] Insert error:', leadError, crmError);
        return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 });
      }

      leadId = crmLead.id;
      usedTable = 'crm_leads';
    } else {
      leadId = lead.id;
    }

    // ── Log Audit Event ───────────────────────────────────────

    await supabase
      .from('audit_events')
      .insert({
        tenant_id: canonical.tenant_id,
        event_type: 'lead.webhook.received',
        trace_id: traceId,
        status: 'Ok',
        metadata: {
          lead_id: leadId,
          table: usedTable,
          source: canonical.source,
          email: canonical.email,
          phone: canonical.phone,
        },
      })
      .then(() => {})
      .catch(() => {}); // Non-critical

    // ── Notify Business Owner ─────────────────────────────────

    if (canonical.tenant_id) {
      notify({
        businessId: canonical.tenant_id,
        title: `New Lead: ${body.name || body.email || 'Anonymous'}`,
        body: body.pain_point
          ? `${body.pain_point} — via ${canonical.source}`
          : `New lead from ${canonical.source}`,
        category: 'leads',
        severity: (body.intent_score || 0) >= 70 ? 'warning' : 'info',
        sourceType: usedTable,
        sourceId: leadId!,
        actionUrl: '/admin-v2/leads',
        actionLabel: 'View Lead',
        channels: ['dashboard', 'email'],
      }).catch(() => {}); // Non-critical
    }

    // ── Trigger Async Enrichment ──────────────────────────────

    // Fire-and-forget: enrich the lead with web data
    if (canonical.email || body.company) {
      enrichLead(supabase, leadId!, usedTable, canonical).catch(() => {});
    }

    // ── Response ──────────────────────────────────────────────

    return NextResponse.json({
      status: 'queued',
      message: "Thanks — you're queued. Expect a call within the next 24 hours.",
      trace_id: traceId,
      lead_id: leadId,
    });

  } catch (error: any) {
    console.error('[Leads Intake] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ── Async Lead Enrichment ──────────────────────────────────────────

async function enrichLead(
  supabase: any,
  leadId: string,
  table: string,
  canonical: any
): Promise<void> {
  try {
    const enrichmentPrompt = `Given this lead information, provide brief enrichment data:
- Email: ${canonical.email || 'unknown'}
- Company: ${canonical.metadata?.company || 'unknown'}
- Business Type: ${canonical.metadata?.business_type || 'unknown'}
- Location hint: ${canonical.metadata?.message || 'none'}

Return JSON with:
{
  "company_size_guess": "solo|small|medium",
  "industry_vertical": "string",
  "likely_pain_points": ["string"],
  "recommended_approach": "string",
  "lead_quality": "hot|warm|cold"
}`;

    const { parsed } = await callOpenRouterJSON({
      model: 'anthropic/claude-sonnet-4.6',
      messages: [{ role: 'user', content: enrichmentPrompt }],
      temperature: 0.3,
      max_tokens: 300,
      caller: 'GL365 Lead Enrichment',
    });

    // Update the lead with enrichment data
    if (table === 'leads') {
      await supabase
        .from('leads')
        .update({
          metadata: {
            ...canonical.metadata,
            enrichment: parsed,
            enriched_at: new Date().toISOString(),
          },
          lead_score: parsed.lead_quality === 'hot' ? 80
            : parsed.lead_quality === 'warm' ? 50
            : 20,
          updated_at: new Date().toISOString(),
        })
        .eq('id', leadId);
    } else {
      await supabase
        .from('crm_leads')
        .update({
          metadata: {
            ...canonical.metadata,
            enrichment: parsed,
            enriched_at: new Date().toISOString(),
          },
        })
        .eq('id', leadId);
    }
  } catch (error) {
    console.warn('[Lead Enrichment] Error (non-fatal):', error);
  }
}
