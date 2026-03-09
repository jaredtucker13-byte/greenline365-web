'use client';

import Link from 'next/link';
import { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/os';
import { publicMegaMenus, floridaDestinations, isDashboardRoute as checkDashboardRoute } from '@/lib/navigation/navConfig';
import type { MegaMenuDropdown } from '@/lib/navigation/navConfig';

export default function Navbar() {
  const pathname: string = usePathname() || '/';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileExpandedMenu, setMobileExpandedMenu] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const dropdownTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isOnDashboard = checkDashboardRoute(pathname);

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event: any, session: any) => {
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

  const handleDropdownEnter = (menuId: string): void => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
      dropdownTimeoutRef.current = null;
    }
    setActiveDropdown(menuId);
  };

  const handleDropdownLeave = (): void => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 150);
  };

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setMobileExpandedMenu(null);
  }, [pathname]);

  if (isOnDashboard) {
    return null;
  }

  return (
    <>
      {/* Floating glass pill navbar */}
      <nav
        ref={navRef}
        className="fixed top-4 left-4 right-4 z-50"
      >
        <div
          className="max-w-7xl mx-auto px-6 rounded-[32px] border border-white/10"
          style={{
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            background: 'rgba(10, 10, 10, 0.75)',
          }}
        >
          <div className="flex justify-between items-center h-16">
            {/* ── Logo ── */}
            <Link href="/" className="flex items-center gap-3 group shrink-0">
              <div className="relative w-9 h-9">
                <motion.div
                  className="absolute inset-0 rounded-lg bg-gradient-to-br from-gold to-gold-300 opacity-20 blur-sm group-hover:opacity-40 transition-opacity duration-500"
                  animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.35, 0.2] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                />
                <div className="relative w-full h-full rounded-lg border border-gold/40 flex items-center justify-center bg-gold/10 group-hover:border-gold group-hover:shadow-gold-glow transition-all duration-300 overflow-hidden">
                  <svg className="w-5 h-5 text-gold" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1" opacity="0.3" />
                    <circle cx="12" cy="12" r="6.5" stroke="currentColor" strokeWidth="1" opacity="0.5" />
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1" opacity="0.7" />
                    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                    <line x1="12" y1="12" x2="12" y2="2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
                  </svg>
                </div>
              </div>
              <div className="font-heading hidden sm:block">
                <div className="flex items-baseline">
                  <span className="text-lg font-bold text-white tracking-tight group-hover:text-gold transition-colors duration-300">Green</span>
                  <span className="text-lg font-bold tracking-tight text-gradient-gold">Line</span>
                  <span className="text-lg font-bold text-gold/80 tracking-tight">365</span>
                </div>
                <div className="text-[9px] text-white/30 tracking-[0.2em] uppercase font-medium -mt-0.5">Florida&apos;s Local Guide</div>
              </div>
            </Link>

            {/* ── Desktop Mega-Menu Nav ── */}
            <div className="hidden lg:flex items-center gap-1">
              {publicMegaMenus.map((menu) => (
                <DesktopDropdown
                  key={menu.id}
                  menu={menu}
                  isOpen={activeDropdown === menu.id}
                  onEnter={() => handleDropdownEnter(menu.id)}
                  onLeave={handleDropdownLeave}
                  pathname={pathname}
                />
              ))}
            </div>

            {/* ── Right side: Search + CTA + Auth ── */}
            <div className="hidden lg:flex items-center gap-3">
              {/* Search Icon */}
              <Link
                href="/#categories"
                className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center hover:border-gold/40 hover:bg-white/5 transition-all duration-300"
                title="Search Directory"
              >
                <svg className="w-4 h-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </Link>

              {/* Auth Section */}
              {loading ? null : user ? (
                <>
                  {isSuperAdmin && (
                    <Link href="/greenline-hq" className="text-xs text-yellow-400/80 hover:text-yellow-400 transition-colors duration-300">
                      HQ
                    </Link>
                  )}
                  {isAdmin && (
                    <Link href="/dashboard" className="text-xs text-white/50 hover:text-gold transition-colors duration-300">
                      Dashboard
                    </Link>
                  )}
                  <Button variant="ghost" size="sm" onClick={handleSignOut} className="!text-white/50 !border-white/10 hover:!text-white/80 !text-xs">
                    Sign Out
                  </Button>
                </>
              ) : (
                <Link href="/login" className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center hover:border-gold/40 hover:bg-white/5 transition-all duration-300" title="Sign In">
                  <svg className="w-4 h-4 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </Link>
              )}

              {/* CTA */}
              <Link
                href="/register-business"
                className="px-4 py-2 text-xs font-semibold rounded-full bg-gradient-to-r from-gold to-gold-300 text-black hover:shadow-lg hover:shadow-gold/20 transition-all duration-300"
              >
                Add Your Business
              </Link>
            </div>

            {/* ── Mobile Menu Button ── */}
            <div className="flex lg:hidden items-center gap-2">
              <Link
                href="/register-business"
                className="px-3 py-1.5 text-[10px] font-semibold rounded-full bg-gradient-to-r from-gold to-gold-300 text-black"
              >
                Add Business
              </Link>
              <motion.button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="w-10 h-10 flex items-center justify-center rounded-full border border-white/10 hover:bg-white/5 transition-all"
                whileTap={{ scale: 0.95 }}
              >
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </motion.button>
            </div>
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
            className="fixed inset-0 z-40 lg:hidden"
          >
            <motion.div
              className="absolute inset-0 bg-[#0A0A0A]/98 backdrop-blur-2xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ delay: 0.1 }}
              className="relative h-full overflow-y-auto pt-24 pb-8 px-6"
            >
              <div className="max-w-sm mx-auto space-y-2">
                {publicMegaMenus.map((menu, index) => (
                  <motion.div
                    key={menu.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.08 + 0.15 }}
                  >
                    <button
                      onClick={() => setMobileExpandedMenu(mobileExpandedMenu === menu.id ? null : menu.id)}
                      className="w-full flex items-center justify-between p-4 rounded-2xl text-left hover:bg-white/5 transition-all duration-300"
                    >
                      <span className="text-xl font-heading font-bold text-white">{menu.label}</span>
                      <motion.svg
                        className="w-5 h-5 text-gold/60"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        animate={{ rotate: mobileExpandedMenu === menu.id ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </motion.svg>
                    </button>

                    <AnimatePresence>
                      {mobileExpandedMenu === menu.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="pl-4 pb-2 space-y-1">
                            {menu.groups.map((group) => (
                              <div key={group.label}>
                                {menu.groups.length > 1 && (
                                  <p className="text-[10px] uppercase tracking-widest text-gold/40 font-semibold px-4 pt-3 pb-1">{group.label}</p>
                                )}
                                {group.items.map((item) => (
                                  <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all duration-300"
                                  >
                                    <span className="text-lg">{item.icon}</span>
                                    <div>
                                      <div className="text-sm font-medium text-white/80">{item.label}</div>
                                      <div className="text-xs text-white/35">{item.description}</div>
                                    </div>
                                  </Link>
                                ))}
                                {/* Destinations sub-links */}
                                {menu.id === 'explore' && group.label === 'Destinations' && (
                                  <div className="pl-10 space-y-1 pt-1">
                                    {floridaDestinations.map((city) => (
                                      <Link
                                        key={city.slug}
                                        href={`/explore/destinations/${city.slug}`}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="block py-1.5 text-xs text-white/40 hover:text-gold transition-colors duration-300"
                                      >
                                        {city.label}
                                      </Link>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}

                {/* Mobile Auth */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="pt-6 space-y-3"
                >
                  <div className="h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent mx-4 mb-4" />

                  {!loading && (
                    <>
                      {user ? (
                        <>
                          {isSuperAdmin && (
                            <Link href="/greenline-hq" onClick={() => setMobileMenuOpen(false)} className="block w-full text-center p-3 text-yellow-400 rounded-xl hover:bg-white/5 transition-all">
                              Greenline HQ
                            </Link>
                          )}
                          {isAdmin && (
                            <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="block w-full text-center p-3 text-white/70 rounded-xl hover:bg-white/5 transition-all">
                              Dashboard
                            </Link>
                          )}
                          <Button variant="ghost" size="lg" fullWidth onClick={handleSignOut} className="!text-white/50 !border-white/15">
                            Sign Out
                          </Button>
                        </>
                      ) : (
                        <>
                          <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="block w-full text-center p-3 text-white/70 rounded-xl border border-white/10 hover:bg-white/5 transition-all">
                            Sign In
                          </Link>
                          <Link href="/register-business" onClick={() => setMobileMenuOpen(false)} className="block w-full text-center p-3 rounded-xl bg-gradient-to-r from-gold to-gold-300 text-black font-semibold">
                            Add Your Business
                          </Link>
                        </>
                      )}
                    </>
                  )}
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Desktop Dropdown Component ─────────────────────────────────────

function DesktopDropdown({
  menu,
  isOpen,
  onEnter,
  onLeave,
  pathname,
}: {
  menu: MegaMenuDropdown;
  isOpen: boolean;
  onEnter: () => void;
  onLeave: () => void;
  pathname: string;
}) {
  // Check if any item in this menu matches current path
  const isActive = menu.groups.some(g => g.items.some(i => pathname.startsWith(i.href)));

  return (
    <div
      className="relative"
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <button
        className={`px-4 py-2 text-sm font-medium transition-all duration-300 relative group flex items-center gap-1 rounded-full ${
          isActive ? 'text-gold' : 'text-white/60 hover:text-white hover:bg-white/5'
        }`}
      >
        {menu.label}
        <svg
          className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} opacity-50 group-hover:opacity-100`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-72 rounded-[32px] border border-white/10 shadow-2xl overflow-hidden"
            style={{
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              background: 'rgba(10, 10, 10, 0.85)',
            }}
          >
            <div className="p-3">
              {menu.groups.map((group) => (
                <div key={group.label}>
                  {menu.groups.length > 1 && (
                    <p className="text-[10px] uppercase tracking-widest text-gold/40 font-semibold px-3 pt-3 pb-1">{group.label}</p>
                  )}
                  {group.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-white/5 transition-all duration-300 group/item"
                    >
                      <span className="text-lg w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 group-hover/item:bg-gold/10 transition-colors duration-300">{item.icon}</span>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-white/80 group-hover/item:text-gold transition-colors duration-300">{item.label}</div>
                        <div className="text-xs text-white/35 truncate">{item.description}</div>
                      </div>
                    </Link>
                  ))}
                  {/* Destinations city sub-links */}
                  {menu.id === 'explore' && group.label === 'Destinations' && (
                    <div className="grid grid-cols-2 gap-1 px-3 pt-1 pb-2">
                      {floridaDestinations.map((city) => (
                        <Link
                          key={city.slug}
                          href={`/explore/destinations/${city.slug}`}
                          className="text-xs text-white/35 hover:text-gold py-1 px-2 rounded-lg hover:bg-white/5 transition-all duration-300"
                        >
                          {city.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
