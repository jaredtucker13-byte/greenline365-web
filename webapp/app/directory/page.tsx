import { Suspense } from 'react';
import DirectoryClient from './DirectoryClient';

export const dynamic = 'force-dynamic';

export default function DirectoryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#C9A84C]/30 border-t-[#C9A84C] rounded-full animate-spin" />
      </div>
    }>
      <DirectoryClient />
    </Suspense>
  );
}
