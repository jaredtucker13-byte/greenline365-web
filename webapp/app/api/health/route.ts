import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Health Check Endpoint
 *
 * Verifies database connectivity and service availability.
 * Returns 200 if healthy, 503 if any service is unhealthy.
 *
 * GET /api/health
 */
export async function GET() {
  const checks: Record<string, { status: string; message?: string }> = {};

  // Check Supabase DB connectivity
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      checks.database = { status: 'unhealthy', message: 'Missing Supabase environment variables' };
    } else {
      const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const { error } = await supabase.from('businesses').select('id').limit(1);
      if (error) {
        checks.database = { status: 'unhealthy', message: error.message };
      } else {
        checks.database = { status: 'healthy' };
      }
    }
  } catch (err: any) {
    checks.database = { status: 'unhealthy', message: err.message };
  }

  // Check required environment variables
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];
  const missingVars = requiredEnvVars.filter((v) => !process.env[v]);
  if (missingVars.length > 0) {
    checks.environment = { status: 'unhealthy', message: `Missing: ${missingVars.join(', ')}` };
  } else {
    checks.environment = { status: 'healthy' };
  }

  const isHealthy = Object.values(checks).every((c) => c.status === 'healthy');

  return NextResponse.json(
    {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: isHealthy ? 200 : 503 }
  );
}
