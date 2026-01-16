import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { nanoid } from 'nanoid';

const SENDER_EMAIL = process.env.SENDER_EMAIL || 'hello@greenline365.com';
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://greenline365.com';

/**
 * Send Access Code Invite API
 * 
 * Admin endpoint to generate code AND send invite email
 * 
 * POST /api/admin/send-invite - Generate code + send email
 */

interface SendInviteRequest {
  recipientEmail: string;
  tier: 'tier1' | 'tier2' | 'tier3';
  codeType?: string;
  maxUses?: number;
  expiresInHours?: number;
  customMessage?: string;
  customCode?: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin, full_name')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body: SendInviteRequest = await request.json();
    const {
      recipientEmail,
      tier,
      codeType = 'promo',
      maxUses = 1,
      expiresInHours = 72,
      customMessage = '',
      customCode = null,
    } = body;

    if (!recipientEmail || !tier) {
      return NextResponse.json(
        { error: 'Recipient email and tier are required' },
        { status: 400 }
      );
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Generate or use custom code
    let code: string;
    if (customCode) {
      if (!/^[A-Z0-9-]{6,30}$/.test(customCode)) {
        return NextResponse.json(
          { error: 'Custom code must be 6-30 characters, uppercase letters, numbers, and hyphens only' },
          { status: 400 }
        );
      }
      code = customCode;
    } else {
      const prefix = codeType === 'family' ? 'FAMILY' 
                   : codeType === 'beta' ? 'BETA'
                   : codeType === 'lifetime' ? 'LIFETIME'
                   : codeType === 'partner' ? 'PARTNER'
                   : 'INVITE';
      
      const uniqueId = nanoid(8).toUpperCase();
      code = `${prefix}-${uniqueId}`;
    }

    // Calculate expiration
    let expiresAt = null;
    if (expiresInHours && expiresInHours > 0) {
      const expDate = new Date();
      expDate.setHours(expDate.getHours() + expiresInHours);
      expiresAt = expDate.toISOString();
    }

    // Create access code
    const { data: accessCode, error: codeError } = await supabase
      .from('access_codes')
      .insert({
        code,
        max_uses: maxUses,
        linked_tier: tier,
        code_type: codeType,
        description: `Sent to ${recipientEmail}`,
        expires_at: expiresAt,
        created_by: user.id,
      })
      .select()
      .single();

    if (codeError) {
      console.error('[Send Invite API] Code creation error:', codeError);
      if (codeError.code === '23505') {
        return NextResponse.json(
          { error: 'Code already exists' },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: codeError.message }, { status: 500 });
    }

    // Prepare email content
    const tierNames = {
      tier1: 'Starter',
      tier2: 'Professional',
      tier3: 'Enterprise',
    };

    const tierFeatures = {
      tier1: 'Content Forge, Mockup Generator & Social Media Posting',
      tier2: 'All Starter features plus CRM, Analytics, Knowledge Base & Blog',
      tier3: 'Full Platform Access including Email Campaigns, SMS, Bookings & AI Receptionist',
    };

    const senderName = profile.full_name || 'Jared';
    const signupUrl = `${APP_URL}/signup?code=${code}`;
    
    const expiryText = expiresInHours 
      ? `Valid for ${expiresInHours} hours` 
      : 'No expiration';

    // Build HTML email - SINGLE CTA VERSION
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're Invited to GreenLine365!</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a; color: #ffffff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="100%" max-width="600" cellpadding="0" cellspacing="0" style="background-color: #1a1a1a; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #39FF14 0%, #0CE293 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 32px; font-weight: bold; color: #000000;">
                🎉 You're Invited!
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="font-size: 16px; line-height: 1.6; color: #ffffff; margin: 0 0 20px 0;">
                Hi there,
              </p>
              
              <p style="font-size: 16px; line-height: 1.6; color: #ffffff; margin: 0 0 20px 0;">
                <strong>${senderName}</strong> has invited you to join <strong>GreenLine365</strong>!
              </p>
              
              ${customMessage ? `
              <div style="background-color: rgba(57, 255, 20, 0.1); border-left: 3px solid #39FF14; padding: 15px 20px; margin: 20px 0; border-radius: 4px;">
                <p style="font-size: 14px; line-height: 1.6; color: #ffffff; margin: 0; font-style: italic;">
                  "${customMessage}"
                </p>
              </div>
              ` : ''}
              
              <!-- Access Code Box -->
              <div style="background-color: #0a0a0a; border: 1px solid rgba(57, 255, 20, 0.3); border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
                <p style="font-size: 12px; color: rgba(255, 255, 255, 0.6); margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 1px;">
                  Your Access Code
                </p>
                <p style="font-size: 32px; font-weight: bold; color: #39FF14; margin: 0; font-family: 'Courier New', monospace; letter-spacing: 2px;">
                  ${code}
                </p>
              </div>
              
              <!-- Benefits -->
              <div style="background-color: rgba(255, 255, 255, 0.05); border-radius: 8px; padding: 20px; margin: 20px 0;">
                <p style="font-size: 14px; color: rgba(255, 255, 255, 0.8); margin: 0 0 12px 0;">
                  <strong>This grants you:</strong>
                </p>
                <p style="font-size: 14px; color: #39FF14; margin: 0 0 8px 0;">
                  ✅ ${tierNames[tier]} Tier Access
                </p>
                <p style="font-size: 13px; color: rgba(255, 255, 255, 0.7); margin: 0; line-height: 1.5;">
                  ${tierFeatures[tier]}
                </p>
              </div>
              
              <!-- Expiration -->
              <p style="font-size: 13px; color: rgba(255, 255, 255, 0.6); margin: 20px 0; text-align: center;">
                ⏰ ${expiryText}
              </p>
              
              <!-- SINGLE CTA -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${signupUrl}" style="display: inline-block; background: linear-gradient(135deg, #39FF14 0%, #0CE293 100%); color: #000000; font-size: 16px; font-weight: bold; text-decoration: none; padding: 16px 40px; border-radius: 8px; box-shadow: 0 4px 12px rgba(57, 255, 20, 0.3);">
                  Click Here to Create Your Account →
                </a>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: rgba(255, 255, 255, 0.03); padding: 30px; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.1);">
              <p style="font-size: 16px; color: #ffffff; margin: 0 0 10px 0;">
                Welcome aboard!
              </p>
              <p style="font-size: 14px; color: rgba(255, 255, 255, 0.6); margin: 0;">
                - The GreenLine365 Team
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    // Plain text version - SINGLE CTA
    const plainContent = `
You're Invited to GreenLine365!

Hi there,

${senderName} has invited you to join GreenLine365!

${customMessage ? `"${customMessage}"\n\n` : ''}

Your Access Code: ${code}

This grants you:
✅ ${tierNames[tier]} Tier Access
${tierFeatures[tier]}

⏰ ${expiryText}

Click here to create your account: ${signupUrl}

Welcome aboard!
- The GreenLine365 Team
    `.trim();

    // Send email via SendGrid
    if (!SENDGRID_API_KEY) {
      return NextResponse.json(
        { 
          success: true, 
          code: accessCode,
          warning: 'Code created but email not sent (SendGrid not configured)'
        }
      );
    }

    const emailResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ 
          to: [{ email: recipientEmail }],
          subject: "You're Invited to GreenLine365!"
        }],
        from: { 
          email: SENDER_EMAIL, 
          name: 'GreenLine365' 
        },
        content: [
          { type: 'text/plain', value: plainContent },
          { type: 'text/html', value: htmlContent },
        ],
      }),
    });

    if (!emailResponse.ok) {
      const error = await emailResponse.text();
      console.error('[Send Invite API] SendGrid error:', error);
      return NextResponse.json(
        { 
          success: true, 
          code: accessCode,
          warning: 'Code created but email failed to send',
          emailError: error
        }
      );
    }

    return NextResponse.json({
      success: true,
      code: accessCode,
      emailSent: true,
      recipient: recipientEmail,
    });

  } catch (error: any) {
    console.error('[Send Invite API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
