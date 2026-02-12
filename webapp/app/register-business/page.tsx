'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { supabase, signUp, signInWithGoogle } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

const INDUSTRIES = [
  'Family Entertainment',
  'Destinations',
  'Services',
  'Dining',
  'Nightlife',
  'Style & Shopping',
  'Health & Wellness',
];

const TIER_INFO: Record<string, { name: string; price: string; color: string }> = {
  free: { name: 'Free', price: '$0', color: '#10B981' },
  pro: { name: 'Pro', price: '$45/mo', color: '#3B82F6' },
  premium: { name: 'Premium', price: '$89/mo', color: '#FF8C00' },
};

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedTier = searchParams.get('tier') || 'free';

  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [step, setStep] = useState<'auth' | 'business'>('auth');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [authData, setAuthData] = useState({ email: '', password: '', fullName: '' });
  const [businessData, setBusinessData] = useState({
    business_name: '',
    industry: '',
    phone: '',
    website: '',
    city: '',
    state: '',
    zip_code: '',
    description: '',
  });

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        setStep('business');
      }
      setCheckingAuth(false);
    };
    check();
  }, []);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (authData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    const { data, error: authError } = await signUp(authData.email, authData.password, authData.fullName);
    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (data.session) {
      setUser(data.user);
      setStep('business');
    } else if (data.user) {
      setError('Check your email for a confirmation link, then come back to complete registration.');
    }
    setLoading(false);
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const handleBusinessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!businessData.business_name || !businessData.industry) {
      setError('Business name and industry are required');
      setLoading(false);
      return;
    }

    const slug = businessData.business_name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      + '-' + Date.now().toString(36);

    // Create directory listing
    const res = await fetch('/api/directory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...businessData,
        slug,
        tenant_id: user?.id,
        tier: selectedTier === 'free' ? 'free' : selectedTier,
      }),
    });

    const listing = await res.json();
    if (!res.ok) {
      setError(listing.error || 'Failed to create listing');
      setLoading(false);
      return;
    }

    // For paid tiers, redirect to Stripe checkout
    if (selectedTier !== 'free') {
      const checkoutRes = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: selectedTier,
          listing_id: listing.id,
          origin_url: window.location.origin,
        }),
      });

      const checkout = await checkoutRes.json();
      if (checkout.url) {
        window.location.href = checkout.url;
        return;
      } else {
        setError(checkout.error || 'Failed to create checkout session');
        setLoading(false);
        return;
      }
    }

    // Free tier — go straight to success
    router.push(`/register-business/success?listing=${listing.id}&tier=free`);
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0f0f]">
        <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  const tierInfo = TIER_INFO[selectedTier] || TIER_INFO.free;

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      {/* Hero */}
      <div className="pt-28 pb-12 text-center px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-4 border" style={{ borderColor: tierInfo.color + '40', color: tierInfo.color, background: tierInfo.color + '10' }}>
            {tierInfo.name} Plan — {tierInfo.price}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3" data-testid="register-title">
            Add Your Business
          </h1>
          <p className="text-white/50 max-w-md mx-auto">
            {step === 'auth' ? 'Create your account first, then set up your business listing.' : 'Tell us about your business to get listed.'}
          </p>
        </motion.div>
      </div>

      {/* Steps indicator */}
      <div className="max-w-md mx-auto px-6 mb-8">
        <div className="flex items-center gap-3">
          <div className={`flex-1 h-1 rounded-full ${step === 'auth' || step === 'business' ? 'bg-emerald-500' : 'bg-white/10'}`} />
          <div className={`flex-1 h-1 rounded-full ${step === 'business' ? 'bg-emerald-500' : 'bg-white/10'}`} />
        </div>
        <div className="flex justify-between mt-2 text-xs text-white/40">
          <span className={step === 'auth' ? 'text-emerald-400' : 'text-white/60'}>1. Account</span>
          <span className={step === 'business' ? 'text-emerald-400' : ''}>2. Business Info</span>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-md mx-auto px-6 pb-20">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white/[0.03] border border-white/10 rounded-2xl p-8"
        >
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm mb-6" data-testid="register-error">
              {error}
            </div>
          )}

          {step === 'auth' && (
            <>
              <button
                onClick={handleGoogleAuth}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white text-gray-800 font-medium rounded-xl hover:bg-gray-100 transition disabled:opacity-50 mb-6"
                data-testid="register-google-btn"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
                <div className="relative flex justify-center text-sm"><span className="px-4 bg-[#0f0f0f] text-white/40">or</span></div>
              </div>

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={authData.fullName}
                    onChange={(e) => setAuthData({ ...authData, fullName: e.target.value })}
                    required
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/25 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 outline-none transition"
                    placeholder="John Smith"
                    data-testid="register-name-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={authData.email}
                    onChange={(e) => setAuthData({ ...authData, email: e.target.value })}
                    required
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/25 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 outline-none transition"
                    placeholder="you@company.com"
                    data-testid="register-email-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1.5">Password</label>
                  <input
                    type="password"
                    value={authData.password}
                    onChange={(e) => setAuthData({ ...authData, password: e.target.value })}
                    required
                    minLength={6}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/25 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 outline-none transition"
                    placeholder="Min 6 characters"
                    data-testid="register-password-input"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-emerald-500 text-black font-bold rounded-xl hover:bg-emerald-400 transition disabled:opacity-50 flex items-center justify-center gap-2"
                  data-testid="register-auth-submit"
                >
                  {loading ? <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : 'Continue'}
                </button>
              </form>

              <p className="text-center text-white/40 text-sm mt-6">
                Already have an account?{' '}
                <Link href="/login" className="text-emerald-400 hover:text-emerald-300">Sign in</Link>
              </p>
            </>
          )}

          {step === 'business' && (
            <form onSubmit={handleBusinessSubmit} className="space-y-4">
              <div className="flex items-center gap-2 mb-2 text-sm text-white/50">
                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                Logged in as <span className="text-white/70">{user?.email}</span>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5">Business Name *</label>
                <input
                  type="text"
                  value={businessData.business_name}
                  onChange={(e) => setBusinessData({ ...businessData, business_name: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/25 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 outline-none transition"
                  placeholder="Acme Plumbing LLC"
                  data-testid="register-business-name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5">Industry *</label>
                <select
                  value={businessData.industry}
                  onChange={(e) => setBusinessData({ ...businessData, industry: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 outline-none transition"
                  data-testid="register-industry-select"
                >
                  <option value="" className="bg-gray-900">Select industry...</option>
                  {INDUSTRIES.map(ind => <option key={ind} value={ind} className="bg-gray-900">{ind}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1.5">Phone</label>
                  <input
                    type="tel"
                    value={businessData.phone}
                    onChange={(e) => setBusinessData({ ...businessData, phone: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/25 focus:border-emerald-500/50 outline-none transition"
                    placeholder="(555) 123-4567"
                    data-testid="register-phone"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1.5">Website</label>
                  <input
                    type="url"
                    value={businessData.website}
                    onChange={(e) => setBusinessData({ ...businessData, website: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/25 focus:border-emerald-500/50 outline-none transition"
                    placeholder="https://..."
                    data-testid="register-website"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1.5">City</label>
                  <input
                    type="text"
                    value={businessData.city}
                    onChange={(e) => setBusinessData({ ...businessData, city: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/25 focus:border-emerald-500/50 outline-none transition"
                    placeholder="Tampa"
                    data-testid="register-city"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1.5">State</label>
                  <input
                    type="text"
                    value={businessData.state}
                    onChange={(e) => setBusinessData({ ...businessData, state: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/25 focus:border-emerald-500/50 outline-none transition"
                    placeholder="FL"
                    data-testid="register-state"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1.5">ZIP</label>
                  <input
                    type="text"
                    value={businessData.zip_code}
                    onChange={(e) => setBusinessData({ ...businessData, zip_code: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/25 focus:border-emerald-500/50 outline-none transition"
                    placeholder="33601"
                    data-testid="register-zip"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5">Description</label>
                <textarea
                  value={businessData.description}
                  onChange={(e) => setBusinessData({ ...businessData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/25 focus:border-emerald-500/50 outline-none transition resize-none"
                  placeholder="Tell customers what you do..."
                  data-testid="register-description"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 font-bold rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2 text-black"
                style={{ background: selectedTier === 'free' ? '#10B981' : 'linear-gradient(135deg, #FF8C00, #FFB800)' }}
                data-testid="register-business-submit"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                ) : selectedTier === 'free' ? (
                  'Create Free Listing'
                ) : (
                  `Continue to Payment — ${tierInfo.price}`
                )}
              </button>

              {selectedTier !== 'free' && (
                <p className="text-center text-white/30 text-xs mt-2">
                  You&apos;ll be redirected to Stripe to complete your {tierInfo.name} subscription.
                </p>
              )}
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default function RegisterBusinessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
