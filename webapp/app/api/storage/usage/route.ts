/**
 * Storage Usage API
 * GET /api/storage/usage
 * 
 * Returns current storage usage for a tenant
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');

    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID required' }, { status: 400 });
    }

    // Verify user has access to this business
    const { data: access } = await supabase
      .from('user_businesses')
      .select('role')
      .eq('user_id', user.id)
      .eq('business_id', businessId)
      .single();

    if (!access) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get business with storage info
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select(`
        id,
        name,
        current_storage_bytes,
        storage_limit_bytes,
        storage_blocked,
        storage_block_reason,
        pricing_tier_id,
        pricing_tiers (
          name,
          storage_limit_gb,
          storage_overage_rate
        )
      `)
      .eq('id', businessId)
      .single();

    if (businessError || !business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    // Get breakdown by storage type
    const { data: breakdown } = await supabase
      .from('storage_usage_events')
      .select('storage_type, delta_bytes')
      .eq('tenant_id', businessId);

    // Calculate breakdown totals
    const breakdownTotals = {
      images: 0,
      mockups: 0,
      documents: 0,
      other: 0,
    };

    if (breakdown) {
      breakdown.forEach((event: any) => {
        const type = event.storage_type as keyof typeof breakdownTotals;
        if (type in breakdownTotals) {
          breakdownTotals[type] += event.delta_bytes;
        } else {
          breakdownTotals.other += event.delta_bytes;
        }
      });
    }

    // Get unacknowledged alerts
    const { data: alerts } = await supabase
      .from('storage_alerts')
      .select('*')
      .eq('tenant_id', businessId)
      .is('acknowledged_at', null)
      .order('created_at', { ascending: false })
      .limit(5);

    // Calculate usage metrics
    const bytesUsed = business.current_storage_bytes || 0;
    const bytesLimit = business.storage_limit_bytes || 5 * 1024 * 1024 * 1024; // 5GB default
    const bytesAvailable = Math.max(0, bytesLimit - bytesUsed);
    const usagePercent = bytesLimit > 0 ? (bytesUsed / bytesLimit) * 100 : 0;

    // Plan info
    const tier = business.pricing_tiers as any;
    const includedGB = tier?.storage_limit_gb || 5;
    const overageRatePerGB = tier?.storage_overage_rate || 0.25;

    // Calculate overage
    const includedBytes = includedGB * 1024 * 1024 * 1024;
    const overageBytes = Math.max(0, bytesUsed - includedBytes);
    const overageGB = overageBytes / (1024 * 1024 * 1024);
    const estimatedOverageCost = overageGB * overageRatePerGB;

    const usage = {
      bytesUsed,
      bytesLimit,
      bytesAvailable,
      usagePercent: Math.round(usagePercent * 100) / 100,
      isBlocked: business.storage_blocked || false,
      blockReason: business.storage_block_reason,
      breakdown: breakdownTotals,
      planName: tier?.name || 'Starter',
      includedGB,
      overageRatePerGB,
      overageGB: Math.round(overageGB * 100) / 100,
      estimatedOverageCost: Math.round(estimatedOverageCost * 100) / 100,
    };

    const formattedAlerts = (alerts || []).map((alert: any) => ({
      id: alert.id,
      type: alert.alert_type,
      thresholdPercent: alert.threshold_percent,
      message: alert.message,
      createdAt: alert.created_at,
      acknowledged: !!alert.acknowledged_at,
    }));

    return NextResponse.json({ usage, alerts: formattedAlerts });

  } catch (error: any) {
    console.error('[Storage Usage API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
