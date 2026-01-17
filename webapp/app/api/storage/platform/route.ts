/**
 * Platform Storage Overview API
 * GET /api/storage/platform
 * 
 * Returns storage usage across ALL tenants (platform owner only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Platform owner user ID
const PLATFORM_OWNER_ID = '677b536d-6521-4ac8-a0a5-98278b35f4cc';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Auth check - ONLY platform owner
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== PLATFORM_OWNER_ID) {
      return NextResponse.json({ error: 'Unauthorized - Platform owner only' }, { status: 403 });
    }

    // Get all tenants with storage info
    const { data: tenants, error: tenantsError } = await supabase
      .from('businesses')
      .select(`
        id,
        name,
        current_storage_bytes,
        storage_limit_bytes,
        storage_blocked,
        is_white_label,
        pricing_tiers (
          name,
          storage_limit_gb,
          storage_overage_rate
        )
      `)
      .order('current_storage_bytes', { ascending: false });

    if (tenantsError) {
      throw tenantsError;
    }

    // Calculate platform totals
    let totalBytesUsed = 0;
    let totalBytesLimit = 0;
    let totalOverageGB = 0;
    let totalOverageCost = 0;
    let blockedCount = 0;

    const tenantsWithMetrics = (tenants || []).map((tenant: any) => {
      const bytesUsed = tenant.current_storage_bytes || 0;
      const bytesLimit = tenant.storage_limit_bytes || 5 * 1024 * 1024 * 1024;
      const usagePercent = bytesLimit > 0 ? (bytesUsed / bytesLimit) * 100 : 0;
      
      const tier = tenant.pricing_tiers as any;
      const includedGB = tier?.storage_limit_gb || 5;
      const overageRate = tier?.storage_overage_rate || 0.25;
      
      const includedBytes = includedGB * 1024 * 1024 * 1024;
      const overageBytes = Math.max(0, bytesUsed - includedBytes);
      const overageGB = overageBytes / (1024 * 1024 * 1024);
      const overageCost = overageGB * overageRate;

      totalBytesUsed += bytesUsed;
      totalBytesLimit += bytesLimit;
      totalOverageGB += overageGB;
      totalOverageCost += overageCost;
      if (tenant.storage_blocked) blockedCount++;

      return {
        id: tenant.id,
        name: tenant.name,
        isWhiteLabel: tenant.is_white_label,
        planName: tier?.name || 'Unknown',
        bytesUsed,
        bytesLimit,
        usagePercent: Math.round(usagePercent * 100) / 100,
        includedGB,
        overageGB: Math.round(overageGB * 100) / 100,
        overageCost: Math.round(overageCost * 100) / 100,
        isBlocked: tenant.storage_blocked || false,
      };
    });

    // Get recent storage events for activity feed
    const { data: recentEvents } = await supabase
      .from('storage_usage_events')
      .select(`
        id,
        tenant_id,
        event_type,
        object_name,
        delta_bytes,
        storage_type,
        created_at,
        businesses!inner (name)
      `)
      .order('created_at', { ascending: false })
      .limit(20);

    const formattedEvents = (recentEvents || []).map((event: any) => ({
      id: event.id,
      tenantId: event.tenant_id,
      tenantName: event.businesses?.name || 'Unknown',
      eventType: event.event_type,
      objectName: event.object_name,
      deltaBytes: event.delta_bytes,
      storageType: event.storage_type,
      createdAt: event.created_at,
    }));

    // Get storage by type across all tenants
    const { data: typeBreakdown } = await supabase
      .from('storage_usage_events')
      .select('storage_type, delta_bytes');

    const breakdownByType: Record<string, number> = {
      image: 0,
      mockup: 0,
      document: 0,
      other: 0,
    };

    (typeBreakdown || []).forEach((event: any) => {
      const type = event.storage_type || 'other';
      if (type in breakdownByType) {
        breakdownByType[type] += event.delta_bytes;
      } else {
        breakdownByType.other += event.delta_bytes;
      }
    });

    return NextResponse.json({
      summary: {
        totalBytesUsed,
        totalBytesLimit,
        totalUsagePercent: totalBytesLimit > 0 ? Math.round((totalBytesUsed / totalBytesLimit) * 10000) / 100 : 0,
        totalOverageGB: Math.round(totalOverageGB * 100) / 100,
        totalOverageCost: Math.round(totalOverageCost * 100) / 100,
        tenantCount: tenantsWithMetrics.length,
        blockedCount,
      },
      breakdownByType,
      tenants: tenantsWithMetrics,
      recentEvents: formattedEvents,
    });

  } catch (error: any) {
    console.error('[Platform Storage API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
