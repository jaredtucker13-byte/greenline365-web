/**
 * CRM Analytics API
 * 
 * Read-only aggregate metrics for the CRM system.
 * All responses include `meta` for freshness tracking.
 * 
 * Endpoints:
 * - ?type=kpis - KPI summary (leads, conversions, revenue)
 * - ?type=funnel - Pipeline funnel stages
 * - ?type=trends - Time series of lead activity
 * - ?type=sources - Breakdown by lead source
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type AnalyticsType = 'kpis' | 'funnel' | 'trends' | 'sources';
type DateRange = '7d' | '30d' | '90d' | 'all';

function getDateCutoff(range: DateRange): Date {
  const now = new Date();
  switch (range) {
    case '7d':
      return new Date(now.setDate(now.getDate() - 7));
    case '30d':
      return new Date(now.setDate(now.getDate() - 30));
    case '90d':
      return new Date(now.setDate(now.getDate() - 90));
    case 'all':
      return new Date('2020-01-01');
    default:
      return new Date(now.setDate(now.getDate() - 30));
  }
}

function createMeta(queryId?: string) {
  return {
    source: 'supabase' as const,
    lastProcessedAt: new Date().toISOString(),
    cacheTtlSec: 60,
    queryId: queryId || `crm_${Date.now()}`,
  };
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const type = (searchParams.get('type') || 'kpis') as AnalyticsType;
    const range = (searchParams.get('range') || '30d') as DateRange;
    const cutoff = getDateCutoff(range);
    
    const queryId = `crm_${type}_${range}_${Date.now()}`;
    
    switch (type) {
      case 'kpis':
        return getKPIs(supabase, cutoff, queryId);
      case 'funnel':
        return getFunnel(supabase, cutoff, queryId);
      case 'trends':
        return getTrends(supabase, cutoff, queryId);
      case 'sources':
        return getSourceBreakdown(supabase, cutoff, queryId);
      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('[CRM Analytics] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function getKPIs(supabase: any, since: Date, queryId: string) {
  // Fetch all leads for calculations
  const { data: leads, error } = await supabase
    .from('crm_leads')
    .select('status, source, value, created_at, converted_at')
    .gte('created_at', since.toISOString());
  
  if (error) {
    console.error('[CRM Analytics] KPIs error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  const allLeads = leads || [];
  
  // Calculate KPIs
  const totalLeads = allLeads.length;
  const newLeads = allLeads.filter((l: any) => l.status === 'new').length;
  const verifiedLeads = allLeads.filter((l: any) => 
    ['verified', 'contacted', 'qualified', 'converted'].includes(l.status)
  ).length;
  const convertedLeads = allLeads.filter((l: any) => l.status === 'converted').length;
  const lostLeads = allLeads.filter((l: any) => l.status === 'lost').length;
  
  const verificationRate = totalLeads > 0 ? (verifiedLeads / totalLeads) * 100 : 0;
  const conversionRate = verifiedLeads > 0 ? (convertedLeads / verifiedLeads) * 100 : 0;
  
  const convertedWithValue = allLeads.filter((l: any) => l.status === 'converted' && l.value);
  const totalRevenue = convertedWithValue.reduce((sum: number, l: any) => sum + (l.value || 0), 0);
  const avgDealValue = convertedWithValue.length > 0 ? totalRevenue / convertedWithValue.length : 0;
  
  // Pipeline value (qualified + contacted leads)
  const pipelineLeads = allLeads.filter((l: any) => 
    ['contacted', 'qualified'].includes(l.status) && l.value
  );
  const pipelineValue = pipelineLeads.reduce((sum: number, l: any) => sum + (l.value || 0), 0);
  
  return NextResponse.json({
    data: {
      totalLeads,
      newLeads,
      verifiedLeads,
      convertedLeads,
      lostLeads,
      verificationRate: Math.round(verificationRate * 10) / 10,
      conversionRate: Math.round(conversionRate * 10) / 10,
      totalRevenue,
      avgDealValue: Math.round(avgDealValue),
      pipelineValue,
    },
    meta: createMeta(queryId),
  });
}

async function getFunnel(supabase: any, since: Date, queryId: string) {
  const { data: leads, error } = await supabase
    .from('crm_leads')
    .select('status, value')
    .gte('created_at', since.toISOString());
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  const allLeads = leads || [];
  
  // Define funnel stages in order
  const stageOrder = ['new', 'pending', 'verified', 'contacted', 'qualified', 'converted'];
  const stageLabels: Record<string, string> = {
    new: 'New Leads',
    pending: 'Pending Verification',
    verified: 'Verified',
    contacted: 'Contacted',
    qualified: 'Qualified',
    converted: 'Converted',
  };
  
  const stages = stageOrder.map(status => {
    const stageLeads = allLeads.filter((l: any) => l.status === status);
    return {
      name: stageLabels[status] || status,
      count: stageLeads.length,
      value: stageLeads.reduce((sum: number, l: any) => sum + (l.value || 0), 0),
    };
  });
  
  // Filter out empty stages for cleaner funnel
  const nonEmptyStages = stages.filter(s => s.count > 0);
  
  return NextResponse.json({
    data: { stages: nonEmptyStages.length > 0 ? nonEmptyStages : stages.slice(0, 4) },
    meta: createMeta(queryId),
  });
}

async function getTrends(supabase: any, since: Date, queryId: string) {
  const { data: leads, error } = await supabase
    .from('crm_leads')
    .select('status, value, created_at, converted_at')
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: true });
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  const allLeads = leads || [];
  
  // Group by date
  const byDate: Record<string, { newLeads: number; conversions: number; revenue: number }> = {};
  
  allLeads.forEach((lead: any) => {
    const date = new Date(lead.created_at).toISOString().split('T')[0];
    if (!byDate[date]) {
      byDate[date] = { newLeads: 0, conversions: 0, revenue: 0 };
    }
    byDate[date].newLeads++;
    
    if (lead.status === 'converted') {
      const convDate = lead.converted_at 
        ? new Date(lead.converted_at).toISOString().split('T')[0]
        : date;
      if (!byDate[convDate]) {
        byDate[convDate] = { newLeads: 0, conversions: 0, revenue: 0 };
      }
      byDate[convDate].conversions++;
      byDate[convDate].revenue += lead.value || 0;
    }
  });
  
  // Convert to array sorted by date
  const trends = Object.entries(byDate)
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date));
  
  return NextResponse.json({
    data: trends,
    meta: createMeta(queryId),
  });
}

async function getSourceBreakdown(supabase: any, since: Date, queryId: string) {
  const { data: leads, error } = await supabase
    .from('crm_leads')
    .select('source, status, value')
    .gte('created_at', since.toISOString());
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  const allLeads = leads || [];
  
  // Group by source
  const bySource: Record<string, { count: number; converted: number; revenue: number }> = {};
  
  allLeads.forEach((lead: any) => {
    const source = lead.source || 'unknown';
    if (!bySource[source]) {
      bySource[source] = { count: 0, converted: 0, revenue: 0 };
    }
    bySource[source].count++;
    
    if (lead.status === 'converted') {
      bySource[source].converted++;
      bySource[source].revenue += lead.value || 0;
    }
  });
  
  // Convert to array with conversion rate
  const sources = Object.entries(bySource)
    .map(([source, data]) => ({
      source,
      count: data.count,
      converted: data.converted,
      conversionRate: data.count > 0 ? Math.round((data.converted / data.count) * 100 * 10) / 10 : 0,
      revenue: data.revenue,
    }))
    .sort((a, b) => b.count - a.count);
  
  return NextResponse.json({
    data: sources,
    meta: createMeta(queryId),
  });
}
