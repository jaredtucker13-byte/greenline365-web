/**
 * Unsubscribe API
 * 
 * POST /api/unsubscribe
 * Body: { email, list: 'waitlist' | 'newsletter' | 'marketing' | 'all', token? }
 * 
 * Handles unsubscribe requests from email links and the unsubscribe page.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { email, list = 'all', token } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    console.log('[Unsubscribe] Processing unsubscribe for:', normalizedEmail, 'from list:', list);

    const results: string[] = [];
    const errors: string[] = [];

    // Unsubscribe from waitlist
    if (list === 'waitlist' || list === 'all') {
      const { error } = await supabase
        .from('waitlist_submissions')
        .update({ 
          status: 'unsubscribed',
          unsubscribed_at: new Date().toISOString(),
        })
        .eq('email', normalizedEmail);

      if (error && !error.message.includes('0 rows')) {
        errors.push('waitlist');
      } else {
        results.push('waitlist');
      }
    }

    // Unsubscribe from newsletter
    if (list === 'newsletter' || list === 'all') {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .update({ 
          unsubscribed_at: new Date().toISOString(),
        })
        .eq('email', normalizedEmail);

      if (error && !error.message.includes('0 rows')) {
        errors.push('newsletter');
      } else {
        results.push('newsletter');
      }
    }

    // Unsubscribe from CRM/marketing (if they're a lead)
    if (list === 'marketing' || list === 'all') {
      const { error } = await supabase
        .from('crm_leads')
        .update({ 
          email_opt_out: true,
          updated_at: new Date().toISOString(),
        })
        .eq('email', normalizedEmail);

      if (error && !error.message.includes('0 rows')) {
        errors.push('marketing');
      } else {
        results.push('marketing');
      }
    }

    // Log the unsubscribe action
    try {
      await supabase
        .from('email_unsubscribes')
        .insert({
          email: normalizedEmail,
          list,
          unsubscribed_at: new Date().toISOString(),
          ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        });
    } catch (e) {
      // Ignore if table doesn't exist
    }

    console.log('[Unsubscribe] Successfully unsubscribed:', normalizedEmail);

    return NextResponse.json({
      success: true,
      message: `You've been unsubscribed from ${list === 'all' ? 'all GreenLine365 communications' : `our ${list}`}. We're sorry to see you go!`,
      unsubscribedFrom: results,
    });

  } catch (error: any) {
    console.error('[Unsubscribe] Error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
