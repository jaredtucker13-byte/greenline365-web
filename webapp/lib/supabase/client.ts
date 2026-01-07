import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
