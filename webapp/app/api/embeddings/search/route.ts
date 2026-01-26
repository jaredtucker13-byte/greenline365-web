import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Semantic Search API
 * 
 * POST /api/embeddings/search - Search context graph using vector similarity
 * Returns relevant nodes + their connected relationships
 */

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';

export async function POST(request: NextRequest) {
  try {
    const { 
      query, 
      customer_phone,
      business_id,
      match_threshold = 0.7,
      match_count = 5,
      include_relationships = true,
      depth = 1
    } = await request.json();
    
    if (!query) {
      return NextResponse.json({ error: 'query is required' }, { status: 400 });
    }
    
    // Generate embedding for the search query
    const embeddingResponse = await fetch('https://openrouter.ai/api/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://greenline365.com',
        'X-Title': 'GreenLine365 Context Search'
      },
      body: JSON.stringify({
        model: 'openai/text-embedding-3-small',
        input: query
      })
    });

    if (!embeddingResponse.ok) {
      const error = await embeddingResponse.text();
      return NextResponse.json({ 
        error: 'Failed to generate query embedding',
        details: error 
      }, { status: 500 });
    }

    const embeddingData = await embeddingResponse.json();
    const queryEmbedding = embeddingData.data[0].embedding;
    
    const supabase = await createClient();

    // Use the match_context_nodes function for similarity search
    const { data: matchedNodes, error: searchError } = await supabase
      .rpc('match_context_nodes', {
        query_embedding: queryEmbedding,
        match_threshold,
        match_count,
        filter_business_id: business_id
      });

    if (searchError) {
      return NextResponse.json({ 
        error: 'Search failed',
        details: searchError.message 
      }, { status: 500 });
    }

    // If include_relationships, fetch connected nodes
    let enrichedResults = matchedNodes;
    
    if (include_relationships && matchedNodes.length > 0) {
      const nodeIds = matchedNodes.map((n: any) => n.id);
      
      // Get relationships (edges) for these nodes
      const { data: edges } = await supabase
        .from('context_edges')
        .select('*, source:context_nodes!source_node_id(id, content, node_type), target:context_nodes!target_node_id(id, content, node_type)')
        .or(`source_node_id.in.(${nodeIds.join(',')}),target_node_id.in.(${nodeIds.join(',')})`);

      enrichedResults = matchedNodes.map((node: any) => ({
        ...node,
        relationships: edges?.filter((e: any) => 
          e.source_node_id === node.id || e.target_node_id === node.id
        ) || []
      }));
    }

    // Update access counts
    const nodeIds = matchedNodes.map((n: any) => n.id);
    if (nodeIds.length > 0) {
      await supabase
        .from('context_nodes')
        .update({ 
          last_accessed_at: new Date().toISOString(),
          access_count: supabase.raw('access_count + 1')
        })
        .in('id', nodeIds);
    }

    return NextResponse.json({
      success: true,
      results: enrichedResults,
      query,
      match_count: matchedNodes.length,
      threshold: match_threshold
    });

  } catch (error: any) {
    console.error('[Semantic Search] Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Search failed' 
    }, { status: 500 });
  }
}
