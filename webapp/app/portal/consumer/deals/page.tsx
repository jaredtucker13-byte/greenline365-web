'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase/client';

interface DealClaim {
  id: string;
  claimed_at: string;
  deal: {
    id: string;
    title: string;
    description: string;
    deal_type: string;
    deal_value: string;
    terms: string | null;
    expires_at: string;
    qr_code_url: string | null;
  } | null;
}

export default function DealsWalletPage() {
  const [claims, setClaims] = useState<DealClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'active' | 'expired'>('active');

  useEffect(() => {
    loadDeals();
  }, []);

  const loadDeals = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Get consumer profile linked to this auth user
    const { data: consumerProfile } = await supabase
      .from('consumer_profiles')
      .select('id')
      .eq('user_id', session.user.id)
      .single();

    if (!consumerProfile) {
      // Also try by email
      const { data: byEmail } = await supabase
        .from('consumer_profiles')
        .select('id')
        .eq('email', session.user.email)
        .single();

      if (!byEmail) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('deal_claims')
        .select(`
          id, claimed_at,
          deal:blast_deals!deal_id(id, title, description, deal_type, deal_value, terms, expires_at, qr_code_url)
        `)
        .eq('consumer_id', byEmail.id)
        .order('claimed_at', { ascending: false });

      setClaims((data as unknown as DealClaim[]) || []);
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('deal_claims')
      .select(`
        id, claimed_at,
        deal:blast_deals!deal_id(id, title, description, deal_type, deal_value, terms, expires_at, qr_code_url)
      `)
      .eq('consumer_id', consumerProfile.id)
      .order('claimed_at', { ascending: false });

    setClaims((data as unknown as DealClaim[]) || []);
    setLoading(false);
  };

  const now = new Date();
  const activeClaims = claims.filter(c => c.deal && new Date(c.deal.expires_at) > now);
  const expiredClaims = claims.filter(c => c.deal && new Date(c.deal.expires_at) <= now);
  const displayClaims = filter === 'active' ? activeClaims : expiredClaims;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-gold-500/30 border-t-gold-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white mb-1">My Deals</h1>
        <p className="text-white/50 text-sm mb-6">Your claimed coupons and deals</p>
      </motion.div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFilter('active')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            filter === 'active' ? 'bg-gold-500 text-black' : 'bg-white/5 text-white/50 hover:text-white'
          }`}
        >
          Active ({activeClaims.length})
        </button>
        <button
          onClick={() => setFilter('expired')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            filter === 'expired' ? 'bg-gold-500 text-black' : 'bg-white/5 text-white/50 hover:text-white'
          }`}
        >
          Expired ({expiredClaims.length})
        </button>
      </div>

      {claims.length === 0 ? (
        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-12 text-center">
          <div className="text-4xl mb-4">🎟️</div>
          <h3 className="text-lg font-bold text-white mb-2">No deals yet</h3>
          <p className="text-white/40 text-sm">Scan QR codes at participating businesses to claim deals!</p>
        </div>
      ) : displayClaims.length === 0 ? (
        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-8 text-center">
          <p className="text-white/40 text-sm">No {filter} deals</p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayClaims.map((claim, i) => (
            <motion.div
              key={claim.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`bg-white/[0.03] border rounded-xl p-5 ${
                filter === 'expired' ? 'border-white/5 opacity-60' : 'border-white/10'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-white font-bold">{claim.deal?.title}</h3>
                  <p className="text-white/50 text-sm mt-1">{claim.deal?.description}</p>
                  <div className="flex items-center gap-3 mt-3">
                    <span className="px-2.5 py-1 bg-gold-500/10 text-gold-400 text-xs font-bold rounded-lg">
                      {claim.deal?.deal_value}
                    </span>
                    <span className="text-white/30 text-xs">
                      {filter === 'active' ? 'Expires' : 'Expired'}: {claim.deal?.expires_at ? new Date(claim.deal.expires_at).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  {claim.deal?.terms && (
                    <p className="text-white/30 text-xs mt-2">{claim.deal.terms}</p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
