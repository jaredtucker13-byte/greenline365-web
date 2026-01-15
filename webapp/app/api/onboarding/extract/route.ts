import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * AI-Powered Onboarding Extraction API
 * 
 * The "Zero-Friction" engine using Gemini 3 Pro via OpenRouter
 * Extracts business data from:
 * - Photos/PDFs (menus, flyers, documents) 
 * - Website URLs (scraping)
 * - Brand voice text
 * 
 * POST /api/onboarding/extract - Extract data from inputs
 */

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const GEMINI_3_PRO = 'google/gemini-2.5-pro-preview'; // Gemini 3 Pro on OpenRouter

interface ExtractionRequest {
  businessId: string;
  
  // Multimodal inputs
  imageDataUrls?: string[]; // base64 data URLs for images/PDFs
  
  websiteUrl?: string;
  brandVoiceText?: string;
  
  // Context
  industry?: string;
  location?: string;
}

interface ExtractedData {
  services: Array<{
    name: string;
    description: string;
    price?: string;
    category?: string;
  }>;
  
  brandVoice: {
    tone: string[];
    values: string[];
    mission: string;
    target_audience: string;
    unique_selling_points: string[];
  };
  
  businessInfo: {
    name?: string;
    tagline?: string;
    description?: string;
    hours?: string;
    contact?: {
      phone?: string;
      email?: string;
      address?: string;
    };
  };
  
