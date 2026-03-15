'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, getProfile } from '@/lib/supabase/client';
import type { UserProfile } from '@/lib/supabase/client';

interface AccountGuardProps {
  children: React.ReactNode;
  requiredType: 'consumer' | 'business';
  requireVerified?: boolean;
}

/**
 * Client-side route guard that checks account_type and email_verified.
 * Redirects unauthorized users to the appropriate page.
 */
export default function AccountGuard({ children, requiredType, requireVerified = true }: AccountGuardProps) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/login');
        return;
      }

      const profile = await getProfile(session.user.id);

      if (!profile) {
        router.push('/login');
        return;
      }

      // Check email verification
      if (requireVerified && !profile.email_verified) {
        router.push('/verify-email');
        return;
      }

      // Admin can access everything
      if (profile.is_admin) {
        setAuthorized(true);
        setLoading(false);
        return;
      }

      // Check account type
      if (profile.account_type !== requiredType) {
        // Redirect to the correct portal
        if (profile.account_type === 'consumer') {
          router.push('/portal/consumer');
        } else {
          router.push('/admin-v2');
        }
        return;
      }

      setAuthorized(true);
      setLoading(false);
    };

    checkAccess();
  }, [router, requiredType, requireVerified]);

  if (loading || !authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0f0f]">
        <div className="w-10 h-10 border-4 border-gold-500/30 border-t-gold-500 rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
