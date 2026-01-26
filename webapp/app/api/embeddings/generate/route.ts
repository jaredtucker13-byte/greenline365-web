import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Embedding Generation API
 * 
 * POST /api/embeddings/generate - Generate vector embedding for text
 * Uses OpenRouter with text-embedding-3-small model
 */

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';

export async function POST(request: NextRequest) {
  try {
    const { text, node_type, metadata = {}, customer_phone, business_id } = await request.json();
    
    if (!text) {
      return NextResponse.json({ error: 'text is required' }, { status: 400 });
    }
    
    // Generate embedding using OpenAI via OpenRouter
    const embeddingResponse = await fetch('https://openrouter.ai/api/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://greenline365.com',
        'X-Title': 'GreenLine365 Context Graph'
      },
      body: JSON.stringify({
        model: 'openai/text-embedding-3-small',
        input: text
      })
    });

    if (!embeddingResponse.ok) {
      const error = await embeddingResponse.text();
      console.error('[Embeddings] OpenRouter error:', error);
      return NextResponse.json({ 
        error: 'Failed to generate embedding',
        details: error 
      }, { status: 500 });
    }

    const embeddingData = await embeddingResponse.json();
    const embedding = embeddingData.data[0].embedding;

    // Store in context_nodes table
    const supabase = await createClient();
    const { data: node, error: nodeError } = await supabase
      .from('context_nodes')
      .insert({
        content: text,
        node_type: node_type || 'general',
        metadata,
        embedding,
        customer_phone,
        business_id
      })
      .select()
      .single();

    if (nodeError) {
      return NextResponse.json({ 
        error: 'Failed to store node',
        details: nodeError.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      node_id: node.id,
      embedding_dimensions: embedding.length,
      node_type: node.node_type
    });

  } catch (error: any) {
    console.error('[Embeddings] Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to generate embedding' 
    }, { status: 500 });
  }
}
