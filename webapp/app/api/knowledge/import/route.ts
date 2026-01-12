import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { EventLogger } from '@/lib/event-logger';

/**
 * Knowledge Import API
 * Bulk upload business knowledge from CSV or JSON
 */

interface ImportChunk {
  category: string;
  subcategory?: string;
  title?: string;
  content: string;
  priority?: number;
}

interface CSVRow {
  category: string;
  subcategory?: string;
  title?: string;
  content: string;
  priority?: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      return handleJSONImport(supabase, user.id, request);
    } else if (contentType.includes('multipart/form-data')) {
      return handleFileImport(supabase, user.id, request);
    } else {
      return NextResponse.json({ error: 'Unsupported content type' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('[Knowledge Import] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function handleJSONImport(supabase: any, userId: string, request: NextRequest) {
  const body = await request.json();
  const { chunks, format } = body;

  if (!chunks || !Array.isArray(chunks)) {
    return NextResponse.json({ error: 'chunks array required' }, { status: 400 });
  }

  // Validate and transform chunks
  const validChunks: ImportChunk[] = [];
  const errors: string[] = [];

  chunks.forEach((chunk: any, index: number) => {
    if (!chunk.content || !chunk.category) {
      errors.push(`Row ${index + 1}: Missing required fields (content, category)`);
      return;
    }

    validChunks.push({
      category: chunk.category,
      subcategory: chunk.subcategory,
      title: chunk.title,
      content: chunk.content,
      priority: parseInt(chunk.priority) || 5,
    });
  });

  if (validChunks.length === 0) {
    return NextResponse.json({ 
      error: 'No valid chunks to import',
      details: errors 
    }, { status: 400 });
  }

  // Insert chunks
  const insertData = validChunks.map(chunk => ({
    user_id: userId,
    category: chunk.category,
    subcategory: chunk.subcategory,
    title: chunk.title,
    content: chunk.content,
    priority: chunk.priority,
    source: 'import',
    confidence: 1.0,
    is_active: true,
  }));

  const { data, error } = await supabase
    .from('memory_knowledge_chunks')
    .insert(insertData)
    .select('id, category, title');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Log the import event
  await EventLogger.knowledgeAdded(supabase, userId, 'bulk-import', `${data.length} items`);

  return NextResponse.json({
    success: true,
    imported: data.length,
    skipped: errors.length,
    errors: errors.length > 0 ? errors : undefined,
    items: data,
  });
}

async function handleFileImport(supabase: any, userId: string, request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  const content = await file.text();
  const fileName = file.name.toLowerCase();

  let chunks: ImportChunk[] = [];

  if (fileName.endsWith('.json')) {
    try {
      const parsed = JSON.parse(content);
      chunks = Array.isArray(parsed) ? parsed : parsed.chunks || [];
    } catch (e) {
      return NextResponse.json({ error: 'Invalid JSON format' }, { status: 400 });
    }
  } else if (fileName.endsWith('.csv')) {
    chunks = parseCSV(content);
  } else {
    return NextResponse.json({ error: 'Unsupported file format. Use .json or .csv' }, { status: 400 });
  }

  if (chunks.length === 0) {
    return NextResponse.json({ error: 'No data found in file' }, { status: 400 });
  }

  // Validate chunks
  const validChunks: ImportChunk[] = [];
  const errors: string[] = [];

  chunks.forEach((chunk: any, index: number) => {
    if (!chunk.content || !chunk.category) {
      errors.push(`Row ${index + 1}: Missing required fields`);
      return;
    }
    validChunks.push({
      category: chunk.category,
      subcategory: chunk.subcategory,
      title: chunk.title,
      content: chunk.content,
      priority: parseInt(chunk.priority as any) || 5,
    });
  });

  if (validChunks.length === 0) {
    return NextResponse.json({ 
      error: 'No valid data to import',
      details: errors 
    }, { status: 400 });
  }

  // Insert
  const insertData = validChunks.map(chunk => ({
    user_id: userId,
    category: chunk.category,
    subcategory: chunk.subcategory,
    title: chunk.title,
    content: chunk.content,
    priority: chunk.priority,
    source: 'file-import',
    confidence: 1.0,
    is_active: true,
  }));

  const { data, error } = await supabase
    .from('memory_knowledge_chunks')
    .insert(insertData)
    .select('id, category, title');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Log the import
  await EventLogger.knowledgeAdded(supabase, userId, 'file-import', `${data.length} items from ${fileName}`);

  return NextResponse.json({
    success: true,
    fileName,
    imported: data.length,
    skipped: errors.length,
    errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
  });
}

function parseCSV(content: string): ImportChunk[] {
  const lines = content.split('\n').map(line => line.trim()).filter(line => line);
  if (lines.length < 2) return [];

  // Parse header
  const header = parseCSVLine(lines[0]);
  const categoryIndex = header.findIndex(h => h.toLowerCase() === 'category');
  const subcategoryIndex = header.findIndex(h => h.toLowerCase() === 'subcategory');
  const titleIndex = header.findIndex(h => h.toLowerCase() === 'title');
  const contentIndex = header.findIndex(h => h.toLowerCase() === 'content');
  const priorityIndex = header.findIndex(h => h.toLowerCase() === 'priority');

  if (categoryIndex === -1 || contentIndex === -1) {
    throw new Error('CSV must have "category" and "content" columns');
  }

  const chunks: ImportChunk[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === 0) continue;

    chunks.push({
      category: values[categoryIndex] || 'general',
      subcategory: subcategoryIndex >= 0 ? values[subcategoryIndex] : undefined,
      title: titleIndex >= 0 ? values[titleIndex] : undefined,
      content: values[contentIndex] || '',
      priority: priorityIndex >= 0 ? parseInt(values[priorityIndex]) || 5 : 5,
    });
  }

  return chunks;
}

function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  values.push(current.trim());
  return values;
}

// GET - Download template
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format') || 'json';

  if (format === 'csv') {
    const template = `category,subcategory,title,content,priority
services,,AC Repair,"Full AC repair service including diagnosis, parts, and labor. Typical turnaround 2-4 hours.",8
services,,AC Installation,"New AC unit installation with warranty. Includes removal of old unit.",8
pricing,,Service Call,"$89 diagnostic fee, waived if you proceed with repair.",10
pricing,,Hourly Rate,"$125/hour for labor after first hour.",10
faq,,Emergency Service,"Yes, we offer 24/7 emergency service for an additional $50 fee.",7
processes,,Typical Job,"1. Schedule appointment 2. Technician diagnoses issue 3. Provide quote 4. Complete repair 5. Test system",6
anti-knowledge,,Competitor Mention,"Never mention or compare to other HVAC companies by name.",10`;

    return new Response(template, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="knowledge-template.csv"',
      },
    });
  }

  const template = {
    description: 'Knowledge Base Import Template',
    instructions: 'Fill in the chunks array with your business knowledge',
    chunks: [
      {
        category: 'services',
        subcategory: 'hvac',
        title: 'AC Repair',
        content: 'Full AC repair service including diagnosis, parts, and labor. Typical turnaround 2-4 hours.',
        priority: 8,
      },
      {
        category: 'pricing',
        title: 'Service Call',
        content: '$89 diagnostic fee, waived if you proceed with repair.',
        priority: 10,
      },
      {
        category: 'faq',
        title: 'Emergency Service',
        content: 'Yes, we offer 24/7 emergency service for an additional $50 fee.',
        priority: 7,
      },
      {
        category: 'anti-knowledge',
        title: 'Competitor Mention',
        content: 'Never mention or compare to other HVAC companies by name.',
        priority: 10,
      },
    ],
    validCategories: ['services', 'pricing', 'faq', 'products', 'processes', 'policies', 'anti-knowledge'],
  };

  return NextResponse.json(template, {
    headers: {
      'Content-Disposition': 'attachment; filename="knowledge-template.json"',
    },
  });
}
