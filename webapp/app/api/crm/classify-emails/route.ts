import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getServiceClient() {
  return createClient(supabaseUrl, supabaseServiceKey);
}

type ContactType = 'general_inbox' | 'owner_personal' | 'decision_maker' | 'marketing_team' | 'unknown';

interface ScrapedContact {
  name: string | null;
  email: string | null;
  role: string | null;
  source: string;
}

const GENERAL_PREFIXES = ['info', 'contact', 'hello', 'inquiries', 'inquiry', 'general', 'office', 'team', 'support', 'help', 'service', 'services', 'customerservice'];
const MARKETING_PREFIXES = ['marketing', 'sales', 'admin', 'advertising', 'pr', 'media', 'press', 'ads'];
const PERSONAL_DOMAINS = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'aol.com', 'icloud.com', 'me.com', 'live.com', 'msn.com', 'att.net', 'comcast.net', 'verizon.net', 'bellsouth.net'];

function classifyEmail(email: string): ContactType {
  if (!email) return 'unknown';
  const lower = email.toLowerCase();
  const local = lower.split('@')[0];
  const domain = lower.split('@')[1] || '';

  if (PERSONAL_DOMAINS.includes(domain)) return 'owner_personal';
  if (GENERAL_PREFIXES.includes(local)) return 'general_inbox';
  if (MARKETING_PREFIXES.includes(local)) return 'marketing_team';
  // Named emails on business domains are likely decision makers
  if (/^[a-z]+(\.[a-z]+)?$/.test(local) && !GENERAL_PREFIXES.includes(local)) return 'decision_maker';
  return 'general_inbox';
}

async function scrapeContactPage(websiteUrl: string): Promise<ScrapedContact[]> {
  const contacts: ScrapedContact[] = [];
  if (!websiteUrl) return contacts;

  const cheerio = await import('cheerio');

  // Common contact/about page paths to try
  const paths = ['/contact', '/about', '/contact-us', '/about-us', '/team', '/our-team'];
  const baseUrl = websiteUrl.replace(/\/$/, '');

  for (const path of paths) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(baseUrl + path, {
        signal: controller.signal,
        headers: { 'User-Agent': 'GreenLine365-Audit/1.0' },
        redirect: 'follow',
      });
      clearTimeout(timeout);

      if (!res.ok) continue;

      const html = await res.text();
      const $ = cheerio.load(html);

      // Extract emails from the page
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const foundEmails: string[] = html.match(emailRegex) || [];

      // Also check mailto: links
      $('a[href^="mailto:"]').each((_, el) => {
        const href = $(el).attr('href') || '';
        const mailto = href.replace('mailto:', '').split('?')[0].trim();
        if (mailto && !foundEmails.includes(mailto)) {
          foundEmails.push(mailto);
        }
      });

      // Deduplicate and filter out image/asset emails
      const cleanEmails = [...new Set(foundEmails)].filter(e =>
        !e.includes('.png') && !e.includes('.jpg') && !e.includes('.svg') &&
        !e.includes('example.com') && !e.includes('sentry') &&
        !e.includes('wixpress') && !e.includes('wordpress')
      );

      // Try to find names near emails
      for (const email of cleanEmails) {
        let name: string | null = null;
        let role: string | null = null;

        // Look for nearby text context
        const textContent = $('body').text();
        const local = email.split('@')[0];

        // Check if the local part looks like a name (e.g., "john.smith" or "jsmith")
        if (/^[a-z]+\.[a-z]+$/i.test(local)) {
          name = local.split('.').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        }

        // Try to detect role from surrounding context
        const rolePatterns = ['owner', 'founder', 'ceo', 'president', 'manager', 'director', 'vp', 'partner', 'proprietor'];
        const lowerText = textContent.toLowerCase();
        for (const rp of rolePatterns) {
          // Check if role word appears within ~200 chars of the email
          const emailIdx = lowerText.indexOf(email.toLowerCase());
          if (emailIdx >= 0) {
            const nearby = lowerText.substring(Math.max(0, emailIdx - 200), emailIdx + 200);
            if (nearby.includes(rp)) {
              role = rp.charAt(0).toUpperCase() + rp.slice(1);
              break;
            }
          }
        }

        contacts.push({
          name,
          email,
          role,
          source: path,
        });
      }

      // If we found emails, no need to check more pages
      if (contacts.length > 0) break;

    } catch {
      // Page doesn't exist or timed out — continue to next
      continue;
    }
  }

  return contacts;
}

