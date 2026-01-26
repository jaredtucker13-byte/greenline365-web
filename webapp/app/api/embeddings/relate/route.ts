import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Context Graph Relationship API
 * 
 * POST /api/embeddings/relate - Create relationship between nodes
 * Builds the graph structure by connecting related information
 */

export async function POST(request: NextRequest) {
  try {
    const { 
      source_node_id, 
      target_node_id, 
      relationship_type,
      strength = 1.0,
      metadata = {},
      business_id
    } = await request.json();
    
    if (!source_node_id || !target_node_id || !relationship_type) {
      return NextResponse.json({ 
        error: 'source_node_id, target_node_id, and relationship_type are required' 
      }, { status: 400 });
    }
    
    const supabase = await createClient();
    
    // Create the edge (relationship)
    const { data: edge, error: edgeError } = await supabase
      .from('context_edges')
      .insert({
        source_node_id,
        target_node_id,
        relationship_type,
        strength,
        metadata,
        business_id
      })
      .select()
      .single();

    if (edgeError) {
      // Check if it's a duplicate edge error
      if (edgeError.code === '23505') {
        return NextResponse.json({ 
          success: true,
          message: 'Relationship already exists',
          duplicate: true
        });
      }
      
      return NextResponse.json({ 
        error: 'Failed to create relationship',
        details: edgeError.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      edge_id: edge.id,
      relationship_type: edge.relationship_type,
      message: `Created ${relationship_type} relationship`
    });

  } catch (error: any) {
    console.error('[Create Relationship] Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to create relationship' 
    }, { status: 500 });
  }
}

/**
 * GET /api/embeddings/relate - Get relationships for a node
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const nodeId = searchParams.get('node_id');
    const depth = parseInt(searchParams.get('depth') || '1');
    
    if (!nodeId) {
      return NextResponse.json({ error: 'node_id is required' }, { status: 400 });
    }
    
    const supabase = await createClient();
    
    if (depth === 1) {
      // Simple 1-level relationship fetch
      const { data: edges, error } = await supabase
        .from('context_edges')
        .select(`
          *,
          source:context_nodes!source_node_id(id, content, node_type, metadata),
          target:context_nodes!target_node_id(id, content, node_type, metadata)
        `)
        .or(`source_node_id.eq.${nodeId},target_node_id.eq.${nodeId}`);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        node_id: nodeId,
        relationships: edges,
        depth: 1
      });
    } else {
      // Recursive graph traversal (up to depth 3)
      const { data: graphPath, error } = await supabase.rpc('get_graph_path', {
        start_node_id: nodeId,
        max_depth: Math.min(depth, 3)
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        node_id: nodeId,
        graph_path: graphPath,
        depth
      });
    }

  } catch (error: any) {
    console.error('[Get Relationships] Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to get relationships' 
    }, { status: 500 });
  }
}
