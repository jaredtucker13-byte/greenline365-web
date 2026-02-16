import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';
import { z } from 'zod';
import { CreateIncidentSchema, UpdateIncidentSchema } from '@/lib/validations/incidents';

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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('GET /api/incidents error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST - Create new incident (The Stain)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = CreateIncidentSchema.parse(body);

    // Generate signature token for future liability transfer
    const signatureToken = crypto.randomBytes(32).toString('hex');
    const signatureExpires = new Date();
    signatureExpires.setDate(signatureExpires.getDate() + 30); // 30 days

    const { data: incident, error } = await supabase
      .from('incidents')
      .insert({
        user_id: user.id,
        title: validated.title || 'New Incident Report',
        description: validated.description,
        customer_name: validated.customer_name,
        customer_email: validated.customer_email,
        customer_phone: validated.customer_phone,
        property_address: validated.property_address,
        severity: validated.severity,
        signature_token: signatureToken,
        signature_expires_at: signatureExpires.toISOString(),
        status: 'draft'
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(incident);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('POST /api/incidents error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
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
    const validated = UpdateIncidentSchema.parse(body);

    const { id, ...updates } = validated;

    // Prevent modification of signed/refused incidents (immutability rule)
    const { data: existing, error: fetchError } = await supabase
      .from('incidents')
      .select('status, signature_type')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError) throw fetchError;

    if (existing.signature_type === 'refused' || existing.signature_type === 'acknowledged') {
      return NextResponse.json(
        { error: 'Cannot modify a signed or refused incident. Liability records are immutable.' },
        { status: 403 }
      );
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
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('PUT /api/incidents error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
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

    // Prevent deletion of signed/refused incidents (immutability rule)
    const { data: existing, error: fetchError } = await supabase
      .from('incidents')
      .select('status, signature_type')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError) throw fetchError;

    if (existing.signature_type === 'refused' || existing.signature_type === 'acknowledged') {
      return NextResponse.json(
        { error: 'Cannot delete a signed or refused incident. Liability records are immutable.' },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from('incidents')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('DELETE /api/incidents error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
