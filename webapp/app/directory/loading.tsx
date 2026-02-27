import { Skeleton, SkeletonCard } from '@/components/ui/os';

export default function DirectoryLoading() {
  return (
    <div className="min-h-screen bg-obsidian">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search bar skeleton */}
        <div className="mb-8 space-y-4">
          <Skeleton variant="text" width="40%" className="mx-auto" />
          <Skeleton variant="rectangular" height="48px" className="max-w-2xl mx-auto rounded-full" />
        </div>

        {/* Filter chips skeleton */}
        <div className="flex gap-3 mb-8 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" width="100px" height="36px" className="rounded-full flex-shrink-0" />
          ))}
        </div>

        {/* Listing grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="glass rounded-xl overflow-hidden">
              <Skeleton variant="rectangular" height="180px" className="rounded-none" />
              <div className="p-4 space-y-3">
                <Skeleton variant="text" width="70%" />
                <Skeleton variant="text" width="50%" />
                <div className="flex gap-2">
                  <Skeleton variant="rectangular" width="60px" height="24px" className="rounded-full" />
                  <Skeleton variant="rectangular" width="80px" height="24px" className="rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
