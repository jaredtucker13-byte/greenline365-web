// ============================================================
// Cron: Trend Scanner — Triggered externally by cron-job.org
// ============================================================
// 1. Checks agent_configs for kill-switch status
// 2. Scans for new local trends using Perplexity via OpenRouter
// 3. Expires stale deals (backup — orchestrator also does this hourly)
// 4. Updates agent_configs with run metadata
//
// Thank-you emails are handled by the orchestrator worker, not here.
//
// Scheduled externally via cron-job.org: "0 */3 * * *" (every 3 hours)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function verifyCronAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) return authHeader === `Bearer ${cronSecret}`;
  return true;
}

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
      .eq('agent_id', 'trend_scanner')
      .single();

    if (agentConfig && !agentConfig.is_active) {
      return NextResponse.json({
        agent: 'trend_scanner',
        status: 'disabled',
        timestamp: new Date().toISOString(),
        message: 'Agent disabled via agent_configs dashboard kill-switch',
      });
    }
  } catch {
    // agent_configs table may not exist yet — proceed anyway
  }

  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    tasks: {} as Record<string, unknown>,
  };
  const tasks = results.tasks as Record<string, unknown>;
  let overallSuccess = true;

  // Task 1: Scan for new trends for active ZIP codes
  try {
    // Get ZIP codes from active listings
    const { data: activeListings } = await supabase
      .from('directory_listings')
      .select('zip_code')
      .not('zip_code', 'is', null)
      .limit(20);

    const uniqueZips = [...new Set(
      (activeListings || []).map(l => l.zip_code).filter(Boolean)
    )];

    // Fallback to Tampa if no active listings
    const zipsToScan = uniqueZips.length > 0 ? uniqueZips : ['33619'];
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    // Process ZIP codes in parallel with per-request timeout (15s each)
    const PER_ZIP_TIMEOUT_MS = 15_000;
    const scanPromises = zipsToScan.map(async (zipCode) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), PER_ZIP_TIMEOUT_MS);
      try {
        const scanResponse = await fetch(`${siteUrl}/api/daily-trend-hunter`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ zipCode, userId: null, source: 'cron_3h' }),
          signal: controller.signal,
        });

        const scanData = await scanResponse.json();
        tasks[`scan_${zipCode}`] = {
          success: scanData.success,
          trendsFound: scanData.trends?.length || 0,
          source: scanData.metadata?.source,
        };
      } catch (err: any) {
        const isTimeout = err.name === 'AbortError';
        tasks[`scan_${zipCode}`] = { error: isTimeout ? 'Scan timed out' : err.message };
        overallSuccess = false;
      } finally {
        clearTimeout(timeoutId);
      }
    });

    await Promise.allSettled(scanPromises);
  } catch (error: any) {
    tasks.trend_scan = { error: error.message };
    overallSuccess = false;
  }

  // Task 2: Expire stale deals (backup — orchestrator does this too)
  try {
    const { data: expiredDeals, error } = await supabase
      .from('blast_deals')
      .update({ status: 'expired', updated_at: new Date().toISOString() })
      .eq('status', 'active')
      .lt('expires_at', new Date().toISOString())
      .select('id');

    tasks.expire_deals = {
      expired: expiredDeals?.length || 0,
      error: error?.message || null,
    };
  } catch (error: any) {
    tasks.expire_deals = { error: error.message };
    overallSuccess = false;
  }

  const durationMs = Date.now() - startTime;

  // ── Update agent_configs with run metadata ──────────────
  try {
    await supabase
      .from('agent_configs')
      .update({
        last_run: new Date().toISOString(),
        last_status: overallSuccess ? 'success' : 'failed',
        last_duration_ms: durationMs,
      })
      .eq('agent_id', 'trend_scanner');
  } catch {
    // Non-critical — don't fail the response
  }

  return NextResponse.json({
    success: overallSuccess,
    agent: 'trend_scanner',
    duration_ms: durationMs,
    ...results,
  });
}
