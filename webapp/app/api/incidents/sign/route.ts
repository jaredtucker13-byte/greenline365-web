import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';
import { z } from 'zod';
import { SignIncidentSchema } from '@/lib/validations/incidents';

// GET - View incident by token (public — no auth required)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    }

    const supabase = await createClient();

    // Get incident by token
    const { data: incident, error } = await supabase
      .from('incidents')
      .select(`
        id, title, description, severity, status,
        customer_name, property_address,
        report_sections, ai_analysis,
        signature_expires_at, signed_at, signature_type,
        created_at,
        incident_images (id, url, caption, ai_analysis)
      `)
      .eq('signature_token', token)
      .gt('signature_expires_at', new Date().toISOString())
      .single();

    if (error || !incident) {
      return NextResponse.json({ error: 'Invalid or expired link' }, { status: 404 });
    }

    // Log view event in signature audit trail
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    await supabase.from('signature_events').insert({
      incident_id: incident.id,
      event_type: 'viewed',
      ip_address: ip,
      user_agent: userAgent,
      metadata: { viewed_at: new Date().toISOString() }
    });

    // Update email link clicked if not already
    await supabase
      .from('incidents')
      .update({ email_link_clicked_at: new Date().toISOString() })
      .eq('id', incident.id)
      .is('email_link_clicked_at', null);

    return NextResponse.json(incident);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('GET /api/incidents/sign error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST - Submit signature or refusal (The Shield — Liability Transfer)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = SignIncidentSchema.parse(body);

    const { token, action, signer_name, refusal_reason } = validated;

    const supabase = await createClient();
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Get incident — must be valid, not expired, not already signed
    const { data: incident, error: fetchError } = await supabase
      .from('incidents')
      .select('id, status, report_sections')
      .eq('signature_token', token)
      .gt('signature_expires_at', new Date().toISOString())
      .is('signed_at', null)
      .single();

    if (fetchError || !incident) {
      return NextResponse.json({ error: 'Invalid, expired, or already signed' }, { status: 400 });
    }

    // Generate SHA-256 hash of report content for tamper-proof evidence chain
    const reportContent = JSON.stringify(incident.report_sections);
    const pdfHash = crypto.createHash('sha256').update(reportContent).digest('hex');

    // Determine liability transfer status
    // THE SHIELD: When a homeowner refuses, liability officially transfers to them
    const isRefusal = action === 'refuse';
    const liabilityTransferred = isRefusal;

    // Update incident with signature — this record becomes IMMUTABLE after this point
    const { error: updateError } = await supabase
      .from('incidents')
      .update({
        signed_at: new Date().toISOString(),
        signer_name,
        signer_ip: ip,
        signer_user_agent: userAgent,
        signature_type: isRefusal ? 'refused' : 'acknowledged',
        refusal_reason: isRefusal ? refusal_reason : null,
        liability_transferred: liabilityTransferred,
        status: isRefusal ? 'refused' : 'signed',
        pdf_hash: pdfHash,
        finalized_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', incident.id);

    if (updateError) throw updateError;

    // Log signature event in audit trail — immutable evidence chain
    await supabase.from('signature_events').insert({
      incident_id: incident.id,
      event_type: isRefusal ? 'refused' : 'signed',
      ip_address: ip,
      user_agent: userAgent,
      metadata: {
        signer_name,
        action,
        refusal_reason: isRefusal ? refusal_reason : null,
        liability_transferred: liabilityTransferred,
        pdf_hash: pdfHash,
        signed_at: new Date().toISOString()
      }
    });

    return NextResponse.json({
      success: true,
      action,
      liability_transferred: liabilityTransferred,
      message: isRefusal
        ? 'Refusal recorded. Liability has been transferred to the property owner. This record is now immutable.'
        : 'Report acknowledged successfully.',
      timestamp: new Date().toISOString(),
      confirmation_hash: pdfHash.substring(0, 16)
    });

  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('POST /api/incidents/sign error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
