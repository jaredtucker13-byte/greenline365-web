import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Audit Log API
 * Query and manage audit logs for compliance
 * 
 * Access: Admin-only for full logs, users see their own
 */

// Admin emails that can see all logs
const ADMIN_EMAILS = [
  'jared@greenline365.com',
  'admin@greenline365.com',
];

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = ADMIN_EMAILS.includes(user.email || '');
    const { searchParams } = new URL(request.url);
    
    // Query params
    const action = searchParams.get('action');
    const category = searchParams.get('category');
    const resourceType = searchParams.get('resourceType');
    const status = searchParams.get('status');
    const from = searchParams.get('from'); // ISO date
    const to = searchParams.get('to'); // ISO date
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .order('occurred_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Non-admins can only see their own logs
    if (!isAdmin) {
      query = query.eq('user_id', user.id);
    }

    // Apply filters
    if (action) query = query.eq('action', action);
    if (category) query = query.eq('action_category', category);
    if (resourceType) query = query.eq('resource_type', resourceType);
    if (status) query = query.eq('status', status);
    if (from) query = query.gte('occurred_at', from);
    if (to) query = query.lte('occurred_at', to);

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      logs: data,
      total: count,
      limit,
      offset,
      isAdmin,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = ADMIN_EMAILS.includes(user.email || '');
    const body = await request.json();
    const { action: queryAction } = body;

    switch (queryAction) {
      case 'summary':
        return getSummary(supabase, user.id, isAdmin, body);
      case 'security-report':
        return getSecurityReport(supabase, user.id, isAdmin);
      case 'compliance-export':
        if (!isAdmin) {
          return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }
        return getComplianceExport(supabase, body);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function getSummary(supabase: any, userId: string, isAdmin: boolean, options: any) {
  const { dateRange = '30d' } = options;
  const cutoff = getDateCutoff(dateRange);

  // Base query
  let query = supabase
    .from('audit_logs')
    .select('action_category, action, status')
    .gte('occurred_at', cutoff.toISOString());

  if (!isAdmin) {
    query = query.eq('user_id', userId);
  }

  const { data: logs } = await query;

  if (!logs || logs.length === 0) {
    return NextResponse.json({
      totalEvents: 0,
      byCategory: {},
      byStatus: {},
      topActions: [],
    });
  }

  // Aggregate
  const byCategory = logs.reduce((acc: any, log: any) => {
    acc[log.action_category] = (acc[log.action_category] || 0) + 1;
    return acc;
  }, {});

  const byStatus = logs.reduce((acc: any, log: any) => {
    acc[log.status] = (acc[log.status] || 0) + 1;
    return acc;
  }, {});

  const actionCounts = logs.reduce((acc: any, log: any) => {
    acc[log.action] = (acc[log.action] || 0) + 1;
    return acc;
  }, {});

  const topActions = Object.entries(actionCounts)
    .sort((a: any, b: any) => b[1] - a[1])
    .slice(0, 10)
    .map(([action, count]) => ({ action, count }));

  return NextResponse.json({
    totalEvents: logs.length,
    byCategory,
    byStatus,
    topActions,
  });
}

async function getSecurityReport(supabase: any, userId: string, isAdmin: boolean) {
  if (!isAdmin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const since = new Date();
  since.setDate(since.getDate() - 7);

  // Failed logins
  const { data: failedLogins } = await supabase
    .from('audit_logs')
    .select('user_email, ip_address, occurred_at')
    .eq('action', 'user.login')
    .eq('status', 'failure')
    .gte('occurred_at', since.toISOString())
    .order('occurred_at', { ascending: false });

  // Group failed logins by email
  const failedByEmail = (failedLogins || []).reduce((acc: any, log: any) => {
    if (!acc[log.user_email]) {
      acc[log.user_email] = { count: 0, ips: new Set(), lastAttempt: log.occurred_at };
    }
    acc[log.user_email].count++;
    if (log.ip_address) acc[log.user_email].ips.add(log.ip_address);
    return acc;
  }, {});

  const suspiciousLogins = Object.entries(failedByEmail)
    .filter(([_, data]: any) => data.count >= 3)
    .map(([email, data]: any) => ({
      email,
      attempts: data.count,
      uniqueIPs: data.ips.size,
      lastAttempt: data.lastAttempt,
    }));

  // Access denied events
  const { data: accessDenied } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('status', 'denied')
    .gte('occurred_at', since.toISOString())
    .order('occurred_at', { ascending: false })
    .limit(50);

  // Sensitive data access
  const { data: sensitiveAccess } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('is_sensitive', true)
    .gte('occurred_at', since.toISOString())
    .order('occurred_at', { ascending: false })
    .limit(50);

  return NextResponse.json({
    period: { from: since.toISOString(), to: new Date().toISOString() },
    suspiciousLogins,
    accessDeniedCount: accessDenied?.length || 0,
    accessDeniedEvents: accessDenied || [],
    sensitiveAccessCount: sensitiveAccess?.length || 0,
    sensitiveAccessEvents: sensitiveAccess || [],
  });
}

async function getComplianceExport(supabase: any, options: any) {
  const { from, to, complianceType } = options;
  
  if (!from || !to) {
    return NextResponse.json({ error: 'Date range required' }, { status: 400 });
  }

  let query = supabase
    .from('audit_logs')
    .select('*')
    .gte('occurred_at', from)
    .lte('occurred_at', to)
    .order('occurred_at', { ascending: true });

  // Filter by compliance type if specified
  if (complianceType) {
    query = query.contains('compliance_flags', [complianceType]);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    exportDate: new Date().toISOString(),
    period: { from, to },
    complianceType: complianceType || 'all',
    recordCount: data?.length || 0,
    records: data || [],
  });
}

function getDateCutoff(range: string): Date {
  const now = new Date();
  switch (range) {
    case '24h': return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case '7d': return new Date(now.setDate(now.getDate() - 7));
    case '30d': return new Date(now.setDate(now.getDate() - 30));
    case '90d': return new Date(now.setDate(now.getDate() - 90));
    default: return new Date(now.setDate(now.getDate() - 30));
  }
}
