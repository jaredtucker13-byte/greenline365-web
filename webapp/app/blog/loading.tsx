import { Skeleton } from '@/components/ui/os';

export default function BlogLoading() {
  return (
    <div className="min-h-screen bg-obsidian">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header skeleton */}
        <div className="text-center mb-12 space-y-4">
          <Skeleton variant="text" width="300px" className="mx-auto" />
          <Skeleton variant="text" width="500px" className="mx-auto" />
        </div>

        {/* Blog grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass rounded-xl overflow-hidden">
              <Skeleton variant="rectangular" height="200px" className="rounded-none" />
              <div className="p-5 space-y-3">
                <Skeleton variant="rectangular" width="80px" height="22px" className="rounded-full" />
                <Skeleton variant="text" width="90%" />
                <Skeleton variant="text" lines={2} />
                <div className="flex items-center gap-3 pt-2">
                  <Skeleton variant="circular" width="32px" height="32px" />
                  <Skeleton variant="text" width="120px" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