/**
 * POST /api/crm/classify-emails
 * Classifies all CRM lead emails by type and scrapes websites for additional contacts.
 * Body: { batch_size?: number, scrape_websites?: boolean }
 */
export async function POST(request: NextRequest) {
  const supabase = getServiceClient();
  const body = await request.json();
  const { batch_size = 50, scrape_websites = true } = body;

  // Get leads that haven't been email-classified yet
  const { data: leads, error } = await supabase
    .from('crm_leads')
    .select('id, email, company, metadata, tags, notes')
    .order('created_at', { ascending: true })
    .limit(batch_size);

  if (error || !leads) {
    return NextResponse.json({ error: error?.message || 'No leads' }, { status: 500 });
  }

  const results = [];
  const stats = {
    general_inbox: 0,
    owner_personal: 0,
    decision_maker: 0,
    marketing_team: 0,
    unknown: 0,
    contacts_scraped: 0,
    additional_emails_found: 0,
  };

  for (const lead of leads) {
    const contactType = classifyEmail(lead.email);
    stats[contactType]++;

    // Parse website from metadata or notes
    let website = (lead.metadata as Record<string, string>)?.website || null;
    if (!website && lead.notes) {
      const webMatch = lead.notes.match(/Web:\s*(https?:\/\/[^\s|]+)/);
      if (webMatch) website = webMatch[1];
    }

    // Scrape for additional contacts if we only have a generic email
    let scrapedContacts: ScrapedContact[] = [];
    if (scrape_websites && website && contactType === 'general_inbox') {
      scrapedContacts = await scrapeContactPage(website);
      stats.contacts_scraped++;
      stats.additional_emails_found += scrapedContacts.length;
    }

    // Filter scraped contacts — keep only NEW emails different from the lead's existing email
    const newContacts = scrapedContacts.filter(c =>
      c.email && c.email.toLowerCase() !== (lead.email || '').toLowerCase()
    );

    // Build updated metadata
    const updatedMetadata = {
      ...(lead.metadata as Record<string, unknown> || {}),
      email_classification: {
        primary_email: lead.email,
        contact_type: contactType,
        classified_at: new Date().toISOString(),
      },
      additional_contacts: newContacts.length > 0 ? newContacts : undefined,
    };

    // Build updated tags
    const existingTags = lead.tags || [];
    const newTags = [...new Set([
      ...existingTags,
      `email_type_${contactType}`,
      ...(newContacts.length > 0 ? ['has_additional_contacts'] : []),
    ])];

    // Update the lead
    const { error: updateError } = await supabase
      .from('crm_leads')
      .update({
        metadata: updatedMetadata,
        tags: newTags,
        updated_at: new Date().toISOString(),
      })
      .eq('id', lead.id);

    results.push({
      id: lead.id,
      company: lead.company,
      primary_email: lead.email,
      contact_type: contactType,
      additional_contacts: newContacts,
      updated: !updateError,
    });
  }

  return NextResponse.json({
    summary: {
      total_processed: results.length,
      ...stats,
    },
    results,
  });
}

/**
 * GET /api/crm/classify-emails
 * Returns email classification stats for all leads.
 */
export async function GET() {
  const supabase = getServiceClient();

  const { data: leads, error } = await supabase
    .from('crm_leads')
    .select('email, tags, metadata')
    .limit(500);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const stats: Record<string, number> = {};
  let withAdditional = 0;

  for (const lead of (leads || [])) {
    const tags = lead.tags || [];
    const emailTag = tags.find((t: string) => t.startsWith('email_type_'));
    const type = emailTag ? emailTag.replace('email_type_', '') : 'unclassified';
    stats[type] = (stats[type] || 0) + 1;
    if (tags.includes('has_additional_contacts')) withAdditional++;
  }

  return NextResponse.json({
    total: leads?.length || 0,
    classification: stats,
    with_additional_contacts: withAdditional,
  });
}
