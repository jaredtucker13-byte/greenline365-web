import { NextRequest, NextResponse } from 'next/server';

/**
 * Image Analysis API - "Autopilot Mode"
 * 
 * Analyzes an uploaded image and generates:
 * - Title/Name
 * - Caption (social media ready)
 * - Product Description
 * - Keywords/Tags
 * - Hashtags
 * 
 * Uses GPT-4o vision capabilities via OpenRouter
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageData, imageUrl, contentType = 'photo', businessType = 'local business', location = 'Tampa, FL' } = body;

    // Require either base64 image data or URL
    if (!imageData && !imageUrl) {
      return NextResponse.json(
        { error: 'Image data or URL is required' },
        { status: 400 }
      );
    }

    const openRouterKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterKey) {
      return NextResponse.json(
        { error: 'OpenRouter API key not configured' },
        { status: 500 }
      );
    }

    // Build the image content for the API
    const imageContent = imageData 
      ? { type: 'image_url', image_url: { url: imageData } } // Base64 data URL
      : { type: 'image_url', image_url: { url: imageUrl } }; // External URL

    // Create the analysis prompt based on content type
    const analysisPrompt = getAnalysisPrompt(contentType, businessType, location);

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://greenline365.com',
        'X-Title': 'GreenLine365 Image Analyzer',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o', // GPT-4o has vision capabilities
        messages: [
          {
            role: 'system',
            content: `You are a creative marketing expert who analyzes images for small businesses. You create engaging, authentic content that sounds human - not robotic or generic.

Your job is to analyze images and generate marketing content that:
- Tells a story
- Connects emotionally with the audience
- Uses industry-specific language
- Includes actionable calls-to-action
- Feels personal and authentic

IMPORTANT: Return ONLY valid JSON. No markdown, no extra text, just the JSON object.`
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: analysisPrompt },
              imageContent
            ]
          }
        ],
        temperature: 0.8,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenRouter API error:', response.status, errorData);
      return NextResponse.json(
        { error: 'Failed to analyze image', details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Parse the JSON response
    let analysis;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError, 'Content:', content);
      // Return a fallback response
      analysis = generateFallbackAnalysis(contentType);
    }

    // Ensure all required fields exist
    const result = {
      success: true,
      analysis: {
        title: analysis.title || 'Untitled',
        caption: analysis.caption || '',
        productDescription: analysis.productDescription || analysis.description || '',
        keywords: Array.isArray(analysis.keywords) ? analysis.keywords : [],
        hashtags: {
          brand: analysis.hashtags?.brand || '#GreenLine365',
          local: analysis.hashtags?.local || `#${location.split(',')[0].replace(/\s+/g, '')}`,
          suggested: Array.isArray(analysis.hashtags?.suggested) ? analysis.hashtags.suggested : [],
        },
        mood: analysis.mood || 'professional',
        suggestedPlatforms: analysis.suggestedPlatforms || ['instagram', 'facebook'],
        callToAction: analysis.callToAction || 'Learn more today!',
      },
      metadata: {
        contentType,
        businessType,
        location,
        analyzedAt: new Date().toISOString(),
      }
    };

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Image analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze image', details: error.message },
      { status: 500 }
    );
  }
}

// Generate analysis prompt based on content type
function getAnalysisPrompt(contentType: string, businessType: string, location: string): string {
  const basePrompt = `Analyze this image for a ${businessType} in ${location}. `;
  
  const typeSpecificPrompt = {
    photo: `This is a general photo post for social media.
    
Generate content that:
- Captures the essence and story of this image
- Creates engagement and connection
- Works well on Instagram, Facebook, and Twitter`,

    product: `This is a PRODUCT image that needs to sell.

Generate content that:
- Highlights the product's features and benefits
- Creates desire and urgency
- Includes a clear value proposition
- Works for e-commerce and social selling`,

    blog: `This will be used as a BLOG header image.

Generate content that:
- Suggests an engaging blog topic based on the image
- Creates SEO-friendly title and description
- Includes content ideas for a full blog post
- Appeals to readers searching for related topics`,
  };

  return `${basePrompt}${typeSpecificPrompt[contentType as keyof typeof typeSpecificPrompt] || typeSpecificPrompt.photo}

Return a JSON object with this EXACT structure:
{
  "title": "Catchy, engaging title (max 60 chars)",
  "caption": "Social media caption with personality. Include 1-2 emojis naturally. Make it feel human and authentic, not corporate. 2-4 sentences max.",
  "productDescription": "Detailed description focusing on benefits and value. 2-3 sentences.",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "hashtags": {
    "brand": "#BusinessName",
    "local": "#${location.split(',')[0].replace(/\s+/g, '')}",
    "suggested": ["#relevant1", "#relevant2", "#relevant3", "#trending1", "#niche1"]
  },
  "mood": "professional|playful|inspiring|urgent|casual",
  "suggestedPlatforms": ["instagram", "facebook"],
  "callToAction": "Short, actionable CTA"
}`;
}

// Fallback analysis if AI fails
function generateFallbackAnalysis(contentType: string) {
  return {
    title: contentType === 'product' ? 'New Product Spotlight' : 'Check This Out',
    caption: "Something special for you today! We're excited to share this with our community. What do you think? 💫",
    productDescription: 'Quality you can trust, service you deserve. Discover what makes us different.',
    keywords: ['quality', 'local business', 'community', 'service', 'trusted'],
    hashtags: {
      brand: '#GreenLine365',
      local: '#Tampa',
      suggested: ['#SmallBusiness', '#LocalLove', '#SupportLocal', '#Community', '#Quality'],
    },
    mood: 'professional',
    suggestedPlatforms: ['instagram', 'facebook'],
    callToAction: 'Visit us today!',
  };
}
