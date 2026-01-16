import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Product Analysis API
 * 
 * Uses Gemini 3 Pro to analyze product photos and generate:
 * - Product description
 * - Price suggestions
 * - Material details
 * - Marketing angles
 * 
 * POST /api/studio/analyze-product
 */

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const GEMINI_3_PRO = 'google/gemini-2.5-pro-preview';

interface AnalyzeProductRequest {
  businessId: string;
  images: string[]; // base64 data URLs
  productName?: string;
  category?: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: AnalyzeProductRequest = await request.json();
    const { businessId, images, productName, category } = body;

    if (!businessId || !images || images.length === 0) {
      return NextResponse.json(
        { error: 'Business ID and at least one image required' },
        { status: 400 }
      );
    }

    // Verify access
    const { data: access } = await supabase
      .from('user_businesses')
      .select('role')
      .eq('user_id', user.id)
      .eq('business_id', businessId)
      .single();

    if (!access) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Build content array for Gemini vision
    const content: any[] = [{
      type: 'text',
      text: `You are a professional product analyst and copywriter. Analyze these product photos from multiple angles and create a comprehensive product profile.

${productName ? `Product Name: ${productName}` : ''}
${category ? `Category: ${category}` : ''}

Analyze and extract:
1. **Description**: A compelling, benefit-driven product description (2-3 sentences)
2. **Materials**: What materials/fabrics is this made from?
3. **Pricing Strategy**: Suggest a price range based on quality, materials, and market positioning
4. **Key Features**: 3-5 bullet points highlighting unique selling points
5. **Target Audience**: Who would buy this?
6. **Marketing Angles**: 3 different ways to position/sell this product

Return ONLY valid JSON (no markdown, no code blocks):
{
  "description": "Compelling product description...",
  "materials": ["material1", "material2"],
  "suggested_price_range": {"min": 29, "max": 49, "recommended": 39},
  "key_features": ["feature1", "feature2", "feature3"],
  "target_audience": "Who buys this",
  "marketing_angles": [
    {"angle": "Luxury positioning", "tagline": "..."},
    {"angle": "Practical benefits", "tagline": "..."},
    {"angle": "Emotional appeal", "tagline": "..."}
  ],
  "seo_keywords": ["keyword1", "keyword2", "keyword3"]
}`
    }];

    // Add all images
    images.forEach(imageUrl => {
      content.push({
        type: 'image_url',
        image_url: { url: imageUrl }
      });
    });

    // Call Gemini 3 Pro via OpenRouter
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://greenline365.com',
        'X-Title': 'ArtfulPhusion Creative Studio',
      },
      body: JSON.stringify({
        model: GEMINI_3_PRO,
        messages: [{
          role: 'user',
          content,
        }],
        temperature: 0.3,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[Product Analysis] OpenRouter error:', error);
      return NextResponse.json(
        { error: 'Failed to analyze product' },
        { status: 500 }
      );
    }

    const result = await response.json();
    const text = result.choices?.[0]?.message?.content || '';
    
    // Extract JSON from response
    let jsonText = text;
    if (text.includes('```')) {
      const match = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      jsonText = match ? match[1] : text;
    }
    
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[Product Analysis] No JSON in response');
      return NextResponse.json(
        { error: 'Failed to parse analysis' },
        { status: 500 }
      );
    }

    const analysis = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      success: true,
      analysis,
    });

  } catch (error: any) {
    console.error('[Product Analysis] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
