import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/admin/generate-a2p-package
 *
 * AI-generates a complete A2P 10DLC campaign package from the tenant's intake blueprint.
 * Returns: campaign description, message samples, opt-in info, privacy policy URL suggestion.
 *
 * The generated content is stored in the a2p_registrations table and displayed
 * in the admin A2P compliance portal for copy-paste into Twilio Console.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';

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

    // Build the prompt for AI generation
    const businessName = tenant.business_name;
    const industry = tenant.industry || 'service business';
    const services = tenant.services || [];
    const ownerName = tenant.owner_name || '';
    const website = tenant.website_url || '';
    const agentName = tenant.agent_name || 'Grace';

    const servicesText = Array.isArray(services)
      ? services.map((s: any) => typeof s === 'string' ? s : s.name).join(', ')
      : String(services);

    const prompt = `You are a compliance writer for GreenLine365, a voice AI booking platform.
Based on the following client data, generate a complete Twilio A2P 10DLC campaign package.

Client Info:
- Business Name: ${businessName}
- Industry: ${industry}
- Services: ${servicesText}
- Owner: ${ownerName}
- Website: ${website || 'none provided'}
- AI Agent Name: ${agentName}

The business sends automated SMS messages to customers who have booked or inquired about services via phone call with our AI voice agent. All recipients have provided verbal consent during the booking call or opted in via web form.

Generate the following in JSON format:
{
  "campaign_description": "150-200 word factual description of what messages will be sent and why. No marketing language.",
  "message_samples": [
    "Sample 1: Appointment confirmation (under 160 chars, include STOP opt-out)",
    "Sample 2: 24-hour reminder (under 160 chars, include STOP)",
    "Sample 3: After-hours / callback (under 160 chars, include STOP)",
    "Sample 4: Post-service follow-up (under 160 chars, include STOP)",
    "Sample 5: Emergency service alert (under 160 chars, include STOP)"
  ],
  "opt_in_method": "2 sentence description of how customers opt in to receive messages",
  "opt_in_message": "Under 100 chars - the message sent when they opt in",
  "privacy_policy_url_suggestion": "Suggested URL path for their privacy policy page"
}

IMPORTANT: Every message sample MUST include "Reply STOP to unsubscribe" or similar opt-out language.
IMPORTANT: Use the actual business name in all samples.
Return ONLY valid JSON, no markdown.`;

    let generatedPackage: any;

    if (OPENROUTER_API_KEY) {
      // Use OpenRouter (Claude/GPT) to generate
      const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'anthropic/claude-sonnet-4-5-20250929',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1500,
          temperature: 0.3,
        }),
      });

      if (!aiResponse.ok) {
        throw new Error(`AI generation failed: ${await aiResponse.text()}`);
      }

      const aiResult = await aiResponse.json();
      const content = aiResult.choices?.[0]?.message?.content || '';

      // Parse the JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        generatedPackage = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('AI did not return valid JSON');
      }
    } else {
      // Fallback: generate templates without AI
      generatedPackage = generateFallbackPackage(businessName, industry, servicesText, agentName, website);
    }

    // Upsert into a2p_registrations table
    const { data: existing } = await supabase
      .from('a2p_registrations')
      .select('id')
      .eq('tenant_id', tenant_id)
      .single();

    const a2pData = {
      tenant_id,
      legal_business_name: businessName,
      business_website: website,
      industry_vertical: industry,
      campaign_description: generatedPackage.campaign_description,
      message_samples: generatedPackage.message_samples,
      opt_in_method: generatedPackage.opt_in_method,
      opt_in_message: generatedPackage.opt_in_message,
      privacy_policy_url: generatedPackage.privacy_policy_url_suggestion || `https://greenline365.com/privacy/${slugify(businessName)}`,
      contact_name: ownerName,
    };

    if (existing) {
      await supabase
        .from('a2p_registrations')
        .update(a2pData)
        .eq('id', existing.id);
    } else {
      await supabase
        .from('a2p_registrations')
        .insert(a2pData);
    }

    return NextResponse.json({
      success: true,
      package: generatedPackage,
      tenant_id,
      message: `A2P package generated for ${businessName}. Review in the admin portal.`,
    });

  } catch (error: any) {
    console.error('[Generate A2P] Error:', error);
    return NextResponse.json(
      { error: error.message, success: false },
      { status: 500 }
    );
  }
}

function generateFallbackPackage(
  businessName: string,
  industry: string,
  services: string,
  agentName: string,
  website: string
) {
  return {
    campaign_description: `${businessName} sends automated SMS messages to customers who have booked or inquired about ${industry} services. Message types include: appointment confirmations with date, time, and provider details; 24-hour appointment reminders; post-service follow-up and satisfaction requests; after-hours callback notifications when customers call outside business hours; and emergency service alerts for urgent requests. All recipients have provided verbal consent during a phone call booking with our AI voice assistant (${agentName}) or have opted in via the business website. Messages are transactional in nature and directly related to services the customer has requested or booked. The business offers: ${services}. No marketing or promotional messages are sent without explicit additional consent.`,
    message_samples: [
      `Hi {Name}, your ${industry} appointment with ${businessName} is confirmed for {Date} at {Time}. Reply STOP to unsubscribe.`,
      `Reminder: ${businessName} arrives tomorrow at {Time} for your {Service}. Reply RESCHEDULE to change or STOP to opt out.`,
      `Hi {Name}, ${businessName} missed your call. Reply BOOK to schedule or call us at {Phone}. Reply STOP to unsubscribe.`,
      `Thanks for choosing ${businessName}! How was your service? We'd love your feedback. Reply STOP to unsubscribe.`,
      `URGENT: ${businessName} received your emergency request. A team member will call within 15 minutes. Reply STOP to opt out.`,
    ],
    opt_in_method: `Customers provide verbal consent during phone call booking with the AI voice assistant. Additionally, customers can opt in via the appointment booking form on the business website.`,
    opt_in_message: `You'll receive SMS updates about your ${businessName} appointment. Reply STOP to unsubscribe.`,
    privacy_policy_url_suggestion: website
      ? `${website}/privacy`
      : `https://greenline365.com/privacy/${slugify(businessName)}`,
  };
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
