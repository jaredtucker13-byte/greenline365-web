'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { gsap, ScrollTrigger, useGSAP, createNavBlur } from '@/lib/gsap';
import { publicNav, destinationSubNav, isDashboardRoute as checkDashboardRoute } from '@/lib/navigation/navConfig';

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navRef = useRef<HTMLElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Hide navbar on dashboard routes (single-source config)
  const isOnDashboard = checkDashboardRoute(pathname);

  // Detect if on a destination subpage
  const isDestinationPage = pathname?.startsWith('/destination/');

  // GSAP-powered scroll blur effect
  useGSAP(() => {
    if (navRef.current) {
      createNavBlur(navRef.current);
    }
  }, []);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);

      if (session?.user) {
        const { data } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', session.user.id)
          .single();
        const adminStatus = data?.is_admin || false;
        setIsAdmin(adminStatus);
        setIsSuperAdmin(adminStatus);
      }
      setLoading(false);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        const { data } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', session.user.id)
          .single();
        const adminStatus = data?.is_admin || false;
        setIsAdmin(adminStatus);
        setIsSuperAdmin(adminStatus);
      } else {
        setIsAdmin(false);
        setIsSuperAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    localStorage.removeItem('greenline365_active_business');
    localStorage.removeItem('greenline365_edit_mode');
    await supabase.auth.signOut();
    setMobileMenuOpen(false);
    window.location.href = '/';
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/?q=${encodeURIComponent(searchQuery.trim())}`;
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  // Use destination sub-nav on destination pages, otherwise public nav
  const navLinks = isDestinationPage ? destinationSubNav : publicNav;

  // Don't render navbar on dashboard routes
  if (isOnDashboard) {
    return null;
  }

  return (
    <>
      <nav
        ref={navRef}
        className="main-nav fixed top-0 left-0 right-0 z-50 bg-transparent border-b border-white/5"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-20">
            {/* ── Logo — no subtitle ── */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative w-10 h-10">
                <motion.div
                  className="absolute inset-0 rounded-lg bg-gradient-to-br from-gold to-gold-300 opacity-20 blur-sm group-hover:opacity-40 transition-opacity duration-500"
                  animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.35, 0.2] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                />
                <div className="relative w-full h-full rounded-lg border border-gold/40 flex items-center justify-center bg-gold/10 group-hover:border-gold group-hover:shadow-gold-glow transition-all duration-300 overflow-hidden">
                  <svg className="w-6 h-6 text-gold" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1" opacity="0.3" />
                    <circle cx="12" cy="12" r="6.5" stroke="currentColor" strokeWidth="1" opacity="0.5" />
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1" opacity="0.7" />
                    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                    <line x1="12" y1="12" x2="12" y2="2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
                    <path d="M8.5 8.5 A5 5 0 0 1 15.5 8.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.6" />
                    <path d="M6 6 A8.5 8.5 0 0 1 18 6" stroke="currentColor" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.4" />
                  </svg>
                </div>
              </div>
              {/* Wordmark — NO subtitle */}
              <div className="font-heading">
                <div className="flex items-baseline">
                  <span className="text-xl font-bold text-white tracking-tight group-hover:text-gold transition-colors duration-300">Green</span>
                  <span className="text-xl font-bold tracking-tight text-gradient-gold">Line</span>
                  <span className="text-xl font-bold text-gold/80 tracking-tight">365</span>
                </div>
              </div>
            </Link>

            {/* ── Desktop Center Navigation ── */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link, index) => (
                <motion.div
                  key={link.label}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative"
                >
                  <Link
                    href={link.href || pathname || '/'}
                    className={`px-4 py-2 text-sm font-medium transition-all duration-300 relative group ${
                      pathname === link.href
                        ? 'text-gold'
                        : 'text-white/60 hover:text-gold'
                    }`}
                  >
                    {link.label}
                    <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-px bg-gradient-to-r from-transparent via-gold to-transparent transition-all duration-300 ${
                      pathname === link.href ? 'w-full' : 'w-0 group-hover:w-full'
                    }`} />
                  </Link>
                </motion.div>
              ))}

              {/* Search icon on destination pages */}
              {isDestinationPage && (
                <motion.button
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  onClick={() => { setSearchOpen(!searchOpen); setTimeout(() => searchInputRef.current?.focus(), 100); }}
                  className="px-3 py-2 text-white/60 hover:text-gold transition-all duration-300"
                  title="Search"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </motion.button>
              )}
            </div>

            {/* ── Desktop Right: Search + Sign In + Add Your Business (secondary) ── */}
            <div className="hidden md:flex items-center gap-3">
              {/* Search icon (non-destination pages) */}
              {!isDestinationPage && (
                <button
                  onClick={() => { setSearchOpen(!searchOpen); setTimeout(() => searchInputRef.current?.focus(), 100); }}
                  className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center hover:border-gold/40 hover:bg-gold/5 transition-all duration-300"
                  title="Search"
                >
                  <svg className="w-4 h-4 text-silver" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              )}

              {loading ? (
                <>
                  <Link
                    href="/login"
                    className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center hover:border-gold/40 hover:bg-gold/5 transition-all duration-300"
                    title="Sign In"
                  >
                    <svg className="w-4 h-4 text-silver" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                  </Link>
                  <Link
                    href="/register-business"
                    data-testid="nav-register-btn"
                    className="text-xs text-white/40 hover:text-gold border border-white/10 hover:border-gold/30 rounded-full px-4 py-2 font-medium transition-all duration-300"
                  >
                    Add Your Business
                  </Link>
                </>
              ) : user ? (
                <>
                  {isSuperAdmin && (
                    <Link
                      href="/greenline-hq"
                      className="text-xs text-yellow-400 border border-yellow-400/30 hover:bg-yellow-400/10 rounded-full px-4 py-2 font-medium transition-all duration-300"
                    >
                      Greenline HQ
                    </Link>
                  )}
                  {isAdmin && (
                    <Link
                      href="/dashboard"
                      className="text-xs text-white/60 border border-white/10 hover:text-white/80 hover:border-white/20 rounded-full px-4 py-2 font-medium transition-all duration-300"
                    >
                      Dashboard
                    </Link>
                  )}
                  <button
                    onClick={handleSignOut}
                    className="text-xs text-white/40 hover:text-white/60 border border-white/10 rounded-full px-4 py-2 font-medium transition-all duration-300"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center hover:border-gold/40 hover:bg-gold/5 transition-all duration-300"
                    title="Sign In"
                  >
                    <svg className="w-4 h-4 text-silver" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                  </Link>
                  <Link
                    href="/register-business"
                    data-testid="nav-register-btn"
                    className="text-xs text-white/40 hover:text-gold border border-white/10 hover:border-gold/30 rounded-full px-4 py-2 font-medium transition-all duration-300"
                  >
                    Add Your Business
                  </Link>
                </>
              )}
            </div>

            {/* ── Mobile Menu Button ── */}
            <motion.button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-lg glass hover:glass-gold transition-all"
              whileTap={{ scale: 0.95 }}
            >
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </motion.button>
          </div>
        </div>

        {/* ── Search Overlay ── */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 bg-[#0A0A0A]/95 backdrop-blur-xl border-b border-gold/10"
            >
              <form onSubmit={handleSearch} className="max-w-2xl mx-auto px-6 py-4">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-gold/60 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search businesses, categories, destinations..."
                    className="flex-1 bg-transparent text-white placeholder-white/30 text-sm font-body outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                    className="text-white/40 hover:text-white/60 transition"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ── Mobile Full-Screen Menu ── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 md:hidden"
          >
            <motion.div
              className="absolute inset-0 bg-midnight-950/98 backdrop-blur-2xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ delay: 0.1 }}
              className="relative h-full flex flex-col justify-center items-center p-8"
            >
              {/* Search bar in mobile menu */}
              <motion.div
                className="absolute top-24 left-1/2 -translate-x-1/2 w-full max-w-sm px-8"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <form onSubmit={(e) => { handleSearch(e); setMobileMenuOpen(false); }}>
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl glass border border-gold/20">
                    <svg className="w-4 h-4 text-gold/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search..."
                      className="flex-1 bg-transparent text-white placeholder-white/30 text-sm font-body outline-none"
                    />
                  </div>
                </form>
              </motion.div>

              <div className="w-full max-w-sm space-y-3">
                {navLinks.map((link, index) => (
                  <motion.div
                    key={link.label}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 + 0.2 }}
                  >
                    <Link
                      href={link.href || '/'}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`block w-full p-4 text-center text-2xl font-heading font-bold rounded-xl transition-all duration-300 ${
                        pathname === link.href
                          ? 'text-gold glass-gold'
                          : 'text-white/80 hover:text-gold hover:glass-gold'
                      }`}
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}

                {/* Mobile Auth */}
                {!loading && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="pt-8 space-y-3"
                  >
                    <div className="section-divider-gold mx-8 mb-4" />

                    {user ? (
                      <>
                        {isSuperAdmin && (
                          <Link
                            href="/greenline-hq"
                            onClick={() => setMobileMenuOpen(false)}
                            className="block w-full text-center text-lg px-8 py-4 rounded-xl border border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/10 transition-all duration-300"
                          >
                            Greenline HQ
                          </Link>
                        )}
                        {isAdmin && (
                          <Link
                            href="/dashboard"
                            onClick={() => setMobileMenuOpen(false)}
                            className="btn-secondary block w-full text-center text-lg px-8 py-4 transition-all duration-300"
                          >
                            Dashboard
                          </Link>
                        )}
                        <button
                          onClick={handleSignOut}
                          className="block w-full text-center text-lg px-8 py-4 rounded-xl border border-white/10 text-white/50 hover:text-white/80 transition-all duration-300"
                        >
                          Sign Out
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          href="/login"
                          onClick={() => setMobileMenuOpen(false)}
                          className="btn-secondary block w-full text-center text-lg px-8 py-4 font-semibold transition-all duration-300"
                        >
                          Sign In
                        </Link>
                        <Link
                          href="/register-business"
                          onClick={() => setMobileMenuOpen(false)}
                          className="block w-full text-center text-sm px-8 py-3 rounded-xl border border-white/10 text-white/40 hover:text-gold hover:border-gold/30 transition-all duration-300"
                        >
                          Add Your Business
                        </Link>
                      </>
                    )}
                  </motion.div>
                )}
              </div>

              <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-radial-green opacity-30 blur-3xl rounded-full pointer-events-none" />
              <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-radial-teal opacity-20 blur-3xl rounded-full pointer-events-none" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
