'use client';

/**
 * LiveLocalPulse — Brainstorming Companion + Coupon Machine
 *
 * The full workflow:
 * 1. Perplexity scans for local trends (weather, events, seasonal)
 * 2. Each trend suggests a blast deal idea
 * 3. Business owner approves/tweaks the deal
 * 4. System generates QR code + claim link
 * 5. Outblast email goes to GL365 consumers in the area
 *
 * This turns slow times into revenue by surfacing the right opportunity at the right moment.
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SuggestedDeal {
  deal_type: string;
  example_title: string;
  example_value: string;
  time_window: string;
  why_it_works: string;
}

interface LiveTrend {
  id: string;
  title: string;
  description: string;
  category: string;
  suggested_action: string;
  expected_traffic: string;
  vibe_score: number;
  suggested_deal: SuggestedDeal | null;
  expires_at?: string;
  created_at?: string;
}

interface BlastDealForm {
  title: string;
  description: string;
  deal_type: string;
  deal_value: string;
  time_window: string;
  terms: string;
  // Claim settings
  claim_required: boolean; // true = limited spots (must claim), false = open coupon
  max_claims: string;      // Only used when claim_required = true
  arrival_window: string;  // Minutes to arrive after claiming (10, 15, 30, 60)
  // Business custom message for the email blast
  business_message: string;
}

interface LiveLocalPulseProps {
  zipCode?: string; // Business owner's ZIP code — drives what trends they see
  businessId?: string; // Business ID for deal creation
  listingId?: string; // Directory listing ID
}

type ViewState = 'pulse' | 'create_deal' | 'deal_preview' | 'deal_sent';

export default function LiveLocalPulse({ zipCode = '33619', businessId, listingId }: LiveLocalPulseProps) {
  const [trends, setTrends] = useState<LiveTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState('');
  const [view, setView] = useState<ViewState>('pulse');
  const [selectedTrend, setSelectedTrend] = useState<LiveTrend | null>(null);
  const [dealForm, setDealForm] = useState<BlastDealForm>({
    title: '', description: '', deal_type: 'bogo', deal_value: '',
    time_window: '', terms: '', claim_required: false, max_claims: '',
    arrival_window: '15', business_message: '',
  });
  const [createdDeal, setCreatedDeal] = useState<any>(null);
  const [outblastResult, setOutblastResult] = useState<any>(null);
  const [error, setError] = useState('');

  const fetchTrends = useCallback(async () => {
    try {
      const response = await fetch(`/api/daily-trend-hunter?zipCode=${zipCode}`);
      const data = await response.json();
      if (data.success && data.trends) {
        setTrends(data.trends);
      }
    } catch (err) {
      console.error('Failed to fetch trends:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const triggerScan = async () => {
    setScanning(true);
    setError('');
    try {
      const response = await fetch('/api/daily-trend-hunter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zipCode, source: 'manual_scan' }),
      });
      const data = await response.json();
      if (data.success && data.trends) {
        setTrends(data.trends);
      }
    } catch (err) {
      setError('Scan failed. Try again.');
    } finally {
      setScanning(false);
    }
  };

  useEffect(() => {
    fetchTrends();
    const interval = setInterval(fetchTrends, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [fetchTrends]);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const hours = now.getHours();
      const nextScan = Math.ceil((hours + 1) / 3) * 3;
      const nextTime = new Date(now);
      nextTime.setHours(nextScan, 0, 0, 0);
      if (nextTime <= now) nextTime.setHours(nextTime.getHours() + 3);

      const diff = nextTime.getTime() - now.getTime();
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeRemaining(`${h}h ${m}m ${s}s`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getSmartIcon = (category: string, title: string, description: string = '') => {
    const content = `${title} ${description}`.toLowerCase();

    if (category === 'sports') {
      if (content.includes('football') || content.includes('nfl') || content.includes('super bowl') || content.includes('buccaneers')) return '🏈';
      if (content.includes('hockey') || content.includes('lightning') || content.includes('nhl')) return '🏒';
      if (content.includes('basketball') || content.includes('nba')) return '🏀';
      if (content.includes('baseball') || content.includes('rays') || content.includes('mlb')) return '⚾';
      if (content.includes('soccer') || content.includes('mls')) return '⚽';
      return '🏆';
    }

    const icons: Record<string, string> = {
      weather: '🌤️', community: '🏘️', entertainment: '🎭',
      holiday: '🎉', seasonal: '🌿', food: '🍔', business: '💼',
    };
    return icons[category] || '⚡';
  };

  const getVibeColor = (score: number) => {
    if (score >= 90) return 'from-green-500/20 to-emerald-500/20 border-green-500/40';
    if (score >= 75) return 'from-yellow-500/20 to-amber-500/20 border-yellow-500/40';
    return 'from-blue-500/20 to-cyan-500/20 border-blue-500/40';
  };

  // Start creating a deal from a trend suggestion
  const startDealFromTrend = (trend: LiveTrend) => {
    setSelectedTrend(trend);
    const deal = trend.suggested_deal;
    setDealForm({
      title: deal?.example_title || `Special: ${trend.title}`,
      description: trend.suggested_action || trend.description,
      deal_type: deal?.deal_type || 'custom',
      deal_value: deal?.example_value || '',
      time_window: deal?.time_window || 'Today only',
      terms: '',
      claim_required: false,
      max_claims: '',
      arrival_window: '15',
      business_message: '',
    });
    setView('create_deal');
  };

  // Submit the deal
  const submitDeal = async () => {
    setError('');
    try {
      const response = await fetch('/api/blast-deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: businessId || 'owner',
          listing_id: listingId || null,
          title: dealForm.title,
          description: dealForm.description,
          deal_type: dealForm.deal_type,
          deal_value: dealForm.deal_value,
          time_window: dealForm.time_window,
          terms: dealForm.terms || null,
          claim_required: dealForm.claim_required,
          max_claims: dealForm.claim_required && dealForm.max_claims ? parseInt(dealForm.max_claims) : null,
          arrival_window_minutes: dealForm.claim_required && dealForm.arrival_window ? parseInt(dealForm.arrival_window) : null,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h default
          source_trend_id: selectedTrend?.id || null,
          source_trend_title: selectedTrend?.title || null,
          category: selectedTrend?.category || null,
          auto_activate: true,
          business_message: dealForm.business_message,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setCreatedDeal(data);
        setView('deal_preview');
      } else {
        setError(data.error || 'Failed to create deal');
      }
    } catch (err) {
      setError('Failed to create deal. Try again.');
    }
  };

  // Trigger the outblast
  const triggerOutblast = async () => {
    if (!createdDeal?.deal?.id) return;
    setError('');
    try {
      const response = await fetch('/api/blast-deals/outblast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deal_id: createdDeal.deal.id,
          business_message: dealForm.business_message,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setOutblastResult(data.outblast);
        setView('deal_sent');
      } else {
        setError(data.error || 'Outblast failed');
      }
    } catch (err) {
      setError('Outblast failed. Try again.');
    }
  };

  const dealTypeOptions = [
    { value: 'bogo', label: 'Buy 1 Get 1', icon: '🔄' },
    { value: 'percent_off', label: '% Off', icon: '💯' },
    { value: 'dollar_off', label: '$ Off', icon: '💵' },
    { value: 'free_item', label: 'Free Item', icon: '🎁' },
    { value: 'bundle', label: 'Bundle Deal', icon: '📦' },
    { value: 'custom', label: 'Custom', icon: '✨' },
  ];

  // ================================
  // LOADING STATE
  // ================================
  if (loading) {
    return (
      <div className="bg-black/40 backdrop-blur-xl border border-[#C9A96E]/20 rounded-2xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-5 bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-700 rounded w-1/2"></div>
          <div className="h-32 bg-gray-700/50 rounded-xl"></div>
        </div>
      </div>
    );
  }

  // ================================
  // DEAL SENT CONFIRMATION
  // ================================
  if (view === 'deal_sent') {
    return (
      <div className="bg-black/40 backdrop-blur-xl border border-green-500/30 rounded-2xl p-6">
        <div className="text-center py-4">
          <div className="text-6xl mb-4">🚀</div>
          <h3 className="text-2xl font-bold text-white mb-2">Blast Sent!</h3>
          <p className="text-green-400 text-lg font-medium mb-6">
            Your deal is live on the directory
          </p>

          {outblastResult && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-6 text-left">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-400">GL365 Members</span>
                  <p className="text-white font-bold text-lg">{outblastResult.gl365_consumers}</p>
                </div>
                <div>
                  <span className="text-gray-400">Synced Clients</span>
                  <p className="text-white font-bold text-lg">{outblastResult.synced_business_clients}</p>
                </div>
                <div>
                  <span className="text-gray-400">Total Sent</span>
                  <p className="text-green-400 font-bold text-lg">{outblastResult.sent}</p>
                </div>
                <div>
                  <span className="text-gray-400">Claim Code</span>
                  <p className="text-[#C9A96E] font-mono font-bold">{createdDeal?.claim_code}</p>
                </div>
              </div>
            </div>
          )}

          {createdDeal?.claim_url && (
            <div className="bg-black/40 border border-[#C9A96E]/30 rounded-xl p-4 mb-6">
              <p className="text-xs text-gray-400 mb-2">QR Code Claim Link</p>
              <p className="text-[#C9A96E] font-mono text-sm break-all">{createdDeal.claim_url}</p>
            </div>
          )}

          <button
            onClick={() => { setView('pulse'); setCreatedDeal(null); setOutblastResult(null); }}
            className="w-full py-3 bg-[#C9A96E] hover:bg-[#E8D5A3] text-black font-bold rounded-xl transition-all"
          >
            Back to Local Pulse
          </button>
        </div>
      </div>
    );
  }

  // ================================
  // DEAL PREVIEW + OUTBLAST
  // ================================
  if (view === 'deal_preview' && createdDeal) {
    return (
      <div className="bg-black/40 backdrop-blur-xl border border-[#C9A96E]/30 rounded-2xl p-6">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">✅</div>
          <h3 className="text-xl font-bold text-white">Deal Created!</h3>
          <p className="text-gray-400 text-sm">Ready to blast to your area</p>
        </div>

        <div className="bg-gradient-to-r from-[#C9A96E]/10 to-[#E8D5A3]/10 border border-[#C9A96E]/30 rounded-xl p-5 mb-6">
          <h4 className="text-lg font-bold text-white mb-1">{dealForm.title}</h4>
          <p className="text-[#C9A96E] text-2xl font-bold mb-2">{dealForm.deal_value}</p>
          <p className="text-gray-300 text-sm mb-3">{dealForm.description}</p>
          <div className="flex gap-2 flex-wrap text-xs">
            <span className="bg-[#C9A96E]/20 text-[#C9A96E] px-3 py-1 rounded-full">{dealForm.time_window}</span>
            {dealForm.max_claims && (
              <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full">
                Max {dealForm.max_claims} claims
              </span>
            )}
          </div>
          <div className="mt-3 pt-3 border-t border-[#C9A96E]/20">
            <p className="text-xs text-gray-400">Claim Code</p>
            <p className="text-[#C9A96E] font-mono font-bold text-lg">{createdDeal.claim_code}</p>
          </div>
        </div>

        {dealForm.business_message && (
          <div className="bg-white/5 border-l-2 border-[#C9A96E] rounded-r-lg p-3 mb-6">
            <p className="text-xs text-gray-500 mb-1">Your message to customers:</p>
            <p className="text-gray-300 text-sm italic">"{dealForm.business_message}"</p>
          </div>
        )}

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        <div className="space-y-3">
          <button
            onClick={triggerOutblast}
            className="w-full py-3 bg-gradient-to-r from-[#C9A96E] to-[#E8D5A3] hover:from-[#E8D5A3] hover:to-[#C9A96E] text-black font-bold rounded-xl transition-all transform hover:scale-[1.02]"
          >
            🚀 Blast to Local Customers
          </button>
          <button
            onClick={() => setView('pulse')}
            className="w-full py-2 text-gray-400 hover:text-white text-sm transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // ================================
  // CREATE DEAL FORM
  // ================================
  if (view === 'create_deal') {
    return (
      <div className="bg-black/40 backdrop-blur-xl border border-[#C9A96E]/20 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setView('pulse')} className="text-gray-400 hover:text-white">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h3 className="text-lg font-bold text-white">Create Blast Deal</h3>
            {selectedTrend && (
              <p className="text-xs text-[#C9A96E]">Inspired by: {selectedTrend.title}</p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {/* Deal Title */}
          <div>
            <label className="text-xs text-gray-400 block mb-1">Deal Title</label>
            <input
              type="text"
              value={dealForm.title}
              onChange={e => setDealForm(f => ({ ...f, title: e.target.value }))}
              className="w-full bg-black/40 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-[#C9A96E] focus:outline-none"
              placeholder="Buy 1 Get 1 Free Iced Coffee"
            />
          </div>

          {/* Deal Type */}
          <div>
            <label className="text-xs text-gray-400 block mb-2">Deal Type</label>
            <div className="grid grid-cols-3 gap-2">
              {dealTypeOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setDealForm(f => ({ ...f, deal_type: opt.value }))}
                  className={`py-2 px-2 rounded-lg text-xs font-medium border transition-all ${
                    dealForm.deal_type === opt.value
                      ? 'bg-[#C9A96E]/20 border-[#C9A96E] text-[#C9A96E]'
                      : 'bg-black/20 border-gray-700 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  {opt.icon} {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Deal Value */}
          <div>
            <label className="text-xs text-gray-400 block mb-1">Deal Value</label>
            <input
              type="text"
              value={dealForm.deal_value}
              onChange={e => setDealForm(f => ({ ...f, deal_value: e.target.value }))}
              className="w-full bg-black/40 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-[#C9A96E] focus:outline-none"
              placeholder="Buy 1 Get 1, 25% Off, Free Donut, etc."
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs text-gray-400 block mb-1">Description</label>
            <textarea
              value={dealForm.description}
              onChange={e => setDealForm(f => ({ ...f, description: e.target.value }))}
              rows={2}
              className="w-full bg-black/40 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-[#C9A96E] focus:outline-none resize-none"
              placeholder="What makes this deal special?"
            />
          </div>

          {/* Time Window */}
          <div>
            <label className="text-xs text-gray-400 block mb-1">Time Window</label>
            <input
              type="text"
              value={dealForm.time_window}
              onChange={e => setDealForm(f => ({ ...f, time_window: e.target.value }))}
              className="w-full bg-black/40 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-[#C9A96E] focus:outline-none"
              placeholder="2-5pm today"
            />
          </div>

          {/* Deal Mode: Open Coupon vs Limited Spots */}
          <div>
            <label className="text-xs text-gray-400 block mb-2">Deal Mode</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setDealForm(f => ({ ...f, claim_required: false }))}
                className={`py-3 px-3 rounded-lg text-xs font-medium border transition-all ${
                  !dealForm.claim_required
                    ? 'bg-[#C9A96E]/20 border-[#C9A96E] text-[#C9A96E]'
                    : 'bg-black/20 border-gray-700 text-gray-400 hover:border-gray-500'
                }`}
              >
                <div className="text-lg mb-1">🎫</div>
                Open Coupon
                <div className="text-[10px] text-gray-500 mt-1">Anyone can use it</div>
              </button>
              <button
                onClick={() => setDealForm(f => ({ ...f, claim_required: true }))}
                className={`py-3 px-3 rounded-lg text-xs font-medium border transition-all ${
                  dealForm.claim_required
                    ? 'bg-red-500/20 border-red-500 text-red-400'
                    : 'bg-black/20 border-gray-700 text-gray-400 hover:border-gray-500'
                }`}
              >
                <div className="text-lg mb-1">🔥</div>
                Limited Spots
                <div className="text-[10px] text-gray-500 mt-1">Must claim to get it</div>
              </button>
            </div>
          </div>

          {/* Limited Spots Settings (only show when claim_required) */}
          {dealForm.claim_required && (
            <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Available Spots</label>
                  <input
                    type="number"
                    value={dealForm.max_claims}
                    onChange={e => setDealForm(f => ({ ...f, max_claims: e.target.value }))}
                    className="w-full bg-black/40 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-red-500 focus:outline-none"
                    placeholder="3"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Must arrive within</label>
                  <select
                    value={dealForm.arrival_window}
                    onChange={e => setDealForm(f => ({ ...f, arrival_window: e.target.value }))}
                    className="w-full bg-black/40 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-red-500 focus:outline-none"
                  >
                    <option value="10">10 minutes</option>
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="60">1 hour</option>
                    <option value="120">2 hours</option>
                  </select>
                </div>
              </div>
              <p className="text-[10px] text-red-400/70">
                Customers must claim a spot and arrive within the window to get this deal
              </p>
            </div>
          )}

          {/* Business Custom Message */}
          <div>
            <label className="text-xs text-gray-400 block mb-1">
              Your Message (optional — included in the email blast)
            </label>
            <textarea
              value={dealForm.business_message}
              onChange={e => setDealForm(f => ({ ...f, business_message: e.target.value }))}
              rows={2}
              className="w-full bg-black/40 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-[#C9A96E] focus:outline-none resize-none"
              placeholder="Come see us today! We've got something special for you..."
            />
          </div>

          {/* Terms (optional) */}
          <div>
            <label className="text-xs text-gray-400 block mb-1">Terms / Fine Print (optional)</label>
            <input
              type="text"
              value={dealForm.terms}
              onChange={e => setDealForm(f => ({ ...f, terms: e.target.value }))}
              className="w-full bg-black/40 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-[#C9A96E] focus:outline-none"
              placeholder="While supplies last. One per customer."
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          {/* Submit */}
          <button
            onClick={submitDeal}
            disabled={!dealForm.title || !dealForm.deal_value}
            className="w-full py-3 bg-gradient-to-r from-[#C9A96E] to-[#E8D5A3] hover:from-[#E8D5A3] hover:to-[#C9A96E] text-black font-bold rounded-xl transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Blast Deal
          </button>
        </div>
      </div>
    );
  }

  // ================================
  // MAIN PULSE VIEW — Trend Cards with Deal Suggestions
  // ================================
  return (
    <div className="bg-black/40 backdrop-blur-xl border border-[#C9A96E]/20 rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
            <span className="animate-pulse">⚡</span>
            Live Local Pulse
          </h3>
          <p className="text-sm text-gray-400">
            Your brainstorming partner — tap a trend to create a blast deal
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500 mb-1">Next Scan</div>
          <div className="text-sm font-mono text-[#C9A96E]">
            {timeRemaining || 'Calculating...'}
          </div>
        </div>
      </div>

      {/* Live Status */}
      {trends.length > 0 && (
        <div className="mb-4 flex items-center gap-2 text-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-green-400 font-medium">LIVE</span>
          <span className="text-gray-500">•</span>
          <span className="text-gray-400">{trends.length} opportunities found</span>
        </div>
      )}

      {/* Trend Cards */}
      <AnimatePresence mode="wait">
        {trends.length > 0 ? (
          <div className="space-y-3">
            {trends.slice(0, 5).map((trend, index) => (
              <motion.div
                key={trend.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.08 }}
                className={`relative bg-gradient-to-r ${getVibeColor(trend.vibe_score || 80)} border rounded-xl p-4 group hover:border-[#C9A96E]/50 transition-all cursor-pointer`}
                onClick={() => startDealFromTrend(trend)}
              >
                {/* Traffic Badge */}
                <div className="absolute -top-2 -right-2 bg-[#C9A96E] text-black text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                  {(trend.expected_traffic || 'medium').toUpperCase()}
                </div>

                <div className="flex items-start gap-3">
                  <div className="text-3xl flex-shrink-0">
                    {getSmartIcon(trend.category, trend.title, trend.description)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-white text-base mb-1">{trend.title}</h4>
                    <p className="text-sm text-gray-300 mb-2">{trend.description}</p>

                    {/* Suggested Action */}
                    {trend.suggested_action && (
                      <div className="bg-[#C9A96E]/10 border border-[#C9A96E]/30 rounded-lg p-2 mb-2">
                        <p className="text-xs text-[#C9A96E] font-medium">
                          💡 {trend.suggested_action}
                        </p>
                      </div>
                    )}

                    {/* Suggested Deal Preview */}
                    {trend.suggested_deal && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-gray-500">Suggested deal:</span>
                        <span className="text-xs bg-[#C9A96E]/20 text-[#C9A96E] px-2 py-0.5 rounded-full font-medium">
                          {trend.suggested_deal.example_title}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Create Deal CTA */}
                <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-full py-2 text-sm font-bold bg-[#C9A96E] text-black rounded-lg text-center">
                    Create Blast Deal from This →
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <div className="text-5xl mb-4">🌤️</div>
            <p className="text-gray-400 text-sm mb-2">
              Scanning for local opportunities...
            </p>
            <p className="text-gray-500 text-xs mb-4">
              Next scan in {timeRemaining || '3 hours'}
            </p>
            <button
              onClick={triggerScan}
              disabled={scanning}
              className="px-6 py-2 bg-[#C9A96E]/20 hover:bg-[#C9A96E]/30 text-[#C9A96E] rounded-lg text-sm font-medium transition-all disabled:opacity-50"
            >
              {scanning ? 'Scanning...' : 'Scan Now'}
            </button>
          </div>
        )}
      </AnimatePresence>

      {/* Manual Scan Button */}
      {trends.length > 0 && (
        <button
          onClick={triggerScan}
          disabled={scanning}
          className="mt-4 w-full py-2 text-xs font-medium text-gray-400 hover:text-[#C9A96E] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {scanning ? (
            <>
              <span className="inline-block animate-spin">🔄</span>
              Scanning...
            </>
          ) : (
            <>
              <span>🔄</span>
              Scan for More Opportunities
            </>
          )}
        </button>
      )}
    </div>
  );
}