  faq: Array<{
    question: string;
    answer: string;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: ExtractionRequest = await request.json();
    const { businessId, imageDataUrls, websiteUrl, brandVoiceText, industry, location } = body;

    if (!businessId) {
      return NextResponse.json(
        { error: 'Business ID required' },
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

    const extractedData: ExtractedData = {
      services: [],
      brandVoice: {
        tone: [],
        values: [],
        mission: '',
        target_audience: '',
        unique_selling_points: [],
      },
      businessInfo: {},
      faq: [],
    };

    // Step 1: Extract from images/PDFs using Gemini 3 Pro vision
    if (imageDataUrls && imageDataUrls.length > 0) {
      const fileData = await extractFromImages(imageDataUrls, industry, location);
      extractedData.services.push(...fileData.services);
      if (fileData.businessInfo) {
        extractedData.businessInfo = { ...extractedData.businessInfo, ...fileData.businessInfo };
      }
    }

    // Step 2: Extract from website
    if (websiteUrl) {
      const webData = await extractFromWebsite(websiteUrl);
      extractedData.services.push(...webData.services);
      extractedData.brandVoice = { ...extractedData.brandVoice, ...webData.brandVoice };
      extractedData.businessInfo = { ...extractedData.businessInfo, ...webData.businessInfo };
      extractedData.faq.push(...webData.faq);
    }

    // Step 3: Analyze brand voice
    if (brandVoiceText) {
      const voiceData = await analyzeBrandVoice(brandVoiceText);
      extractedData.brandVoice = { ...extractedData.brandVoice, ...voiceData };
    }

    return NextResponse.json({
      success: true,
      extracted: extractedData,
    });

  } catch (error: any) {
    console.error('[Onboarding Extract API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Extract from images/PDFs using Gemini 3 Pro via OpenRouter
async function extractFromImages(
  imageDataUrls: string[],
  industry?: string,
  location?: string
): Promise<{ services: any[]; businessInfo: any }> {
  if (!OPENROUTER_API_KEY) {
    console.error('[Image Extraction] OpenRouter API key not configured');
    return { services: [], businessInfo: {} };
  }

  try {
    // Build content array with images
    const content: any[] = [{
      type: 'text',
      text: `Analyze these business documents (menus, flyers, price lists, photos) and extract structured data.

Industry: ${industry || 'unknown'}
Location: ${location || 'unknown'}

Extract ALL services/products with names, descriptions, and prices. Also extract business name, tagline, hours, contact info.

Return ONLY valid JSON in this EXACT format (no markdown, no code blocks):
{
  "services": [
    {"name": "Service Name", "description": "Full description", "price": "$XX", "category": "Category"}
  ],
  "businessInfo": {
    "name": "Business Name",
    "tagline": "Short tagline",
    "description": "What they do",
    "hours": "Mon-Fri 9-5",
    "contact": {"phone": "", "email": "", "address": ""}
  }
}`
    }];

    // Add images
    imageDataUrls.forEach(dataUrl => {
      content.push({
        type: 'image_url',
        image_url: { url: dataUrl }
      });
    });

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://greenline365.com',
        'X-Title': 'GreenLine365 Onboarding Engine',
      },
      body: JSON.stringify({
        model: GEMINI_3_PRO,
        messages: [{
          role: 'user',
          content,
        }],
        temperature: 0.2,
        max_tokens: 8000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[Image Extraction] OpenRouter error:', error);
      return { services: [], businessInfo: {} };
    }

    const result = await response.json();
    const text = result.choices?.[0]?.message?.content || '';
    
    // Extract JSON from response (handle code blocks)
    let jsonText = text;
    if (text.includes('```')) {
      const match = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      jsonText = match ? match[1] : text;
    }
    
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[Image Extraction] No JSON in response');
      return { services: [], businessInfo: {} };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      services: parsed.services || [],
      businessInfo: parsed.businessInfo || {},
    };

  } catch (error) {
    console.error('[Image Extraction] Error:', error);
    return { services: [], businessInfo: {} };
  }
}

// Extract from website using Gemini 3 Pro via OpenRouter
async function extractFromWebsite(url: string): Promise<{
  services: any[];
  brandVoice: any;
  businessInfo: any;
  faq: any[];
}> {
  try {
    // Use existing scrape endpoint
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const scrapeResponse = await fetch(`${baseUrl}/api/scrape`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });

    const scrapeData = await scrapeResponse.json();
    const rawContent = (scrapeData.raw_content || scrapeData.content || '').substring(0, 100000);

    if (!rawContent) {
      return { services: [], brandVoice: {}, businessInfo: {}, faq: [] };
    }

    // Analyze with Gemini 3 Pro (2M context window)
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://greenline365.com',
        'X-Title': 'GreenLine365 Onboarding Engine',
      },
      body: JSON.stringify({
        model: GEMINI_3_PRO,
        messages: [{
          role: 'user',
          content: `Analyze this complete website content and extract ALL business intelligence:

${rawContent}

Return ONLY valid JSON (no markdown, no code blocks):
{
  "services": [{"name": "...", "description": "...", "price": "...", "category": "..."}],
  "brandVoice": {
    "tone": ["professional", "friendly"],
    "values": ["quality", "trust"],
    "mission": "one clear sentence",
    "target_audience": "who they serve",
    "unique_selling_points": ["usp1", "usp2"]
  },
  "businessInfo": {"name": "...", "tagline": "...", "description": "...", "hours": "...", "contact": {}},
  "faq": [{"question": "...", "answer": "..."}]
}`
        }],
        temperature: 0.2,
        max_tokens: 8000,
      }),
    });

    if (!response.ok) {
      console.error('[Website Extraction] OpenRouter error');
      return { services: [], brandVoice: {}, businessInfo: {}, faq: [] };
    }

    const result = await response.json();
    const text = result.choices?.[0]?.message?.content || '';
    
    // Handle markdown code blocks
    let jsonText = text;
    if (text.includes('```')) {
      const match = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      jsonText = match ? match[1] : text;
    }
    
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { services: [], brandVoice: {}, businessInfo: {}, faq: [] };
    }

    return JSON.parse(jsonMatch[0]);

  } catch (error) {
    console.error('[Website Extraction] Error:', error);
    return { services: [], brandVoice: {}, businessInfo: {}, faq: [] };
  }
}

// Analyze brand voice
async function analyzeBrandVoice(text: string): Promise<any> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Analyze this brand voice text and distill the core identity:

${text.substring(0, 10000)}

Return ONLY valid JSON:
{
  "tone": ["adjective1", "adjective2"],
  "values": ["value1", "value2"],
  "mission": "one clear sentence",
  "target_audience": "who they serve",
  "unique_selling_points": ["usp1", "usp2", "usp3"]
}`
            }],
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!response.ok) {
      return {};
    }

    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {};
    }

    return JSON.parse(jsonMatch[0]);

  } catch (error) {
    console.error('[Brand Voice] Error:', error);
    return {};
  }
}
