// ============================================================
// /api/health — System Health Check + Deploy Manifest
// ============================================================
// Pings every service GL365 depends on. Returns health status.
// Also serves as the deploy manifest (what's live, what version).
//
// Public endpoint — no auth required. Uptime monitors hit this.
// The orchestrator worker also calls this every cycle.
//
// GET /api/health           → Full health report
// GET /api/health?quick=1   → Just overall status (for load balancers)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

interface ServiceCheck {
  status: 'healthy' | 'degraded' | 'down';
  latency_ms: number;
  error?: string;
  details?: Record<string, unknown>;
}

// ── Service Health Checks ───────────────────────────────────

async function checkSupabase(): Promise<ServiceCheck> {
  const start = Date.now();
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Quick query to verify connection
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    const latency = Date.now() - start;

    if (error) {
      // Table might not exist but connection works if we got an API response
      if (error.code === '42P01') {
        return { status: 'healthy', latency_ms: latency, details: { note: 'connected, table check skipped' } };
      }
      return { status: 'degraded', latency_ms: latency, error: error.message };
    }

    return { status: 'healthy', latency_ms: latency };
  } catch (err: any) {
    return { status: 'down', latency_ms: Date.now() - start, error: err.message };
  }
}

async function checkSupabaseAuth(): Promise<ServiceCheck> {
  const start = Date.now();
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // List users with limit 1 to verify auth service
    const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
    const latency = Date.now() - start;

    if (error) {
      return { status: 'degraded', latency_ms: latency, error: error.message };
    }

    return { status: 'healthy', latency_ms: latency, details: { total_users: data.users?.length ? 'accessible' : 'empty' } };
  } catch (err: any) {
    return { status: 'down', latency_ms: Date.now() - start, error: err.message };
  }
}

async function checkOpenRouter(): Promise<ServiceCheck> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return { status: 'down', latency_ms: 0, error: 'OPENROUTER_API_KEY not set' };

  const start = Date.now();
  try {
    const res = await fetch('https://openrouter.ai/api/v1/models', {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(5000),
    });
    const latency = Date.now() - start;

    if (res.ok) return { status: 'healthy', latency_ms: latency };
    return { status: 'degraded', latency_ms: latency, error: `HTTP ${res.status}` };
  } catch (err: any) {
    return { status: 'down', latency_ms: Date.now() - start, error: err.message };
  }
}

async function checkStripe(): Promise<ServiceCheck> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return { status: 'down', latency_ms: 0, error: 'STRIPE_SECRET_KEY not set' };

  const start = Date.now();
  try {
    const res = await fetch('https://api.stripe.com/v1/balance', {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(5000),
    });
    const latency = Date.now() - start;

    if (res.ok) return { status: 'healthy', latency_ms: latency };
    if (res.status === 401) return { status: 'down', latency_ms: latency, error: 'Invalid API key' };
    return { status: 'degraded', latency_ms: latency, error: `HTTP ${res.status}` };
  } catch (err: any) {
    return { status: 'down', latency_ms: Date.now() - start, error: err.message };
  }
}

async function checkSendGrid(): Promise<ServiceCheck> {
  const key = process.env.SENDGRID_API_KEY;
  if (!key) return { status: 'down', latency_ms: 0, error: 'SENDGRID_API_KEY not set' };

  const start = Date.now();
  try {
    const res = await fetch('https://api.sendgrid.com/v3/scopes', {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(5000),
    });
    const latency = Date.now() - start;

    if (res.ok) return { status: 'healthy', latency_ms: latency };
    return { status: 'degraded', latency_ms: latency, error: `HTTP ${res.status}` };
  } catch (err: any) {
    return { status: 'down', latency_ms: Date.now() - start, error: err.message };
  }
}

// ── Environment Check ───────────────────────────────────────

function checkEnvironment(): Record<string, boolean> {
  const vars: Record<string, string | undefined> = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    CRON_SECRET: process.env.CRON_SECRET,
    SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
    RETELL_API_KEY: process.env.RETELL_API_KEY,
  };

  const result: Record<string, boolean> = {};
  for (const [key, value] of Object.entries(vars)) {
    result[key] = !!value;
  }
  return result;
}

// ── Main Handler ────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const quick = request.nextUrl.searchParams.get('quick');
  const startTime = Date.now();

  // Quick mode: just return status for load balancers
  if (quick) {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      await supabase.from('profiles').select('id').limit(1);
      return NextResponse.json({ status: 'healthy', timestamp: new Date().toISOString() });
    } catch {
      return NextResponse.json({ status: 'down', timestamp: new Date().toISOString() }, { status: 503 });
    }
  }

  // Full health check: ping all services in parallel
  const [supabase, supabaseAuth, openrouter, stripe, sendgrid] = await Promise.all([
    checkSupabase(),
    checkSupabaseAuth(),
    checkOpenRouter(),
    checkStripe(),
    checkSendGrid(),
  ]);

  const checks: Record<string, ServiceCheck> = {
    supabase,
    supabase_auth: supabaseAuth,
    openrouter,
    stripe,
    sendgrid,
  };

  // Determine overall status
  const statuses = Object.values(checks).map(c => c.status);
  let overall: 'healthy' | 'degraded' | 'down' = 'healthy';

  // If Supabase is down, everything is down
  if (checks.supabase.status === 'down') {
    overall = 'down';
  } else if (statuses.includes('down') || statuses.includes('degraded')) {
    overall = 'degraded';
  }

  // Deploy manifest
  const manifest = {
    environment: process.env.NEXT_PUBLIC_ENVIRONMENT || process.env.NODE_ENV || 'unknown',
    git_sha: process.env.VERCEL_GIT_COMMIT_SHA || process.env.GIT_SHA || 'unknown',
    git_branch: process.env.VERCEL_GIT_COMMIT_REF || 'unknown',
    git_message: process.env.VERCEL_GIT_COMMIT_MESSAGE || 'unknown',
    deploy_url: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'local',
    region: process.env.VERCEL_REGION || 'unknown',
    deployed_at: process.env.VERCEL_GIT_COMMIT_AUTHOR_LOGIN
      ? `by ${process.env.VERCEL_GIT_COMMIT_AUTHOR_LOGIN}`
      : 'unknown',
  };

  // Environment vars status (set/not set, never the values)
  const env_vars = checkEnvironment();

  const totalLatency = Date.now() - startTime;

  const response = {
    status: overall,
    timestamp: new Date().toISOString(),
    response_time_ms: totalLatency,
    services: checks,
    deploy: manifest,
    env_vars,
  };

  const httpStatus = overall === 'down' ? 503 : overall === 'degraded' ? 200 : 200;

  return NextResponse.json(response, { status: httpStatus });
}
