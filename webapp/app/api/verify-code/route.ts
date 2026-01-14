/**
 * Verify by Code API
 * 
 * POST /api/verify-code
 * Body: { email, code }
 * 
 * Verifies a user's email using the 6-digit code
 * Also syncs verified leads to the CRM automatically
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Sync verified lead to CRM - minimal fields for compatibility
async function syncToCRM(entry: any): Promise<{ success: boolean; error?: string }> {
  console.log('[CRM Sync] Starting sync for:', entry.email);
  
  try {
    // First check if crm_leads table exists by trying a simple query
    const { error: tableCheckError } = await supabase
      .from('crm_leads')
      .select('id')
      .limit(1);
    
    if (tableCheckError) {
      console.error('[CRM Sync] Table check failed:', tableCheckError.message);
      return { success: false, error: `Table error: ${tableCheckError.message}` };
    }

    // Check if lead already exists in CRM
    const { data: existingLead, error: findError } = await supabase
      .from('crm_leads')
      .select('id, status')
      .eq('email', entry.email)
      .maybeSingle(); // Use maybeSingle to avoid error when not found

    if (findError) {
      console.error('[CRM Sync] Find error:', findError.message);
    }

    if (existingLead) {
      // Update existing lead
      const { error: updateError } = await supabase
        .from('crm_leads')
        .update({
          status: 'verified',
          verified_at: new Date().toISOString(),
        })
        .eq('id', existingLead.id);
      
      if (updateError) {
        console.error('[CRM Sync] Update failed:', updateError.message);
        return { success: false, error: updateError.message };
      }
      
      console.log('[CRM Sync] Updated existing lead:', entry.email);
      return { success: true };
    } else {
      // Create new CRM lead - using only basic columns that should exist
      const insertData: Record<string, any> = {
        email: entry.email,
        status: 'verified',
        verified_at: new Date().toISOString(),
        source: 'waitlist',
      };
      
      // Add optional fields if they exist in entry
      if (entry.name) insertData.name = entry.name;
      if (entry.company) insertData.company = entry.company;
      
      console.log('[CRM Sync] Attempting insert with data:', JSON.stringify(insertData));
      
      const { data: newLead, error: insertError } = await supabase
        .from('crm_leads')
        .insert(insertData)
        .select()
        .single();

      if (insertError) {
        console.error('[CRM Sync] Insert failed:', insertError.message, insertError.details, insertError.hint);
        return { success: false, error: insertError.message };
      }
      
      console.log('[CRM Sync] Created new lead:', entry.email, 'ID:', newLead?.id);
      return { success: true };
    }
  } catch (err: any) {
    console.error('[CRM Sync] Unexpected error:', err.message);
    return { success: false, error: err.message };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json({ error: 'Email and code are required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find the waitlist entry
    const { data: entry, error: findError } = await supabase
      .from('waitlist_submissions')
      .select('*')
      .eq('email', normalizedEmail)
      .single();

    if (findError || !entry) {
      return NextResponse.json({ error: 'Email not found. Please sign up first.' }, { status: 404 });
    }

    // Check if already verified
    if (entry.verified) {
      return NextResponse.json({ 
        success: true, 
        message: 'Email already verified!',
        alreadyVerified: true 
      });
    }

    // Check if code matches
    if (entry.verification_code !== code) {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
    }

    // Check if expired
    if (entry.verification_expires && new Date(entry.verification_expires) < new Date()) {
      return NextResponse.json({ error: 'Verification code has expired. Please sign up again.' }, { status: 400 });
    }

    // Mark as verified in waitlist
    const { error: updateError } = await supabase
      .from('waitlist_submissions')
      .update({ 
        verified: true,
        status: 'verified',
        verified_at: new Date().toISOString(),
        verification_token: null, // Clear token after use
        verification_code: null,  // Clear code after use
      })
      .eq('email', normalizedEmail);

    if (updateError) {
      console.error('[Verify Code] Update error:', updateError);
      return NextResponse.json({ error: 'Failed to verify email' }, { status: 500 });
    }

    // Sync to CRM automatically
    const crmResult = await syncToCRM({ ...entry, email: normalizedEmail });
    
    console.log('[Verify Code] CRM sync result:', crmResult);

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully! Welcome to GreenLine365.',
      crmSynced: crmResult.success,
      crmError: crmResult.error || null,
    });

  } catch (error: any) {
    console.error('[Verify Code] Error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
