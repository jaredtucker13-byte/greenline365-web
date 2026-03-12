// ============================================================
// /api/cron/orchestrator — Agentic System Orchestrator
// ============================================================
// The brain of GL365's production ops. Triggered externally by cron-job.org.
// This worker is AGENTIC — it doesn't just report, it ACTS:
//   1. Checks agent_configs table for kill-switch status
//   2. Checks service health (Supabase, OpenRouter, Stripe, SendGrid)
//   3. Validates seed data — flags what's missing
//   4. Checks pending migrations
//   5. Sends scheduled thank-you emails (~5 min after QR scan)
//   6. Expires stale deals
//   7. Cleans up old health logs (30-day retention)
//   8. Logs full report to _system_health_log
//   9. Updates agent_configs with run metadata
//
// Scheduled externally via cron-job.org: "0 * * * *" (every hour)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── Auth ────────────────────────────────────────────────────

function verifyCronAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error('[Orchestrator] CRON_SECRET env var is not set - denying access');
    return false;
  }
  return authHeader === `Bearer ${cronSecret}`;
}

// ── Types ───────────────────────────────────────────────────

interface TaskResult {
  success: boolean;
  details: Record<string, unknown>;
  action_taken?: string;
  error?: string;
}

// ── Task 1: Health Checks (calls /api/health) ───────────────

async function checkServiceHealth(): Promise<TaskResult> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  try {
    const res = await fetch(`${siteUrl}/api/health`, {
      signal: AbortSignal.timeout(15000),
    });
    const data = await res.json();

    return {
      success: data.status !== 'down',
      details: { overall: data.status, services: data.services },
    };
  } catch (err: any) {
    // Fallback: direct DB check
    try {
      const { error } = await supabase.from('profiles').select('id').limit(1);
      return {
        success: !error,
        details: { overall: error ? 'degraded' : 'healthy', note: 'Health endpoint unreachable, direct DB check performed' },
      };
    } catch {
      return { success: false, details: { overall: 'down' }, error: err.message };
    }
  }
}

// ── Task 2: Seed Data Validation ────────────────────────────

async function validateSeedData(): Promise<TaskResult> {
  const checks: Record<string, { expected: number; found: number; ok: boolean }> = {};

  const tables = [
    { name: 'deal_email_templates', min: 2 },
    { name: 'feature_registry', min: 10 },
    { name: 'industries', min: 5 },
  ];

  for (const t of tables) {
    try {
      const { count } = await supabase.from(t.name).select('*', { count: 'exact', head: true });
      checks[t.name] = { expected: t.min, found: count || 0, ok: (count || 0) >= t.min };
    } catch {
      checks[t.name] = { expected: t.min, found: 0, ok: false };
    }
  }

  return {
    success: Object.values(checks).every(c => c.ok),
    details: checks,
  };
}

// ── Task 3: Process Scheduled Thank-You Emails ──────────────

