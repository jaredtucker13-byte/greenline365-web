// ============================================================
// Cron: Trend Scanner — Runs every 3 hours via Vercel Cron
// ============================================================
// 1. Scans for new local trends using Perplexity via OpenRouter
// 2. Expires stale deals (backup — orchestrator also does this hourly)
//
// Thank-you emails are handled by the orchestrator worker, not here.
//
// Configure in vercel.json: schedule "0 */3 * * *"
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
  if (!cronSecret) {
    console.error('[CRON] CRON_SECRET not configured — rejecting request');
    return false;
  }
  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    tasks: {} as Record<string, unknown>,
  };
  const tasks = results.tasks as Record<string, unknown>;

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
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

    for (const zipCode of zipsToScan) {
      try {
        const scanResponse = await fetch(`${siteUrl}/api/daily-trend-hunter`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ zipCode, userId: null, source: 'cron_3h' }),
        });

        const scanData = await scanResponse.json();
        tasks[`scan_${zipCode}`] = {
          success: scanData.success,
          trendsFound: scanData.trends?.length || 0,
          source: scanData.metadata?.source,
        };
      } catch (err: any) {
        tasks[`scan_${zipCode}`] = { error: err.message };
      }
    }
  } catch (error: any) {
    tasks.trend_scan = { error: error.message };
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
  }

  return NextResponse.json({ success: true, ...results });
}
