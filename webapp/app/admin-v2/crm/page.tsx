'use client';

/**
 * CRM Page - Redirects to consolidated CRM Dashboard
 * 
 * This page now redirects to /admin-v2/crm-dashboard which contains
 * the consolidated CRM functionality with both metrics and lead management.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CRMRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/admin-v2/crm-dashboard');
  }, [router]);
  
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[#39FF14]/30 border-t-[#39FF14] rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white/60">Redirecting to CRM Dashboard...</p>
      </div>
    </div>
  );
}
