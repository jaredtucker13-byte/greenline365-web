import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// SendGrid API
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDER_EMAIL = process.env.SENDER_EMAIL || 'greenline365help@gmail.com';

interface SendEmailRequest {
  to: string | string[];
  subject: string;
  html_content: string;
  plain_content?: string;
  template_id?: string;
  variables?: Record<string, string>;
  campaign_id?: string;
}

// Replace template variables
function replaceVariables(content: string, variables: Record<string, string>): string {
  let result = content;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, value);
  }
  return result;
}

// Send email via SendGrid
async function sendViaEmail(to: string, subject: string, htmlContent: string, plainContent?: string) {
  if (!SENDGRID_API_KEY) {
    throw new Error('SendGrid API key not configured');
  }

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: SENDER_EMAIL, name: 'GreenLine365' },
      subject,
      content: [
        ...(plainContent ? [{ type: 'text/plain', value: plainContent }] : []),
        { type: 'text/html', value: htmlContent },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`SendGrid error: ${error}`);
  }

  return { success: true, messageId: response.headers.get('x-message-id') };
}

// POST /api/email/send - Send an email
export async function POST(request: NextRequest) {
  try {
    const body: SendEmailRequest = await request.json();
    const { to, subject, html_content, plain_content, template_id, variables = {}, campaign_id } = body;

    if (!to || (!html_content && !template_id)) {
      return NextResponse.json(
        { error: 'Missing required fields: to, and either html_content or template_id' },
        { status: 400 }
      );
    }

    let finalSubject = subject;
    let finalHtml = html_content;
    let finalPlain = plain_content;

    // If template_id provided, fetch and use template
    if (template_id) {
      const { data: template, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('id', template_id)
        .single();

      if (error || !template) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 });
      }

      finalSubject = subject || template.subject;
      finalHtml = template.html_content;
      finalPlain = template.plain_content;
    }

    // Replace variables
    finalSubject = replaceVariables(finalSubject, variables);
    finalHtml = replaceVariables(finalHtml, variables);
    if (finalPlain) {
      finalPlain = replaceVariables(finalPlain, variables);
    }

    // Handle single or multiple recipients
    const recipients = Array.isArray(to) ? to : [to];
    const results = [];

    for (const recipient of recipients) {
      try {
        const result = await sendViaEmail(recipient, finalSubject, finalHtml, finalPlain);
        
        // Log the send
        if (campaign_id) {
          await supabase.from('email_sends').insert({
            campaign_id,
            recipient_email: recipient,
            status: 'sent',
            sendgrid_message_id: result.messageId,
            sent_at: new Date().toISOString(),
          });
        }

        results.push({ email: recipient, success: true, messageId: result.messageId });
      } catch (error: any) {
        // Log the failure
        if (campaign_id) {
          await supabase.from('email_sends').insert({
            campaign_id,
            recipient_email: recipient,
            status: 'failed',
            error_message: error.message,
          });
        }

        results.push({ email: recipient, success: false, error: error.message });
      }
    }

    const allSuccess = results.every(r => r.success);
    const someSuccess = results.some(r => r.success);

    return NextResponse.json({
      success: allSuccess,
      partial: !allSuccess && someSuccess,
      results,
      sent: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
    }, { status: allSuccess ? 200 : someSuccess ? 207 : 500 });

  } catch (error: any) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send email' },
      { status: 500 }
    );
  }
}
