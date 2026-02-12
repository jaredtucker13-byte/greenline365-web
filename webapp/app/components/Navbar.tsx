'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/os';

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  // Hide navbar on dashboard routes
  const isDashboardRoute = pathname?.startsWith('/admin-v2') || 
                           pathname?.startsWith('/dashboard') || 
                           pathname?.startsWith('/god-mode');

  // Scroll detection for nav blur effect
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleScroll = () => {
        setScrolled(window.scrollY > 20);
      };
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, []);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      
      if (session?.user) {
        // Check if user is in super_admins table
        const { data: superAdminData } = await supabase
          .from('super_admins')
          .select('user_id')
          .eq('user_id', session.user.id)
          .single();
        
        setIsSuperAdmin(!!superAdminData);
        
        // Check regular admin status
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
        // Check super admin
        const { data: superAdminData } = await supabase
          .from('super_admins')
          .select('user_id')
          .eq('user_id', session.user.id)
          .single();
        
        setIsSuperAdmin(!!superAdminData);
        
        // Check regular admin
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
    { href: '/services', label: 'Our Services' },
  ];

  // Don't render navbar on dashboard routes
  if (isDashboardRoute) {
    return null;
  }

  return (
    <>
      <nav 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled 
            ? 'glass-strong shadow-glass border-b border-white/10' 
            : 'bg-transparent border-b border-white/5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative w-10 h-10">
                <motion.div
                  className="absolute inset-0 rounded-lg bg-gradient-to-br from-gold to-gold-300 opacity-20 blur-sm group-hover:opacity-30 transition-opacity"
                  animate={{ scale: [1, 1.1, 1], rotate: [0, 5, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                />
                <div className="relative w-full h-full rounded-lg border border-gold/40 flex items-center justify-center bg-gold/10 group-hover:border-gold group-hover:shadow-gold-glow transition-all duration-300">
                  <svg className="w-5 h-5 text-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <div className="font-heading">
                <div className="flex items-baseline">
                  <span className="text-xl font-semibold text-white group-hover:text-gold transition-colors duration-300">GreenLine</span>
                  <span className="text-xl font-semibold text-gradient-gold">365</span>
                </div>
                <div className="text-[10px] text-white/40 tracking-wider uppercase font-medium -mt-1">Business Directory</div>
              </div>
            </Link>

            {/* System Status Indicator */}
            <motion.div 
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full glass-gold border border-gold/20"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <motion.div 
                className="w-2 h-2 rounded-full bg-greenline shadow-intel-glow"
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-xs font-semibold text-gold tracking-wide">LIVE</span>
            </motion.div>

            {/* Desktop Navigation */}
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
                        className="px-4 py-2 text-sm font-medium text-white/70 hover:text-gold transition-all duration-300 relative group flex items-center gap-1"
                      >
                        {link.label}
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gold group-hover:w-full transition-all duration-300" />
                      </button>
                      
                      {/* Dropdown Menu */}
                      <AnimatePresence>
                        {((link.label === 'Features' && featuresOpen) || (link.label === 'Industries' && industriesOpen)) && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            transition={{ duration: 0.2 }}
                            className="absolute top-full left-0 mt-2 w-56 rounded-xl border border-gold/20 backdrop-blur-2xl shadow-xl overflow-hidden"
                            style={{ background: 'rgba(28, 28, 30, 0.95)' }}
                          >
                            {link.dropdown.map((item, i) => (
                              <Link
                                key={item.href}
                                href={item.href}
                                className="block px-4 py-3 text-sm text-white/80 hover:text-gold hover:bg-white/5 transition-all duration-200"
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
                      className="px-4 py-2 text-sm font-medium text-white/70 hover:text-gold transition-all duration-300 relative group"
                    >
                      {link.label}
                      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gold group-hover:w-full transition-all duration-300" />
                    </Link>
                  )}
                </motion.div>
              ))}
              
              {/* Auth Section */}
              {loading ? (
                <div className="flex items-center gap-2 ml-2">
                  <Link
                    href="/login"
                    className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center hover:border-gold/40 transition-all"
                    title="Sign In"
                  >
                    <svg className="w-4 h-4 text-silver" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                  </Link>
                  <Link
                    href="/register-business"
                    data-testid="nav-register-btn"
                    className="px-4 py-2 text-sm font-semibold text-gold/80 rounded-full transition-all hover:text-gold hover:bg-gold/10 font-heading border border-gold/30 hover:border-gold/50"
                  >
                    Add Your Business
                  </Link>
                </div>
              ) : user ? (
                <div className="flex items-center gap-2 ml-2">
                  {isSuperAdmin && (
                    <Link
                      href="/god-mode"
                      className="px-4 py-2 text-sm font-medium text-red-400 hover:text-red-300 transition-colors"
                    >
                      God Mode
                    </Link>
                  )}
                  {isAdmin && (
                    <Link
                      href="/dashboard"
                      className="px-4 py-2 text-sm font-medium text-gold hover:text-gold-300 transition-colors"
                    >
                      Dashboard
                    </Link>
                  )}
                  <button
                    onClick={handleSignOut}
                    className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 ml-2">
                  <Link
                    href="/login"
                    className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center hover:border-gold/40 hover:bg-gold/5 transition-all"
                    title="Sign In"
                  >
                    <svg className="w-4 h-4 text-silver" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                  </Link>
                  <Link
                    href="/register-business"
                    data-testid="nav-register-btn"
                    className="px-4 py-2 text-sm font-semibold text-gold/80 rounded-full transition-all hover:text-gold hover:bg-gold/10 font-heading border border-gold/30 hover:border-gold/50"
                  >
                    Add Your Business
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <motion.button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-lg glass hover:glass-green transition-all"
              whileTap={{ scale: 0.95 }}
            >
              <svg 
                className="w-6 h-6 text-white" 
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

      {/* Mobile Full-Screen Menu */}
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
              className="absolute inset-0 bg-os-dark/95 backdrop-blur-xl"
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
              <div className="w-full max-w-md space-y-2">
                {navLinks.map((link, index) => (
                  <motion.div
                    key={link.href || link.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 + 0.2 }}
                  >
                    {link.dropdown ? (
                      <div>
                        <div className="block w-full p-4 text-center text-2xl font-display font-bold text-neon-green-500">
                          {link.label}
                        </div>
                        {link.dropdown.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className="block w-full p-3 text-center text-lg text-white/80 hover:text-neon-green-500 transition-all duration-300 rounded-xl hover:glass-green"
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <Link
                        href={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="block w-full p-4 text-center text-2xl font-display font-bold text-white hover:text-neon-green-500 transition-all duration-300 rounded-xl hover:glass-green"
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
                    transition={{ delay: 0.6 }}
                    className="pt-6 space-y-2"
                  >
                    {user ? (
                      <>
                        {isSuperAdmin && (
                          <Link
                            href="/god-mode"
                            onClick={() => setMobileMenuOpen(false)}
                            className="block w-full p-4 text-center text-xl font-semibold text-red-400 rounded-xl glass-green"
                          >
                            God Mode
                          </Link>
                        )}
                        {isAdmin && (
                          <Link
                            href="/dashboard"
                            onClick={() => setMobileMenuOpen(false)}
                            className="block w-full p-4 text-center text-xl font-semibold text-neon-green-500 rounded-xl glass-green"
                          >
                            Dashboard
                          </Link>
                        )}
                        <button
                          onClick={handleSignOut}
                          className="block w-full p-4 text-center text-xl font-semibold text-white/70 rounded-xl glass"
                        >
                          Sign Out
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          href="/register-business"
                          onClick={() => setMobileMenuOpen(false)}
                          className="block w-full p-4 text-center text-xl font-bold bg-neon-green-500 text-black rounded-xl"
                        >
                          Add Your Business
                        </Link>
                        <Link
                          href="/login"
                          onClick={() => setMobileMenuOpen(false)}
                          className="block w-full p-4 text-center text-xl font-semibold text-white/70 rounded-xl glass"
                        >
                          Sign In
                        </Link>
                      </>
                    )}
                  </motion.div>
                )}
              </div>
              
              {/* Decorative Elements */}
              <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-radial-green opacity-20 blur-3xl" />
              <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-radial-teal opacity-20 blur-3xl" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
