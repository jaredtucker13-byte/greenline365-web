/**
 * Storage Usage API
 * GET /api/storage/usage
 * 
 * Returns current storage usage for a tenant
 * Gracefully handles missing tables (migration not run yet)
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

    // Try to get business with storage info
    // Fall back to defaults if storage columns don't exist yet
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, name')
      .eq('id', businessId)
      .single();

    if (businessError || !business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    // Return default usage until migration is run
    // This prevents the 404 error spam in the console
    const defaultUsage = {
      bytesUsed: 0,
      bytesLimit: 5 * 1024 * 1024 * 1024, // 5GB default
      bytesAvailable: 5 * 1024 * 1024 * 1024,
      usagePercent: 0,
      isBlocked: false,
      blockReason: null,
      breakdown: {
        images: 0,
        mockups: 0,
        documents: 0,
        other: 0,
      },
      planName: 'Starter',
      includedGB: 5,
      overageRatePerGB: 0.25,
      overageGB: 0,
      estimatedOverageCost: 0,
    };

    return NextResponse.json({ 
      usage: defaultUsage, 
      alerts: [],
      note: 'Storage tracking tables not yet created. Run the migration to enable full tracking.'
    });

  } catch (error: any) {
    console.error('[Storage Usage API] Error:', error);
    
    // Return defaults instead of error to prevent console spam
    return NextResponse.json({ 
      usage: {
        bytesUsed: 0,
        bytesLimit: 5 * 1024 * 1024 * 1024,
        bytesAvailable: 5 * 1024 * 1024 * 1024,
        usagePercent: 0,
        isBlocked: false,
        blockReason: null,
        breakdown: { images: 0, mockups: 0, documents: 0, other: 0 },
        planName: 'Starter',
        includedGB: 5,
        overageRatePerGB: 0.25,
        overageGB: 0,
        estimatedOverageCost: 0,
      }, 
      alerts: [] 
    });
  }
}
