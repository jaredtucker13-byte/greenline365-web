import { Suspense } from 'react';
import DirectoryClient from './DirectoryClient';

export const dynamic = 'force-dynamic';

function DirectoryLoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4 p-8">
      <div className="h-8 bg-white/10 rounded w-1/3" />
      <div className="h-4 bg-white/10 rounded w-1/2" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-64 bg-white/10 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default function DirectoryPage() {
  return (
    <Suspense fallback={<DirectoryLoadingSkeleton />}>
      <DirectoryClient />
    </Suspense>
  );
}
