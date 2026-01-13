import { createBrowserClient } from '@supabase/ssr';
import { User, Session } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create the browser client with cookie support
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

// Factory function for creating fresh client instances (for components)
export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

// Auth helper functions
export async function signUp(email: string, password: string, fullName?: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName || email,
      },
    },
  });
  return { data, error };
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`,
    },
  });
  return { data, error };
}

export async function signInWithMagicLink(email: string, redirectTo?: string) {
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback${redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''}`,
    },
  });
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getSession(): Promise<{ session: Session | null; user: User | null }> {
  const { data: { session } } = await supabase.auth.getSession();
  return { session, user: session?.user || null };
}

export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function isAdmin(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', userId)
    .single();
  return data?.is_admin || false;
}

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
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  created_at?: string;
  source?: string;
  external_calendar_id?: string;
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
