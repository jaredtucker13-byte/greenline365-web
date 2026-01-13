import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://greenline365.com';

// Send signing request email
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { incident_id } = body;

    if (!incident_id) {
      return NextResponse.json({ error: 'Missing incident_id' }, { status: 400 });
    }

    // Get incident
    const { data: incident, error: incidentError } = await supabase
      .from('incidents')
      .select('*')
      .eq('id', incident_id)
      .eq('user_id', user.id)
      .single();

    if (incidentError) throw incidentError;

    if (!incident.customer_email) {
      return NextResponse.json({ error: 'No customer email on incident' }, { status: 400 });
    }

    // Generate signing link
    const signLink = `${SITE_URL}/sign/${incident.signature_token}`;

    // Send email via SendGrid
    const emailResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: incident.customer_email, name: incident.customer_name }]
        }],
        from: {
          email: 'reports@greenline365.com',
          name: 'GreenLine365 Reports'
        },
        subject: `Incident Report Ready for Review: ${incident.title}`,
        content: [{
          type: 'text/html',
          value: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1a1a2e; color: #00ff88; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .button { display: inline-block; background: #00ff88; color: #1a1a2e; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; margin: 20px 0; }
    .footer { padding: 20px; font-size: 12px; color: #666; text-align: center; }
    .severity-high { color: #ff4444; font-weight: bold; }
    .severity-medium { color: #ffaa00; font-weight: bold; }
    .severity-low { color: #00aa00; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>GreenLine365</h1>
      <p>Incident Documentation Report</p>
    </div>
    <div class="content">
      <h2>Hello ${incident.customer_name || 'Customer'},</h2>
      
      <p>An incident report has been prepared regarding your property:</p>
      
      <p><strong>Report:</strong> ${incident.title}</p>
      <p><strong>Property:</strong> ${incident.property_address || 'On file'}</p>
      <p><strong>Date:</strong> ${new Date(incident.created_at).toLocaleDateString()}</p>
      ${incident.severity ? `<p><strong>Severity:</strong> <span class="severity-${incident.severity}">${incident.severity.toUpperCase()}</span></p>` : ''}
      
      <p>Please review the findings and acknowledge receipt of this report:</p>
      
      <center>
        <a href="${signLink}" class="button">Review & Sign Report</a>
      </center>
      
      <p style="font-size: 12px; color: #666;">
        This link will expire on ${new Date(incident.signature_expires_at).toLocaleDateString()}.
        By acknowledging this report, you confirm that you have reviewed the documented findings.
        This does not constitute admission of liability by any party.
      </p>
    </div>
    <div class="footer">
      <p>GreenLine365 | Professional Documentation Services</p>
      <p>If you did not expect this email, please disregard.</p>
    </div>
  </div>
</body>
</html>
          `
        }]
      })
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error('SendGrid error:', errorText);
      throw new Error('Failed to send email');
    }

    // Log signature event
    await supabase.from('signature_events').insert({
      incident_id,
      event_type: 'email_sent',
      metadata: {
        recipient: incident.customer_email,
        sent_at: new Date().toISOString()
      }
    });

    // Update incident
    await supabase
      .from('incidents')
      .update({
        email_sent_at: new Date().toISOString(),
        status: 'pending_signature',
        updated_at: new Date().toISOString()
      })
      .eq('id', incident_id);

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      sign_link: signLink
    });

  } catch (error: any) {
    console.error('POST /api/incidents/send-for-signature error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
