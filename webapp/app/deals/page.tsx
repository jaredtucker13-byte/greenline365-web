'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface BlastDeal {
  id: string;
  title: string;
  description: string;
  deal_type: string;
  deal_value: string;
  terms: string | null;
  time_window: string | null;
  claim_code: string;
  claim_url: string;
  max_claims: number | null;
  current_claims: number;
  expires_at: string;
  category: string | null;
  tags: string[];
  status: string;
  listing_id: string | null;
  created_at: string;
  business_name: string | null;
  business_slug: string | null;
  business_city: string | null;
  business_state: string | null;
  business_logo_url: string | null;
  business_industry: string | null;
}

function timeRemaining(expiresAt: string): string {
  const now = new Date();
  const end = new Date(expiresAt);
  const diff = end.getTime() - now.getTime();

  if (diff <= 0) return 'Expired';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h left`;
  }
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
}

function getDealTypeLabel(type: string): string {
  switch (type) {
    case 'percent_off': return '% Off';
    case 'dollar_off': return '$ Off';
    case 'bogo': return 'BOGO';
    case 'free_item': return 'Freebie';
    case 'bundle': return 'Bundle';
    default: return 'Deal';
  }
}

export default function DealsPage() {
  const [deals, setDeals] = useState<BlastDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchDeals();
  }, []);

  const fetchDeals = async () => {
    try {
      const res = await fetch('/api/blast-deals?browse=active');
      const data = await res.json();
      if (data.success) {
        setDeals(data.deals || []);
      }
    } catch {
      // Silently fail — show empty state
    } finally {
      setLoading(false);
    }
  };

  const categories = ['all', ...new Set(deals.map(d => d.category).filter(Boolean) as string[])];
  const filteredDeals = filter === 'all' ? deals : deals.filter(d => d.category === filter);

  return (
    <main className="min-h-screen bg-obsidian pt-24 pb-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-block bg-gold-500/10 text-gold-400 text-xs font-bold px-4 py-1.5 rounded-full mb-4 tracking-wider border border-gold-500/20">
            LOCAL DEALS
          </div>
          <h1 className="text-4xl font-bold text-white sm:text-5xl">
            Blast Deals
          </h1>
          <p className="mt-3 text-lg text-white/50 max-w-xl mx-auto">
            Flash deals from local businesses near you. Claim before they expire.
          </p>
        </div>

        {/* Category Filter */}
        {categories.length > 1 && (
          <div className="flex flex-wrap gap-2 justify-center mb-8">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  filter === cat
                    ? 'bg-gold-500 text-black'
                    : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10 hover:text-white'
                }`}
              >
                {cat === 'all' ? 'All Deals' : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse rounded-xl border border-white/10 bg-white/5 p-6">
                <div className="h-4 bg-white/10 rounded w-1/3 mb-4" />
                <div className="h-6 bg-white/10 rounded w-2/3 mb-3" />
                <div className="h-10 bg-white/10 rounded w-1/2 mb-4" />
                <div className="h-3 bg-white/10 rounded w-full mb-2" />
                <div className="h-3 bg-white/10 rounded w-3/4" />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredDeals.length === 0 && (
          <div className="text-center py-20">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white/5">
              <svg className="h-10 w-10 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">No Active Deals Right Now</h2>
            <p className="text-white/40 mb-6 max-w-sm mx-auto">
              Check back soon — local businesses drop flash deals throughout the week.
            </p>
            <Link
              href="/directory"
              className="inline-flex items-center gap-2 rounded-lg bg-gold-500 px-6 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-gold-400"
            >
              Browse the Directory
            </Link>
          </div>
        )}

        {/* Deals Grid */}
        {!loading && filteredDeals.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredDeals.map(deal => {
              const spotsLeft = deal.max_claims ? Math.max(0, deal.max_claims - deal.current_claims) : null;
              const remaining = timeRemaining(deal.expires_at);
              const isUrgent = remaining.includes('m left') || remaining.includes('1h');

              return (
                <Link
                  key={deal.id}
                  href={`/claim/${deal.claim_code}`}
                  className="group relative rounded-xl border border-white/10 bg-white/5 overflow-hidden transition-all hover:border-gold-500/30 hover:bg-white/10"
                >
                  {/* Deal Type Badge */}
                  <div className="absolute top-3 left-3 z-10">
                    <span className="bg-gold-500 text-black text-xs font-bold px-2.5 py-1 rounded-full">
                      {getDealTypeLabel(deal.deal_type)}
                    </span>
                  </div>

                  {/* Urgency Badge */}
                  {isUrgent && (
                    <div className="absolute top-3 right-3 z-10">
                      <span className="bg-red-500/90 text-white text-xs font-bold px-2.5 py-1 rounded-full animate-pulse">
                        ENDING SOON
                      </span>
                    </div>
                  )}

                  <div className="p-6 pt-12">
                    {/* Business Info */}
                    {deal.business_name && (
                      <div className="flex items-center gap-2.5 mb-3">
                        {deal.business_logo_url ? (
                          <img
                            src={deal.business_logo_url}
                            alt={deal.business_name}
                            className="h-8 w-8 rounded-full object-cover border border-white/10 flex-shrink-0"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-gold-500/20 border border-gold-500/30 flex items-center justify-center flex-shrink-0">
                            <span className="text-gold-400 text-xs font-bold">
                              {deal.business_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate">{deal.business_name}</p>
                          {(deal.business_city || deal.business_state) && (
                            <p className="text-xs text-white/40 truncate">
                              {[deal.business_city, deal.business_state].filter(Boolean).join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Deal Value */}
                    <div className="text-3xl font-bold text-gold-400 mb-2 group-hover:text-gold-300 transition-colors">
                      {deal.deal_value}
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">
                      {deal.title}
                    </h3>

                    {/* Description */}
                    {deal.description && (
                      <p className="text-sm text-white/50 mb-4 line-clamp-2">
                        {deal.description}
                      </p>
                    )}

                    {/* Meta Info */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="bg-white/5 text-white/40 text-xs px-2.5 py-1 rounded-full border border-white/10">
                        {remaining}
                      </span>
                      {spotsLeft !== null && (
                        <span className={`text-xs px-2.5 py-1 rounded-full border ${
                          spotsLeft <= 5
                            ? 'bg-red-500/10 text-red-400 border-red-500/20'
                            : 'bg-white/5 text-white/40 border-white/10'
                        }`}>
                          {spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left
                        </span>
                      )}
                      {deal.time_window && (
                        <span className="bg-white/5 text-white/40 text-xs px-2.5 py-1 rounded-full border border-white/10">
                          {deal.time_window}
                        </span>
                      )}
                    </div>

                    {/* CTA */}
                    <div className="flex items-center text-sm font-medium text-gold-400 group-hover:text-gold-300 transition-colors">
                      View Deal
                      <svg className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Business CTA */}
        <div className="mt-16 rounded-xl border border-gold-500/20 bg-gold-500/5 p-8 text-center">
          <h2 className="text-xl font-semibold text-white mb-2">
            Want to offer a deal to your community?
          </h2>
          <p className="text-sm text-white/50 mb-4 max-w-md mx-auto">
            GreenLine365 Pro and Premium businesses can create flash deals to drive foot traffic and attract new customers.
          </p>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 rounded-lg bg-gold-500 px-6 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-gold-400"
          >
            Learn About Business Plans
          </Link>
        </div>
      </div>
    </main>
  );
}
