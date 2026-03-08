import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');

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
      return NextResponse.json({ error: 'Access denied to this business' }, { status: 403 });
    }

    const { data: items, error } = await supabase
      .from('brain_admin')
      .select('*')
      .eq('business_id', businessId)
      .order('due_date', { ascending: true, nullsFirst: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ items: items || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { itemId, completed, businessId } = body;

    // Verify user has access to the business that owns this item
    if (businessId) {
      const { data: access } = await supabase
        .from('user_businesses')
        .select('role')
        .eq('user_id', user.id)
        .eq('business_id', businessId)
        .single();

      if (!access) {
        return NextResponse.json({ error: 'Access denied to this business' }, { status: 403 });
      }
    }

    const { error } = await supabase
      .from('brain_admin')
      .update({
        completed,
        completed_at: completed ? new Date().toISOString() : null,
      })
      .eq('id', itemId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}