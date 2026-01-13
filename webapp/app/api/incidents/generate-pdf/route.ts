import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { IncidentReportPDF } from '@/lib/pdf/IncidentReportPDF';
import crypto from 'crypto';
import React from 'react';

// Company info - could come from tenant profile in production
const DEFAULT_COMPANY = {
  name: 'GreenLine365',
  address: '123 Business Park, Suite 100, City, ST 12345',
  phone: '(555) 123-4567',
  email: 'reports@greenline365.com',
  website: 'www.greenline365.com'
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { incident_id, download } = body;

    if (!incident_id) {
      return NextResponse.json({ error: 'Missing incident_id' }, { status: 400 });
    }

    // Get incident with images
    const { data: incident, error: incidentError } = await supabase
      .from('incidents')
      .select(`
        *,
        incident_images (*)
      `)
      .eq('id', incident_id)
      .eq('user_id', user.id)
      .single();

    if (incidentError || !incident) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    }

    // Get signature events for audit trail
    const { data: signatureEvents } = await supabase
      .from('signature_events')
      .select('*')
      .eq('incident_id', incident_id)
      .order('occurred_at', { ascending: true });

    // Get company info from tenant profile (if exists)
    const { data: tenantProfile } = await supabase
      .from('memory_core_profiles')
      .select('business_name, business_location, contact_info')
      .eq('user_id', user.id)
      .single();

    const company = tenantProfile ? {
      name: tenantProfile.business_name || DEFAULT_COMPANY.name,
      address: tenantProfile.business_location || DEFAULT_COMPANY.address,
      phone: tenantProfile.contact_info?.phone || DEFAULT_COMPANY.phone,
      email: tenantProfile.contact_info?.email || DEFAULT_COMPANY.email,
      website: tenantProfile.contact_info?.website || DEFAULT_COMPANY.website
    } : DEFAULT_COMPANY;

    // Generate PDF buffer
    const pdfDocument = React.createElement(IncidentReportPDF, {
      incident,
      images: incident.incident_images || [],
      company,
      signatureEvents: signatureEvents || []
    });
    
    const pdfBuffer = await renderToBuffer(pdfDocument as React.ReactElement);

    // Generate hash for document integrity
    const pdfHash = crypto.createHash('sha256').update(pdfBuffer).digest('hex');

    // Update incident with PDF hash
    await supabase
      .from('incidents')
      .update({ 
        pdf_hash: pdfHash,
        updated_at: new Date().toISOString()
      })
      .eq('id', incident_id);

    // Log audit event
    await supabase.from('signature_events').insert({
      incident_id,
      event_type: 'pdf_generated',
      metadata: {
        hash: pdfHash,
        generated_at: new Date().toISOString(),
        generated_by: user.id
      }
    });

    // If download requested, return PDF directly
    if (download) {
      const filename = `incident-report-${incident.id.substring(0, 8).toUpperCase()}.pdf`;
      
      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': pdfBuffer.length.toString(),
          'X-Document-Hash': pdfHash
        }
      });
    }

    // Otherwise, upload to storage and return URL
    const storagePath = `reports/${incident_id}/${Date.now()}-report.pdf`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('incident-images')
      .upload(storagePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      // Still return success with direct download option
      return NextResponse.json({
        success: true,
        hash: pdfHash,
        message: 'PDF generated (storage upload failed)',
        download_url: `/api/incidents/generate-pdf?incident_id=${incident_id}&download=true`
      });
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('incident-images')
      .getPublicUrl(storagePath);

    // Update incident with PDF URL
    await supabase
      .from('incidents')
      .update({ 
        pdf_url: publicUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', incident_id);

    return NextResponse.json({
      success: true,
      pdf_url: publicUrl,
      hash: pdfHash,
      filename: `incident-report-${incident.id.substring(0, 8).toUpperCase()}.pdf`
    });

  } catch (error: any) {
    console.error('POST /api/incidents/generate-pdf error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET - Download PDF directly
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const incidentId = searchParams.get('incident_id');
    const token = searchParams.get('token');
    
    const supabase = await createClient();
    
    let incident;
    
    if (token) {
      // Public access via signature token
      const { data, error } = await supabase
        .from('incidents')
        .select(`*, incident_images (*)`)
        .eq('signature_token', token)
        .single();
      
      if (error || !data) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 404 });
      }
      incident = data;
    } else if (incidentId) {
      // Authenticated access
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      const { data, error } = await supabase
        .from('incidents')
        .select(`*, incident_images (*)`)
        .eq('id', incidentId)
        .eq('user_id', user.id)
        .single();
      
      if (error || !data) {
        return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
      }
      incident = data;
    } else {
      return NextResponse.json({ error: 'Missing incident_id or token' }, { status: 400 });
    }

    // Get signature events
    const { data: signatureEvents } = await supabase
      .from('signature_events')
      .select('*')
      .eq('incident_id', incident.id)
      .order('occurred_at', { ascending: true });

    // Generate PDF
    const pdfBuffer = await renderToBuffer(
      IncidentReportPDF({
        incident,
        images: incident.incident_images || [],
        company: DEFAULT_COMPANY,
        signatureEvents: signatureEvents || []
      })
    );

    const filename = `incident-report-${incident.id.substring(0, 8).toUpperCase()}.pdf`;

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString()
      }
    });

  } catch (error: any) {
    console.error('GET /api/incidents/generate-pdf error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
