import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { nanoid } from 'nanoid';

/**
 * AI-Powered Onboarding Extraction API
 * 
 * The "Zero-Friction" engine that extracts business data from:
 * - Photos/PDFs (menus, flyers, documents)
 * - Website URLs (scraping)
 * - Brand voice text
 * 
 * Uses Gemini 2.5 Pro for multimodal extraction
 * 
 * POST /api/onboarding/extract - Upload files and extract data
 */

const GEMINI_API_KEY = process.env.EMERGENT_LLM_KEY;
const UPLOAD_DIR = '/tmp/onboarding-uploads';

interface ExtractionRequest {
  businessId: string;
  
  // Multimodal inputs
  files?: Array<{
    name: string;
    type: string; // mime type
    data: string; // base64
  }>;
  
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
    const { businessId, files, websiteUrl, brandVoiceText, industry, location } = body;

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

    // Step 1: Extract from files (photos/PDFs)
    if (files && files.length > 0) {
      const fileData = await extractFromFiles(files, industry, location);
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

// Extract data from uploaded files using Gemini 2.5 Pro vision
async function extractFromFiles(
  files: Array<{ name: string; type: string; data: string }>,
  industry?: string,
  location?: string
): Promise<{ services: any[]; businessInfo: any }> {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured');
  }

  // Ensure upload directory exists
  await mkdir(UPLOAD_DIR, { recursive: true });

  // Save files temporarily
  const filePaths = await Promise.all(
    files.map(async (file) => {
      const buffer = Buffer.from(file.data.split(',')[1], 'base64');
      const filename = `${nanoid()}-${file.name}`;
      const filepath = join(UPLOAD_DIR, filename);
      await writeFile(filepath, buffer);
      return { path: filepath, mime: file.type };
    })
  );

  try {
    // Use emergentintegrations for Gemini multimodal
    const { execSync } = require('child_process');
    
    // Create Python script for extraction
    const pythonScript = `
import os
import json
import asyncio
from emergentintegrations.llm.chat import LlmChat, UserMessage, FileContentWithMimeType
from dotenv import load_dotenv

load_dotenv()

async def extract():
    chat = LlmChat(
        api_key=os.getenv('EMERGENT_LLM_KEY'),
        session_id='onboarding-extraction-${nanoid()}',
        system_message='''You are a business data extraction expert. 
Extract structured information from documents like menus, flyers, price lists, etc.
Return ONLY valid JSON with this exact structure:
{
  "services": [{"name": "...", "description": "...", "price": "...", "category": "..."}],
  "businessInfo": {"name": "...", "tagline": "...", "description": "...", "hours": "...", "contact": {}}
}'''
    ).with_model("gemini", "gemini-2.5-pro")
    
    files = [
        ${filePaths.map(f => `FileContentWithMimeType(file_path="${f.path}", mime_type="${f.mime}")`).join(',\n        ')}
    ]
    
    prompt = """Analyze these business documents and extract:
    1. All services/products with names, descriptions, and prices
    2. Business name, tagline, hours, contact info
    
    Industry context: ${industry || 'general'}
    Location: ${location || 'unknown'}
    
    Return valid JSON only."""
    
    message = UserMessage(text=prompt, file_contents=files)
    response = await chat.send_message(message)
    print(response)

asyncio.run(extract())
`;

    // Write and execute Python script
    const scriptPath = join(UPLOAD_DIR, `extract-${nanoid()}.py`);
    await writeFile(scriptPath, pythonScript);
    
    const output = execSync(`python3 ${scriptPath}`, {
      encoding: 'utf-8',
      timeout: 60000,
    });

    // Parse JSON from output
    const jsonMatch = output.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[File Extraction] No JSON in response:', output);
      return { services: [], businessInfo: {} };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      services: parsed.services || [],
      businessInfo: parsed.businessInfo || {},
    };

  } catch (error) {
    console.error('[File Extraction] Error:', error);
    return { services: [], businessInfo: {} };
  }
}

