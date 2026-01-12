import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Tenant CRM API
 * 
 * Each tenant (business using GreenLine365) gets their own CRM to track:
 * - Their leads/customers
 * - Email campaign performance (open rates, click rates)
 * - Revenue and ROI
 * - Customer journey and conversions
 * 
 * This mirrors what GreenLine365 tracks for the platform,
 * but at the individual business level.
 */

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, dateRange = '30d' } = body;
    const cutoff = getDateCutoff(dateRange);

    switch (action) {
      // Lead Management
      case 'leads.list':
        return listLeads(supabase, user.id, body);
      case 'leads.add':
        return addLead(supabase, user.id, body.lead);
      case 'leads.update':
        return updateLead(supabase, user.id, body.leadId, body.updates);
      case 'leads.stats':
        return getLeadStats(supabase, user.id, cutoff);
      
      // Customer Management
      case 'customers.list':
        return listCustomers(supabase, user.id, body);
      case 'customers.add':
        return addCustomer(supabase, user.id, body.customer);
      case 'customers.stats':
        return getCustomerStats(supabase, user.id, cutoff);
      
      // Email Analytics
      case 'email.stats':
        return getEmailStats(supabase, user.id, cutoff);
      case 'email.campaign':
        return getCampaignStats(supabase, user.id, body.campaignId);
      
      // Revenue & ROI
      case 'revenue.log':
        return logRevenue(supabase, user.id, body.entry);
      case 'revenue.stats':
        return getRevenueStats(supabase, user.id, cutoff);
      case 'roi.calculate':
        return calculateROI(supabase, user.id, cutoff);
      
      // Dashboard Overview
      case 'dashboard':
        return getDashboardOverview(supabase, user.id, cutoff);
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('[CRM API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function getDateCutoff(range: string): Date {
  const now = new Date();
  switch (range) {
    case 'today': return new Date(now.setHours(0, 0, 0, 0));
    case '7d': return new Date(now.setDate(now.getDate() - 7));
    case '30d': return new Date(now.setDate(now.getDate() - 30));
    case '90d': return new Date(now.setDate(now.getDate() - 90));
    case 'ytd': return new Date(now.getFullYear(), 0, 1);
    case 'all': return new Date('2020-01-01');
    default: return new Date(now.setDate(now.getDate() - 30));
  }
}

// ============================================
// LEAD MANAGEMENT
// ============================================

async function listLeads(supabase: any, userId: string, options: any) {
  const { status, source, limit = 50, offset = 0 } = options;
  
  let query = supabase
    .from('crm_leads')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq('status', status);
  if (source) query = query.eq('source', source);

  const { data, error, count } = await query;
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  return NextResponse.json({ leads: data, total: count });
}

async function addLead(supabase: any, userId: string, lead: any) {
  const { data, error } = await supabase
    .from('crm_leads')
    .insert({
      user_id: userId,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      source: lead.source || 'manual',
      status: 'new',
      value: lead.estimatedValue || 0,
      notes: lead.notes,
      tags: lead.tags || [],
      metadata: lead.metadata || {},
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  return NextResponse.json({ success: true, lead: data });
}

async function updateLead(supabase: any, userId: string, leadId: string, updates: any) {
  const { data, error } = await supabase
    .from('crm_leads')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', leadId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  return NextResponse.json({ success: true, lead: data });
}

async function getLeadStats(supabase: any, userId: string, since: Date) {
  const { data: leads } = await supabase
    .from('crm_leads')
    .select('status, source, value, created_at, converted_at')
    .eq('user_id', userId)
    .gte('created_at', since.toISOString());

  if (!leads || leads.length === 0) {
    return NextResponse.json({
      total: 0,
      byStatus: {},
      bySource: {},
      conversionRate: 0,
      totalValue: 0,
    });
  }

  const byStatus = leads.reduce((acc: any, l: any) => {
    acc[l.status] = (acc[l.status] || 0) + 1;
    return acc;
  }, {});

  const bySource = leads.reduce((acc: any, l: any) => {
    acc[l.source] = (acc[l.source] || 0) + 1;
    return acc;
  }, {});

  const converted = leads.filter((l: any) => l.status === 'converted').length;
  const totalValue = leads.reduce((sum: number, l: any) => sum + (l.value || 0), 0);

  return NextResponse.json({
    total: leads.length,
    byStatus,
    bySource,
    conversionRate: leads.length > 0 ? ((converted / leads.length) * 100).toFixed(1) : 0,
    totalValue,
    newThisPeriod: leads.filter((l: any) => l.status === 'new').length,
    convertedThisPeriod: converted,
  });
}

// ============================================
// CUSTOMER MANAGEMENT
// ============================================

async function listCustomers(supabase: any, userId: string, options: any) {
  const { limit = 50, offset = 0 } = options;
  
  const { data, error } = await supabase
    .from('crm_customers')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  return NextResponse.json({ customers: data });
}

async function addCustomer(supabase: any, userId: string, customer: any) {
  const { data, error } = await supabase
    .from('crm_customers')
    .insert({
      user_id: userId,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      company: customer.company,
      lead_id: customer.leadId,
      lifetime_value: customer.initialValue || 0,
      tags: customer.tags || [],
      notes: customer.notes,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  return NextResponse.json({ success: true, customer: data });
}

async function getCustomerStats(supabase: any, userId: string, since: Date) {
  const { data: customers } = await supabase
    .from('crm_customers')
    .select('lifetime_value, created_at')
    .eq('user_id', userId);

  const newCustomers = customers?.filter((c: any) => 
    new Date(c.created_at) >= since
  ) || [];

  const totalLTV = customers?.reduce((sum: number, c: any) => 
    sum + (c.lifetime_value || 0), 0
  ) || 0;

  const avgLTV = customers && customers.length > 0 
    ? totalLTV / customers.length 
    : 0;

  return NextResponse.json({
    totalCustomers: customers?.length || 0,
    newCustomers: newCustomers.length,
    totalLifetimeValue: totalLTV,
    averageLifetimeValue: avgLTV.toFixed(2),
  });
}

// ============================================
// EMAIL ANALYTICS
// ============================================

async function getEmailStats(supabase: any, userId: string, since: Date) {
  const { data: emails } = await supabase
    .from('crm_email_events')
    .select('event_type, campaign_id, created_at')
    .eq('user_id', userId)
    .gte('created_at', since.toISOString());

  if (!emails || emails.length === 0) {
    return NextResponse.json({
      totalSent: 0,
      totalOpened: 0,
      totalClicked: 0,
      openRate: 0,
      clickRate: 0,
      clickToOpenRate: 0,
    });
  }

  const sent = emails.filter((e: any) => e.event_type === 'sent').length;
  const opened = emails.filter((e: any) => e.event_type === 'opened').length;
  const clicked = emails.filter((e: any) => e.event_type === 'clicked').length;
  const bounced = emails.filter((e: any) => e.event_type === 'bounced').length;
  const unsubscribed = emails.filter((e: any) => e.event_type === 'unsubscribed').length;

  return NextResponse.json({
    totalSent: sent,
    totalOpened: opened,
    totalClicked: clicked,
    totalBounced: bounced,
    totalUnsubscribed: unsubscribed,
    openRate: sent > 0 ? ((opened / sent) * 100).toFixed(1) : 0,
    clickRate: sent > 0 ? ((clicked / sent) * 100).toFixed(1) : 0,
    clickToOpenRate: opened > 0 ? ((clicked / opened) * 100).toFixed(1) : 0,
    bounceRate: sent > 0 ? ((bounced / sent) * 100).toFixed(1) : 0,
  });
}

async function getCampaignStats(supabase: any, userId: string, campaignId: string) {
  const { data: events } = await supabase
    .from('crm_email_events')
    .select('event_type, recipient_email, created_at')
    .eq('user_id', userId)
    .eq('campaign_id', campaignId);

  if (!events) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
  }

  const sent = events.filter((e: any) => e.event_type === 'sent').length;
  const opened = events.filter((e: any) => e.event_type === 'opened').length;
  const clicked = events.filter((e: any) => e.event_type === 'clicked').length;

  // Unique recipients who opened/clicked
  const uniqueOpened = new Set(
    events.filter((e: any) => e.event_type === 'opened').map((e: any) => e.recipient_email)
  ).size;
  const uniqueClicked = new Set(
    events.filter((e: any) => e.event_type === 'clicked').map((e: any) => e.recipient_email)
  ).size;

  return NextResponse.json({
    campaignId,
    totalSent: sent,
    totalOpened: opened,
    totalClicked: clicked,
    uniqueOpens: uniqueOpened,
    uniqueClicks: uniqueClicked,
    openRate: sent > 0 ? ((uniqueOpened / sent) * 100).toFixed(1) : 0,
    clickRate: sent > 0 ? ((uniqueClicked / sent) * 100).toFixed(1) : 0,
  });
}

// ============================================
// REVENUE & ROI
// ============================================

async function logRevenue(supabase: any, userId: string, entry: any) {
  const { data, error } = await supabase
    .from('crm_revenue')
    .insert({
      user_id: userId,
      amount: entry.amount,
      type: entry.type || 'sale', // sale, recurring, refund
      source: entry.source, // email_campaign, social, direct, referral
      customer_id: entry.customerId,
      lead_id: entry.leadId,
      description: entry.description,
      campaign_id: entry.campaignId,
      occurred_at: entry.date || new Date().toISOString(),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  // Update customer lifetime value if linked
  if (entry.customerId && entry.amount > 0) {
    await supabase.rpc('increment_customer_ltv', {
      p_customer_id: entry.customerId,
      p_amount: entry.amount,
    });
  }
  
  return NextResponse.json({ success: true, entry: data });
}

async function getRevenueStats(supabase: any, userId: string, since: Date) {
  const { data: revenue } = await supabase
    .from('crm_revenue')
    .select('amount, type, source, occurred_at')
    .eq('user_id', userId)
    .gte('occurred_at', since.toISOString());

  if (!revenue || revenue.length === 0) {
    return NextResponse.json({
      totalRevenue: 0,
      bySource: {},
      byType: {},
      transactionCount: 0,
      averageTransaction: 0,
    });
  }

  const totalRevenue = revenue.reduce((sum: number, r: any) => {
    return r.type === 'refund' ? sum - r.amount : sum + r.amount;
  }, 0);

  const bySource = revenue.reduce((acc: any, r: any) => {
    if (r.type !== 'refund') {
      acc[r.source || 'other'] = (acc[r.source || 'other'] || 0) + r.amount;
    }
    return acc;
  }, {});

  const byType = revenue.reduce((acc: any, r: any) => {
    acc[r.type] = (acc[r.type] || 0) + r.amount;
    return acc;
  }, {});

  // Group by day for trend
  const byDay = revenue.reduce((acc: any, r: any) => {
    const day = new Date(r.occurred_at).toISOString().split('T')[0];
    acc[day] = (acc[day] || 0) + (r.type === 'refund' ? -r.amount : r.amount);
    return acc;
  }, {});

  return NextResponse.json({
    totalRevenue,
    bySource,
    byType,
    byDay,
    transactionCount: revenue.length,
    averageTransaction: (totalRevenue / revenue.filter((r: any) => r.type !== 'refund').length).toFixed(2),
  });
}

async function calculateROI(supabase: any, userId: string, since: Date) {
  // Get revenue
  const { data: revenue } = await supabase
    .from('crm_revenue')
    .select('amount, type, source')
    .eq('user_id', userId)
    .gte('occurred_at', since.toISOString());

  const totalRevenue = (revenue || []).reduce((sum: number, r: any) => {
    return r.type === 'refund' ? sum - r.amount : sum + r.amount;
  }, 0);

  // Revenue by marketing channel
  const revenueByChannel: Record<string, number> = {};
  (revenue || []).forEach((r: any) => {
    if (r.type !== 'refund' && r.source) {
      revenueByChannel[r.source] = (revenueByChannel[r.source] || 0) + r.amount;
    }
  });

  // Get lead conversion stats
  const { data: leads } = await supabase
    .from('crm_leads')
    .select('source, status, value')
    .eq('user_id', userId)
    .gte('created_at', since.toISOString());

  const leadsConverted = (leads || []).filter((l: any) => l.status === 'converted').length;
  const totalLeads = leads?.length || 0;
  const conversionRate = totalLeads > 0 ? (leadsConverted / totalLeads) * 100 : 0;

  // Lead value by source
  const leadValueBySource: Record<string, { total: number; converted: number }> = {};
  (leads || []).forEach((l: any) => {
    if (!leadValueBySource[l.source]) {
      leadValueBySource[l.source] = { total: 0, converted: 0 };
    }
    leadValueBySource[l.source].total++;
    if (l.status === 'converted') {
      leadValueBySource[l.source].converted++;
    }
  });

  // Email ROI
  const { data: emailEvents } = await supabase
    .from('crm_email_events')
    .select('event_type')
    .eq('user_id', userId)
    .gte('created_at', since.toISOString());

  const emailsSent = (emailEvents || []).filter((e: any) => e.event_type === 'sent').length;
  const emailRevenue = revenueByChannel['email_campaign'] || 0;
  const revenuePerEmail = emailsSent > 0 ? emailRevenue / emailsSent : 0;

  return NextResponse.json({
    overview: {
      totalRevenue,
      totalLeads,
      leadsConverted,
      conversionRate: conversionRate.toFixed(1),
    },
    channelROI: Object.entries(revenueByChannel).map(([channel, rev]) => ({
      channel,
      revenue: rev,
      percentage: totalRevenue > 0 ? ((rev / totalRevenue) * 100).toFixed(1) : 0,
    })),
    leadsBySource: Object.entries(leadValueBySource).map(([source, data]) => ({
      source,
      total: data.total,
      converted: data.converted,
      conversionRate: data.total > 0 ? ((data.converted / data.total) * 100).toFixed(1) : 0,
    })),
    emailMetrics: {
      sent: emailsSent,
      revenue: emailRevenue,
      revenuePerEmail: revenuePerEmail.toFixed(2),
    },
  });
}

// ============================================
// DASHBOARD OVERVIEW
// ============================================

async function getDashboardOverview(supabase: any, userId: string, since: Date) {
  // Parallel fetch all stats
  const [leadStats, customerStats, emailStats, revenueStats] = await Promise.all([
    getLeadStatsInternal(supabase, userId, since),
    getCustomerStatsInternal(supabase, userId, since),
    getEmailStatsInternal(supabase, userId, since),
    getRevenueStatsInternal(supabase, userId, since),
  ]);

  return NextResponse.json({
    leads: leadStats,
    customers: customerStats,
    email: emailStats,
    revenue: revenueStats,
    period: {
      since: since.toISOString(),
      until: new Date().toISOString(),
    },
  });
}

// Internal versions that return objects instead of Response
async function getLeadStatsInternal(supabase: any, userId: string, since: Date) {
  const { data: leads } = await supabase
    .from('crm_leads')
    .select('status')
    .eq('user_id', userId)
    .gte('created_at', since.toISOString());

  const total = leads?.length || 0;
  const converted = leads?.filter((l: any) => l.status === 'converted').length || 0;

  return {
    total,
    converted,
    conversionRate: total > 0 ? ((converted / total) * 100).toFixed(1) : 0,
  };
}

async function getCustomerStatsInternal(supabase: any, userId: string, since: Date) {
  const { data: customers } = await supabase
    .from('crm_customers')
    .select('lifetime_value, created_at')
    .eq('user_id', userId);

  const newCustomers = customers?.filter((c: any) => 
    new Date(c.created_at) >= since
  ).length || 0;

  return {
    total: customers?.length || 0,
    new: newCustomers,
    totalLTV: customers?.reduce((sum: number, c: any) => sum + (c.lifetime_value || 0), 0) || 0,
  };
}

async function getEmailStatsInternal(supabase: any, userId: string, since: Date) {
  const { data: emails } = await supabase
    .from('crm_email_events')
    .select('event_type')
    .eq('user_id', userId)
    .gte('created_at', since.toISOString());

  const sent = emails?.filter((e: any) => e.event_type === 'sent').length || 0;
  const opened = emails?.filter((e: any) => e.event_type === 'opened').length || 0;
  const clicked = emails?.filter((e: any) => e.event_type === 'clicked').length || 0;

  return {
    sent,
    opened,
    clicked,
    openRate: sent > 0 ? ((opened / sent) * 100).toFixed(1) : 0,
    clickRate: sent > 0 ? ((clicked / sent) * 100).toFixed(1) : 0,
  };
}

async function getRevenueStatsInternal(supabase: any, userId: string, since: Date) {
  const { data: revenue } = await supabase
    .from('crm_revenue')
    .select('amount, type')
    .eq('user_id', userId)
    .gte('occurred_at', since.toISOString());

  const total = (revenue || []).reduce((sum: number, r: any) => {
    return r.type === 'refund' ? sum - r.amount : sum + r.amount;
  }, 0);

  return {
    total,
    transactions: revenue?.length || 0,
  };
}

export async function GET(request: NextRequest) {
  // Quick dashboard overview
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d';
    const cutoff = getDateCutoff(range);

    return getDashboardOverview(supabase, user.id, cutoff);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
