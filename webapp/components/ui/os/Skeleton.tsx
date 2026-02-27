'use client';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  width?: string;
  height?: string;
  lines?: number;
}

export function Skeleton({ className = '', variant = 'text', width, height, lines = 1 }: SkeletonProps) {
  const baseClass = 'bg-obsidian-500/40 animate-shimmer rounded';
  const shimmerGradient = 'bg-[length:200%_100%] bg-gradient-to-r from-obsidian-500/40 via-obsidian-400/20 to-obsidian-500/40';

  if (variant === 'card') {
    return (
      <div className={`glass rounded-xl p-6 space-y-4 ${className}`}>
        <div className={`h-4 w-3/4 rounded ${baseClass} ${shimmerGradient}`} />
        <div className={`h-3 w-full rounded ${baseClass} ${shimmerGradient}`} />
        <div className={`h-3 w-5/6 rounded ${baseClass} ${shimmerGradient}`} />
        <div className="flex gap-3 pt-2">
          <div className={`h-8 w-20 rounded-full ${baseClass} ${shimmerGradient}`} />
          <div className={`h-8 w-24 rounded-full ${baseClass} ${shimmerGradient}`} />
        </div>
      </div>
    );
  }

  if (variant === 'circular') {
    return (
      <div
        className={`rounded-full ${baseClass} ${shimmerGradient} ${className}`}
        style={{ width: width || '40px', height: height || '40px' }}
      />
    );
  }

  if (variant === 'rectangular') {
    return (
      <div
        className={`rounded-lg ${baseClass} ${shimmerGradient} ${className}`}
        style={{ width: width || '100%', height: height || '120px' }}
      />
    );
  }

  // Text variant — supports multiple lines
  return (
    <div className={`space-y-2.5 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`h-3.5 rounded ${baseClass} ${shimmerGradient}`}
          style={{
            width: i === lines - 1 && lines > 1 ? '60%' : width || '100%',
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return <Skeleton variant="card" className={className} />;
}

export function SkeletonListItem({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-4 p-4 glass rounded-lg ${className}`}>
      <Skeleton variant="circular" width="48px" height="48px" />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" width="40%" />
      </div>
    </div>
  );
}
