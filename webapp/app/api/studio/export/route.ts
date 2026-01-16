import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Omnichannel Export API
 * 
 * Formats mockup images for different social platforms:
 * - Pinterest: 1000x1500 (2:3 ratio)
 * - TikTok: 1080x1920 (9:16 ratio)
 * - Instagram Square: 1080x1080
 * - Instagram Story: 1080x1920
 * - Facebook: 1200x630
 * 
 * POST /api/studio/export
 */

interface ExportRequest {
  imageUrl: string;
  platforms: ('pinterest' | 'tiktok' | 'instagram_square' | 'instagram_story' | 'facebook')[];
  productName?: string;
}

const PLATFORM_SPECS = {
  pinterest: { width: 1000, height: 1500, name: 'Pinterest Pin' },
  tiktok: { width: 1080, height: 1920, name: 'TikTok Video Cover' },
  instagram_square: { width: 1080, height: 1080, name: 'Instagram Square' },
  instagram_story: { width: 1080, height: 1920, name: 'Instagram Story' },
  facebook: { width: 1200, height: 630, name: 'Facebook Post' },
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: ExportRequest = await request.json();
    const { imageUrl, platforms, productName } = body;

    if (!imageUrl || !platforms || platforms.length === 0) {
      return NextResponse.json(
        { error: 'Image URL and platforms required' },
        { status: 400 }
      );
    }

    // In a production system, we'd use Sharp or a similar library
    // to actually resize/crop the images. For now, we'll return
    // the specs with the original URL as a placeholder.
    
    const exports = platforms.map(platform => {
      const spec = PLATFORM_SPECS[platform];
      if (!spec) return null;
      
      return {
        platform,
        name: spec.name,
        width: spec.width,
        height: spec.height,
        aspectRatio: `${spec.width}:${spec.height}`,
        imageUrl: imageUrl, // In production: resized URL
        downloadName: `${productName || 'mockup'}_${platform}.png`,
      };
    }).filter(Boolean);

    return NextResponse.json({
      success: true,
      exports,
      note: 'Images are ready for download. In production, these would be resized to exact platform specifications.',
    });

  } catch (error: any) {
    console.error('[Export] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Bulk export endpoint
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  // Return platform specifications
  return NextResponse.json({
    platforms: PLATFORM_SPECS,
    recommended: {
      ecommerce: ['instagram_square', 'pinterest'],
      social: ['instagram_story', 'tiktok', 'facebook'],
      all: Object.keys(PLATFORM_SPECS),
    },
  });
}
