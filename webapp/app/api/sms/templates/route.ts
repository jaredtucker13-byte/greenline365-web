import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET /api/sms/templates - List SMS templates
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('sms_templates')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return NextResponse.json({ templates: data || [] });
  } catch (error: any) {
    // If table doesn't exist, return default templates
    const defaultTemplates = [
      {
        id: '1',
        name: 'Booking Confirmation',
        slug: 'booking-confirmation',
        category: 'transactional',
        message: 'Hi {{name}}! Your booking with GreenLine365 is confirmed for {{date}} at {{time}}. Reply HELP for assistance.',
        variables: ['name', 'date', 'time'],
      },
      {
        id: '2',
        name: 'Appointment Reminder',
        slug: 'appointment-reminder',
        category: 'transactional',
        message: 'Reminder: You have an appointment tomorrow at {{time}}. Reply C to confirm or R to reschedule.',
        variables: ['time'],
      },
      {
        id: '3',
        name: 'Welcome Message',
        slug: 'welcome',
        category: 'marketing',
        message: 'Welcome to GreenLine365, {{name}}! 🎉 We\'re excited to help grow your business. Reply STOP to opt out.',
        variables: ['name'],
      },
      {
        id: '4',
        name: 'Promo Offer',
        slug: 'promo',
        category: 'marketing',
        message: '🔥 Special offer for {{name}}! Get {{discount}}% off your next service. Use code: {{code}}. Expires {{expiry}}.',
        variables: ['name', 'discount', 'code', 'expiry'],
      },
      {
        id: '5',
        name: 'OTP Verification',
        slug: 'otp',
        category: 'transactional',
        message: 'Your GreenLine365 verification code is: {{code}}. This code expires in 10 minutes. Do not share this code.',
        variables: ['code'],
      },
    ];
    
    return NextResponse.json({ templates: defaultTemplates });
  }
}

// POST /api/sms/templates - Create new template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, message, category, variables } = body;
    
    if (!name || !message) {
      return NextResponse.json(
        { error: 'Name and message are required' },
        { status: 400 }
      );
    }
    
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    const { data, error } = await supabase
      .from('sms_templates')
      .insert({
        name,
        slug,
        message,
        category: category || 'custom',
        variables: variables || [],
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return NextResponse.json({ template: data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create template' },
      { status: 500 }
    );
  }
}
