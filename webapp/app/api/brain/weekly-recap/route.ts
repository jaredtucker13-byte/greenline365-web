/**
 * Brain Weekly Recap API
 * POST /api/brain/weekly-recap
 * 
 * Generates a weekly recap email with:
 * - Summary of all brain activity (thoughts captured, projects, people, ideas)
 * - Key metrics from the week (directory views, signups, reviews, campaign sends)
 * - AI-generated actionable steps for the coming week
 * - Sends via Gmail SMTP to the owner
 * 
 * Designed to be triggered every Sunday at 1:00 PM via cron
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/email/gmail-sender';
import { getCoreMarketingContext } from '@/lib/marketing-skills-loader';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OWNER_EMAIL = 'jared.tucker13@gmail.com';
const BIZ_ID = '4c8278a9-46a5-4621-bf3a-88fd03d71478';

export async function POST(request: NextRequest) {
  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const weekStart = oneWeekAgo.toISOString();

    // === GATHER ALL DATA ===

    // Brain data
    const [thoughts, projects, ideas, people, admin] = await Promise.all([
      supabase.from('brain_thoughts').select('*').eq('business_id', BIZ_ID).gte('created_at', weekStart).order('created_at', { ascending: false }),
      supabase.from('brain_projects').select('*').eq('business_id', BIZ_ID).eq('status', 'active'),
      supabase.from('brain_ideas').select('*').eq('business_id', BIZ_ID).gte('created_at', weekStart),
      supabase.from('brain_people').select('*').eq('business_id', BIZ_ID),
      supabase.from('brain_admin').select('*').eq('business_id', BIZ_ID).eq('completed', false),
    ]);

    // Directory metrics
    const [listings, reviews, campaigns, leads] = await Promise.all([
      supabase.from('directory_listings').select('id', { count: 'exact', head: true }),
      supabase.from('directory_feedback').select('*').gte('created_at', weekStart),
      supabase.from('email_campaigns').select('*').eq('status', 'active'),
      supabase.from('crm_leads').select('*').gte('created_at', weekStart),
    ]);

    // Email sends this week
    const { data: emailSends } = await supabase.from('email_sends')
      .select('status').gte('created_at', weekStart);

    const sentCount = emailSends?.filter(e => e.status === 'sent').length || 0;
    const failedCount = emailSends?.filter(e => e.status === 'failed').length || 0;

    // === BUILD CONTEXT FOR AI ===
    const weekData = {
      brain: {
        thoughts_captured: thoughts.data?.length || 0,
        active_projects: projects.data?.length || 0,
        new_ideas: ideas.data?.length || 0,
        people_tracked: people.data?.length || 0,
        pending_admin: admin.data?.length || 0,
        pending_tasks: (admin.data || []).map((t: any) => t.task).slice(0, 5),
        active_project_names: (projects.data || []).map((p: any) => p.title).slice(0, 5),
        recent_ideas: (ideas.data || []).map((i: any) => i.title).slice(0, 5),
      },
      directory: {
        total_listings: listings.count || 0,
        new_reviews: reviews.data?.length || 0,
        new_leads: leads.data?.length || 0,
      },
      campaigns: {
        active_campaigns: campaigns.data?.length || 0,
        emails_sent: sentCount,
        emails_failed: failedCount,
      },
    };

    // === GENERATE AI RECAP WITH OPUS 4.6 ===
    const marketingContext = getCoreMarketingContext();
    
    const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-opus-4.6',
        messages: [{
          role: 'system',
          content: `You are a strategic business advisor writing a weekly recap email for a business owner. Be concise, specific, and actionable. Use the marketing frameworks provided to inform your recommendations.

CRITICAL FORMATTING RULES:
- Output clean HTML only. No markdown. No asterisks. No hashtags.
- Use <h3> for section headers (not # or ##)
- Use <p> tags for paragraphs
- Use <ul><li> for lists
- Use <strong> for emphasis (not ** or __)
- Use <span style="color:#C9A96E"> for highlighting key numbers
- Keep paragraphs to 1-2 sentences max
- Use plenty of spacing between sections
- Write like you're texting a friend who runs a business — casual, direct, no corporate speak
${marketingContext}`,
        }, {
          role: 'user',
          content: `Generate a weekly recap for GreenLine365 (Florida business directory). Here's this week's data:\n\n${JSON.stringify(weekData, null, 2)}\n\nSections (use <h3> tags):\n1. Wins This Week\n2. The Numbers\n3. Needs Attention\n4. This Week's Game Plan (5 specific tasks, numbered)\n5. Big Picture Thought\n\nKeep it under 400 words. Output clean HTML only.`,
        }],
        max_tokens: 1000,
        temperature: 0.6,
      }),
    });

    const aiData = await aiResponse.json();
    const recapText = aiData.choices?.[0]?.message?.content || 'Recap generation failed.';

    // === BUILD EMAIL ===
    const today = new Date();
    const weekEndStr = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    const html = `
<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0a0a0a;color:#e0e0e0;">
<div style="max-width:640px;margin:0 auto;padding:40px 20px;">
  <div style="text-align:center;margin-bottom:24px;">
    <h1 style="color:#C9A96E;font-size:24px;margin:0;">GreenLine<span style="color:#fff;">365</span></h1>
    <p style="color:#666;font-size:12px;margin:4px 0 0;">Weekly Brain Recap — ${weekEndStr}</p>
  </div>

  <div style="background:#1a1a1a;border:1px solid #C9A96E30;border-radius:16px;padding:32px;">
    <!-- Quick Stats -->
    <div style="display:flex;gap:12px;margin-bottom:24px;text-align:center;">
      <div style="flex:1;background:#111;border-radius:8px;padding:12px;">
        <div style="color:#C9A96E;font-size:24px;font-weight:700;">${weekData.brain.thoughts_captured}</div>
        <div style="color:#666;font-size:11px;">Thoughts</div>
      </div>
      <div style="flex:1;background:#111;border-radius:8px;padding:12px;">
        <div style="color:#10B981;font-size:24px;font-weight:700;">${weekData.campaigns.emails_sent}</div>
        <div style="color:#666;font-size:11px;">Emails Sent</div>
      </div>
      <div style="flex:1;background:#111;border-radius:8px;padding:12px;">
        <div style="color:#3B82F6;font-size:24px;font-weight:700;">${weekData.directory.new_leads}</div>
        <div style="color:#666;font-size:11px;">New Leads</div>
      </div>
      <div style="flex:1;background:#111;border-radius:8px;padding:12px;">
        <div style="color:#F59E0B;font-size:24px;font-weight:700;">${weekData.brain.active_projects}</div>
        <div style="color:#666;font-size:11px;">Active Projects</div>
      </div>
    </div>

    <!-- AI Recap -->
    <div style="color:#ccc;font-size:14px;line-height:1.8;">${recapText}</div>
  </div>

  <div style="text-align:center;margin-top:24px;">
    <a href="https://greenline365.com/admin-v2" style="display:inline-block;background:linear-gradient(135deg,#C9A96E,#E6D8B5);color:#000;font-weight:700;font-size:14px;padding:12px 32px;border-radius:10px;text-decoration:none;">Open Command Center</a>
  </div>

  <div style="text-align:center;margin-top:20px;">
    <p style="color:#444;font-size:11px;">GreenLine365 Second Brain &middot; Weekly Recap</p>
  </div>
</div>
</body></html>`.trim();

    // === SEND EMAIL ===
    const sendResult = await sendEmail({
      to: OWNER_EMAIL,
      subject: `Weekly Recap — ${weekEndStr} | GreenLine365`,
      html,
    });

    return NextResponse.json({
      success: sendResult.success,
      recap: recapText,
      data: weekData,
      sent_to: OWNER_EMAIL,
      error: sendResult.error,
    });
  } catch (error: any) {
    console.error('[Weekly Recap] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
