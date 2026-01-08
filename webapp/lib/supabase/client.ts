import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create a mock client for when env vars are missing (build time or missing config)
function createSupabaseClient(): SupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase environment variables not set. Using mock client.');
    return {
      from: () => ({
        select: () => ({ data: [], error: null, single: () => ({ data: null, error: null }) }),
        insert: () => ({ data: null, error: { message: 'Supabase not configured' }, select: () => ({ single: () => ({ data: null, error: null }) }) }),
        update: () => ({ data: null, error: { message: 'Supabase not configured' }, eq: () => ({ select: () => ({ single: () => ({ data: null, error: null }) }) }) }),
        delete: () => ({ data: null, error: { message: 'Supabase not configured' } }),
        upsert: () => ({ data: null, error: { message: 'Supabase not configured' } }),
        eq: () => ({ select: () => ({ single: () => ({ data: null, error: null }) }) }),
        order: () => ({ data: [], error: null }),
      }),
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: { message: 'Supabase not configured' } }),
        signUp: () => Promise.resolve({ data: { user: null, session: null }, error: { message: 'Supabase not configured' } }),
        signOut: () => Promise.resolve({ error: null }),
        signInWithOAuth: () => Promise.resolve({ data: { url: null, provider: 'google' }, error: { message: 'Supabase not configured' } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      },
    } as unknown as SupabaseClient;
  }
  
  return createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = createSupabaseClient();

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
