import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServerClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/middleware';

/**
 * Greenline HQ Super Admin API
 *
 * POST /api/admin/hq
 * Actions: dashboard, tenants, users, billing, analytics, system,
 *          tenant-update, tenant-toggle, user-toggle-admin
 */

export async function POST(request: NextRequest) {
  // Require admin via profile.is_admin check
  const authResult = await requireAdmin(request);
  if (authResult instanceof Response) return authResult;

  const { user, supabase } = authResult;
  const serviceClient = createServerClient();

  try {
    const body = await request.json();
    const { action, ...params } = body;

    switch (action) {
      case 'dashboard':
        return getDashboardMetrics(serviceClient);
      case 'tenants':
        return getTenantsData(serviceClient, params);
      case 'tenant-detail':
        return getTenantDetail(serviceClient, params);
      case 'tenant-update':
        return updateTenant(serviceClient, params);
      case 'tenant-toggle':
        return toggleTenant(serviceClient, params);
      case 'users':
        return getUsersData(serviceClient, params);
      case 'user-toggle-admin':
        return toggleUserAdmin(serviceClient, params);
      case 'billing':
        return getBillingData(serviceClient, params);
      case 'analytics':
        return getAnalyticsData(serviceClient, params);
      case 'system':
        return getSystemData(serviceClient, params);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('[HQ API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─── Dashboard KPIs ──────────────────────────────────────────────────────────

async function getDashboardMetrics(db: any) {
  const [
    { count: totalBusinesses },
    { count: activeBusinesses },
    { data: profiles },
    { count: totalBookings },
    { count: totalLeads },
    { data: recentBusinesses },
    { data: recentWaitlist },
    { count: totalWaitlist },
    { count: totalNewsletter },
  ] = await Promise.all([
    db.from('businesses').select('*', { count: 'exact', head: true }),
    db.from('businesses').select('*', { count: 'exact', head: true }).eq('is_active', true),
    db.from('profiles').select('id, email, is_admin, created_at'),
    db.from('bookings').select('*', { count: 'exact', head: true }),
    db.from('crm_leads').select('*', { count: 'exact', head: true }),
    db.from('businesses').select('id, name, slug, tier, is_active, created_at').order('created_at', { ascending: false }).limit(5),
    db.from('waitlist_submissions').select('id, email, company, status, created_at').order('created_at', { ascending: false }).limit(5),
    db.from('waitlist_submissions').select('*', { count: 'exact', head: true }),
    db.from('newsletter_subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
  ]);

  // Tier breakdown
  const { data: tierData } = await db
    .from('businesses')
    .select('tier');

  const tierBreakdown = (tierData || []).reduce((acc: Record<string, number>, b: any) => {
    acc[b.tier] = (acc[b.tier] || 0) + 1;
    return acc;
  }, {});

  // Last 30 days signups
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const { count: newBusinesses30d } = await db
    .from('businesses')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', thirtyDaysAgo.toISOString());

  return NextResponse.json({
    kpis: {
      totalBusinesses: totalBusinesses || 0,
      activeBusinesses: activeBusinesses || 0,
      totalUsers: profiles?.length || 0,
      adminUsers: profiles?.filter((p: any) => p.is_admin).length || 0,
      totalBookings: totalBookings || 0,
      totalLeads: totalLeads || 0,
      totalWaitlist: totalWaitlist || 0,
      totalNewsletter: totalNewsletter || 0,
      newBusinesses30d: newBusinesses30d || 0,
    },
    tierBreakdown,
    recentBusinesses: recentBusinesses || [],
    recentWaitlist: recentWaitlist || [],
  });
}

// ─── Tenants (Businesses) ────────────────────────────────────────────────────

async function getTenantsData(db: any, params: any) {
  const { search, tier, status, page = 1, limit = 25 } = params;
  const offset = (page - 1) * limit;

  let query = db
    .from('businesses')
    .select('*, user_businesses(user_id, role, is_primary)', { count: 'exact' });

  if (search) {
    query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%,email.ilike.%${search}%`);
  }
  if (tier) {
    query = query.eq('tier', tier);
  }
  if (status === 'active') {
    query = query.eq('is_active', true);
  } else if (status === 'inactive') {
    query = query.eq('is_active', false);
  }

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    tenants: data || [],
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit),
  });
}

async function getTenantDetail(db: any, params: any) {
  const { businessId } = params;
  if (!businessId) {
    return NextResponse.json({ error: 'businessId required' }, { status: 400 });
  }

  const [
    { data: business },
    { data: members },
    { count: bookingsCount },
    { count: leadsCount },
    { count: contentCount },
  ] = await Promise.all([
    db.from('businesses').select('*').eq('id', businessId).single(),
    db.from('user_businesses').select('user_id, role, is_primary, created_at, profiles:user_id(email, full_name)').eq('business_id', businessId),
    db.from('bookings').select('*', { count: 'exact', head: true }).eq('business_id', businessId),
    db.from('crm_leads').select('*', { count: 'exact', head: true }).eq('owner_id', businessId),
    db.from('content_schedule').select('*', { count: 'exact', head: true }).eq('business_id', businessId),
  ]);

  return NextResponse.json({
    business,
    members: members || [],
    stats: {
      bookings: bookingsCount || 0,
      leads: leadsCount || 0,
      content: contentCount || 0,
    },
  });
}

async function updateTenant(db: any, params: any) {
  const { businessId, updates } = params;
  if (!businessId) {
    return NextResponse.json({ error: 'businessId required' }, { status: 400 });
  }

  const { data, error } = await db
    .from('businesses')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', businessId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, business: data });
}

async function toggleTenant(db: any, params: any) {
  const { businessId, is_active } = params;
  if (!businessId) {
    return NextResponse.json({ error: 'businessId required' }, { status: 400 });
  }

  const { data, error } = await db
    .from('businesses')
    .update({ is_active, updated_at: new Date().toISOString() })
    .eq('id', businessId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, business: data });
}

// ─── Users ───────────────────────────────────────────────────────────────────

async function getUsersData(db: any, params: any) {
  const { search, adminOnly, page = 1, limit = 25 } = params;
  const offset = (page - 1) * limit;

  let query = db
    .from('profiles')
    .select('id, email, full_name, avatar_url, is_admin, created_at, updated_at', { count: 'exact' });

  if (search) {
    query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
  }
  if (adminOnly) {
    query = query.eq('is_admin', true);
  }

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Enrich with business memberships
  const userIds = (data || []).map((u: any) => u.id);
  const { data: memberships } = await db
    .from('user_businesses')
    .select('user_id, role, business:businesses(id, name, slug, tier)')
    .in('user_id', userIds.length > 0 ? userIds : ['none']);

  const membershipMap: Record<string, any[]> = {};
  (memberships || []).forEach((m: any) => {
    if (!membershipMap[m.user_id]) membershipMap[m.user_id] = [];
    membershipMap[m.user_id].push({ role: m.role, business: m.business });
  });

  const enrichedUsers = (data || []).map((u: any) => ({
    ...u,
    businesses: membershipMap[u.id] || [],
  }));

  return NextResponse.json({
    users: enrichedUsers,
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit),
  });
}

async function toggleUserAdmin(db: any, params: any) {
  const { userId, is_admin } = params;
  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 });
  }

  const { data, error } = await db
    .from('profiles')
    .update({ is_admin, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, profile: data });
}

// ─── Billing ─────────────────────────────────────────────────────────────────

async function getBillingData(db: any, params: any) {
  const { page = 1, limit = 25 } = params;
  const offset = (page - 1) * limit;

  // Get subscriptions with plan details
  const { data: subs, count, error } = await db
    .from('subscriptions')
    .select(`
      id, account_id, listing_id, status, billing_cycle,
      current_period_start, current_period_end,
      cancel_at_period_end, trial_ends_at,
      stripe_subscription_id, stripe_customer_id,
      created_at, updated_at,
      plan:plans(id, slug, product_type, name, price_monthly_cents, price_annual_cents)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  // Summary stats
  const { data: allSubs } = await db
    .from('subscriptions')
    .select('status, billing_cycle, plan:plans(price_monthly_cents, price_annual_cents)');

  const activeSubs = (allSubs || []).filter((s: any) => s.status === 'active' || s.status === 'trialing');
  const mrr = activeSubs.reduce((sum: number, s: any) => {
    const plan = s.plan;
    if (!plan) return sum;
    if (s.billing_cycle === 'annual') {
      return sum + (plan.price_annual_cents || 0) / 12;
    }
    return sum + (plan.price_monthly_cents || 0);
  }, 0);

  const statusBreakdown = (allSubs || []).reduce((acc: Record<string, number>, s: any) => {
    acc[s.status] = (acc[s.status] || 0) + 1;
    return acc;
  }, {});

  return NextResponse.json({
    subscriptions: subs || [],
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit),
    summary: {
      mrr: Math.round(mrr),
      totalSubscriptions: allSubs?.length || 0,
      activeSubscriptions: activeSubs.length,
      statusBreakdown,
    },
  });
}

// ─── Analytics ───────────────────────────────────────────────────────────────

async function getAnalyticsData(db: any, params: any) {
  const { range = '30d' } = params;
  const cutoff = getDateCutoff(range);

  // Signups over time
  const { data: businesses } = await db
    .from('businesses')
    .select('created_at, tier')
    .gte('created_at', cutoff.toISOString())
    .order('created_at');

  // Bookings over time
  const { data: bookings } = await db
    .from('bookings')
    .select('created_at, status')
    .gte('created_at', cutoff.toISOString());

  // Leads over time
  const { data: leads } = await db
    .from('crm_leads')
    .select('created_at, status, source')
    .gte('created_at', cutoff.toISOString());

  // Waitlist over time
  const { data: waitlist } = await db
    .from('waitlist_submissions')
    .select('created_at, status')
    .gte('created_at', cutoff.toISOString());

  // Group by day
  const signupsByDay = groupByDay(businesses || [], 'created_at');
  const bookingsByDay = groupByDay(bookings || [], 'created_at');
  const leadsByDay = groupByDay(leads || [], 'created_at');
  const waitlistByDay = groupByDay(waitlist || [], 'created_at');

  // Lead sources breakdown
  const leadSources = (leads || []).reduce((acc: Record<string, number>, l: any) => {
    acc[l.source || 'unknown'] = (acc[l.source || 'unknown'] || 0) + 1;
    return acc;
  }, {});

  return NextResponse.json({
    signupsByDay,
    bookingsByDay,
    leadsByDay,
    waitlistByDay,
    leadSources,
    totals: {
      newBusinesses: businesses?.length || 0,
      newBookings: bookings?.length || 0,
      newLeads: leads?.length || 0,
      newWaitlist: waitlist?.length || 0,
    },
    period: {
      since: cutoff.toISOString(),
      until: new Date().toISOString(),
    },
  });
}

// ─── System ──────────────────────────────────────────────────────────────────

async function getSystemData(db: any, params: any) {
  const { page = 1, limit = 50 } = params;
  const offset = (page - 1) * limit;

  // Audit logs
  const { data: auditLogs, count } = await db
    .from('activity_log')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  // Table row counts for system health
  const tables = ['businesses', 'profiles', 'bookings', 'crm_leads', 'content_schedule', 'waitlist_submissions', 'newsletter_subscriptions'];
  const tableCounts: Record<string, number> = {};

  for (const table of tables) {
    const { count: tableCount } = await db
      .from(table)
      .select('*', { count: 'exact', head: true });
    tableCounts[table] = tableCount || 0;
  }

  return NextResponse.json({
    auditLogs: auditLogs || [],
    totalLogs: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit),
    tableCounts,
  });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getDateCutoff(range: string): Date {
  const now = new Date();
  switch (range) {
    case 'today': return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    case '7d': { const d = new Date(); d.setDate(d.getDate() - 7); return d; }
    case '30d': { const d = new Date(); d.setDate(d.getDate() - 30); return d; }
    case '90d': { const d = new Date(); d.setDate(d.getDate() - 90); return d; }
    case 'all': return new Date('2020-01-01');
    default: { const d = new Date(); d.setDate(d.getDate() - 30); return d; }
  }
}

function groupByDay(items: any[], dateField: string): Record<string, number> {
  return items.reduce((acc: Record<string, number>, item: any) => {
    const day = new Date(item[dateField]).toISOString().split('T')[0];
    acc[day] = (acc[day] || 0) + 1;
    return acc;
  }, {});
}
