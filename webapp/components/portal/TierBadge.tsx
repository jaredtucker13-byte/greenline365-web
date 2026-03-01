'use client';

interface TierBadgeProps {
  tier: 'free' | 'directory_pro' | 'command_center' | 'bundle' | string;
  size?: 'sm' | 'md';
}

const TIER_CONFIG: Record<string, { label: string; className: string }> = {
  free: {
    label: 'FREE',
    className: 'bg-white/10 text-white/60 border-white/20',
  },
  directory_pro: {
    label: 'PRO',
    className: 'bg-gold-500/20 text-gold-500 border-gold-500/40',
  },
  command_center: {
    label: 'COMMAND CENTER',
    className: 'bg-neon-teal-500/20 text-neon-teal-500 border-neon-teal-500/40',
  },
  bundle: {
    label: 'BUNDLE',
    className: 'bg-neon-amber-500/20 text-neon-amber-500 border-neon-amber-500/40',
  },
};

export default function TierBadge({ tier, size = 'sm' }: TierBadgeProps) {
  const config = TIER_CONFIG[tier] || TIER_CONFIG.free;
  const sizeClasses = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-3 py-1';

  return (
    <span
      className={`inline-flex items-center rounded-full border font-bold uppercase tracking-wider ${config.className} ${sizeClasses}`}
    >
      {config.label}
    </span>
  );
}