async function processScheduledEmails(): Promise<TaskResult> {
  try {
    const now = new Date().toISOString();

    const { data: pendingEmails, error } = await supabase
      .from('deal_redemptions')
      .select(`
        id, deal_id, consumer_email, consumer_name, deal_code,
        scanned_at, thankyou_scheduled_for
      `)
      .eq('thankyou_status', 'scheduled')
      .lte('thankyou_scheduled_for', now)
      .limit(50);

    if (error) {
      if (error.code === '42P01') return { success: true, details: { note: 'deal_redemptions table not created yet' } };
      return { success: false, details: {}, error: error.message };
    }

    if (!pendingEmails || pendingEmails.length === 0) {
      return { success: true, details: { pending: 0, sent: 0 } };
    }

    let sent = 0;
    let failed = 0;
    const sendgridKey = process.env.SENDGRID_API_KEY;

    for (const redemption of pendingEmails) {
      // Get deal info
      const { data: deal } = await supabase
        .from('blast_deals')
        .select('title, description, deal_value, business_id, listing_id, followup_discount_enabled, followup_discount_value, followup_discount_terms, followup_discount_expires_days, review_link_enabled, review_link_url, review_link_text')
        .eq('id', redemption.deal_id)
        .single();

      if (!deal) continue;

      // Get business name
      let businessName = 'your favorite local business';
      if (deal.listing_id) {
        const { data: listing } = await supabase
          .from('directory_listings')
          .select('business_name')
          .eq('id', deal.listing_id)
          .single();
        if (listing) businessName = listing.business_name;
      }

      // Build the thank-you email
      const consumerName = redemption.consumer_name || 'there';
      let body = `Hi ${consumerName},\n\nThank you for choosing ${businessName}! We truly appreciate your business.\n\nToday's deal: ${deal.title}\nDiscount applied: ${deal.deal_value}\n`;

      // Followup discount (owner's discretion)
      if (deal.followup_discount_enabled && deal.followup_discount_value) {
        const code = `GL365-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        body += `\nAs a thank you, here's something for your next visit:\n${deal.followup_discount_value}\nUse code: ${code}\n`;
        if (deal.followup_discount_terms) body += `${deal.followup_discount_terms}\n`;

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + (deal.followup_discount_expires_days || 30));

        await supabase.from('deal_redemptions').update({
          followup_discount_code: code,
          followup_discount_expires_at: expiresAt.toISOString(),
        }).eq('id', redemption.id);
      }

      // Review CTA (owner's discretion)
      if (deal.review_link_enabled && deal.review_link_url) {
        body += `\n${deal.review_link_text || 'Your feedback means the world to us!'}\nLeave a review: ${deal.review_link_url}\n`;
      }

      body += `\nWe look forward to seeing you again!\n\nWarm regards,\nThe ${businessName} Team\nPowered by GreenLine 365`;

      // Send via SendGrid
      if (sendgridKey) {
        try {
          const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
            method: 'POST',
            headers: { Authorization: `Bearer ${sendgridKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              personalizations: [{ to: [{ email: redemption.consumer_email }] }],
              from: { email: process.env.SENDGRID_FROM_EMAIL || 'greenline365help@gmail.com', name: `${businessName} via GreenLine 365` },
              subject: `Thank you for your purchase at ${businessName}!`,
              content: [{ type: 'text/plain', value: body }],
            }),
          });

          if (res.ok || res.status === 202) {
            await supabase.from('deal_redemptions').update({ thankyou_status: 'sent', thankyou_sent_at: new Date().toISOString() }).eq('id', redemption.id);
            sent++;
          } else {
            await supabase.from('deal_redemptions').update({ thankyou_status: 'failed' }).eq('id', redemption.id);
            failed++;
          }
        } catch { failed++; }
      } else {
        await supabase.from('deal_redemptions').update({ thankyou_status: 'failed' }).eq('id', redemption.id);
        failed++;
      }
    }

    return {
      success: true,
      details: { pending: pendingEmails.length, sent, failed },
      action_taken: sent > 0 ? `Sent ${sent} thank-you email(s)` : undefined,
    };
  } catch (err: any) {
    return { success: false, details: {}, error: err.message };
  }
}

// ── Task 4: Expire Stale Deals ──────────────────────────────

async function expireStaleDeals(): Promise<TaskResult> {
  try {
    const { data: expired, error } = await supabase
      .from('blast_deals')
      .update({ status: 'expired', updated_at: new Date().toISOString() })
      .eq('status', 'active')
      .lt('expires_at', new Date().toISOString())
      .select('id');

    if (error) {
      if (error.code === '42P01') return { success: true, details: { note: 'blast_deals table not created yet' } };
      return { success: false, details: {}, error: error.message };
    }

    return {
      success: true,
      details: { expired: expired?.length || 0 },
      action_taken: expired && expired.length > 0 ? `Expired ${expired.length} deal(s)` : undefined,
    };
  } catch (err: any) {
    return { success: false, details: {}, error: err.message };
  }
}

// ── Task 5: Cleanup Old Health Logs (30-day retention) ──────

async function cleanupHealthLogs(): Promise<TaskResult> {
  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);

    const { error } = await supabase
      .from('_system_health_log')
      .delete()
      .lt('checked_at', cutoff.toISOString());

    if (error) {
      if (error.code === '42P01') return { success: true, details: { note: '_system_health_log table not created yet' } };
      return { success: false, details: {}, error: error.message };
    }

    return { success: true, details: { retention: '30 days' } };
  } catch (err: any) {
    return { success: false, details: {}, error: err.message };
  }
}

// ── Task 6: Check Migration Status ──────────────────────────

async function checkMigrationStatus(): Promise<TaskResult> {
  try {
    const { data: applied, error } = await supabase
      .from('_migrations')
      .select('filename')
      .eq('success', true)
      .is('rolled_back_at', null);

    if (error) {
      if (error.code === '42P01') {
        return { success: false, details: { note: 'Run: node scripts/migrate.js', applied: 0 } };
      }
      return { success: false, details: {}, error: error.message };
    }

    const appliedSet = new Set((applied || []).map(r => r.filename));
    const critical = ['026_blast_deals_local_pulse.sql', '027_production_ops_tables.sql'];
    const pending = critical.filter(m => !appliedSet.has(m));

    return {
      success: pending.length === 0,
      details: { applied: applied?.length || 0, pending_critical: pending },
    };
  } catch (err: any) {
    return { success: false, details: {}, error: err.message };
  }
}

// ── Log to _system_health_log ───────────────────────────────

async function logResults(overall: string, tasks: Record<string, TaskResult>, actions: string[]) {
  try {
    await supabase.from('_system_health_log').insert({
      overall_status: overall,
      checks: tasks.health_check?.details || {},
      seed_status: tasks.seed_validation?.details || {},
      migration_status: tasks.migration_check?.details || {},
      actions_taken: actions.map(a => ({ action: a, ts: new Date().toISOString() })),
      environment: process.env.NEXT_PUBLIC_ENVIRONMENT || 'unknown',
      git_sha: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
      deploy_url: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'local',
    });
  } catch {
    // Logging failure shouldn't crash the orchestrator
  }
}

// ── Main ────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();

  // ── Check agent_configs kill-switch ──────────────────────
  try {
    const { data: agentConfig } = await supabase
      .from('agent_configs')
      .select('is_active')
      .eq('agent_id', 'orchestrator')
      .single();

    if (agentConfig && !agentConfig.is_active) {
      return NextResponse.json({
        orchestrator: 'GL365 Agentic System Orchestrator',
        status: 'disabled',
        timestamp: new Date().toISOString(),
        message: 'Agent disabled via agent_configs dashboard kill-switch',
      });
    }
  } catch {
    // agent_configs table may not exist yet — proceed anyway
  }

  const results: Record<string, TaskResult> = {};
  const allActions: string[] = [];

  // Parallel checks
  const [healthCheck, seedValidation, migrationCheck] = await Promise.all([
    checkServiceHealth(),
    validateSeedData(),
    checkMigrationStatus(),
  ]);

  results.health_check = healthCheck;
  results.seed_validation = seedValidation;
  results.migration_check = migrationCheck;

  // Sequential tasks (need DB)
  if (healthCheck.success) {
    results.thankyou_emails = await processScheduledEmails();
    results.expire_deals = await expireStaleDeals();
    results.cleanup_logs = await cleanupHealthLogs();
  } else {
    results.thankyou_emails = { success: false, details: { skipped: 'DB unavailable' } };
    results.expire_deals = { success: false, details: { skipped: 'DB unavailable' } };
    results.cleanup_logs = { success: false, details: { skipped: 'DB unavailable' } };
  }

  // Collect actions
  for (const task of Object.values(results)) {
    if (task.action_taken) allActions.push(task.action_taken);
  }

  // Overall status
  const anyDown = Object.values(results).some(r => !r.success && r.error);
  const allOk = Object.values(results).every(r => r.success);
  const overall = anyDown ? 'down' : allOk ? 'healthy' : 'degraded';

  // Log everything
  await logResults(overall, results, allActions);

  const durationMs = Date.now() - startTime;

  // ── Update agent_configs with run metadata ──────────────
  try {
    await supabase
      .from('agent_configs')
      .update({
        last_run: new Date().toISOString(),
        last_status: overall === 'down' ? 'failed' : 'success',
        last_duration_ms: durationMs,
      })
      .eq('agent_id', 'orchestrator');
  } catch {
    // Non-critical — don't fail the response
  }

  return NextResponse.json({
    orchestrator: 'GL365 Agentic System Orchestrator',
    status: overall,
    timestamp: new Date().toISOString(),
    duration_ms: durationMs,
    tasks: results,
    actions_taken: allActions,
  });
}
