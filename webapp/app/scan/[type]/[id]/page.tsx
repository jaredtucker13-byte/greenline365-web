/**
 * Universal QR Scan Landing Page
 *
 * /scan/[type]/[id]
 *
 * This is where every QR scan lands. Based on the entity type,
 * it either redirects to the appropriate page or shows an inline
 * action (check-in confirmation, loyalty visit, etc.).
 *
 * Routes:
 *   /scan/identity/:code  → View someone's Identity Passport
 *   /scan/event/:id       → Event check-in
 *   /scan/session/:id     → Join a Game Night session
 *   /scan/loyalty/:slug   → Log a loyalty visit
 *   /scan/challenge/:id   → Check in at a challenge stop
 *   /scan/openhouse/:id   → Open house sign-in
 *   /scan/game/:qr_id     → Game box scan → load game template
 *   /scan/facility/:id    → Facility/court info
 *   /scan/feedback/:id    → QR feedback form (industry-matched poll template)
 *
 * Note: /claim/[code] (deals) and /invite/[code] (groups) have their own routes.
 */
import { redirect } from 'next/navigation';
import FeedbackClient from './FeedbackClient';

// Route map: type → handler page (for types with dedicated pages)
const REDIRECT_MAP: Record<string, (id: string) => string> = {
  identity:  (id) => `/passport/${id}`,
  session:   (id) => `/game-night/${id}`,
  game:      (id) => `/game-library/${id}`,
  facility:  (id) => `/facilities/${id}`,
};

// Types that show an inline check-in experience
const INLINE_TYPES = ['event', 'loyalty', 'challenge', 'openhouse'];

export default async function ScanPage({
  params,
}: {
  params: Promise<{ type: string; id: string }>;
}) {
  const { type, id } = await params;

  // If this type has a dedicated page, redirect there
  if (REDIRECT_MAP[type]) {
    redirect(REDIRECT_MAP[type](id));
  }

  // QR feedback form — industry-matched poll template
  if (type === 'feedback') {
    return <FeedbackClient listingId={id} />;
  }

  // For inline types, show the check-in UI
  if (INLINE_TYPES.includes(type)) {
    return <ScanCheckIn type={type} entityId={id} />;
  }

  // Unknown type — show a helpful fallback
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
      <div className="max-w-sm w-full text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-[#C9A96E]/10 flex items-center justify-center">
          <svg className="w-8 h-8 text-[#C9A96E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-white">QR Code Scanned</h1>
        <p className="text-white/60 text-sm">
          This QR code was recognized but the feature isn&apos;t available yet.
        </p>
        <a
          href="/"
          className="inline-block px-6 py-2 rounded-lg bg-[#C9A96E] text-[#0A0A0A] font-medium text-sm hover:bg-[#E8D5A3] transition-colors"
        >
          Go to GreenLine365
        </a>
      </div>
    </div>
  );
}

// ─── Inline Check-In Component ───────────────────────────────────

function ScanCheckIn({ type, entityId }: { type: string; entityId: string }) {
  const typeLabels: Record<string, { title: string; action: string; icon: string }> = {
    event:     { title: 'Event Check-In', action: 'Check In', icon: 'ticket' },
    loyalty:   { title: 'Loyalty Visit', action: 'Log Visit', icon: 'heart' },
    challenge: { title: 'Challenge Stop', action: 'Check In', icon: 'flag' },
    openhouse: { title: 'Open House Sign-In', action: 'Sign In', icon: 'home' },
  };

  const config = typeLabels[type] || { title: 'Check-In', action: 'Confirm', icon: 'check' };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
      <div className="max-w-sm w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#C9A96E]/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-[#C9A96E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white">{config.title}</h1>
          <p className="text-white/50 text-sm">ID: {entityId}</p>
        </div>

        {/* Check-in form — this will be dynamic per type in future phases */}
        <div className="rounded-xl border border-[#C9A96E]/20 bg-white/5 p-6 space-y-4">
          <p className="text-white/70 text-sm text-center">
            Sign in to your GreenLine365 account to {config.action.toLowerCase()}, or enter your info below.
          </p>

          <div className="space-y-3">
            <input
              type="text"
              placeholder="Your name"
              className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:border-[#C9A96E]/50 focus:outline-none transition-colors"
            />
            <input
              type="email"
              placeholder="Email address"
              className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:border-[#C9A96E]/50 focus:outline-none transition-colors"
            />
          </div>

          <button
            className="w-full py-2.5 rounded-lg bg-[#C9A96E] text-[#0A0A0A] font-semibold text-sm hover:bg-[#E8D5A3] transition-colors"
          >
            {config.action}
          </button>
        </div>

        <p className="text-center text-[10px] text-white/30">
          Powered by GreenLine365
        </p>
      </div>
    </div>
  );
}
