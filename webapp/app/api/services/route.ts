/**
 * Services API
 * GET - List tenant services
 * POST - Create new service
 * PUT - Update service
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    let query = supabase
      .from('tenant_services')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    const { data: services, error } = await query;

    if (error) {
      // Table might not exist yet - return default services
      console.log('[Services] Table may not exist:', error.message);
      return NextResponse.json({ 
        services: [
          { id: 'default-1', name: 'Quick Demo', duration_minutes: 10, price: 0, price_type: 'free', color: '#39FF14' },
          { id: 'default-2', name: 'Strategy Call', duration_minutes: 30, price: 0, price_type: 'free', color: '#0CE293' },
        ]
      });
    }

    // If no services found, return defaults
    if (!services || services.length === 0) {
      return NextResponse.json({ 
        services: [
          { id: 'default-1', name: 'Quick Demo', duration_minutes: 10, price: 0, price_type: 'free', color: '#39FF14' },
          { id: 'default-2', name: 'Strategy Call', duration_minutes: 30, price: 0, price_type: 'free', color: '#0CE293' },
        ]
      });
    }

    return NextResponse.json({ services });
  } catch (error: any) {
    console.error('[Services] Error:', error);
    // Return defaults on error
    return NextResponse.json({ 
      services: [
        { id: 'default-1', name: 'Quick Demo', duration_minutes: 10, price: 0, price_type: 'free', color: '#39FF14' },
        { id: 'default-2', name: 'Strategy Call', duration_minutes: 30, price: 0, price_type: 'free', color: '#0CE293' },
      ]
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      tenant_id,
      name,
      description,
      duration_minutes = 30,
      price,
      price_type = 'fixed',
      requires_human = false,
      color = '#39FF14',
    } = body;

    if (!name) {
      return NextResponse.json({ error: 'Service name is required' }, { status: 400 });
    }

    const { data: service, error } = await supabase
      .from('tenant_services')
      .insert({
        tenant_id,
        name,
        description,
        duration_minutes,
        price,
        price_type,
        requires_human,
        color,
      })
      .select()
      .single();

    if (error) {
      console.error('[Services] Create error:', error);
      return NextResponse.json({ error: 'Failed to create service' }, { status: 500 });
    }

    return NextResponse.json({ service }, { status: 201 });
  } catch (error: any) {
    console.error('[Services] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Service ID is required' }, { status: 400 });
    }

    const { data: service, error } = await supabase
      .from('tenant_services')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[Services] Update error:', error);
      return NextResponse.json({ error: 'Failed to update service' }, { status: 500 });
    }

    return NextResponse.json({ service });
  } catch (error: any) {
    console.error('[Services] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
