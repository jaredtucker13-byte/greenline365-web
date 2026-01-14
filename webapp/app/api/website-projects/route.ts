/**
 * Website Builder Projects API
 * 
 * GET - List all projects for the user
 * POST - Create a new project
 * PUT - Update a project
 * DELETE - Delete a project
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: projects, error } = await supabase
      .from('website_projects')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('[Projects] Fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
    }

    return NextResponse.json({ projects: projects || [] });
  } catch (error: any) {
    console.error('[Projects] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, sourceUrl, sourceType } = body;

    if (!name) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }

    const { data: project, error } = await supabase
      .from('website_projects')
      .insert({
        user_id: user.id,
        name,
        description: description || null,
        source_url: sourceUrl || null,
        source_type: sourceType || 'scratch', // 'url', 'upload', 'scratch'
        status: 'draft',
        sections: [],
        settings: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('[Projects] Create error:', error);
      return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
    }

    return NextResponse.json({ project }, { status: 201 });
  } catch (error: any) {
    console.error('[Projects] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, description, sections, settings, status, generatedCode, previewImage } = body;

    if (!id) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (sections !== undefined) updateData.sections = sections;
    if (settings !== undefined) updateData.settings = settings;
    if (status !== undefined) updateData.status = status;
    if (generatedCode !== undefined) updateData.generated_code = generatedCode;
    if (previewImage !== undefined) updateData.preview_image = previewImage;

    const { data: project, error } = await supabase
      .from('website_projects')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('[Projects] Update error:', error);
      return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
    }

    return NextResponse.json({ project });
  } catch (error: any) {
    console.error('[Projects] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('website_projects')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('[Projects] Delete error:', error);
      return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Projects] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
