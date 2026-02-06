import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const BUCKET_NAME = 'blog-images';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// Optimization defaults
const MAX_WIDTH = 1920;
const MAX_HEIGHT = 1080;
const WEBP_QUALITY = 80;
const JPEG_QUALITY = 82;

async function optimizeImage(buffer: Buffer, mimeType: string): Promise<{ data: Buffer; format: string; mime: string }> {
  let pipeline = sharp(buffer);
  const metadata = await pipeline.metadata();

  // Resize if exceeds max dimensions (preserving aspect ratio)
  if (metadata.width && metadata.width > MAX_WIDTH) {
    pipeline = pipeline.resize({ width: MAX_WIDTH, withoutEnlargement: true });
  } else if (metadata.height && metadata.height > MAX_HEIGHT) {
    pipeline = pipeline.resize({ height: MAX_HEIGHT, withoutEnlargement: true });
  }

  // GIFs: skip re-encoding (animated frames), just pass through
  if (mimeType === 'image/gif') {
    return { data: buffer, format: 'gif', mime: 'image/gif' };
  }

  // Convert PNG/JPEG/WebP to WebP for best compression
  const optimized = await pipeline
    .webp({ quality: WEBP_QUALITY, effort: 4 })
    .toBuffer();

  return { data: optimized, format: 'webp', mime: 'image/webp' };
}

/**
 * POST - Upload image with automatic optimization
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const folder = formData.get('folder') as string || 'uploads';
    const skipOptimize = formData.get('skip_optimize') === 'true';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: `Invalid file type. Allowed: ${ALLOWED_TYPES.join(', ')}` }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB` }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const rawBuffer = Buffer.from(arrayBuffer);
    const originalSize = rawBuffer.length;

    let uploadBuffer: Buffer;
    let contentType: string;
    let extension: string;

    if (skipOptimize || file.type === 'image/gif') {
      uploadBuffer = rawBuffer;
      contentType = file.type;
      extension = file.name.split('.').pop() || 'jpg';
    } else {
      const optimized = await optimizeImage(rawBuffer, file.type);
      uploadBuffer = optimized.data;
      contentType = optimized.mime;
      extension = optimized.format;
    }

    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const fileName = `${folder}/${timestamp}-${randomStr}.${extension}`;

    // Ensure bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(b => b.name === BUCKET_NAME);

    if (!bucketExists) {
      await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: MAX_FILE_SIZE,
        allowedMimeTypes: [...ALLOWED_TYPES, 'image/webp'],
      });
    }

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, uploadBuffer, { contentType, upsert: false });

    if (error) {
      console.error('Upload error:', error);
      return NextResponse.json({ error: 'Failed to upload image', details: error.message }, { status: 500 });
    }

    const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);
    const compressedSize = uploadBuffer.length;
    const savings = originalSize > 0 ? Math.round((1 - compressedSize / originalSize) * 100) : 0;

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      path: data.path,
      fileName: file.name,
      originalSize,
      compressedSize,
      savingsPercent: savings,
      format: extension,
      type: contentType,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Upload failed' }, { status: 500 });
  }
}

/**
 * DELETE - Delete image from Supabase Storage
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const path = searchParams.get('path');
    if (!path) return NextResponse.json({ error: 'Path is required' }, { status: 400 });

    const { error } = await supabase.storage.from(BUCKET_NAME).remove([path]);
    if (error) return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 });

    return NextResponse.json({ success: true, message: 'Image deleted' });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}

/**
 * GET - List images in a folder
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const folder = searchParams.get('folder') || 'uploads';
    const limit = parseInt(searchParams.get('limit') || '50');

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(folder, { limit, sortBy: { column: 'created_at', order: 'desc' } });

    if (error) return NextResponse.json({ error: 'Failed to list images' }, { status: 500 });

    const images = (data || []).map(file => {
      const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(`${folder}/${file.name}`);
      return { name: file.name, path: `${folder}/${file.name}`, url: urlData.publicUrl, size: file.metadata?.size, createdAt: file.created_at };
    });

    return NextResponse.json({ success: true, images, count: images.length });
  } catch (error) {
    console.error('List error:', error);
    return NextResponse.json({ error: 'Failed to list images' }, { status: 500 });
  }
}
