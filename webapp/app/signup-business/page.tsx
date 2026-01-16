'use client';

/**
 * Business Signup Page with Code Redemption
 * For customers who received an invite code
 */

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { Check, AlertCircle } from 'lucide-react';

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  
  const [code, setCode] = useState('');
  const [codeValid, setCodeValid] = useState<boolean | null>(null);
  const [codeTier, setCodeTier] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    password: '',
    confirmPassword: '',
  });

  // Get code from URL on mount
  useEffect(() => {
    const urlCode = searchParams.get('code');
    if (urlCode) {
      setCode(urlCode);
      validateCode(urlCode);
    }
  }, [searchParams]);

  const validateCode = async (codeToValidate: string) => {
    try {
      const response = await fetch(`/api/redeem-code?code=${codeToValidate}`);
      const data = await response.json();
      
      if (data.valid) {
        setCodeValid(true);
        setCodeTier(data.tier);
      } else {
        setCodeValid(false);
        setError(data.error || 'Invalid code');
      }
    } catch (err) {
      setCodeValid(false);
      setError('Failed to validate code');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      // Step 1: Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
          },
        },
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      if (!authData.user) {
        setError('Failed to create account');
        setLoading(false);
        return;
      }

      // Step 2: Create business
      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .insert({
          name: formData.fullName + "'s Business", // Temporary, will be updated in onboarding
          slug: `business-${Date.now()}`, // Temporary
          tier: 'tier1', // Will be updated by code redemption
        })
        .select()
        .single();

      if (businessError) {
        setError('Failed to create business account');
        setLoading(false);
        return;
      }

      // Step 3: Link user to business
      const { error: linkError } = await supabase
        .from('user_businesses')
        .insert({
          user_id: authData.user.id,
          business_id: businessData.id,
          role: 'owner',
          is_primary: true,
        });

      if (linkError) {
        setError('Failed to link account');
        setLoading(false);
        return;
      }

      // Step 4: Redeem code if provided
      if (code && codeValid) {
        const redeemResponse = await fetch('/api/redeem-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code,
            businessId: businessData.id,
          }),
        });

        const redeemData = await redeemResponse.json();
        
        if (!redeemData.success) {
          console.error('Code redemption failed:', redeemData.error);
          // Continue anyway - user can contact support
        }
      }

      // Step 5: Redirect to onboarding
      router.push('/onboarding?businessId=' + businessData.id);

    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err.message || 'An error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 py-12">
      <div className="max-w-md mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-2">Create Your Account</h1>
          <p className="text-white/60">Join GreenLine365 and start automating your business</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-gray-900/80 to-gray-900/40 border border-white/10 rounded-2xl p-8"
        >
          {/* Code Status Banner */}
          {code && codeValid !== null && (
            <div className={`mb-6 p-4 rounded-lg border ${
              codeValid 
                ? 'bg-green-500/10 border-green-500/30' 
                : 'bg-red-500/10 border-red-500/30'
            }`}>
              <div className="flex items-center gap-2">
                {codeValid ? (
                  <>
                    <Check className="w-5 h-5 text-green-400" />
                    <div>
                      <p className="text-green-400 font-medium">Valid Access Code</p>
                      <p className="text-sm text-green-300/80">
                        {codeTier === 'tier1' && 'Starter Tier Access'}
                        {codeTier === 'tier2' && 'Professional Tier Access'}
                        {codeTier === 'tier3' && 'Enterprise Tier Access'}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    <p className="text-red-400">Invalid or expired code</p>
                  </>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Email <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-[#39FF14] focus:ring-1 focus:ring-[#39FF14] outline-none transition"
                placeholder="you@company.com"
              />
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Full Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-[#39FF14] focus:ring-1 focus:ring-[#39FF14] outline-none transition"
                placeholder="John Doe"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Password <span className="text-red-400">*</span>
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-[#39FF14] focus:ring-1 focus:ring-[#39FF14] outline-none transition"
                placeholder="At least 6 characters"
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Confirm Password <span className="text-red-400">*</span>
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                minLength={6}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-[#39FF14] focus:ring-1 focus:ring-[#39FF14] outline-none transition"
                placeholder="Re-enter password"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || (!!code && codeValid === false)}
              className="w-full py-4 bg-gradient-to-r from-[#39FF14] to-[#0CE293] text-black font-bold rounded-xl hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-white/50 text-sm">
              Already have an account?{' '}
              <Link href="/login" className="text-[#39FF14] hover:text-[#32E012] transition font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
