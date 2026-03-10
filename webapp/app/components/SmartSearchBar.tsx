'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';

/* ─── Route → placeholder mapping ──────────────────────────── */
const ROUTE_PLACEHOLDERS: Record<string, string> = {
  '/explore/dining':          'Ask: Best outdoor seating nearby?',
  '/explore/beaches':         'Ask: Top dog-friendly beaches?',
  '/explore/destinations':    'Ask: Weekend getaway ideas?',
  '/services/home':           'Ask: Find emergency HVAC repair',
  '/services/professional':   'Ask: Find a licensed CPA near me',
  '/services/community':      'Ask: Local tutoring services?',
  '/services':                'Ask: Find a trusted pro today',
  '/community/claim':         'Ask: How do I claim my listing?',
  '/community/suggest':       'Ask: Suggest a hidden gem',
  '/community/faq':           'Ask: How does verification work?',
  '/community/contact':       'Ask: Reach our support team',
  '/community':               'Ask: Join the GreenLine community',
  '/why-greenline':           'Ask: What makes GreenLine different?',
  '/why-greenline/story':     'Ask: Who founded GreenLine365?',
  '/why-greenline/trust':     'Ask: How is trust verified?',
  '/home-ledger':             'Ask: What is a home health score?',
  '/pricing':                 'Ask: Compare listing tiers',
  '/directory':               'Ask: Find a top-rated business',
};

/* Theme color per route prefix */
type ThemeKey = 'services' | 'explore' | 'community' | 'default';

const THEME_GRADIENTS: Record<ThemeKey, string> = {
  services:  'from-gold/20 via-gold/5 to-transparent',
  explore:   'from-gold/25 via-amber-500/5 to-transparent',
  community: 'from-gold/15 via-yellow-600/5 to-transparent',
  default:   'from-gold/10 via-transparent to-transparent',
};

const THEME_BORDERS: Record<ThemeKey, string> = {
  services:  'border-gold/25',
  explore:   'border-gold/30',
  community: 'border-gold/20',
  default:   'border-white/10',
};

function resolveTheme(pathname: string): ThemeKey {
  if (pathname.startsWith('/services')) return 'services';
  if (pathname.startsWith('/explore')) return 'explore';
  if (pathname.startsWith('/community')) return 'community';
  return 'default';
}

function resolvePlaceholder(pathname: string): string {
  // Exact match first
  if (ROUTE_PLACEHOLDERS[pathname]) return ROUTE_PLACEHOLDERS[pathname];

  // Destination city pages
  if (pathname.startsWith('/explore/destinations/')) return 'Ask: Top things to do here?';

  // Prefix match (longest first)
  const sorted = Object.keys(ROUTE_PLACEHOLDERS).sort((a, b) => b.length - a.length);
  for (const route of sorted) {
    if (pathname.startsWith(route)) return ROUTE_PLACEHOLDERS[route];
  }

  return 'Search GreenLine365…';
}

/* ─── Sparkle SVG ──────────────────────────────────────────── */
function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2L13.09 8.26L18 6L14.74 10.91L21 12L14.74 13.09L18 18L13.09 15.74L12 22L10.91 15.74L6 18L9.26 13.09L3 12L9.26 10.91L6 6L10.91 8.26L12 2Z"
        fill="currentColor"
        opacity="0.9"
      />
    </svg>
  );
}

/* ─── Dashboard / admin routes where bar is hidden ─────────── */
const HIDDEN_PREFIXES = ['/admin', '/dashboard', '/greenline-hq', '/portal', '/login', '/register', '/api'];
const HIDDEN_EXACT = ['/'];

export default function SmartSearchBar() {
  const pathname = usePathname() || '/';
  const router = useRouter();
  const [query, setQuery] = useState('');

  const isHidden = HIDDEN_EXACT.includes(pathname) || HIDDEN_PREFIXES.some((p) => pathname.startsWith(p));
  const theme = useMemo(() => resolveTheme(pathname), [pathname]);
  const placeholder = useMemo(() => resolvePlaceholder(pathname), [pathname]);

  if (isHidden) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/directory?q=${encodeURIComponent(query.trim())}`);
    setQuery('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className="fixed top-[5.5rem] left-4 right-4 z-40 pointer-events-none"
    >
      <form
        onSubmit={handleSubmit}
        className={`
          pointer-events-auto max-w-xl mx-auto flex items-center gap-2
          px-4 py-2.5 rounded-full border
          ${THEME_BORDERS[theme]}
          bg-gradient-to-r ${THEME_GRADIENTS[theme]}
          backdrop-blur-xl
          shadow-[0_4px_24px_rgba(0,0,0,0.3)]
          transition-all duration-500
          group
          focus-within:border-gold/50 focus-within:shadow-[0_4px_32px_rgba(201,168,76,0.15)]
        `}
        style={{
          background: `linear-gradient(135deg, rgba(10,10,10,0.8) 0%, rgba(10,10,10,0.65) 100%)`,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        {/* Search icon */}
        <svg
          className="w-4 h-4 text-white/40 shrink-0 group-focus-within:text-gold/70 transition-colors duration-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>

        {/* Input */}
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="
            flex-1 bg-transparent text-sm text-white/90
            placeholder-white/30 outline-none font-body
            min-w-0
          "
        />

        {/* Sparkle icon */}
        <motion.div
          animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.15, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="shrink-0"
        >
          <SparkleIcon className="w-4 h-4 text-gold/60 group-focus-within:text-gold transition-colors duration-300" />
        </motion.div>
      </form>
    </motion.div>
  );
}
