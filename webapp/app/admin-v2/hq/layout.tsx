'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import HQSidebar from './components/HQSidebar';

export default function HQLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login?redirectTo=/admin-v2/hq');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (!profile?.is_admin) {
        router.push('/admin-v2');
        return;
      }

      setAuthorized(true);
      setChecking(false);
    };
    check();
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen bg-[#0A0E14] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-gold-500/30 border-t-gold-400 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60 text-sm tracking-wider">VERIFYING CLEARANCE...</p>
        </div>
      </div>
    );
  }

  if (!authorized) return null;

  return (
    <div className="min-h-screen bg-[#0A0E14] flex">
      <HQSidebar />
      <main className="flex-1 min-w-0 overflow-auto">
        {children}
      </main>
    </div>
  );
}
