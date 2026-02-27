'use client';

/**
 * BadgeDisplay — Renders the 7 industry reputation badges on listing pages.
 *
 * Free tier: All 7 badges shown in grayscale with lock icon ("Negative Light" strategy)
 * Pro+: Earned badges shown in full color, unearned shown in grayscale
 *
 * Badge types from OPERATIONAL_BIBLE_V2.md:
 *   cleanliness, vibe, expertise, safety, master_tech, community_favorite, network_leader
 */

interface Badge {
  id: string;
  badge_type: string;
  badge_label: string;
  badge_color: string;
  badge_icon?: string;
  is_active?: boolean;
  earned_at?: string;
}

interface BadgeDisplayProps {
  /** Earned badges from the API (directory_badges array) */
  earnedBadges: Badge[];
  /** The listing's tier: 'free' | 'pro' | 'premium' */
  tier: string;
  /** Whether the listing has been claimed */
  isClaimed: boolean;
  /** Compact mode for listing cards (shows icons only) */
  compact?: boolean;
}

/** The 7 canonical badge definitions */
const BADGE_DEFINITIONS = [
  {
    type: 'cleanliness',
    label: 'Cleanliness',
    icon: '✦',
    color: '#10B981',
    description: 'Verified clean environment',
  },
  {
    type: 'vibe',
    label: 'Vibe',
    icon: '◆',
    color: '#8B5CF6',
    description: 'Great atmosphere & experience',
  },
  {
    type: 'expertise',
    label: 'Expertise',
    icon: '★',
    color: '#3B82F6',
    description: 'Proven industry knowledge',
  },
  {
    type: 'safety',
    label: 'Safety',
    icon: '⬡',
    color: '#F59E0B',
    description: 'Safety standards verified',
  },
  {
    type: 'master_tech',
    label: 'Master Tech',
    icon: '⚙',
    color: '#EF4444',
    description: 'Technical excellence certified',
  },
  {
    type: 'community_favorite',
    label: 'Community Favorite',
    icon: '♥',
    color: '#00D4FF',
    description: '50+ positive reviews',
  },
  {
    type: 'network_leader',
    label: 'Network Leader',
    icon: '◈',
    color: '#C9A84C',
    description: 'Perfect record & 100+ interactions',
  },
] as const;

export function BadgeDisplay({ earnedBadges, tier, isClaimed, compact = false }: BadgeDisplayProps) {
  const isFree = tier === 'free';
  const earnedTypes = new Set(earnedBadges.map(b => b.badge_type));

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {BADGE_DEFINITIONS.map(def => {
          const isEarned = earnedTypes.has(def.type);
          const showLocked = isFree || !isEarned;

          return (
            <div
              key={def.type}
              className="relative group"
              title={showLocked ? `${def.label} — Locked` : def.label}
            >
              <span
                className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[9px] font-bold transition-all"
                style={showLocked
                  ? { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.08)' }
                  : { background: `${def.color}20`, color: def.color, border: `1px solid ${def.color}40` }
                }
              >
                {showLocked ? (
                  <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 1C8.676 1 6 3.676 6 7v2H4v14h16V9h-2V7c0-3.324-2.676-6-6-6zm0 2c2.276 0 4 1.724 4 4v2H8V7c0-2.276 1.724-4 4-4zm0 10c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z" />
                  </svg>
                ) : (
                  def.icon
                )}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  // Full display for listing detail pages
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h4 className="text-xs font-heading font-semibold text-white/60 uppercase tracking-wider">
          Reputation Badges
        </h4>
        {isFree && (
          <span className="text-[9px] text-white/25 font-body">(Upgrade to earn)</span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {BADGE_DEFINITIONS.map(def => {
          const isEarned = earnedTypes.has(def.type);
          const showLocked = isFree || !isEarned;

          return (
            <div
              key={def.type}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all ${
                showLocked
                  ? 'border-white/5 bg-white/[0.02]'
                  : 'border-white/10 bg-white/[0.04]'
              }`}
              style={!showLocked ? { borderColor: `${def.color}25` } : undefined}
            >
              {/* Badge Icon */}
              <span
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold flex-shrink-0 transition-all"
                style={showLocked
                  ? { background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.12)' }
                  : { background: `${def.color}15`, color: def.color, boxShadow: `0 0 12px ${def.color}20` }
                }
              >
                {showLocked ? (
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 1C8.676 1 6 3.676 6 7v2H4v14h16V9h-2V7c0-3.324-2.676-6-6-6zm0 2c2.276 0 4 1.724 4 4v2H8V7c0-2.276 1.724-4 4-4zm0 10c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z" />
                  </svg>
                ) : (
                  def.icon
                )}
              </span>

              {/* Badge Info */}
              <div className="min-w-0">
                <span
                  className={`text-xs font-heading font-semibold block truncate ${
                    showLocked ? 'text-white/20' : 'text-white/80'
                  }`}
                >
                  {def.label}
                </span>
                {showLocked ? (
                  <span className="text-[9px] text-white/10 font-body">Locked</span>
                ) : (
                  <span className="text-[9px] font-body" style={{ color: `${def.color}90` }}>
                    {def.description}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Upgrade prompt for free tier */}
      {isFree && isClaimed && (
        <p className="text-[10px] text-white/20 font-body text-center pt-1">
          Upgrade to Pro to start earning reputation badges
        </p>
      )}
    </div>
  );
}

export { BADGE_DEFINITIONS };
