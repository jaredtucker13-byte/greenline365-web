'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { supabase, signUp, signInWithGoogle } from '@/lib/supabase/client';
import { validatePassword, getPasswordStrength, validateEmail } from '@/lib/auth/password-validation';
import PasswordStrengthIndicator from '@/components/ui/PasswordStrengthIndicator';
import TermsCheckbox from '@/components/ui/TermsCheckbox';
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
  free: { name: 'Free', price: '$0', color: '#C9A84C' },
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

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [termsError, setTermsError] = useState(false);
  const [fieldTouched, setFieldTouched] = useState<Record<string, boolean>>({});

  const [authData, setAuthData] = useState({ email: '', password: '', confirmPassword: '', fullName: '' });
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

  const passwordValidation = useMemo(() => validatePassword(authData.password), [authData.password]);
  const passwordStrength = useMemo(() => getPasswordStrength(authData.password), [authData.password]);
  const emailValid = useMemo(() => validateEmail(authData.email), [authData.email]);
  const passwordsMatch = authData.password === authData.confirmPassword;

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

  const handleFieldBlur = (fieldName: string) => {
    setFieldTouched(prev => ({ ...prev, [fieldName]: true }));
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!passwordValidation.isValid) {
      setError('Password does not meet all requirements');
      setLoading(false);
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (!agreedToTerms) {
      setTermsError(true);
      setError('You must agree to the Terms of Service and Privacy Policy');
      setLoading(false);
      return;
    }

    const { data, error: authError } = await signUp(authData.email, authData.password, authData.fullName, 'business');
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
    if (!agreedToTerms) {
      setTermsError(true);
      setError('You must agree to the Terms of Service and Privacy Policy');
      return;
    }
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

  // Eye toggle button for show/hide password
  const EyeToggle = ({ show, onClick, label }: { show: boolean; onClick: () => void; label: string }) => (
    <button
      type="button"
      onClick={onClick}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition"
      aria-label={label}
    >
      {show ? (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      )}
    </button>
  );

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0f0f]">
        <div className="w-10 h-10 border-4 border-gold-500/30 border-t-gold-500 rounded-full animate-spin" />
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
      <div className="max-w-md mx-auto px-6 mb-8" role="navigation" aria-label="Registration progress">
        <div className="flex items-center">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
            step === 'auth'
              ? 'bg-gold-500 border-gold-500 text-black'
              : 'bg-gold-500/20 border-gold-500 text-gold-400'
          }`} aria-current={step === 'auth' ? 'step' : undefined}>
            {step === 'business' ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
              </svg>
            ) : '1'}
          </div>
          <div className={`flex-1 h-0.5 mx-3 transition-all ${step === 'business' ? 'bg-gold-500' : 'bg-white/10'}`} />
          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
            step === 'business'
              ? 'bg-gold-500 border-gold-500 text-black'
              : 'border-white/20 text-white/40'
          }`} aria-current={step === 'business' ? 'step' : undefined}>
            2
          </div>
        </div>
        <div className="flex justify-between mt-2 text-xs">
          <span className={step === 'auth' ? 'text-gold-400 font-medium' : 'text-gold-400/60'}>Account</span>
          <span className={step === 'business' ? 'text-gold-400 font-medium' : 'text-white/40'}>Business Info</span>
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
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm mb-6" role="alert" data-testid="register-error">
              {error}
            </div>
          )}

          {step === 'auth' && (
            <>
              {/* Terms checkbox - applies to both Google and email auth */}
              <div className="mb-6">
                <TermsCheckbox
                  checked={agreedToTerms}
                  onChange={(checked) => { setAgreedToTerms(checked); if (checked) setTermsError(false); }}
                  error={termsError}
                />
              </div>

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
                  <label htmlFor="reg-fullname" className="block text-sm font-medium text-white/70 mb-1.5">Full Name</label>
                  <input
                    id="reg-fullname"
                    type="text"
                    value={authData.fullName}
                    onChange={(e) => setAuthData({ ...authData, fullName: e.target.value })}
                    onBlur={() => handleFieldBlur('fullName')}
                    required
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/50 outline-none transition"
                    placeholder="John Smith"
                    aria-invalid={fieldTouched.fullName && !authData.fullName.trim() ? 'true' : undefined}
                    data-testid="register-name-input"
                  />
                  {fieldTouched.fullName && !authData.fullName.trim() && (
                    <p className="text-red-400 text-xs mt-1">Full name is required</p>
                  )}
                </div>
                <div>
                  <label htmlFor="reg-email" className="block text-sm font-medium text-white/70 mb-1.5">Email</label>
                  <input
                    id="reg-email"
                    type="email"
                    value={authData.email}
                    onChange={(e) => setAuthData({ ...authData, email: e.target.value })}
                    onBlur={() => handleFieldBlur('email')}
                    required
                    className={`w-full px-4 py-3 rounded-xl bg-white/5 border text-white placeholder:text-white/40 focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/50 outline-none transition ${
                      fieldTouched.email && authData.email && !emailValid ? 'border-red-500/50' : 'border-white/10'
                    }`}
                    placeholder="you@company.com"
                    aria-invalid={fieldTouched.email && authData.email && !emailValid ? 'true' : undefined}
                    aria-describedby="reg-email-error"
                    data-testid="register-email-input"
                  />
                  {fieldTouched.email && authData.email && !emailValid && (
                    <p id="reg-email-error" className="text-red-400 text-xs mt-1">Please enter a valid email address</p>
                  )}
                  {fieldTouched.email && emailValid && (
                    <p className="text-green-400 text-xs mt-1 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                      </svg>
                      Valid email
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="reg-password" className="block text-sm font-medium text-white/70 mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      id="reg-password"
                      type={showPassword ? 'text' : 'password'}
                      value={authData.password}
                      onChange={(e) => setAuthData({ ...authData, password: e.target.value })}
                      onBlur={() => handleFieldBlur('password')}
                      required
                      minLength={8}
                      className="w-full px-4 py-3 pr-12 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/50 outline-none transition"
                      placeholder="8+ chars, mixed case, number, symbol"
                      aria-describedby="password-strength"
                      data-testid="register-password-input"
                    />
                    <EyeToggle show={showPassword} onClick={() => setShowPassword(!showPassword)} label={showPassword ? 'Hide password' : 'Show password'} />
                  </div>
                  <PasswordStrengthIndicator password={authData.password} />
                </div>
                <div>
                  <label htmlFor="reg-confirm-password" className="block text-sm font-medium text-white/70 mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <input
                      id="reg-confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={authData.confirmPassword}
                      onChange={(e) => setAuthData({ ...authData, confirmPassword: e.target.value })}
                      onBlur={() => handleFieldBlur('confirmPassword')}
                      required
                      className={`w-full px-4 py-3 pr-12 rounded-xl bg-white/5 border text-white placeholder:text-white/40 focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/50 outline-none transition ${
                        fieldTouched.confirmPassword && authData.confirmPassword && !passwordsMatch ? 'border-red-500/50' : 'border-white/10'
                      }`}
                      placeholder="Re-enter your password"
                      aria-invalid={fieldTouched.confirmPassword && authData.confirmPassword && !passwordsMatch ? 'true' : undefined}
                      aria-describedby="reg-confirm-error"
                      data-testid="register-confirm-password-input"
                    />
                    <EyeToggle show={showConfirmPassword} onClick={() => setShowConfirmPassword(!showConfirmPassword)} label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'} />
                  </div>
                  {fieldTouched.confirmPassword && authData.confirmPassword && !passwordsMatch && (
                    <p id="reg-confirm-error" className="text-red-400 text-xs mt-1">Passwords do not match</p>
                  )}
                  {fieldTouched.confirmPassword && authData.confirmPassword && passwordsMatch && (
                    <p className="text-green-400 text-xs mt-1 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                      </svg>
                      Passwords match
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-gold-500 text-black font-bold rounded-xl hover:bg-gold-400 transition disabled:opacity-50 flex items-center justify-center gap-2"
                  data-testid="register-auth-submit"
                >
                  {loading ? <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : 'Continue'}
                </button>
              </form>

              <p className="text-center text-white/40 text-sm mt-6">
                Already have an account?{' '}
                <Link href="/login" className="text-gold-400 hover:text-gold-300">Sign in</Link>
              </p>
            </>
          )}

          {step === 'business' && (
            <form onSubmit={handleBusinessSubmit} className="space-y-4">
              <div className="flex items-center gap-2 mb-2 text-sm text-white/50">
                <svg className="w-4 h-4 text-gold-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                Logged in as <span className="text-white/70">{user?.email}</span>
              </div>

              <div>
                <label htmlFor="reg-business-name" className="block text-sm font-medium text-white/70 mb-1.5">Business Name *</label>
                <input
                  id="reg-business-name"
                  type="text"
                  value={businessData.business_name}
                  onChange={(e) => setBusinessData({ ...businessData, business_name: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/50 outline-none transition"
                  placeholder="Acme Plumbing LLC"
                  data-testid="register-business-name"
                />
              </div>

              <div>
                <label htmlFor="reg-industry" className="block text-sm font-medium text-white/70 mb-1.5">Industry *</label>
                <select
                  id="reg-industry"
                  value={businessData.industry}
                  onChange={(e) => setBusinessData({ ...businessData, industry: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/50 outline-none transition"
                  data-testid="register-industry-select"
                >
                  <option value="" className="bg-gray-900">Select industry...</option>
                  {INDUSTRIES.map(ind => <option key={ind} value={ind} className="bg-gray-900">{ind}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="reg-phone" className="block text-sm font-medium text-white/70 mb-1.5">Phone</label>
                  <input
                    id="reg-phone"
                    type="tel"
                    value={businessData.phone}
                    onChange={(e) => setBusinessData({ ...businessData, phone: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:border-gold-500/50 outline-none transition"
                    placeholder="(555) 123-4567"
                    data-testid="register-phone"
                  />
                </div>
                <div>
                  <label htmlFor="reg-website" className="block text-sm font-medium text-white/70 mb-1.5">Website</label>
                  <input
                    id="reg-website"
                    type="url"
                    value={businessData.website}
                    onChange={(e) => setBusinessData({ ...businessData, website: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:border-gold-500/50 outline-none transition"
                    placeholder="https://..."
                    data-testid="register-website"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label htmlFor="reg-city" className="block text-sm font-medium text-white/70 mb-1.5">City</label>
                  <input
                    id="reg-city"
                    type="text"
                    value={businessData.city}
                    onChange={(e) => setBusinessData({ ...businessData, city: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:border-gold-500/50 outline-none transition"
                    placeholder="Tampa"
                    data-testid="register-city"
                  />
                </div>
                <div>
                  <label htmlFor="reg-state" className="block text-sm font-medium text-white/70 mb-1.5">State</label>
                  <input
                    id="reg-state"
                    type="text"
                    value={businessData.state}
                    onChange={(e) => setBusinessData({ ...businessData, state: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:border-gold-500/50 outline-none transition"
                    placeholder="FL"
                    data-testid="register-state"
                  />
                </div>
                <div>
                  <label htmlFor="reg-zip" className="block text-sm font-medium text-white/70 mb-1.5">ZIP</label>
                  <input
                    id="reg-zip"
                    type="text"
                    value={businessData.zip_code}
                    onChange={(e) => setBusinessData({ ...businessData, zip_code: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:border-gold-500/50 outline-none transition"
                    placeholder="33601"
                    data-testid="register-zip"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="reg-description" className="block text-sm font-medium text-white/70 mb-1.5">Description</label>
                <textarea
                  id="reg-description"
                  value={businessData.description}
                  onChange={(e) => setBusinessData({ ...businessData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:border-gold-500/50 outline-none transition resize-none"
                  placeholder="Tell customers what you do..."
                  data-testid="register-description"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 font-bold rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2 text-black"
                style={{ background: selectedTier === 'free' ? '#C9A84C' : 'linear-gradient(135deg, #FF8C00, #FFB800)' }}
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
        <div className="w-10 h-10 border-4 border-gold-500/30 border-t-gold-500 rounded-full animate-spin" />
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
