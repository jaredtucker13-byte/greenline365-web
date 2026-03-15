'use client';

/**
 * Business Signup Page with Code Redemption
 * For customers who received an invite code
 */

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { Check, AlertCircle } from 'lucide-react';
import { validatePassword, validateEmail } from '@/lib/auth/password-validation';
import PasswordStrengthIndicator from '@/components/ui/PasswordStrengthIndicator';
import TermsCheckbox from '@/components/ui/TermsCheckbox';

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [code, setCode] = useState('');
  const [codeValid, setCodeValid] = useState<boolean | null>(null);
  const [codeTier, setCodeTier] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [termsError, setTermsError] = useState(false);
  const [fieldTouched, setFieldTouched] = useState<Record<string, boolean>>({});

  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    password: '',
    confirmPassword: '',
  });

  const passwordValidation = useMemo(() => validatePassword(formData.password), [formData.password]);
  const emailValid = useMemo(() => validateEmail(formData.email), [formData.email]);
  const passwordsMatch = formData.password === formData.confirmPassword;

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

  const handleFieldBlur = (fieldName: string) => {
    setFieldTouched(prev => ({ ...prev, [fieldName]: true }));
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

    if (!passwordValidation.isValid) {
      setError('Password does not meet all requirements');
      setLoading(false);
      return;
    }

    if (!agreedToTerms) {
      setTermsError(true);
      setError('You must agree to the Terms of Service and Privacy Policy');
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
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm mb-4" role="alert">
              {error}
            </div>
          )}

          {/* Terms checkbox */}
          <div className="mb-6">
            <TermsCheckbox
              checked={agreedToTerms}
              onChange={(checked) => { setAgreedToTerms(checked); if (checked) setTermsError(false); }}
              error={termsError}
            />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="sb-email" className="block text-sm font-medium text-white/80 mb-2">
                Email <span className="text-red-400">*</span>
              </label>
              <input
                id="sb-email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={() => handleFieldBlur('email')}
                required
                className={`w-full px-4 py-3 rounded-xl bg-white/5 border text-white placeholder:text-white/40 focus:border-[#39FF14] focus:ring-1 focus:ring-[#39FF14] outline-none transition ${
                  fieldTouched.email && formData.email && !emailValid ? 'border-red-500/50' : 'border-white/10'
                }`}
                placeholder="you@company.com"
                aria-invalid={fieldTouched.email && formData.email && !emailValid ? 'true' : undefined}
              />
              {fieldTouched.email && formData.email && !emailValid && (
                <p className="text-red-400 text-xs mt-1">Please enter a valid email address</p>
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

            {/* Full Name */}
            <div>
              <label htmlFor="sb-fullname" className="block text-sm font-medium text-white/80 mb-2">
                Full Name <span className="text-red-400">*</span>
              </label>
              <input
                id="sb-fullname"
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                onBlur={() => handleFieldBlur('fullName')}
                required
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:border-[#39FF14] focus:ring-1 focus:ring-[#39FF14] outline-none transition"
                placeholder="John Doe"
                aria-invalid={fieldTouched.fullName && !formData.fullName.trim() ? 'true' : undefined}
              />
              {fieldTouched.fullName && !formData.fullName.trim() && (
                <p className="text-red-400 text-xs mt-1">Full name is required</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="sb-password" className="block text-sm font-medium text-white/80 mb-2">
                Password <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  id="sb-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={() => handleFieldBlur('password')}
                  required
                  minLength={8}
                  className="w-full px-4 py-3 pr-12 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:border-[#39FF14] focus:ring-1 focus:ring-[#39FF14] outline-none transition"
                  placeholder="8+ chars, mixed case, number, symbol"
                  aria-describedby="sb-password-strength"
                />
                <EyeToggle show={showPassword} onClick={() => setShowPassword(!showPassword)} label={showPassword ? 'Hide password' : 'Show password'} />
              </div>
              <PasswordStrengthIndicator password={formData.password} />
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="sb-confirm-password" className="block text-sm font-medium text-white/80 mb-2">
                Confirm Password <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  id="sb-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onBlur={() => handleFieldBlur('confirmPassword')}
                  required
                  className={`w-full px-4 py-3 pr-12 rounded-xl bg-white/5 border text-white placeholder:text-white/40 focus:border-[#39FF14] focus:ring-1 focus:ring-[#39FF14] outline-none transition ${
                    fieldTouched.confirmPassword && formData.confirmPassword && !passwordsMatch ? 'border-red-500/50' : 'border-white/10'
                  }`}
                  placeholder="Re-enter password"
                  aria-invalid={fieldTouched.confirmPassword && formData.confirmPassword && !passwordsMatch ? 'true' : undefined}
                />
                <EyeToggle show={showConfirmPassword} onClick={() => setShowConfirmPassword(!showConfirmPassword)} label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'} />
              </div>
              {fieldTouched.confirmPassword && formData.confirmPassword && !passwordsMatch && (
                <p className="text-red-400 text-xs mt-1">Passwords do not match</p>
              )}
              {fieldTouched.confirmPassword && formData.confirmPassword && passwordsMatch && (
                <p className="text-green-400 text-xs mt-1 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                  </svg>
                  Passwords match
                </p>
              )}
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

export default function SignupWithCodePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-white/60">Loading...</div>
      </div>
    }>
      <SignupForm />
    </Suspense>
  );
}
