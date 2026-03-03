import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Metadata } from 'next';
import { HQSignOutButton } from './HQSignOutButton';

export const metadata: Metadata = {
  title: 'Greenline HQ',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function GreenlineHQLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.user_metadata?.role !== 'super_admin') {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] ring-2 ring-yellow-400/60">
      {/* Header Badge */}
      <header className="sticky top-0 z-50 border-b border-yellow-400/20 bg-[#0A0A0A]/95 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center">
              <svg
                className="w-4 h-4 text-black"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                />
              </svg>
            </div>
            <span className="text-xs font-bold tracking-widest uppercase text-yellow-400/90">
              Greenline HQ &mdash; Internal Only
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-white/30 font-mono">
              {user.email}
            </span>
            <HQSignOutButton />
          </div>
        </div>
      </header>

      <div className="relative">{children}</div>
    </div>
  );
}
