'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase, getProfile } from '@/lib/supabase/client';
import AccountGuard from '@/components/auth/AccountGuard';

const NAV_ITEMS = [
  { href: '/portal/consumer', label: 'Dashboard', icon: 'home' },
  { href: '/portal/consumer/favorites', label: 'Favorites', icon: 'heart' },
  { href: '/portal/consumer/deals', label: 'Deals', icon: 'tag' },
  { href: '/portal/consumer/profile', label: 'Profile', icon: 'user' },
];

function NavIcon({ icon, className }: { icon: string; className?: string }) {
  const cls = className || 'w-5 h-5';
  switch (icon) {
    case 'home':
      return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
    case 'heart':
      return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>;
    case 'tag':
      return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>;
    case 'user':
      return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
    default:
      return null;
  }
}

function ConsumerPortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserEmail(session.user.email || '');
        const profile = await getProfile(session.user.id);
        setUserName(profile?.full_name || session.user.email || '');
      }
    };
    loadUser();
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-white/10 bg-[#0f0f0f]">
        <div className="p-6 border-b border-white/10">
          <Link href="/" className="text-gold-400 font-bold text-lg">GreenLine365</Link>
          <p className="text-white/40 text-xs mt-1">Consumer Portal</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-gold-500/10 text-gold-400 border border-gold-500/20'
                    : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                }`}
              >
                <NavIcon icon={item.icon} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-gold-500/20 flex items-center justify-center text-sm font-bold text-gold-400">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm text-white/80 truncate">{userName}</p>
              <p className="text-xs text-white/40 truncate">{userEmail}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-[#0f0f0f] border-r border-white/10 flex flex-col">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div>
                <Link href="/" className="text-gold-400 font-bold text-lg">GreenLine365</Link>
                <p className="text-white/40 text-xs mt-1">Consumer Portal</p>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="text-white/40 hover:text-white">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="flex-1 p-4 space-y-1">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-gold-500/10 text-gold-400 border border-gold-500/20'
                        : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                    }`}
                  >
                    <NavIcon icon={item.icon} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#0f0f0f]">
          <button onClick={() => setSidebarOpen(true)} className="text-white/60 hover:text-white">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-gold-400 font-bold text-sm">GreenLine365</span>
          <div className="w-8 h-8 rounded-full bg-gold-500/20 flex items-center justify-center text-xs font-bold text-gold-400">
            {userName.charAt(0).toUpperCase()}
          </div>
        </header>

        <main className="flex-1 p-6 md:p-8 overflow-auto">
          {children}
        </main>

        {/* Mobile bottom tab bar */}
        <nav className="md:hidden flex border-t border-white/10 bg-[#0f0f0f]">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-xs transition ${
                  isActive ? 'text-gold-400' : 'text-white/40'
                }`}
              >
                <NavIcon icon={item.icon} className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

export default function ConsumerPortalRoot({ children }: { children: React.ReactNode }) {
  return (
    <AccountGuard requiredType="consumer">
      <ConsumerPortalLayout>{children}</ConsumerPortalLayout>
    </AccountGuard>
  );
}
