import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Signature Models API
 * 
 * Manages the Character Vault - persistent AI models for consistent mockups
 * 
 * GET /api/studio/models - List models for business
 * POST /api/studio/models - Create new model
 * DELETE /api/studio/models?id=xxx - Delete model
 */

interface CreateModelRequest {
  businessId: string;
  name: string;
  modelType: 'photo_seed' | 'virtual';
  
  // For photo_seed
  referenceImages?: string[];
  
  // For virtual
  ethnicity?: string;
  ageRange?: string;
  gender?: string;
  styleTags?: string[];
}

// Virtual model presets
const ETHNICITY_OPTIONS = [
  'East Asian',
  'South Asian', 
  'Southeast Asian',
  'Middle Eastern',
  'African',
  'African American',
  'European',
  'Latin American',
  'Mixed/Multiracial',
];

const AGE_RANGES = [
  '18-25',
  '25-35',
  '35-45',
  '45-55',
  '55+',
];

const STYLE_TAGS = [
  'Professional',
  'Casual',
  'Athletic',
  'Elegant',
  'Streetwear',
  'Bohemian',
  'Classic',
  'Edgy',
  'Natural',
  'Glamorous',
];

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) {
      // Return options for creating models
      return NextResponse.json({
        options: {
          ethnicities: ETHNICITY_OPTIONS,
          ageRanges: AGE_RANGES,
          styleTags: STYLE_TAGS,
        },
      });
    }

    // Get models for business
    const { data: models, error } = await supabase
      .from('signature_models')
      .select('*')
      .eq('business_id', businessId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      models: models || [],
    });

  } catch (error: any) {
    console.error('[Models GET] Error:', error);
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

    const body: CreateModelRequest = await request.json();
    const { businessId, name, modelType, referenceImages, ethnicity, ageRange, gender, styleTags } = body;

    if (!businessId || !name || !modelType) {
      return NextResponse.json(
        { error: 'Business ID, name, and model type required' },
        { status: 400 }
      );
    }

    // For photo_seed, require reference images
    if (modelType === 'photo_seed' && (!referenceImages || referenceImages.length === 0)) {
      return NextResponse.json(
        { error: 'Reference images required for photo seed models' },
        { status: 400 }
      );
    }

    // For virtual, require at least ethnicity
    if (modelType === 'virtual' && !ethnicity) {
      return NextResponse.json(
        { error: 'Ethnicity required for virtual models' },
        { status: 400 }
      );
    }

    // Generate preview for virtual models (placeholder for now)
    let previewUrl = null;
    if (modelType === 'virtual') {
      // In production, this would call the AI to generate a preview
      previewUrl = `https://placehold.co/400x400/8b5cf6/ffffff?text=${encodeURIComponent(name)}`;
    } else if (referenceImages && referenceImages.length > 0) {
      previewUrl = referenceImages[0];
    }

    const { data, error } = await supabase
      .from('signature_models')
      .insert({
        business_id: businessId,
        name,
        model_type: modelType,
        reference_images: referenceImages || [],
        ethnicity,
        age_range: ageRange,
        gender,
        style_tags: styleTags || [],
        preview_url: previewUrl,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      model: data,
    });

  } catch (error: any) {
    console.error('[Models POST] Error:', error);
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
    const modelId = searchParams.get('id');

    if (!modelId) {
      return NextResponse.json({ error: 'Model ID required' }, { status: 400 });
    }

    // Soft delete
    const { error } = await supabase
      .from('signature_models')
      .update({ is_active: false })
      .eq('id', modelId);

    if (error) throw error;

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('[Models DELETE] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
