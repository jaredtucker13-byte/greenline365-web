'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      
      if (session?.user) {
        // Check if user is admin
        const { data } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', session.user.id)
          .single();
        setIsAdmin(data?.is_admin || false);
      }
      setLoading(false);
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        const { data } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', session.user.id)
          .single();
        setIsAdmin(data?.is_admin || false);
      } else {
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setMobileMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-40 backdrop-blur-xl bg-black/30 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold">
            <span className="text-white">Green</span>
            <span className="text-emerald-400">Line365</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/" className="text-white/70 hover:text-white transition">
              Home
            </Link>
            <Link href="/about" className="text-white/70 hover:text-white transition">
              About
            </Link>
            <Link href="/how-it-works" className="text-white/70 hover:text-white transition">
              How It Works
            </Link>
            <Link href="/pricing" className="text-white/70 hover:text-white transition">
              Pricing
            </Link>
            <Link href="/support" className="text-white/70 hover:text-white transition">
              Support
            </Link>
            
            {/* Auth Section */}
            {!loading && (
              <>
                {user ? (
                  <div className="flex items-center space-x-4">
                    {isAdmin && (
                      <Link
                        href="/dashboard"
                        className="text-emerald-400 hover:text-emerald-300 transition font-medium"
                      >
                        Dashboard
                      </Link>
                    )}
                    <button
                      onClick={handleSignOut}
                      className="text-white/70 hover:text-white transition"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <Link
                    href="/login"
                    className="text-white/70 hover:text-white transition"
                  >
                    Login
                  </Link>
                )}
              </>
            )}
            
            <Link
              href="/demo-calendar"
              className="px-5 py-2 bg-emerald-500 text-black font-semibold rounded-lg hover:bg-emerald-400 transition"
            >
              Book Demo
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-10 h-10 flex items-center justify-center"
          >
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden pt-4 pb-2 space-y-3">
            <Link href="/" className="block text-white/70 hover:text-white transition py-2" onClick={() => setMobileMenuOpen(false)}>
              Home
            </Link>
            <Link href="/about" className="block text-white/70 hover:text-white transition py-2" onClick={() => setMobileMenuOpen(false)}>
              About
            </Link>
            <Link href="/how-it-works" className="block text-white/70 hover:text-white transition py-2" onClick={() => setMobileMenuOpen(false)}>
              How It Works
            </Link>
            <Link href="/use-cases" className="block text-white/70 hover:text-white transition py-2" onClick={() => setMobileMenuOpen(false)}>
              Use Cases
            </Link>
            <Link href="/pricing" className="block text-white/70 hover:text-white transition py-2" onClick={() => setMobileMenuOpen(false)}>
              Pricing
            </Link>
            <Link href="/support" className="block text-white/70 hover:text-white transition py-2" onClick={() => setMobileMenuOpen(false)}>
              Support
            </Link>
            <Link
              href="/demo-calendar"
              onClick={() => setMobileMenuOpen(false)}
              className="block w-full px-5 py-2 bg-emerald-500 text-black font-semibold rounded-lg hover:bg-emerald-400 transition text-center"
            >
              Book Demo
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
