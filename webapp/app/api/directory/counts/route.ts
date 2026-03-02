/**
 * Dynamic Counts API
 * GET /api/directory/counts
 *
 * Returns live counts from Supabase to replace ALL hard-coded numbers.
 * Calls the get_dynamic_counts() RPC function.
 * Falls back to a manual query if the RPC doesn't exist yet.
 */
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // Try RPC first (requires migration 033 to be run)
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_dynamic_counts');

    if (!rpcError && rpcData) {
      return NextResponse.json(rpcData, {
        headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
      });
    }

    // Fallback: manual query
    const { count: totalBusinesses } = await supabase
      .from('directory_listings')
      .select('*', { count: 'exact', head: true })
      .eq('is_published', true);

    const { data: industries } = await supabase
      .from('directory_listings')
      .select('industry')
      .eq('is_published', true);

    const uniqueIndustries = new Set((industries || []).map((r: any) => r.industry));

    const { count: totalClaimed } = await supabase
      .from('directory_listings')
      .select('*', { count: 'exact', head: true })
      .eq('is_published', true)
      .eq('is_claimed', true);

    const { count: totalPremium } = await supabase
      .from('directory_listings')
      .select('*', { count: 'exact', head: true })
      .eq('is_published', true)
      .in('tier', ['growth', 'authority', 'dominator']);

    // Build category counts
    const categoryCounts: Record<string, number> = {};
    for (const ind of uniqueIndustries) {
      const { count } = await supabase
        .from('directory_listings')
        .select('*', { count: 'exact', head: true })
        .eq('is_published', true)
        .eq('industry', ind);
      categoryCounts[ind] = count || 0;
    }

    const result = {
      total_businesses: totalBusinesses || 0,
      total_categories: uniqueIndustries.size,
      total_destinations: 8,
      total_claimed: totalClaimed || 0,
      total_premium: totalPremium || 0,
      total_public_resources: 0,
      total_resource_downloads: 0,
      category_counts: categoryCounts,
    };

    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    });
  } catch (error: any) {
    console.error('[Directory Counts] Error:', error);
    return NextResponse.json(
      { total_businesses: 0, total_categories: 0, total_destinations: 8, error: error.message },
      { status: 500 }
    );
  }
}
