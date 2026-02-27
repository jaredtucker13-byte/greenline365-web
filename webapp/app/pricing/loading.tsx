import { Skeleton } from '@/components/ui/os';

export default function PricingLoading() {
  return (
    <div className="min-h-screen bg-obsidian">
      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12 space-y-4">
          <Skeleton variant="text" width="400px" className="mx-auto" />
          <Skeleton variant="text" width="300px" className="mx-auto" />
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={`glass rounded-xl p-6 space-y-6 ${i === 1 ? 'ring-1 ring-gold/30' : ''}`}>
              <div className="space-y-2">
                <Skeleton variant="text" width="80px" />
                <Skeleton variant="text" width="120px" />
              </div>
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, j) => (
                  <div key={j} className="flex items-center gap-2">
                    <Skeleton variant="circular" width="20px" height="20px" />
                    <Skeleton variant="text" width="80%" />
                  </div>
                ))}
              </div>
              <Skeleton variant="rectangular" height="44px" className="rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
