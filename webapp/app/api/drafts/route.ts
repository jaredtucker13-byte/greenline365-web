import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ============================================
// GET - Fetch all drafts for a user
// ============================================
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status') || 'draft'; // 'draft', 'scheduled', 'published'
    
    // Build query - don't require userId since we're demoing
    let query = supabase
      .from('scheduled_content')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false })
      .limit(20);

    // Add userId filter if provided and not demo
    if (userId && userId !== 'demo-user') {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch drafts', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      drafts: data || [],
      count: data?.length || 0
    });

  } catch (error) {
    console.error('GET drafts error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// ============================================
// POST - Save a new draft or scheduled content
// ============================================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    const {
      userId,
      title,
      contentType, // 'photo', 'product', 'blog'
      contentData, // Full content object (caption, keywords, hashtags, etc.)
      status = 'draft', // 'draft', 'scheduled', 'published'
      scheduledAt,
      platforms = ['instagram'],
    } = body;

    if (!title && !contentData?.caption) {
      return NextResponse.json({ error: 'Title or content is required' }, { status: 400 });
    }

    // Map to the actual table schema
    const insertData: Record<string, unknown> = {
      user_id: userId !== 'demo-user' ? userId : null,
      title: title || contentData?.title || 'Untitled Draft',
      description: contentData?.caption || contentData?.productDescription || '',
      content_type: contentType || 'photo',
      event_type: 'content',
      scheduled_date: scheduledAt ? new Date(scheduledAt).toISOString() : new Date().toISOString(),
      platforms: platforms || [],
      hashtags: contentData?.hashtags 
        ? [contentData.hashtags.brand, contentData.hashtags.local, ...(contentData.hashtags.optional || [])].filter(Boolean)
        : [],
      image_url: contentData?.imageUrl || null,
      status,
      color: contentType === 'blog' ? '#8B5CF6' : contentType === 'product' ? '#F59E0B' : '#0CE293',
      metadata: {
        keywords: contentData?.keywords || [],
        blogContent: contentData?.blogContent || null,
        productDescription: contentData?.productDescription || null,
        fullContentData: contentData,
      },
    };

    const { data, error } = await supabase
      .from('scheduled_content')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ error: 'Failed to save draft', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: status === 'draft' ? 'Draft saved successfully' : 'Content scheduled successfully',
      draft: data
    });

  } catch (error) {
    console.error('POST draft error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// ============================================
// PUT - Update an existing draft
// ============================================
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    
    const {
      id,
      userId,
      title,
      contentType,
      contentData,
      status,
      scheduledAt,
      platforms,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (title !== undefined) updateData.title = title;
    if (contentType !== undefined) updateData.content_type = contentType;
    if (status !== undefined) updateData.status = status;
    if (scheduledAt !== undefined) updateData.scheduled_date = scheduledAt ? new Date(scheduledAt).toISOString() : null;
    if (platforms !== undefined) updateData.platforms = platforms;
    
    if (contentData !== undefined) {
      updateData.description = contentData?.caption || contentData?.productDescription || '';
      updateData.image_url = contentData?.imageUrl || null;
      updateData.hashtags = contentData?.hashtags 
        ? [contentData.hashtags.brand, contentData.hashtags.local, ...(contentData.hashtags.optional || [])].filter(Boolean)
        : [];
      updateData.metadata = {
        keywords: contentData?.keywords || [],
        blogContent: contentData?.blogContent || null,
        productDescription: contentData?.productDescription || null,
        fullContentData: contentData,
      };
    }

    let query = supabase
      .from('scheduled_content')
      .update(updateData)
      .eq('id', id);
    
    // Add userId filter if provided and not demo
    if (userId && userId !== 'demo-user') {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query.select().single();

    if (error) {
      console.error('Supabase update error:', error);
      return NextResponse.json({ error: 'Failed to update draft', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Draft updated successfully',
      draft: data
    });

  } catch (error) {
    console.error('PUT draft error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// ============================================
// DELETE - Delete a draft
// ============================================
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const userId = searchParams.get('userId');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    let query = supabase
      .from('scheduled_content')
      .delete()
      .eq('id', id);
    
    // Add userId filter if provided and not demo
    if (userId && userId !== 'demo-user') {
      query = query.eq('user_id', userId);
    }

    const { error } = await query;

    if (error) {
      console.error('Supabase delete error:', error);
      return NextResponse.json({ error: 'Failed to delete draft', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Draft deleted successfully'
    });

  } catch (error) {
    console.error('DELETE draft error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
