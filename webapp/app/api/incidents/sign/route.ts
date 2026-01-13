import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

// GET - View incident by token (public)
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

    // Log view event
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
  } catch (error: any) {
    console.error('GET /api/incidents/sign error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Submit signature or refusal
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, action, signer_name, refusal_reason } = body;

    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    }

    if (!action || !['acknowledge', 'refuse'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    if (!signer_name) {
      return NextResponse.json({ error: 'Signer name required' }, { status: 400 });
    }

    if (action === 'refuse' && !refusal_reason) {
      return NextResponse.json({ error: 'Refusal reason required' }, { status: 400 });
    }

    const supabase = await createClient();
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Get incident
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

    // Generate PDF hash (in production, generate actual PDF first)
    const reportContent = JSON.stringify(incident.report_sections);
    const pdfHash = crypto.createHash('sha256').update(reportContent).digest('hex');

    // Update incident with signature
    const { error: updateError } = await supabase
      .from('incidents')
      .update({
        signed_at: new Date().toISOString(),
        signer_name,
        signer_ip: ip,
        signer_user_agent: userAgent,
        signature_type: action === 'acknowledge' ? 'acknowledged' : 'refused',
        refusal_reason: action === 'refuse' ? refusal_reason : null,
        status: action === 'acknowledge' ? 'signed' : 'refused',
        pdf_hash: pdfHash,
        finalized_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', incident.id);

    if (updateError) throw updateError;

    // Log signature event
    await supabase.from('signature_events').insert({
      incident_id: incident.id,
      event_type: action === 'acknowledge' ? 'signed' : 'refused',
      ip_address: ip,
      user_agent: userAgent,
      metadata: {
        signer_name,
        action,
        refusal_reason: action === 'refuse' ? refusal_reason : null,
        pdf_hash: pdfHash,
        signed_at: new Date().toISOString()
      }
    });

    return NextResponse.json({
      success: true,
      action,
      message: action === 'acknowledge' 
        ? 'Report acknowledged successfully' 
        : 'Refusal recorded successfully',
      timestamp: new Date().toISOString(),
      confirmation_hash: pdfHash.substring(0, 16)
    });

  } catch (error: any) {
    console.error('POST /api/incidents/sign error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
