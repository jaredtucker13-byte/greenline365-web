import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/waitlist - Fetch waitlist submissions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    
    const supabase = await createClient();
    
    let query = supabase
      .from('waitlist_submissions')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch waitlist' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ submissions: data, count: data?.length || 0 });
  } catch (error) {
    console.error('Error fetching waitlist:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, company, industry } = body;

    // Validate required fields
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = await createClient();

    // Insert into waitlist_submissions table
    const { data, error } = await supabase
      .from('waitlist_submissions')
      .insert([
        {
          email,
          name: name || null,
          company: company || null,
          industry: industry || null,
          source: 'website',
          status: 'pending',
        },
      ])
      .select()
      .single();

    if (error) {
      // Check for duplicate email
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'This email is already on the waitlist' },
          { status: 409 }
        );
      }
      
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to join waitlist' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Successfully joined the waitlist!', data },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error adding to waitlist:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
