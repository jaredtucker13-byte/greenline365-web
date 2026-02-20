import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/admin/generate-privacy-policy
 *
 * Generates an A2P-compliant privacy policy HTML for a client.
 * Stores it in Supabase and updates the tenant's privacy_policy_url.
 *
 * The policy covers:
 * - What data is collected (name, phone, email, service history)
 * - How it's used (appointment booking, service reminders)
 * - SMS opt-in/opt-out instructions
 * - Contact information for privacy requests
 * - Third-party services disclosure (Cal.com, Twilio)
 *
 * Most small service businesses don't have a privacy policy page,
 * and A2P registration requires one. This generates it in under 60 seconds.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const { tenant_id } = await request.json();

    if (!tenant_id) {
      return NextResponse.json({ error: 'Missing tenant_id' }, { status: 400 });
    }

    // Fetch tenant data
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenant_id)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const businessName = tenant.business_name;
    const ownerName = tenant.owner_name || businessName;
    const ownerEmail = tenant.owner_email || '';
    const ownerPhone = tenant.owner_phone || tenant.transfer_phone || '';
    const website = tenant.website_url || '';
    const address = [tenant.address, tenant.city, tenant.state, tenant.zip_code].filter(Boolean).join(', ');
    const slug = slugify(businessName);
    const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const services = tenant.services || [];
    const servicesText = Array.isArray(services)
      ? services.map((s: any) => typeof s === 'string' ? s : s.name).join(', ')
      : String(services);

    // Generate the privacy policy HTML
    const html = generatePrivacyPolicyHTML({
      businessName,
      ownerName,
      ownerEmail,
      ownerPhone,
      website,
      address,
      servicesText,
      currentDate,
    });

    // Store in Supabase Storage
    const filePath = `privacy/${slug}.html`;
    const { error: uploadError } = await supabase.storage
      .from('public-assets')
      .upload(filePath, html, {
        contentType: 'text/html',
        upsert: true,
      });

    let policyUrl: string;

    if (uploadError) {
      // If storage bucket doesn't exist or upload fails, store as a data URL fallback
      console.error('[Privacy Policy] Upload error:', uploadError.message);
      // Store the HTML directly in the tenant record instead
      policyUrl = `https://www.greenline365.com/privacy/${slug}`;
    } else {
      const { data: publicUrl } = supabase.storage
        .from('public-assets')
        .getPublicUrl(filePath);
      policyUrl = publicUrl?.publicUrl || `https://www.greenline365.com/privacy/${slug}`;
    }

    // Update tenant record
    await supabase
      .from('tenants')
      .update({
        privacy_policy_url: policyUrl,
        privacy_policy_html: html,
      })
      .eq('id', tenant_id);

    // Also update the A2P registration if it exists
    await supabase
      .from('a2p_registrations')
      .update({ privacy_policy_url: policyUrl })
      .eq('tenant_id', tenant_id);

    return NextResponse.json({
      success: true,
      privacy_policy_url: policyUrl,
      slug,
      message: `Privacy policy generated for ${businessName}. URL: ${policyUrl}`,
    });

  } catch (error: any) {
    console.error('[Generate Privacy Policy] Error:', error);
    return NextResponse.json({ error: error.message, success: false }, { status: 500 });
  }
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

interface PolicyVars {
  businessName: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  website: string;
  address: string;
  servicesText: string;
  currentDate: string;
}

