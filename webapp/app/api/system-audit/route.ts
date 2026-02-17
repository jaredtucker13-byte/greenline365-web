import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

/**
 * System Audit API — Parallel Sub-Agent Health Checks
 *
 * Fires three diagnostic agents simultaneously via Promise.allSettled:
 *   - SAYA:     Voice & onboarding flow health
 *   - PASSPORT: Property Passport & directory health
 *   - SYNC:     Deployment & API health (0 errors target)
 *
 * Protected by CRON_SECRET (Bearer token).
 *
 * GET  /api/system-audit
 * POST /api/system-audit  { agents?: ('saya'|'passport'|'sync')[] }
 */

// ─── Types ───────────────────────────────────────────────

interface Check {
  name: string;
  passed: boolean;
  status: number;
  message: string;
}

interface AgentResult {
  agent: string;
  description: string;
  durationMs: number;
  passed: boolean;
  checks: Check[];
}

interface AuditReport {
  timestamp: string;
  environment: string;
  overallHealth: 'GREEN' | 'YELLOW' | 'RED';
  totalDurationMs: number;
  agents: AgentResult[];
  summary: {
    total_checks: number;
    passed: number;
    failed: number;
  };
}

// ─── Auth ────────────────────────────────────────────────

function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  return authHeader === `Bearer ${cronSecret}`;
}

// ─── Agent SAYA: Voice / Onboarding Flow ─────────────────

