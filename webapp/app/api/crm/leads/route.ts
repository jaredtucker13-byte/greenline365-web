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
    
    // Auth check - get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const isAdmin = ADMIN_EMAILS.includes(user.email || '');
    
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
    
    // Non-admin users only see their own leads
    if (!isAdmin) {
      query = query.eq('user_id', user.id);
    }
    
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
    
    // Get stats - scoped to user unless admin
    let statsQuery = supabase
      .from('crm_leads')
      .select('status');
    
    if (!isAdmin) {
      statsQuery = statsQuery.eq('user_id', user.id);
    }
    
    const { data: allLeads } = await statsQuery;
    
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
    
    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    
    const {
      email,
      name,
      phone,
      company,
      source = 'manual',
      value,
      tags = [],
      notes,
      status = 'new',
    } = body;
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    
    const normalizedEmail = email.toLowerCase().trim();
    
    // Check for existing lead - scoped to this user
    const { data: existing } = await supabase
      .from('crm_leads')
      .select('id')
      .eq('email', normalizedEmail)
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (existing) {
      return NextResponse.json({ error: 'Lead with this email already exists', existingId: existing.id }, { status: 409 });
    }
    
    const now = new Date().toISOString();
    
    // Create lead - associate with current user
    const { data: lead, error } = await supabase
      .from('crm_leads')
      .insert({
        user_id: user.id,
        email: normalizedEmail,
        name: name || null,
        phone: phone || null,
        company: company || null,
        source: source || 'manual',
        value: value || null,
        tags: tags || [],
        notes: notes || null,
        status: status || 'new',
        first_contact_at: now,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();
    
    if (error) {
      console.error('[CRM] Create error:', error);
      return NextResponse.json({ error: 'Failed to create lead', details: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ lead }, { status: 201 });
  } catch (error: any) {
    console.error('[CRM] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Skip admin check for now - allow updates
    // TODO: Re-enable admin check once auth is fully working
    
    const body = await request.json();
    const { id, ...updates } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 });
    }
    
    // Build update object - only use columns that exist
    const dbUpdates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    
    // Map fields that exist in the actual schema
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
    if (updates.company !== undefined) dbUpdates.company = updates.company;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.source !== undefined) dbUpdates.source = updates.source;
    if (updates.value !== undefined) dbUpdates.value = updates.value;
    if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
    if (updates.assigned_to !== undefined) dbUpdates.assigned_to = updates.assigned_to;
    if (updates.metadata !== undefined) dbUpdates.metadata = updates.metadata;
    
    // Handle status changes with timestamps
    if (updates.status === 'converted' && !updates.converted_at) {
      dbUpdates.converted_at = new Date().toISOString();
    }
    if (updates.status === 'lost' && !updates.lost_at) {
      dbUpdates.lost_at = new Date().toISOString();
      if (updates.lost_reason) dbUpdates.lost_reason = updates.lost_reason;
    }
    if (updates.status === 'contacted' || updates.status === 'qualified') {
      dbUpdates.last_contact_at = new Date().toISOString();
    }
    
    const { data: lead, error } = await supabase
      .from('crm_leads')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('[CRM] Update error:', error);
      return NextResponse.json({ error: 'Failed to update lead', details: error.message }, { status: 500 });
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