function generatePrivacyPolicyHTML(vars: PolicyVars): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Privacy Policy — ${vars.businessName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 720px; margin: 0 auto; padding: 40px 20px; color: #333; line-height: 1.7; }
    h1 { font-size: 28px; color: #111; margin-bottom: 8px; }
    h2 { font-size: 20px; color: #222; margin-top: 32px; border-bottom: 1px solid #eee; padding-bottom: 8px; }
    p { margin: 12px 0; }
    ul { padding-left: 24px; }
    li { margin: 6px 0; }
    .effective { color: #666; font-size: 14px; margin-bottom: 24px; }
    .contact-box { background: #f7f7f7; border: 1px solid #e0e0e0; border-radius: 8px; padding: 16px 20px; margin: 20px 0; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 13px; color: #999; }
  </style>
</head>
<body>
  <h1>Privacy Policy</h1>
  <p class="effective">${vars.businessName} — Effective ${vars.currentDate}</p>

  <p>${vars.businessName} ("we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your personal information when you interact with our services, including phone calls handled by our AI voice assistant, SMS text messages, and our website.</p>

  <h2>Information We Collect</h2>
  <p>We collect the following information when you contact us or book a service:</p>
  <ul>
    <li><strong>Contact Information:</strong> Your name, phone number, and email address</li>
    <li><strong>Service Information:</strong> The type of service you request, appointment dates and times, and any notes you provide about your service needs</li>
    <li><strong>Property Information:</strong> Your service address (to dispatch technicians or confirm location)</li>
    <li><strong>Communication Records:</strong> Call logs, including date, time, duration, and a summary of the conversation with our AI assistant</li>
    <li><strong>Booking History:</strong> Records of past appointments, services performed, and your preferences</li>
  </ul>

  <h2>How We Use Your Information</h2>
  <p>Your information is used exclusively for:</p>
  <ul>
    <li><strong>Booking and Scheduling:</strong> Creating, confirming, rescheduling, and managing your appointments</li>
    <li><strong>SMS Notifications:</strong> Sending appointment confirmations, reminders (typically 24 hours before your appointment), and post-service follow-ups</li>
    <li><strong>Service Delivery:</strong> Ensuring our team has the information needed to provide the services you requested</li>
    <li><strong>Customer Recognition:</strong> Providing a personalized experience when you call back — so you don't have to repeat your information each time</li>
    <li><strong>Service Improvement:</strong> Improving the quality and accuracy of our scheduling and customer communication</li>
  </ul>

  <h2>SMS Text Messages</h2>
  <p>By booking an appointment with ${vars.businessName}, you consent to receive transactional SMS messages related to your service, including:</p>
  <ul>
    <li>Appointment confirmations with date, time, and provider details</li>
    <li>24-hour appointment reminders</li>
    <li>Technician/provider arrival notifications</li>
    <li>Post-service follow-ups and satisfaction inquiries</li>
    <li>Emergency service alerts (if applicable)</li>
  </ul>
  <p><strong>Opt-Out:</strong> You may opt out of SMS messages at any time by replying <strong>STOP</strong> to any message. You may also text <strong>HELP</strong> for assistance. Standard message and data rates may apply. Message frequency varies based on your service activity.</p>
  <p>We do not send marketing or promotional SMS messages without your explicit additional consent.</p>

  <h2>AI Voice Assistant</h2>
  <p>Our phone line uses an AI voice assistant powered by GreenLine365 to answer calls, check availability, and book appointments on your behalf. The AI assistant:</p>
  <ul>
    <li>Collects only the information necessary to complete your booking</li>
    <li>Remembers your preferences for a better experience on future calls</li>
    <li>Does not store or access sensitive financial information (credit cards, bank accounts)</li>
    <li>Can transfer you to a human team member at any time upon request</li>
  </ul>

  <h2>How We Protect Your Information</h2>
  <p>We take reasonable measures to protect your personal information, including:</p>
  <ul>
    <li>Encrypted data storage using industry-standard protocols</li>
    <li>Access controls limiting who can view your information to authorized staff only</li>
    <li>Secure transmission of data between our systems</li>
    <li>Regular review of our security practices</li>
  </ul>

  <h2>Third-Party Services</h2>
  <p>We use the following third-party services to operate our booking and communication systems:</p>
  <ul>
    <li><strong>Cal.com:</strong> Calendar and scheduling platform</li>
    <li><strong>Twilio:</strong> SMS messaging delivery</li>
    <li><strong>GreenLine365:</strong> AI voice assistant and customer management platform</li>
  </ul>
  <p>These services process your data only as necessary to provide their services and are bound by their own privacy policies.</p>

  <h2>Data Retention</h2>
  <p>We retain your personal information for as long as you are an active customer and for a reasonable period afterward to fulfill any legal obligations. You may request deletion of your data at any time by contacting us.</p>

  <h2>Your Rights</h2>
  <p>You have the right to:</p>
  <ul>
    <li>Request access to the personal information we hold about you</li>
    <li>Request correction of inaccurate information</li>
    <li>Request deletion of your personal information</li>
    <li>Opt out of SMS communications at any time</li>
    <li>Request a human representative handle your call instead of the AI assistant</li>
  </ul>

  <h2>Contact Us</h2>
  <div class="contact-box">
    <p><strong>${vars.businessName}</strong></p>
    ${vars.address ? `<p>${vars.address}</p>` : ''}
    ${vars.ownerPhone ? `<p>Phone: ${vars.ownerPhone}</p>` : ''}
    ${vars.ownerEmail ? `<p>Email: ${vars.ownerEmail}</p>` : ''}
    ${vars.website ? `<p>Website: ${vars.website}</p>` : ''}
  </div>
  <p>For privacy-related inquiries, please contact ${vars.ownerName} at ${vars.ownerEmail || vars.ownerPhone || 'the information above'}.</p>

  <h2>Changes to This Policy</h2>
  <p>We may update this Privacy Policy from time to time. The effective date at the top of this page indicates when it was last revised. Continued use of our services after changes constitutes acceptance of the updated policy.</p>

  <div class="footer">
    <p>&copy; ${new Date().getFullYear()} ${vars.businessName}. All rights reserved.</p>
    <p>Powered by <a href="https://greenline365.com" style="color: #39FF14;">GreenLine365</a></p>
  </div>
</body>
</html>`;
}
