// ============================================================
// Cron: Weekly Trend Digest — Triggered externally by cron-job.org
// ============================================================
// 1. Checks agent_configs for kill-switch status
// 2. Queries local_trends from the past 7 days
// 3. Compiles a summary of top trends by category
// 4. Stores the digest in weekly_digests table
// 5. Optionally sends via SendGrid if configured
// 6. Updates agent_configs with run metadata
//
// Scheduled externally via cron-job.org: "0 9 * * 1" (Monday 9 AM)
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

interface TrendSummary {
  category: string;
  count: number;
  trends: { title: string; location: string; expected_traffic: string | null }[];
}

async function compileTrendDigest(): Promise<{
  period_start: string;
  period_end: string;
  total_trends: number;
  by_category: TrendSummary[];
  top_locations: { location: string; count: number }[];
}> {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const { data: trends, error } = await supabase
    .from('local_trends')
    .select('title, description, location, event_date, expected_traffic, category, source')
    .gte('created_at', weekAgo.toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    if (error.code === '42P01') {
      return {
        period_start: weekAgo.toISOString(),
        period_end: now.toISOString(),
        total_trends: 0,
        by_category: [],
        top_locations: [],
      };
    }
    throw new Error(`Failed to query local_trends: ${error.message}`);
  }

  const allTrends = trends || [];

  // Group by category
  const categoryMap = new Map<string, TrendSummary>();
  for (const trend of allTrends) {
    const cat = trend.category || 'other';
    if (!categoryMap.has(cat)) {
      categoryMap.set(cat, { category: cat, count: 0, trends: [] });
    }
    const group = categoryMap.get(cat)!;
    group.count++;
    if (group.trends.length < 5) {
      group.trends.push({
        title: trend.title,
        location: trend.location,
        expected_traffic: trend.expected_traffic,
      });
    }
  }

  const byCategory = Array.from(categoryMap.values())
    .sort((a, b) => b.count - a.count);

  // Top locations
  const locationCounts = new Map<string, number>();
  for (const trend of allTrends) {
    const loc = trend.location || 'Unknown';
    locationCounts.set(loc, (locationCounts.get(loc) || 0) + 1);
  }
  const topLocations = Array.from(locationCounts.entries())
    .map(([location, count]) => ({ location, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    period_start: weekAgo.toISOString(),
    period_end: now.toISOString(),
    total_trends: allTrends.length,
    by_category: byCategory,
    top_locations: topLocations,
  };
}

function buildDigestHtml(digest: Awaited<ReturnType<typeof compileTrendDigest>>): string {
  const categoryRows = digest.by_category
    .map(cat => {
      const trendList = cat.trends
        .map(t => `<li><strong>${t.title}</strong> — ${t.location}${t.expected_traffic ? ` (${t.expected_traffic} traffic)` : ''}</li>`)
        .join('');
      return `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #eee;">
            <h3 style="margin: 0 0 8px; color: #B8860B; text-transform: capitalize;">${cat.category} (${cat.count})</h3>
            <ul style="margin: 0; padding-left: 20px;">${trendList}</ul>
          </td>
        </tr>`;
    })
    .join('');

  const locationList = digest.top_locations
    .map(l => `<li>${l.location}: ${l.count} trend${l.count !== 1 ? 's' : ''}</li>`)
    .join('');

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #B8860B 0%, #DAA520 100%); padding: 24px; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">GreenLine 365 Weekly Trend Digest</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0;">
          ${new Date(digest.period_start).toLocaleDateString()} — ${new Date(digest.period_end).toLocaleDateString()}
        </p>
      </div>
      <div style="padding: 24px; background: #fff; border: 1px solid #eee;">
        <p style="font-size: 18px; color: #333;">
          <strong>${digest.total_trends}</strong> local trend${digest.total_trends !== 1 ? 's' : ''} detected this week across
          <strong>${digest.by_category.length}</strong> categories.
        </p>
        <table style="width: 100%; border-collapse: collapse;">${categoryRows}</table>
        ${digest.top_locations.length > 0 ? `
          <h3 style="margin: 24px 0 8px; color: #333;">Top Locations</h3>
          <ul style="padding-left: 20px;">${locationList}</ul>
        ` : ''}
      </div>
      <div style="padding: 16px; background: #f8f8f8; border-radius: 0 0 8px 8px; text-align: center; color: #888; font-size: 12px;">
        Powered by GreenLine 365 Agentic System
      </div>
    </div>
  `;
}

async function sendDigestEmail(html: string, digest: Awaited<ReturnType<typeof compileTrendDigest>>): Promise<boolean> {
  const sendgridKey = process.env.SENDGRID_API_KEY;
  const adminEmail = process.env.ADMIN_EMAIL || process.env.SENDGRID_FROM_EMAIL;

  if (!sendgridKey || !adminEmail) return false;

  try {
    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: { Authorization: `Bearer ${sendgridKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: adminEmail }] }],
        from: {
          email: process.env.SENDGRID_FROM_EMAIL || 'greenline365help@gmail.com',
          name: 'GreenLine 365 Digest',
        },
        subject: `Weekly Trend Digest — ${digest.total_trends} trends (${new Date(digest.period_start).toLocaleDateString()} - ${new Date(digest.period_end).toLocaleDateString()})`,
        content: [{ type: 'text/html', value: html }],
      }),
    });

    return res.ok || res.status === 202;
  } catch {
    return false;
  }
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
      .eq('agent_id', 'weekly_digest')
      .single();

    if (agentConfig && !agentConfig.is_active) {
      return NextResponse.json({
        agent: 'weekly_digest',
        status: 'disabled',
        timestamp: new Date().toISOString(),
        message: 'Agent disabled via agent_configs dashboard kill-switch',
      });
    }
  } catch {
    // agent_configs table may not exist yet — proceed anyway
  }

  let overallSuccess = true;
  let emailSent = false;

  try {
    // Compile the digest
    const digest = await compileTrendDigest();
    const html = buildDigestHtml(digest);

    // Store in weekly_digests table
    try {
      await supabase.from('weekly_digests').insert({
        period_start: digest.period_start,
        period_end: digest.period_end,
        total_trends: digest.total_trends,
        by_category: digest.by_category,
        top_locations: digest.top_locations,
        html_content: html,
      });
    } catch {
      // Table may not exist yet — non-critical
    }

    // Send email if SendGrid configured
    if (digest.total_trends > 0) {
      emailSent = await sendDigestEmail(html, digest);
    }

    const durationMs = Date.now() - startTime;

    // ── Update agent_configs with run metadata ──────────────
    try {
      await supabase
        .from('agent_configs')
        .update({
          last_run: new Date().toISOString(),
          last_status: 'success',
          last_duration_ms: durationMs,
        })
        .eq('agent_id', 'weekly_digest');
    } catch {
      // Non-critical
    }

    return NextResponse.json({
      success: true,
      agent: 'weekly_digest',
      duration_ms: durationMs,
      digest: {
        period_start: digest.period_start,
        period_end: digest.period_end,
        total_trends: digest.total_trends,
        categories: digest.by_category.length,
        top_locations: digest.top_locations.length,
      },
      email_sent: emailSent,
    });
  } catch (err: any) {
    overallSuccess = false;
    const durationMs = Date.now() - startTime;

    // Update agent_configs with failure
    try {
      await supabase
        .from('agent_configs')
        .update({
          last_run: new Date().toISOString(),
          last_status: 'failed',
          last_duration_ms: durationMs,
        })
        .eq('agent_id', 'weekly_digest');
    } catch {
      // Non-critical
    }

    return NextResponse.json({
      success: false,
      agent: 'weekly_digest',
      duration_ms: durationMs,
      error: err.message,
    }, { status: 500 });
  }
}
