import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const [listingsRes, leadsRes] = await Promise.all([
      supabase.from('directory_listings').select('industry, city, tags', { count: 'exact' }),
      supabase.from('crm_leads').select('id', { count: 'exact' }),
    ]);

    const listings = listingsRes.data || [];
    const totalBusinesses = listingsRes.count || 0;
    const totalLeads = leadsRes.count || 0;

    const industries = new Set(listings.map(l => l.industry).filter(Boolean));
    const cities = new Set(listings.map(l => l.city).filter(Boolean));

    // Count unique destinations from tags
    const destinations = new Set<string>();
    listings.forEach(l => {
      const tags: string[] = l.tags || [];
      tags.forEach(t => {
        if (t.startsWith('destination:')) destinations.add(t.replace('destination:', ''));
      });
    });

    return NextResponse.json({
      totalBusinesses,
      totalDestinations: destinations.size || cities.size,
      totalCategories: industries.size,
      totalLeads,
    });
  } catch (error: any) {
    return NextResponse.json({
      totalBusinesses: 0,
      totalDestinations: 0,
      totalCategories: 0,
      totalLeads: 0,
    });
  }
}
