'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to admin-v2 (Tactical Command Center)
    router.replace('/admin-v2');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-white/60">Redirecting to Command Center...</p>
      </div>
    </div>
  );
}
