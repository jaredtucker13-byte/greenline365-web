'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/os';
import { gsap, ScrollTrigger, useGSAP, createNavBlur } from '@/lib/gsap';

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const navRef = useRef<HTMLElement>(null);

  // Hide navbar on dashboard routes
  const isDashboardRoute = pathname?.startsWith('/admin-v2') ||
                           pathname?.startsWith('/dashboard') ||
                           pathname?.startsWith('/god-mode');

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
        const { data: superAdminData } = await supabase
          .from('super_admins')
          .select('user_id')
          .eq('user_id', session.user.id)
          .single();

        setIsSuperAdmin(!!superAdminData);

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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        const { data: superAdminData } = await supabase
          .from('super_admins')
          .select('user_id')
          .eq('user_id', session.user.id)
          .single();

        setIsSuperAdmin(!!superAdminData);

        const { data } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', session.user.id)
          .single();
        setIsAdmin(data?.is_admin || false);
      } else {
        setIsAdmin(false);
        setIsSuperAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setMobileMenuOpen(false);
  };

  const [featuresOpen, setFeaturesOpen] = useState(false);
  const [industriesOpen, setIndustriesOpen] = useState(false);

  const navLinks: { href: string; label: string; dropdown?: { href: string; label: string }[] }[] = [
    { href: '/', label: 'Directory' },
    { href: '/loops', label: 'Experiences' },
    { href: '/home-ledger', label: 'Home Ledger' },
    { href: '/services', label: 'Our Services' },
  ];

  // Don't render navbar on dashboard routes
  if (isDashboardRoute) {
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
            {/* ── Futuristic Logo ── */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative w-10 h-10">
                {/* Glow pulse behind logo */}
                <motion.div
                  className="absolute inset-0 rounded-lg bg-gradient-to-br from-gold to-gold-300 opacity-20 blur-sm group-hover:opacity-40 transition-opacity duration-500"
                  animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.35, 0.2] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                />
                {/* Radar / signal icon container */}
                <div className="relative w-full h-full rounded-lg border border-gold/40 flex items-center justify-center bg-gold/10 group-hover:border-gold group-hover:shadow-gold-glow transition-all duration-300 overflow-hidden">
                  {/* Radar sweep SVG */}
                  <svg className="w-6 h-6 text-gold" viewBox="0 0 24 24" fill="none">
                    {/* Outer ring */}
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1" opacity="0.3" />
                    {/* Middle ring */}
                    <circle cx="12" cy="12" r="6.5" stroke="currentColor" strokeWidth="1" opacity="0.5" />
                    {/* Inner ring */}
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1" opacity="0.7" />
                    {/* Center dot */}
                    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                    {/* Signal line */}
                    <line x1="12" y1="12" x2="12" y2="2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
                    {/* Signal arcs */}
                    <path d="M8.5 8.5 A5 5 0 0 1 15.5 8.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.6" />
                    <path d="M6 6 A8.5 8.5 0 0 1 18 6" stroke="currentColor" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.4" />
                  </svg>
                </div>
              </div>
              {/* Wordmark */}
              <div className="font-heading">
                <div className="flex items-baseline">
                  <span className="text-xl font-bold text-white tracking-tight group-hover:text-gold transition-colors duration-300">Green</span>
                  <span className="text-xl font-bold tracking-tight text-gradient-gold">Line</span>
                  <span className="text-xl font-bold text-gold/80 tracking-tight">365</span>
                </div>
                <div className="text-[10px] text-white/30 tracking-[0.2em] uppercase font-medium -mt-0.5">Business OS</div>
              </div>
            </Link>

            {/* ── System Status Indicator ── */}
            <motion.div
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full glass-gold border border-gold/20"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <motion.div
                className="w-2 h-2 rounded-full bg-gold shadow-gold-glow"
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-xs font-semibold text-gold tracking-wide">LIVE</span>
            </motion.div>

            {/* ── Desktop Navigation ── */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link, index) => (
                <motion.div
                  key={link.href || link.label}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative"
                  onMouseEnter={() => {
                    if (link.label === 'Features') setFeaturesOpen(true);
                    if (link.label === 'Industries') setIndustriesOpen(true);
                  }}
                  onMouseLeave={() => {
                    if (link.label === 'Features') setFeaturesOpen(false);
                    if (link.label === 'Industries') setIndustriesOpen(false);
                  }}
                >
                  {link.dropdown ? (
                    <>
                      <button
                        className="px-4 py-2 text-sm font-medium text-white/60 hover:text-gold transition-all duration-300 relative group flex items-center gap-1"
                      >
                        {link.label}
                        <svg className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent group-hover:w-full transition-all duration-300" />
                      </button>

                      {/* Dropdown Menu */}
                      <AnimatePresence>
                        {((link.label === 'Features' && featuresOpen) || (link.label === 'Industries' && industriesOpen)) && (
                          <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.96 }}
                            transition={{ duration: 0.2 }}
                            className="absolute top-full left-0 mt-2 w-56 rounded-xl glass-strong border border-gold/15 shadow-xl overflow-hidden"
                          >
                            {link.dropdown.map((item) => (
                              <Link
                                key={item.href}
                                href={item.href}
                                className="block px-4 py-3 text-sm text-white/70 hover:text-gold hover:bg-gold/5 transition-all duration-200 border-b border-white/5 last:border-0"
                              >
                                {item.label}
                              </Link>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  ) : (
                    <Link
                      href={link.href}
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
                  )}
                </motion.div>
              ))}

              {/* ── Auth Section ── */}
              {loading ? (
                <div className="flex items-center gap-3 ml-4">
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
                    className="btn-primary inline-flex items-center justify-center text-sm px-4 py-2 font-medium transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Add Your Business
                  </Link>
                </div>
              ) : user ? (
                <div className="flex items-center gap-2 ml-4">
                  {isSuperAdmin && (
                    <Link
                      href="/god-mode"
                      className="btn-ghost inline-flex items-center justify-center text-sm px-4 py-2 !text-red-400 !border-red-400/30 hover:!bg-red-400/10 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      God Mode
                    </Link>
                  )}
                  {isAdmin && (
                    <Link
                      href="/dashboard"
                      className="btn-ghost inline-flex items-center justify-center text-sm px-4 py-2 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      Dashboard
                    </Link>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSignOut}
                    className="!text-white/50 !border-white/10 hover:!text-white/80"
                  >
                    Sign Out
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-3 ml-4">
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
                    className="btn-primary inline-flex items-center justify-center text-sm px-4 py-2 font-medium transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Add Your Business
                  </Link>
                </div>
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
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-midnight-950/98 backdrop-blur-2xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* Menu Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ delay: 0.1 }}
              className="relative h-full flex flex-col justify-center items-center p-8"
            >
              {/* OS-style status bar */}
              <motion.div
                className="absolute top-24 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full glass-gold border border-gold/20"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <motion.div
                  className="w-2 h-2 rounded-full bg-gold"
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span className="text-xs font-semibold text-gold tracking-widest">NAVIGATION</span>
              </motion.div>

              <div className="w-full max-w-sm space-y-3">
                {navLinks.map((link, index) => (
                  <motion.div
                    key={link.href || link.label}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 + 0.2 }}
                  >
                    {link.dropdown ? (
                      <div className="space-y-1">
                        <div className="block w-full p-4 text-center text-xl font-heading font-bold text-gold">
                          {link.label}
                        </div>
                        {link.dropdown.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className="block w-full p-3 text-center text-lg text-white/70 hover:text-gold transition-all duration-300 rounded-xl hover:glass-gold"
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <Link
                        href={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`block w-full p-4 text-center text-2xl font-heading font-bold rounded-xl transition-all duration-300 ${
                          pathname === link.href
                            ? 'text-gold glass-gold'
                            : 'text-white/80 hover:text-gold hover:glass-gold'
                        }`}
                      >
                        {link.label}
                      </Link>
                    )}
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
                    {/* Divider */}
                    <div className="section-divider-gold mx-8 mb-4" />

                    {user ? (
                      <>
                        {isSuperAdmin && (
                          <Link
                            href="/god-mode"
                            onClick={() => setMobileMenuOpen(false)}
                            className="btn-ghost block w-full text-center text-lg px-8 py-4 !text-red-400 !border-red-400/30 hover:!bg-red-400/10 transition-all duration-300"
                          >
                            God Mode
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
                        <Button
                          variant="ghost"
                          size="lg"
                          fullWidth
                          onClick={handleSignOut}
                          className="!text-white/50 !border-white/15"
                        >
                          Sign Out
                        </Button>
                      </>
                    ) : (
                      <>
                        <Link
                          href="/register-business"
                          onClick={() => setMobileMenuOpen(false)}
                          className="btn-primary block w-full text-center text-lg px-8 py-4 font-semibold transition-all duration-300"
                        >
                          Add Your Business
                        </Link>
                        <Link
                          href="/login"
                          onClick={() => setMobileMenuOpen(false)}
                          className="btn-ghost block w-full text-center text-lg px-8 py-4 transition-all duration-300"
                        >
                          Sign In
                        </Link>
                      </>
                    )}
                  </motion.div>
                )}
              </div>

              {/* Decorative ambient orbs */}
              <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-radial-green opacity-30 blur-3xl rounded-full pointer-events-none" />
              <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-radial-teal opacity-20 blur-3xl rounded-full pointer-events-none" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
