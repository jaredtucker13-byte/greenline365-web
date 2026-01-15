import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Knowledge Warehouse API (Multi-tenant)
 * Manages Layer 2 of the Dynamic Memory Bucket System
 * 
 * Actions:
 * - seed: Bulk add knowledge chunks for a business
 * - add: Add single knowledge chunk
 * - search: Search knowledge by query (text-based for now, vector later)
 * - list: List all knowledge by category
 * - delete: Remove a knowledge chunk
 */

interface KnowledgeChunk {
  category: 'services' | 'pricing' | 'faq' | 'products' | 'processes' | 'policies' | 'anti-knowledge';
  subcategory?: string;
  title?: string;
  content: string;
  source?: string;
  confidence?: number;
  priority?: number;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, businessId } = body;

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID required' }, { status: 400 });
    }

    // Verify user has access to this business
    const { data: access } = await supabase
      .from('user_businesses')
      .select('role')
      .eq('user_id', user.id)
      .eq('business_id', businessId)
      .single();

    if (!access) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    switch (action) {
      case 'seed':
        return seedKnowledge(supabase, user.id, businessId, body.chunks as KnowledgeChunk[]);
      case 'add':
        return addKnowledge(supabase, user.id, businessId, body.chunk as KnowledgeChunk);
      case 'search':
        return searchKnowledge(supabase, businessId, body.query, body.category);
      case 'list':
        return listKnowledge(supabase, businessId, body.category);
      case 'delete':
        return deleteKnowledge(supabase, businessId, body.id);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('[Knowledge API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function seedKnowledge(supabase: any, userId: string, businessId: string, chunks: KnowledgeChunk[]) {
  if (!chunks || !Array.isArray(chunks) || chunks.length === 0) {
    return NextResponse.json({ error: 'No chunks provided' }, { status: 400 });
  }

  const insertData = chunks.map(chunk => ({
    business_id: businessId,
    category: chunk.category,
    subcategory: chunk.subcategory,
    title: chunk.title,
    content: chunk.content,
    source: chunk.source || 'onboarding',
    confidence: chunk.confidence || 1.0,
    priority: chunk.priority || 5,
    is_active: true,
    created_by: userId,
  }));

  const { data, error } = await supabase
    .from('memory_knowledge_chunks')
    .insert(insertData)
    .select('id, category, title');

  if (error) {
    console.error('[Knowledge API] Seed error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ 
    success: true, 
    inserted: data.length,
    chunks: data 
  });
}

async function addKnowledge(supabase: any, userId: string, businessId: string, chunk: KnowledgeChunk) {
  if (!chunk || !chunk.content || !chunk.category) {
    return NextResponse.json({ error: 'Content and category required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('memory_knowledge_chunks')
    .insert({
      business_id: businessId,
      category: chunk.category,
      subcategory: chunk.subcategory,
      title: chunk.title,
      content: chunk.content,
      source: chunk.source || 'manual',
      confidence: chunk.confidence || 1.0,
      priority: chunk.priority || 5,
      is_active: true,
      created_by: userId,
    })
    .select('id, category, title')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, chunk: data });
}

async function searchKnowledge(supabase: any, businessId: string, query: string, category?: string) {
  if (!query) {
    return NextResponse.json({ error: 'Query required' }, { status: 400 });
  }

  let queryBuilder = supabase
    .from('memory_knowledge_chunks')
    .select('id, category, subcategory, title, content, priority')
    .eq('business_id', businessId)
    .eq('is_active', true)
    .ilike('content', `%${query}%`)
    .order('priority', { ascending: false })
    .limit(10);

  if (category) {
    queryBuilder = queryBuilder.eq('category', category);
  }

  const { data, error } = await queryBuilder;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ results: data });
}

async function listKnowledge(supabase: any, businessId: string, category?: string) {
  let queryBuilder = supabase
    .from('memory_knowledge_chunks')
    .select('id, category, subcategory, title, content, priority, created_at')
    .eq('business_id', businessId)
    .eq('is_active', true)
    .order('category')
    .order('priority', { ascending: false });

  if (category) {
    queryBuilder = queryBuilder.eq('category', category);
  }

  const { data, error } = await queryBuilder;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Group by category
  const grouped = data.reduce((acc: any, item: any) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});

  return NextResponse.json({ 
    total: data.length,
    byCategory: grouped,
    items: data 
  });
}

async function deleteKnowledge(supabase: any, businessId: string, id: string) {
  if (!id) {
    return NextResponse.json({ error: 'ID required' }, { status: 400 });
  }

  // Soft delete by setting is_active to false
  const { error } = await supabase
    .from('memory_knowledge_chunks')
    .update({ is_active: false })
    .eq('id', id)
    .eq('business_id', businessId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    return listKnowledge(supabase, user.id, category || undefined);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
