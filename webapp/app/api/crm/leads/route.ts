/**
 * CRM Leads API
 * 
 * GET - List leads with filtering, sorting, pagination
 * POST - Create a new lead
 * PUT - Update a lead
 * DELETE - Delete/archive a lead
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Allowed admin emails (should match your admin list)
const ADMIN_EMAILS = [
  'greenline365help@gmail.com',
  'admin@greenline365.com',
];

async function checkAdmin(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  return ADMIN_EMAILS.includes(user.email || '');
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Skip admin check for now - allow viewing leads
    // TODO: Re-enable admin check once auth is fully working
    
    const { searchParams } = new URL(request.url);
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;
    
    // Filters
    const status = searchParams.get('status');
    const source = searchParams.get('source');
    const search = searchParams.get('search');
    
    // Sorting
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    // Build query - only select columns that exist in the actual table
    let query = supabase
      .from('crm_leads')
      .select('id, user_id, email, name, phone, company, status, source, value, first_contact_at, last_contact_at, converted_at, lost_at, lost_reason, tags, notes, assigned_to, metadata, created_at, updated_at', { count: 'exact' });
    
    // Apply filters
    if (status) {
      if (status.includes(',')) {
        query = query.in('status', status.split(','));
      } else {
        query = query.eq('status', status);
      }
    }
    
    if (source) query = query.eq('source', source);
    
    if (search) {
      query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%,company.ilike.%${search}%`);
    }
    
    // Apply sorting and pagination
    query = query
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1);
    
    const { data: leads, error, count } = await query;
    
    if (error) {
      console.error('[CRM] Fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch leads', details: error.message }, { status: 500 });
    }
    
    // Get stats
    const { data: allLeads } = await supabase
      .from('crm_leads')
      .select('status');
    
    const stats: Record<string, number> = {};
    allLeads?.forEach((lead: any) => {
      const s = lead.status || 'unknown';
      stats[s] = (stats[s] || 0) + 1;
    });
    
    return NextResponse.json({
      leads: leads || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
      stats,
    });
  } catch (error: any) {
    console.error('[CRM] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    
    const {
      email,
      name,
      phone,
      company,
      role,
      country,
      source = 'manual',
      sourceDetail,
      interestType,
      desiredPlan,
      useCase,
      companySize,
      priority = 'medium',
      tags = [],
      notes,
      newsletterOptIn = false,
      utmSource,
      utmMedium,
      utmCampaign,
    } = body;
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    
    const normalizedEmail = email.toLowerCase().trim();
    
    // Check for existing lead
    const { data: existing } = await supabase
      .from('crm_leads')
      .select('id')
      .eq('email', normalizedEmail)
      .single();
    
    if (existing) {
      return NextResponse.json({ error: 'Lead with this email already exists', existingId: existing.id }, { status: 409 });
    }
    
    // Create lead
    const { data: lead, error } = await supabase
      .from('crm_leads')
      .insert({
        email: normalizedEmail,
        name,
        phone,
        company,
        role,
        country,
        source,
        source_detail: sourceDetail,
        interest_type: interestType,
        desired_plan: desiredPlan,
        use_case: useCase,
        company_size: companySize,
        priority,
        tags,
        notes,
        newsletter_opt_in: newsletterOptIn,
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign,
        status: 'new',
        consent_given: true,
        consent_timestamp: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (error) {
      console.error('[CRM] Create error:', error);
      return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 });
    }
    
    // Log activity
    await supabase.from('crm_lead_activities').insert({
      lead_id: lead.id,
      activity_type: 'lead_created',
      activity_data: { source, email: normalizedEmail },
    });
    
    return NextResponse.json({ lead }, { status: 201 });
  } catch (error: any) {
    console.error('[CRM] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    if (!await checkAdmin(supabase)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { id, ...updates } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 });
    }
    
    // Map camelCase to snake_case
    const dbUpdates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    
    const fieldMap: Record<string, string> = {
      name: 'name',
      phone: 'phone',
      company: 'company',
      role: 'role',
      country: 'country',
      status: 'status',
      priority: 'priority',
      tags: 'tags',
      notes: 'notes',
      interestType: 'interest_type',
      desiredPlan: 'desired_plan',
      useCase: 'use_case',
      companySize: 'company_size',
      emailOptOut: 'email_opt_out',
      newsletterOptIn: 'newsletter_opt_in',
      leadScore: 'lead_score',
      ownerId: 'owner_id',
    };
    
    for (const [key, value] of Object.entries(updates)) {
      const dbField = fieldMap[key] || key;
      if (value !== undefined) {
        dbUpdates[dbField] = value;
      }
    }
    
    // Handle status changes with timestamps
    if (updates.status === 'verified' && !updates.verifiedAt) {
      dbUpdates.verified_at = new Date().toISOString();
    }
    if (updates.status === 'invited') {
      dbUpdates.invited_at = new Date().toISOString();
    }
    if (updates.status === 'onboarded') {
      dbUpdates.onboarded_at = new Date().toISOString();
    }
    if (updates.status === 'converted') {
      dbUpdates.converted_at = new Date().toISOString();
    }
    if (updates.status === 'archived') {
      dbUpdates.archived_at = new Date().toISOString();
    }
    
    const { data: lead, error } = await supabase
      .from('crm_leads')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('[CRM] Update error:', error);
      return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 });
    }
    
    // Log activity
    if (updates.status) {
      await supabase.from('crm_lead_activities').insert({
        lead_id: id,
        activity_type: 'status_change',
        activity_data: { newStatus: updates.status },
      });
    }
    
    return NextResponse.json({ lead });
  } catch (error: any) {
    console.error('[CRM] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    if (!await checkAdmin(supabase)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const action = searchParams.get('action') || 'archive'; // archive or delete
    
    if (!id) {
      return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 });
    }
    
    if (action === 'delete') {
      const { error } = await supabase
        .from('crm_leads')
        .delete()
        .eq('id', id);
      
      if (error) {
        return NextResponse.json({ error: 'Failed to delete lead' }, { status: 500 });
      }
    } else {
      // Archive instead of delete
      const { error } = await supabase
        .from('crm_leads')
        .update({
          status: 'archived',
          archived_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
      
      if (error) {
        return NextResponse.json({ error: 'Failed to archive lead' }, { status: 500 });
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[CRM] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
