import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const incidentId = formData.get('incident_id') as string;
    const files = formData.getAll('files') as File[];

    if (!incidentId) {
      return NextResponse.json({ error: 'Missing incident_id' }, { status: 400 });
    }

    if (!files.length) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    const uploadedImages = [];

    for (const file of files) {
      // Generate unique filename
      const ext = file.name.split('.').pop();
      const filename = `${incidentId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
      
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('incident-images')
        .upload(filename, file, {
          contentType: file.type,
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        continue;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('incident-images')
        .getPublicUrl(filename);

      // Extract basic metadata (EXIF would need a library like exifr)
      const exifData = {
        original_filename: file.name,
        file_size: file.size,
        mime_type: file.type,
        uploaded_at: new Date().toISOString()
      };

      // Save to database
      const { data: imageRecord, error: dbError } = await supabase
        .from('incident_images')
        .insert({
          incident_id: incidentId,
          user_id: user.id,
          filename: file.name,
          storage_path: filename,
          url: publicUrl,
          mime_type: file.type,
          file_size: file.size,
          exif_data: exifData
        })
        .select()
        .single();

      if (dbError) {
        console.error('DB error:', dbError);
        continue;
      }

      uploadedImages.push(imageRecord);
    }

    return NextResponse.json({
      success: true,
      uploaded: uploadedImages.length,
      images: uploadedImages
    });

  } catch (error: any) {
    console.error('POST /api/incidents/upload error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET - List images for an incident
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const incidentId = searchParams.get('incident_id');

    if (!incidentId) {
      return NextResponse.json({ error: 'Missing incident_id' }, { status: 400 });
    }

    const { data: images, error } = await supabase
      .from('incident_images')
      .select('*')
      .eq('incident_id', incidentId)
      .eq('user_id', user.id)
      .order('display_order', { ascending: true });

    if (error) throw error;

    return NextResponse.json(images);
  } catch (error: any) {
    console.error('GET /api/incidents/upload error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Remove image
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get('id');

    if (!imageId) {
      return NextResponse.json({ error: 'Missing image id' }, { status: 400 });
    }

    // Get image record first
    const { data: image } = await supabase
      .from('incident_images')
      .select('storage_path')
      .eq('id', imageId)
      .eq('user_id', user.id)
      .single();

    if (image?.storage_path) {
      // Delete from storage
      await supabase.storage
        .from('incident-images')
        .remove([image.storage_path]);
    }

    // Delete from database
    const { error } = await supabase
      .from('incident_images')
      .delete()
      .eq('id', imageId)
      .eq('user_id', user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE /api/incidents/upload error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
