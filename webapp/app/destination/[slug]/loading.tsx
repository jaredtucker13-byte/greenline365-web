import { Skeleton } from '@/components/ui/os';

export default function DestinationLoading() {
  return (
    <div className="min-h-screen bg-obsidian">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero skeleton */}
        <Skeleton variant="rectangular" height="280px" className="rounded-xl mb-8" />

        <div className="space-y-3 mb-10">
          <Skeleton variant="text" width="50%" />
          <Skeleton variant="text" lines={2} width="80%" />
        </div>

        {/* Category tabs skeleton */}
        <div className="flex gap-3 mb-8">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" width="110px" height="40px" className="rounded-full flex-shrink-0" />
          ))}
        </div>

        {/* Business grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass rounded-xl overflow-hidden">
              <Skeleton variant="rectangular" height="160px" className="rounded-none" />
              <div className="p-4 space-y-2">
                <Skeleton variant="text" width="75%" />
                <Skeleton variant="text" width="50%" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
