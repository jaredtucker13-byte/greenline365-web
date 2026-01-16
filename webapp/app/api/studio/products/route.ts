import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Product Library API
 * 
 * Manages saved products and their mockups
 * 
 * GET /api/studio/products - List products
 * POST /api/studio/products - Create/save product
 * GET /api/studio/products/[id] - Get single product with mockups
 * DELETE /api/studio/products?id=xxx - Archive product
 */

interface CreateProductRequest {
  businessId: string;
  name: string;
  description?: string;
  productType: string;
  originalImages: string[];
  aiAnalysis?: any;
  price?: number;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    const productId = searchParams.get('id');
    const status = searchParams.get('status');

    if (productId) {
      // Get single product with mockups
      const { data: product, error } = await supabase
        .from('studio_products')
        .select('*')
        .eq('id', productId)
        .single();

      if (error) throw error;

      // Get mockups for this product
      const { data: mockups } = await supabase
        .from('studio_mockups')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      return NextResponse.json({
        success: true,
        product: {
          ...product,
          mockups: mockups || [],
        },
      });
    }

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID required' }, { status: 400 });
    }

    // List products
    let query = supabase
      .from('studio_products')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    } else {
      query = query.neq('status', 'archived');
    }

    const { data: products, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      products: products || [],
    });

  } catch (error: any) {
    console.error('[Products GET] Error:', error);
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

    const body: CreateProductRequest = await request.json();
    const { businessId, name, description, productType, originalImages, aiAnalysis, price } = body;

    if (!businessId || !name || !productType || !originalImages || originalImages.length === 0) {
      return NextResponse.json(
        { error: 'Business ID, name, product type, and at least one image required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('studio_products')
      .insert({
        business_id: businessId,
        name,
        description: description || '',
        product_type: productType,
        original_images: originalImages,
        ai_analysis: aiAnalysis || {},
        price,
        status: aiAnalysis ? 'analyzed' : 'draft',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      product: data,
    });

  } catch (error: any) {
    console.error('[Products POST] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('studio_products')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      product: data,
    });

  } catch (error: any) {
    console.error('[Products PATCH] Error:', error);
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
    const productId = searchParams.get('id');

    if (!productId) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    // Soft delete (archive)
    const { error } = await supabase
      .from('studio_products')
      .update({ status: 'archived' })
      .eq('id', productId);

    if (error) throw error;

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('[Products DELETE] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
