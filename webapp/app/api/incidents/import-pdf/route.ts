/**
 * Incident PDF Import API
 *
 * Accepts PDFs from any field service management system (ServiceTitan, Housecall Pro, etc.)
 * and uses Claude to extract structured incident data.
 *
 * POST /api/incidents/import-pdf
 *   - Uploads PDF to Supabase Storage
 *   - Sends to Claude for extraction (model numbers, addresses, findings, etc.)
 *   - Returns structured data to pre-fill the incident report form
 *   - Archives the original PDF as source documentation
 *
 * The tech reviews the extracted data, confirms/edits, then saves the incident.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { callOpenRouterJSON } from '@/lib/openrouter';

const PDF_EXTRACTION_PROMPT = `You are an expert at extracting structured data from field service management (FSM) documents.
You are reading a PDF that may come from ServiceTitan, Housecall Pro, FieldEdge, or any similar system.

Extract ALL available information and return it as JSON. If a field is not found, set it to null.

Return JSON:
{
  "property": {
    "address": "Full street address",
    "city": "City",
    "state": "State",
    "zip": "ZIP code",
    "unit": "Unit/Apt number if applicable"
  },
  "customer": {
    "name": "Customer full name",
    "phone": "Phone number",
    "email": "Email if found"
  },
  "technician": {
    "name": "Technician name",
    "id": "Tech ID or employee number if found"
  },
  "job": {
    "date": "Service date (ISO format if possible)",
    "type": "Type of service (repair, install, maintenance, inspection, etc.)",
    "description": "Description of work performed",
    "invoice_number": "Invoice or job number"
  },
  "equipment": [
    {
      "type": "Equipment type (AC, furnace, water heater, etc.)",
      "brand": "Brand/manufacturer",
      "model": "Model number",
      "serial": "Serial number",
      "condition": "Condition notes",
      "age_years": "Estimated age if mentioned"
    }
  ],
  "findings": [
    {
      "issue": "Issue found",
      "severity": "low|medium|high|critical",
      "details": "Detailed description",
      "recommendation": "Recommended action"
    }
  ],
  "parts_used": [
    {
      "name": "Part name",
      "quantity": 1,
      "part_number": "Part number if available"
    }
  ],
  "notes": "Any additional notes, comments, or observations",
  "total_cost": "Total cost if found",
  "warranty_info": "Any warranty information mentioned",
  "source_system": "Name of the FSM system if identifiable (e.g., ServiceTitan, Housecall Pro)"
}`;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const incidentId = formData.get('incident_id') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Unsupported file type. Accepts: PDF, PNG, JPEG, WebP' },
        { status: 400 }
      );
    }

    // Size limit: 50MB
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Maximum 50MB.' }, { status: 400 });
    }

    // Upload to Supabase Storage
    const timestamp = Date.now();
    const safeFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `imports/${user.id}/${timestamp}-${safeFilename}`;

    const { error: uploadError } = await supabase.storage
      .from('incident-images')
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('[PDF Import] Upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
    }

    // Get the public URL for the archived file
    const { data: { publicUrl } } = supabase.storage
      .from('incident-images')
      .getPublicUrl(storagePath);

    // Convert file to base64 for Claude
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    // Determine media type for Claude
    const mediaType = file.type === 'application/pdf' ? 'application/pdf' : file.type;

    // Send to Claude for extraction
    let extraction;
    try {
      const { parsed } = await callOpenRouterJSON({
        model: 'anthropic/claude-sonnet-4.6',
        messages: [
          {
            role: 'system',
            content: PDF_EXTRACTION_PROMPT,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract all structured data from this document for an incident report:',
              },
              file.type === 'application/pdf'
                ? {
                    type: 'document',
                    source: {
                      type: 'base64',
                      media_type: mediaType,
                      data: base64,
                    },
                  }
                : {
                    type: 'image_url',
                    image_url: { url: `data:${mediaType};base64,${base64}` },
                  },
            ],
          },
        ],
        max_tokens: 4000,
        temperature: 0.2,
        caller: 'GL365 Incident PDF Import',
      });

      extraction = parsed;
    } catch (aiError: any) {
      console.error('[PDF Import] AI extraction error:', aiError);
      return NextResponse.json({
        success: false,
        error: 'AI extraction failed. File has been uploaded — you can fill in details manually.',
        archived_url: publicUrl,
        storage_path: storagePath,
      }, { status: 200 });
    }

    // If linked to an existing incident, store the import as a source document
    if (incidentId) {
      await supabase.from('incident_images').insert({
        incident_id: incidentId,
        user_id: user.id,
        filename: file.name,
        storage_path: storagePath,
        url: publicUrl,
        mime_type: file.type,
        file_size: file.size,
        exif_data: {
          type: 'imported_document',
          source_system: extraction?.source_system || 'unknown',
          imported_at: new Date().toISOString(),
          original_filename: file.name,
        },
        ai_analysis: extraction,
      });
    }

    return NextResponse.json({
      success: true,
      extraction,
      archived_url: publicUrl,
      storage_path: storagePath,
      message: 'Document processed. Review the extracted data and confirm.',
    });

  } catch (error: any) {
    console.error('[PDF Import] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
