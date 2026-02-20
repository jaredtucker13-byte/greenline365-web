import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import PortalShell from './PortalShell';

export const metadata: Metadata = {
  title: 'Portal - GreenLine365',
  description: 'Manage your business listing, photos, hours, and more.',
};

export const dynamic = 'force-dynamic';

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/portal');
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <PortalShell>{children}</PortalShell>
    </div>
  );
}
