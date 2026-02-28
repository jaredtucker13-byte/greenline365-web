import { Skeleton } from '@/components/ui/os';

export default function ListingLoading() {
  return (
    <div className="min-h-screen bg-obsidian">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Hero image skeleton */}
        <Skeleton variant="rectangular" height="320px" className="rounded-xl mb-8" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="space-y-3">
              <Skeleton variant="text" width="60%" />
              <div className="flex gap-2">
                <Skeleton variant="rectangular" width="80px" height="28px" className="rounded-full" />
                <Skeleton variant="rectangular" width="100px" height="28px" className="rounded-full" />
              </div>
              <Skeleton variant="text" lines={3} />
            </div>

            {/* Reviews skeleton */}
            <div className="glass rounded-xl p-6 space-y-4">
              <Skeleton variant="text" width="120px" />
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2 pb-4 border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-3">
                    <Skeleton variant="circular" width="36px" height="36px" />
                    <Skeleton variant="text" width="140px" />
                  </div>
                  <Skeleton variant="text" lines={2} />
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="glass rounded-xl p-5 space-y-4">
              <Skeleton variant="text" width="100px" />
              <Skeleton variant="text" lines={4} />
              <Skeleton variant="rectangular" height="44px" className="rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
