import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Product Analysis API
 * 
 * Uses Gemini 3 Pro via OpenRouter to analyze product photos and generate:
 * - Product description
 * - Price suggestions  
 * - Material details
 * - Marketing angles
 * 
 * POST /api/studio/analyze-product
 */

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const GEMINI_MODEL = 'google/gemini-2.5-pro-preview';

interface AnalyzeProductRequest {
  imageUrls: string[];  // Direct URLs or base64
  productType: string;
  businessId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: AnalyzeProductRequest = await request.json();
    const { imageUrls, productType } = body;

    if (!imageUrls || imageUrls.length === 0) {
      return NextResponse.json(
        { error: 'At least one image required' },
        { status: 400 }
      );
    }

    // Check if OpenRouter API key is configured
    if (!OPENROUTER_API_KEY) {
      console.warn('[Product Analysis] OpenRouter API key not configured, using mock response');
      return NextResponse.json({
        success: true,
        analysis: getMockAnalysis(productType),
      });
    }

    // Build vision prompt
    const systemPrompt = `You are an expert product analyst and copywriter for e-commerce. Analyze the product image(s) and provide comprehensive product intelligence.

Product Category: ${productType}

Analyze and return ONLY valid JSON (no markdown):
{
  "name": "Product name based on what you see",
  "description": "Compelling 2-3 sentence product description highlighting benefits",
  "materials": ["material1", "material2"],
  "colors": ["primary color", "secondary color"],
  "style": "Style description (e.g., modern minimalist, vintage, streetwear)",
  "suggested_price": {"min": 29, "max": 59, "recommended": 39},
  "key_features": ["feature 1", "feature 2", "feature 3"],
  "target_audience": "Who would buy this",
  "marketing_angles": [
    {"angle": "Luxury", "tagline": "Short tagline"},
    {"angle": "Practical", "tagline": "Short tagline"},
    {"angle": "Emotional", "tagline": "Short tagline"}
  ],
  "seo_keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
}`;

    // Build content array with images
    const content: any[] = [{ type: 'text', text: systemPrompt }];
    
    for (const url of imageUrls.slice(0, 5)) {
      content.push({
        type: 'image_url',
        image_url: { url }
      });
    }

    // Call Gemini via OpenRouter
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://greenline365.com',
        'X-Title': 'ArtfulPhusion Creative Studio',
      },
      body: JSON.stringify({
        model: GEMINI_MODEL,
        messages: [{ role: 'user', content }],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Product Analysis] OpenRouter error:', errorText);
      
      // Fallback to mock if API fails
      return NextResponse.json({
        success: true,
        analysis: getMockAnalysis(productType),
        warning: 'AI analysis unavailable, using template',
      });
    }

    const result = await response.json();
    const text = result.choices?.[0]?.message?.content || '';
    
    // Parse JSON from response
    let analysis;
    try {
      // Remove markdown code blocks if present
      let jsonText = text;
      if (text.includes('```')) {
        const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        jsonText = match ? match[1] : text;
      }
      
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found');
      }
    } catch (parseError) {
      console.error('[Product Analysis] Parse error:', parseError);
      analysis = getMockAnalysis(productType);
    }

    return NextResponse.json({
      success: true,
      analysis,
    });

  } catch (error: any) {
    console.error('[Product Analysis] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Mock analysis for development/fallback
function getMockAnalysis(productType: string) {
  const templates: Record<string, any> = {
    apparel: {
      name: 'Premium Cotton T-Shirt',
      description: 'Crafted from ultra-soft organic cotton, this versatile piece offers everyday comfort with a modern silhouette. Perfect for layering or wearing on its own.',
      materials: ['100% Organic Cotton', 'Reinforced Stitching'],
      colors: ['Black', 'White'],
      style: 'Modern Minimalist',
      suggested_price: { min: 29, max: 49, recommended: 39 },
      key_features: ['Pre-shrunk fabric', 'Tagless comfort', 'Sustainable materials'],
      target_audience: 'Style-conscious millennials seeking quality basics',
      marketing_angles: [
        { angle: 'Sustainability', tagline: 'Wear your values' },
        { angle: 'Quality', tagline: 'Built to last, made to love' },
        { angle: 'Versatility', tagline: 'One shirt, endless possibilities' },
      ],
      seo_keywords: ['organic cotton tee', 'sustainable fashion', 'minimalist wardrobe', 'premium basics', 'eco-friendly clothing'],
    },
    jewelry: {
      name: 'Artisan Gold Ring',
      description: 'Handcrafted with meticulous attention to detail, this statement piece combines timeless elegance with contemporary design.',
      materials: ['14K Gold Plated', 'Sterling Silver Base'],
      colors: ['Gold', 'Rose Gold'],
      style: 'Contemporary Elegance',
      suggested_price: { min: 79, max: 149, recommended: 99 },
      key_features: ['Hypoallergenic', 'Tarnish-resistant', 'Adjustable sizing'],
      target_audience: 'Fashion-forward women who appreciate artisan craftsmanship',
      marketing_angles: [
        { angle: 'Luxury', tagline: 'Affordable luxury, priceless memories' },
        { angle: 'Craftsmanship', tagline: 'Where art meets adornment' },
        { angle: 'Gift', tagline: 'The gift that says everything' },
      ],
      seo_keywords: ['artisan jewelry', 'gold ring', 'statement piece', 'handcrafted accessories', 'gift for her'],
    },
    wall_art: {
      name: 'Abstract Canvas Print',
      description: 'Transform any space with this captivating abstract piece. Museum-quality printing on premium canvas brings depth and dimension to your walls.',
      materials: ['Premium Canvas', 'Archival Inks', 'Wooden Frame'],
      colors: ['Multi-color', 'Earth Tones'],
      style: 'Modern Abstract',
      suggested_price: { min: 89, max: 249, recommended: 149 },
      key_features: ['Ready to hang', 'Fade-resistant', 'Multiple sizes available'],
      target_audience: 'Homeowners and interior designers seeking unique artwork',
      marketing_angles: [
        { angle: 'Transformation', tagline: 'Turn walls into conversations' },
        { angle: 'Quality', tagline: 'Gallery-worthy, home-ready' },
        { angle: 'Expression', tagline: 'Your space, your story' },
      ],
      seo_keywords: ['canvas wall art', 'abstract print', 'home decor', 'modern art', 'living room decor'],
    },
    default: {
      name: 'Premium Product',
      description: 'A high-quality product designed with attention to detail and crafted from premium materials.',
      materials: ['Premium Materials'],
      colors: ['Various'],
      style: 'Contemporary',
      suggested_price: { min: 39, max: 99, recommended: 59 },
      key_features: ['High quality', 'Durable construction', 'Modern design'],
      target_audience: 'Quality-conscious consumers',
      marketing_angles: [
        { angle: 'Quality', tagline: 'Excellence in every detail' },
        { angle: 'Value', tagline: 'Invest in the best' },
        { angle: 'Style', tagline: 'Designed for life' },
      ],
      seo_keywords: ['premium product', 'high quality', 'modern design', 'best seller', 'top rated'],
    },
  };

  return templates[productType] || templates.default;
}