async function agentSaya(baseUrl: string): Promise<AgentResult> {
  const checks: Check[] = [];
  const start = Date.now();

  // Check 1: Retell webhook endpoint is reachable
  try {
    const res = await fetch(`${baseUrl}/api/retell/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'health_check' }),
    });
    checks.push({
      name: 'retell_webhook_reachable',
      passed: res.status !== 404,
      status: res.status,
      message: res.status === 404 ? 'Webhook endpoint not found' : 'Endpoint reachable',
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    checks.push({ name: 'retell_webhook_reachable', passed: false, status: 0, message: msg });
  }

  // Check 2: Retell API key configured
  checks.push({
    name: 'retell_api_key_configured',
    passed: !!process.env.RETELL_API_KEY,
    status: process.env.RETELL_API_KEY ? 200 : 0,
    message: process.env.RETELL_API_KEY ? 'Configured' : 'RETELL_API_KEY missing',
  });

  // Check 3: Voice agent IDs configured
  const agentIds = {
    demo: !!process.env.RETELL_DEMO_AGENT_ID,
    sales: !!process.env.RETELL_SALES_AGENT_ID,
    support: !!process.env.RETELL_SUPPORT_AGENT_ID,
    followup: !!process.env.RETELL_FOLLOWUP_AGENT_ID,
  };
  const configuredCount = Object.values(agentIds).filter(Boolean).length;
  checks.push({
    name: 'retell_agent_ids_configured',
    passed: configuredCount >= 2,
    status: 200,
    message: Object.entries(agentIds)
      .map(([k, v]) => `${k}:${v ? 'OK' : 'MISSING'}`)
      .join(', '),
  });

  // Check 4: Twilio credentials present
  const twilioConfigured =
    !!process.env.TWILIO_ACCOUNT_SID && !!process.env.TWILIO_AUTH_TOKEN;
  checks.push({
    name: 'twilio_credentials_configured',
    passed: twilioConfigured,
    status: twilioConfigured ? 200 : 0,
    message: twilioConfigured
      ? 'Twilio SID + Auth Token present'
      : 'Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN',
  });

  return {
    agent: 'SAYA',
    description: 'Voice & Onboarding Flow Health',
    durationMs: Date.now() - start,
    passed: checks.every((c) => c.passed),
    checks,
  };
}

// ─── Agent PASSPORT: Property Passport & Directory ───────

async function agentPassport(baseUrl: string): Promise<AgentResult> {
  const checks: Check[] = [];
  const start = Date.now();
  const supabase = createServerClient();

  // Check 1: Properties API endpoint reachable
  try {
    const res = await fetch(`${baseUrl}/api/properties?limit=1`);
    checks.push({
      name: 'properties_api_reachable',
      passed: res.status !== 404,
      status: res.status,
      message:
        res.status === 404 ? 'Endpoint not found' : `Endpoint reachable (${res.status})`,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    checks.push({ name: 'properties_api_reachable', passed: false, status: 0, message: msg });
  }

  // Check 2: Properties table accessible
  try {
    const { count, error } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true });
    checks.push({
      name: 'properties_table_accessible',
      passed: !error,
      status: error ? 500 : 200,
      message: error ? error.message : `${count ?? 0} properties in database`,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    checks.push({ name: 'properties_table_accessible', passed: false, status: 0, message: msg });
  }

  // Check 3: Directory listings count
  try {
    const { count, error } = await supabase
      .from('directory_listings')
      .select('*', { count: 'exact', head: true });
    checks.push({
      name: 'directory_listings_count',
      passed: !error && (count ?? 0) > 0,
      status: error ? 500 : 200,
      message: error ? error.message : `${count ?? 0} listings in directory`,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    checks.push({
      name: 'directory_listings_count',
      passed: false,
      status: 0,
      message: msg,
    });
  }

  // Check 4: Directory API endpoint reachable
  try {
    const res = await fetch(`${baseUrl}/api/directory?limit=1`);
    checks.push({
      name: 'directory_api_reachable',
      passed: res.ok,
      status: res.status,
      message: res.ok ? 'Directory API healthy' : `Directory API returned ${res.status}`,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    checks.push({ name: 'directory_api_reachable', passed: false, status: 0, message: msg });
  }

  return {
    agent: 'PASSPORT',
    description: 'Property Passport & Directory Health',
    durationMs: Date.now() - start,
    passed: checks.every((c) => c.passed),
    checks,
  };
}

// ─── Agent SYNC: Deployment & API Health ─────────────────

async function agentSync(baseUrl: string): Promise<AgentResult> {
  const checks: Check[] = [];
  const start = Date.now();

  // Check 1: Homepage loads
  try {
    const res = await fetch(baseUrl, { method: 'HEAD' });
    checks.push({
      name: 'homepage_reachable',
      passed: res.ok,
      status: res.status,
      message: res.ok ? 'Homepage loads' : `Homepage returned ${res.status}`,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    checks.push({ name: 'homepage_reachable', passed: false, status: 0, message: msg });
  }

  // Check 2: Critical API endpoints respond (no 500s)
  const criticalEndpoints = [
    { path: '/api/directory?limit=1', method: 'GET' as const },
    { path: '/api/directory/stats', method: 'GET' as const },
  ];

  let errorCount = 0;
  for (const ep of criticalEndpoints) {
    try {
      const res = await fetch(`${baseUrl}${ep.path}`, { method: ep.method });
      const ok = res.status < 500;
      if (!ok) errorCount++;
      checks.push({
        name: `api_health_${ep.path.split('?')[0].replace(/\//g, '_').slice(1)}`,
        passed: ok,
        status: res.status,
        message: ok ? 'OK' : `Server error: ${res.status}`,
      });
    } catch (e: unknown) {
      errorCount++;
      const msg = e instanceof Error ? e.message : 'Unknown error';
      checks.push({
        name: `api_health_${ep.path.split('?')[0].replace(/\//g, '_').slice(1)}`,
        passed: false,
        status: 0,
        message: msg,
      });
    }
  }

  // Check 3: Supabase connection
  try {
    const supabase = createServerClient();
    const { error } = await supabase
      .from('profiles')
      .select('id', { head: true, count: 'exact' });
    checks.push({
      name: 'supabase_connection',
      passed: !error,
      status: error ? 500 : 200,
      message: error ? error.message : 'Supabase connected',
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    checks.push({ name: 'supabase_connection', passed: false, status: 0, message: msg });
  }

  // Check 4: Critical environment variables present
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];
  const missingVars = requiredVars.filter((v) => !process.env[v]);
  checks.push({
    name: 'critical_env_vars',
    passed: missingVars.length === 0,
    status: missingVars.length === 0 ? 200 : 0,
    message:
      missingVars.length === 0
        ? 'All critical vars set'
        : `Missing: ${missingVars.join(', ')}`,
  });

  return {
    agent: 'SYNC',
    description: 'Deployment & API Health',
    durationMs: Date.now() - start,
    passed: errorCount === 0 && checks.every((c) => c.passed),
    checks,
  };
}

// ─── Orchestrator ────────────────────────────────────────

const AGENT_MAP: Record<string, (baseUrl: string) => Promise<AgentResult>> = {
  saya: agentSaya,
  passport: agentPassport,
  sync: agentSync,
};

async function runAudit(
  request: NextRequest,
  agentFilter?: string[]
): Promise<NextResponse> {
  const start = Date.now();

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
    'http://localhost:3000';

  // Determine which agents to run
  const agentsToRun = agentFilter?.length
    ? agentFilter
        .map((a) => a.toLowerCase())
        .filter((a) => a in AGENT_MAP)
    : Object.keys(AGENT_MAP);

  // Fire all agents in parallel via Promise.allSettled
  const results = await Promise.allSettled(
    agentsToRun.map((key) => AGENT_MAP[key](baseUrl))
  );

  // Unwrap results — handle both fulfilled and rejected promises
  const agents: AgentResult[] = results.map((r, i) => {
    if (r.status === 'fulfilled') return r.value;
    return {
      agent: agentsToRun[i].toUpperCase(),
      description: 'Agent crashed',
      durationMs: 0,
      passed: false,
      checks: [
        {
          name: 'agent_execution',
          passed: false,
          status: 0,
          message: r.reason instanceof Error ? r.reason.message : 'Unknown error',
        },
      ],
    };
  });

  // Compute summary
  const allChecks = agents.flatMap((a) => a.checks);
  const passedCount = allChecks.filter((c) => c.passed).length;
  const failedCount = allChecks.length - passedCount;

  let overallHealth: 'GREEN' | 'YELLOW' | 'RED';
  if (failedCount === 0) overallHealth = 'GREEN';
  else if (failedCount <= 2) overallHealth = 'YELLOW';
  else overallHealth = 'RED';

  const report: AuditReport = {
    timestamp: new Date().toISOString(),
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'unknown',
    overallHealth,
    totalDurationMs: Date.now() - start,
    agents,
    summary: {
      total_checks: allChecks.length,
      passed: passedCount,
      failed: failedCount,
    },
  };

  return NextResponse.json(report, {
    status: overallHealth === 'RED' ? 503 : 200,
  });
}

// ─── Route Handlers ──────────────────────────────────────

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json(
      { error: 'Unauthorized. Provide CRON_SECRET as Bearer token.' },
      { status: 401 }
    );
  }

  return runAudit(request);
}

export async function POST(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let agentFilter: string[] | undefined;
  try {
    const body = await request.json();
    if (Array.isArray(body.agents)) {
      agentFilter = body.agents;
    }
  } catch {
    // No body or invalid JSON — run all agents
  }

  return runAudit(request, agentFilter);
}
