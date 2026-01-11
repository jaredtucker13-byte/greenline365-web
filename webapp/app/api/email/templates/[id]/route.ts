import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET /api/email/templates/[id] - Get single template
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }
    
    return NextResponse.json({ template: data });
  } catch (error: any) {
    console.error('Error fetching template:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch template' },
      { status: 500 }
    );
  }
}

// PUT /api/email/templates/[id] - Update template
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, category, subject, preview_text, html_content, plain_content, variables, is_active } = body;
    
    const updateData: any = { updated_at: new Date().toISOString() };
    
    if (name !== undefined) {
      updateData.name = name;
      updateData.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (subject !== undefined) updateData.subject = subject;
    if (preview_text !== undefined) updateData.preview_text = preview_text;
    if (html_content !== undefined) updateData.html_content = html_content;
    if (plain_content !== undefined) updateData.plain_content = plain_content;
    if (variables !== undefined) updateData.variables = variables;
    if (is_active !== undefined) updateData.is_active = is_active;
    
    const { data, error } = await supabase
      .from('email_templates')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return NextResponse.json({ template: data });
  } catch (error: any) {
    console.error('Error updating template:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update template' },
      { status: 500 }
    );
  }
}

// DELETE /api/email/templates/[id] - Delete template
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const { error } = await supabase
      .from('email_templates')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting template:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete template' },
      { status: 500 }
    );
  }
}
