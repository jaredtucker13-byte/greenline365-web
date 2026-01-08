import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create a mock client for when env vars are missing (build time or missing config)
function createSupabaseClient(): SupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase environment variables not set. Using mock client.');
    // Return a mock client that won't crash but won't work either
    // This allows the app to build and show UI even without Supabase configured
    return {
      from: () => ({
        select: () => Promise.resolve({ data: [], error: null }),
        insert: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
        update: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
        delete: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
        upsert: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
      }),
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        signIn: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
        signOut: () => Promise.resolve({ error: null }),
      },
    } as unknown as SupabaseClient;
  }
  
  return createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = createSupabaseClient();

// Type definitions for your booking data
export interface BookingData {
  id?: string;
  full_name: string;
  company?: string;
  role?: string;
  business_name?: string;
  website?: string;
  industry?: string;
  needs?: string[];
  notes?: string;
  preferred_datetime: string;
  alternate_datetime?: string;
  email: string;
  phone?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  created_at?: string;
  source?: string; // For tracking which widget/company created the booking
  external_calendar_id?: string; // For future cal.com/Google Calendar integration
}

// Booking functions
export async function createBooking(data: Omit<BookingData, 'id' | 'created_at' | 'status'>) {
  const { data: booking, error } = await supabase
    .from('bookings')
    .insert([{ ...data, status: 'pending' }])
    .select()
    .single();

  if (error) throw error;
  return booking;
}

export async function getBookings() {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function updateBookingStatus(id: string, status: BookingData['status']) {
  const { data, error } = await supabase
    .from('bookings')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}
