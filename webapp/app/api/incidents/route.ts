import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

// GET - List incidents or get single incident
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const status = searchParams.get('status');

    if (id) {
      // Get single incident with images
      const { data: incident, error } = await supabase
        .from('incidents')
        .select(`
          *,
          incident_images (*)
        `)
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return NextResponse.json(incident);
    }

    // List incidents
    let query = supabase
      .from('incidents')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: incidents, error } = await query;
    if (error) throw error;

    return NextResponse.json(incidents);
  } catch (error: any) {
    console.error('GET /api/incidents error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create new incident
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, customer_name, customer_email, customer_phone, property_address, severity } = body;

    // Generate signature token
    const signatureToken = crypto.randomBytes(32).toString('hex');
    const signatureExpires = new Date();
    signatureExpires.setDate(signatureExpires.getDate() + 30); // 30 days

    const { data: incident, error } = await supabase
      .from('incidents')
      .insert({
        user_id: user.id,
        title: title || 'New Incident Report',
        description,
        customer_name,
        customer_email,
        customer_phone,
        property_address,
        severity: severity || 'medium',
        signature_token: signatureToken,
        signature_expires_at: signatureExpires.toISOString(),
        status: 'draft'
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(incident);
  } catch (error: any) {
    console.error('POST /api/incidents error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update incident
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing incident ID' }, { status: 400 });
    }

    const { data: incident, error } = await supabase
      .from('incidents')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(incident);
  } catch (error: any) {
    console.error('PUT /api/incidents error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete incident
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing incident ID' }, { status: 400 });
    }

    const { error } = await supabase
      .from('incidents')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE /api/incidents error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