// Extract data from website using existing scraper + Gemini
async function extractFromWebsite(url: string): Promise<{
  services: any[];
  brandVoice: any;
  businessInfo: any;
  faq: any[];
}> {
  try {
    // Use existing scrape API
    const scrapeResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/scrape`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });

    const scrapeData = await scrapeResponse.json();
    const rawContent = scrapeData.raw_content || scrapeData.content || '';

    if (!rawContent) {
      return { services: [], brandVoice: {}, businessInfo: {}, faq: [] };
    }

    // Analyze with Gemini using emergentintegrations
    const { execSync } = require('child_process');
    
    const pythonScript = `
import os
import json
import asyncio
from emergentintegrations.llm.chat import LlmChat, UserMessage
from dotenv import load_dotenv

load_dotenv()

async def analyze():
    chat = LlmChat(
        api_key=os.getenv('EMERGENT_LLM_KEY'),
        session_id='website-extraction-${nanoid()}',
        system_message='You are a business intelligence extraction expert.'
    ).with_model("gemini", "gemini-2.5-pro")
    
    prompt = """Analyze this website content and extract structured data:

${rawContent.replace(/"/g, '\\"').substring(0, 50000)}

Return ONLY valid JSON:
{
  "services": [{"name": "...", "description": "...", "price": "..."}],
  "brandVoice": {"tone": [], "values": [], "mission": "", "target_audience": ""},
  "businessInfo": {"name": "...", "tagline": "...", "description": "..."},
  "faq": [{"question": "...", "answer": "..."}]
}"""
    
    response = await chat.send_message(UserMessage(text=prompt))
    print(response)

asyncio.run(analyze())
`;

    const scriptPath = join(UPLOAD_DIR, `web-extract-${nanoid()}.py`);
    await mkdir(UPLOAD_DIR, { recursive: true });
    await writeFile(scriptPath, pythonScript);
    
    const output = execSync(`python3 ${scriptPath}`, {
      encoding: 'utf-8',
      timeout: 90000,
    });

    const jsonMatch = output.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { services: [], brandVoice: {}, businessInfo: {}, faq: [] };
    }

    return JSON.parse(jsonMatch[0]);

  } catch (error) {
    console.error('[Website Extraction] Error:', error);
    return { services: [], brandVoice: {}, businessInfo: {}, faq: [] };
  }
}

// Analyze brand voice text using Gemini thinking mode
async function analyzeBrandVoice(text: string): Promise<any> {
  try {
    const { execSync } = require('child_process');
    
    const pythonScript = `
import os
import json
import asyncio
from emergentintegrations.llm.chat import LlmChat, UserMessage
from dotenv import load_dotenv

load_dotenv()

async def analyze():
    chat = LlmChat(
        api_key=os.getenv('EMERGENT_LLM_KEY'),
        session_id='brand-voice-${nanoid()}',
        system_message='You are a brand strategy expert who distills brand identity from text.'
    ).with_model("gemini", "gemini-2.5-pro")
    
    prompt = """Analyze this brand text and extract the core identity:

${text.replace(/"/g, '\\"').substring(0, 10000)}

Return ONLY valid JSON:
{
  "tone": ["professional", "friendly", "authoritative"],
  "values": ["quality", "innovation", "trust"],
  "mission": "one sentence mission",
  "target_audience": "who they serve",
  "unique_selling_points": ["point 1", "point 2"]
}"""
    
    response = await chat.send_message(UserMessage(text=prompt))
    print(response)

asyncio.run(analyze())
`;

    const scriptPath = join(UPLOAD_DIR, `voice-${nanoid()}.py`);
    await mkdir(UPLOAD_DIR, { recursive: true });
    await writeFile(scriptPath, pythonScript);
    
    const output = execSync(`python3 ${scriptPath}`, {
      encoding: 'utf-8',
      timeout: 30000,
    });

    const jsonMatch = output.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {};
    }

    return JSON.parse(jsonMatch[0]);

  } catch (error) {
    console.error('[Brand Voice Analysis] Error:', error);
    return {};
  }
}
