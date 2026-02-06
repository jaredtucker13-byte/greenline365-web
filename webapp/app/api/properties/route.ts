import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getServiceClient() {
  return createClient(supabaseUrl, supabaseServiceKey);
}

// GET /api/properties - List properties or search
export async function GET(request: NextRequest) {
  const supabase = getServiceClient();
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenant_id');
  const search = searchParams.get('search');
  const propertyId = searchParams.get('id');
  const limit = parseInt(searchParams.get('limit') || '50');

  if (!tenantId) {
    return NextResponse.json({ error: 'tenant_id required' }, { status: 400 });
  }

  // Single property with full details
  if (propertyId) {
    const { data: property, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .eq('tenant_id', tenantId)
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 404 });

    // Get contacts, assets, interactions
    const [contacts, assets, interactions] = await Promise.all([
      supabase.from('contacts').select('*').eq('property_id', propertyId).eq('tenant_id', tenantId),
      supabase.from('assets').select('*').eq('property_id', propertyId).eq('tenant_id', tenantId),
      supabase.from('interactions').select('*').eq('property_id', propertyId).eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(50),
    ]);

    // Calculate health score
    let healthScore = 100;
    if (assets.data) {
      for (const asset of assets.data) {
        if (asset.install_date) {
          const ageYears = (Date.now() - new Date(asset.install_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000);
          if (ageYears > 15) healthScore -= 20;
          else if (ageYears > 10) healthScore -= 10;
          else if (ageYears > 5) healthScore -= 5;
        }
        if (asset.confidence_score && asset.confidence_score < 50) healthScore -= 10;
      }
    }
    healthScore = Math.max(0, Math.min(100, healthScore));

    // Total maintenance value
    const totalValue = (interactions.data || [])
      .filter((i: any) => i.metadata?.cost)
      .reduce((sum: number, i: any) => sum + (i.metadata.cost || 0), 0);

    return NextResponse.json({
      ...property,
      contacts: contacts.data || [],
      assets: assets.data || [],
      interactions: interactions.data || [],
      health_score: healthScore,
      total_maintenance_value: totalValue,
    });
  }

  // Search properties
  if (search) {
    const { data, error } = await supabase
      .from('properties')
      .select('*, contacts(id, first_name, last_name, phone_normalized)')
      .eq('tenant_id', tenantId)
      .ilike('full_address', `%${search}%`)
      .limit(limit);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data || []);
  }

  // List all properties
  const { data, error } = await supabase
    .from('properties')
    .select('*, contacts(id, first_name, last_name, phone_normalized), assets(id, asset_type)')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

// POST /api/properties - Create a property
export async function POST(request: NextRequest) {
  const supabase = getServiceClient();
  const body = await request.json();
  const { tenant_id, address, city, state, zip, unit, gate_code, google_place_id } = body;

  if (!tenant_id || !address) {
    return NextResponse.json({ error: 'tenant_id and address required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('properties')
    .insert({
      tenant_id,
      address,
      city: city || '',
      state: state || '',
      zip: zip || '',
      unit: unit || null,
      gate_code: gate_code || null,
      google_place_id: google_place_id || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
