'use client';

/**
 * Public Claim Page — /claim/[code]
 *
 * When a GL365 consumer clicks a deal link or scans a QR code,
 * they land here to claim the deal.
 *
 * For "open coupon" deals: Just shows the deal + code (no claim needed)
 * For "limited spots" deals: Consumer enters email to claim their spot
 */

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface DealInfo {
  id: string;
  title: string;
  description: string;
  deal_type: string;
  deal_value: string;
  time_window: string;
  terms: string;
  claim_code: string;
  claim_required: boolean;
  max_claims: number | null;
  current_claims: number;
  arrival_window_minutes: number | null;
  expires_at: string;
  status: string;
  business_name?: string;
}

export default function ClaimPage() {
  const params = useParams();
  const code = params.code as string;

  const [deal, setDeal] = useState<DealInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [claimResult, setClaimResult] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!code) return;
    fetchDeal();
  }, [code]);

  const fetchDeal = async () => {
    try {
      const response = await fetch(`/api/blast-deals?browse=active`);
      const data = await response.json();
      if (data.success && data.deals) {
        const found = data.deals.find((d: any) => d.claim_code === code);
        if (found) {
          setDeal(found);
        } else {
          setError('Deal not found or has expired');
        }
      }
    } catch (err) {
      setError('Unable to load deal');
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async () => {
    if (!deal || !email) return;
    setClaiming(true);
    setError('');

    try {
      const response = await fetch(`/api/blast-deals/${deal.id}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, source: 'link' }),
      });
      const data = await response.json();

      if (data.success) {
        setClaimed(true);
        setClaimResult(data);
      } else {
        setError(data.error || 'Could not claim deal');
      }
    } catch (err) {
      setError('Claim failed. Please try again.');
    } finally {
      setClaiming(false);
    }
  };

  const isExpired = deal ? new Date(deal.expires_at) < new Date() : false;
  const isSoldOut = deal?.max_claims ? deal.current_claims >= deal.max_claims : false;
  const spotsLeft = deal?.max_claims ? Math.max(0, deal.max_claims - deal.current_claims) : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-pulse text-[#C9A96E] text-lg">Loading deal...</div>
      </div>
    );
  }

  if (error && !deal) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-6xl mb-4">😔</div>
          <h1 className="text-2xl font-bold text-white mb-2">Deal Not Available</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <a href="/directory" className="text-[#C9A96E] hover:underline">
            Browse the directory →
          </a>
        </div>
      </div>
    );
  }

  if (!deal) return null;

  // CLAIMED SUCCESSFULLY
  if (claimed && claimResult) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-3xl font-bold text-white mb-2">Deal Claimed!</h1>
          <p className="text-green-400 text-lg mb-6">{claimResult.message}</p>

          <div className="bg-gradient-to-r from-[#C9A96E]/10 to-[#E8D5A3]/10 border-2 border-[#C9A96E]/40 rounded-2xl p-6 mb-6">
            <h2 className="text-xl font-bold text-white mb-2">{deal.title}</h2>
            <div className="text-4xl font-bold text-[#C9A96E] mb-4">{deal.deal_value}</div>

            <div className="bg-black/40 rounded-xl p-4 mb-4">
              <p className="text-xs text-gray-400 mb-1">Show this code when you visit</p>
              <p className="text-2xl font-mono font-bold text-[#C9A96E] tracking-wider">
                {deal.claim_code}
              </p>
            </div>

            {deal.arrival_window_minutes && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-3">
                <p className="text-red-400 text-sm font-bold">
                  ⏰ Arrive within {deal.arrival_window_minutes} minutes!
                </p>
              </div>
            )}

            {deal.time_window && (
              <p className="text-gray-300 text-sm">{deal.time_window}</p>
            )}
          </div>

          {claimResult.remaining !== null && claimResult.remaining !== undefined && (
            <p className="text-gray-500 text-sm mb-4">
              {claimResult.remaining} spot{claimResult.remaining !== 1 ? 's' : ''} remaining
            </p>
          )}

          <a href="/directory" className="text-[#C9A96E] hover:underline text-sm">
            Discover more local businesses →
          </a>
        </div>
      </div>
    );
  }

  // DEAL VIEW
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        {/* GL365 Branding */}
        <div className="text-center mb-6">
          <p className="text-[#C9A96E] font-bold text-sm tracking-wider">GREENLINE365</p>
          <p className="text-gray-500 text-xs">Local Deals</p>
        </div>

        {/* Deal Card */}
        <div className="bg-gradient-to-b from-[#1a1a2e] to-[#0a0a0a] border border-[#C9A96E]/30 rounded-2xl overflow-hidden">
          {/* Deal Header */}
          <div className="bg-gradient-to-r from-[#C9A96E]/20 to-[#E8D5A3]/20 p-6 text-center">
            <div className="inline-block bg-[#C9A96E] text-black text-xs font-bold px-4 py-1 rounded-full mb-4 tracking-wider">
              ⚡ FLASH DEAL
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">{deal.title}</h1>
            {deal.business_name && (
              <p className="text-[#C9A96E]">at {deal.business_name}</p>
            )}
          </div>

          {/* Deal Value */}
          <div className="p-6 text-center">
            <div className="text-5xl font-bold text-[#C9A96E] mb-4">{deal.deal_value}</div>
            {deal.description && (
              <p className="text-gray-300 mb-4">{deal.description}</p>
            )}

            {/* Urgency Indicators */}
            <div className="flex flex-wrap gap-2 justify-center mb-6">
              {deal.time_window && (
                <span className="bg-[#C9A96E]/10 text-[#C9A96E] text-xs px-3 py-1 rounded-full border border-[#C9A96E]/30">
                  ⏰ {deal.time_window}
                </span>
              )}
              {spotsLeft !== null && (
                <span className="bg-red-500/10 text-red-400 text-xs px-3 py-1 rounded-full border border-red-500/30">
                  🔥 {spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left
                </span>
              )}
              {deal.arrival_window_minutes && (
                <span className="bg-orange-500/10 text-orange-400 text-xs px-3 py-1 rounded-full border border-orange-500/30">
                  🏃 Must arrive in {deal.arrival_window_minutes} min
                </span>
              )}
            </div>

            {/* Status Messages */}
            {isExpired && (
              <div className="bg-gray-500/10 border border-gray-500/30 rounded-xl p-4 mb-4">
                <p className="text-gray-400 font-bold">This deal has expired</p>
              </div>
            )}

            {isSoldOut && !isExpired && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4">
                <p className="text-red-400 font-bold">All spots have been claimed!</p>
              </div>
            )}

            {/* Open Coupon — just show the code */}
            {!deal.claim_required && !isExpired && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 mb-4">
                <p className="text-sm text-gray-400 mb-2">Just mention this deal when you visit!</p>
                <p className="text-3xl font-mono font-bold text-[#C9A96E] tracking-wider mb-2">
                  {deal.claim_code}
                </p>
                <p className="text-green-400 text-sm">No claim needed — show up and enjoy</p>
              </div>
            )}

            {/* Limited Spots — claim form */}
            {deal.claim_required && !isExpired && !isSoldOut && (
              <div className="space-y-3">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Your email"
                  className="w-full bg-black/40 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-[#C9A96E] focus:outline-none"
                  required
                />
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name (optional)"
                  className="w-full bg-black/40 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-[#C9A96E] focus:outline-none"
                />

                {error && <p className="text-red-400 text-sm">{error}</p>}

                <button
                  onClick={handleClaim}
                  disabled={!email || claiming}
                  className="w-full py-4 bg-gradient-to-r from-[#C9A96E] to-[#E8D5A3] hover:from-[#E8D5A3] hover:to-[#C9A96E] text-black font-bold text-lg rounded-xl transition-all transform hover:scale-[1.02] disabled:opacity-50"
                >
                  {claiming ? 'Claiming...' : `Claim My Spot (${spotsLeft} left)`}
                </button>
              </div>
            )}

            {deal.terms && (
              <p className="text-gray-600 text-xs mt-4">{deal.terms}</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <a href="/directory" className="text-[#C9A96E] hover:underline text-sm">
            Discover more local businesses on GreenLine365 →
          </a>
        </div>
      </div>
    </div>
  );
}
