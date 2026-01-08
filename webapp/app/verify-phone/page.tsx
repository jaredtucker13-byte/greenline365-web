'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

type VerificationStep = 'input' | 'otp' | 'success';

export default function VerifyPhonePage() {
  const [step, setStep] = useState<VerificationStep>('input');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
  });
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Format phone number as user types
    if (name === 'phone') {
      // Remove non-digits except +
      let formatted = value.replace(/[^\d+]/g, '');
      // Ensure it starts with +
      if (formatted && !formatted.startsWith('+')) {
        formatted = '+' + formatted;
      }
      setFormData({ ...formData, phone: formatted });
    } else {
      setFormData({ ...formData, [name]: value });
    }
    setError(null);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const digits = value.replace(/\D/g, '').slice(0, 6).split('');
      const newOtp = [...otp];
      digits.forEach((digit, i) => {
        if (index + i < 6) {
          newOtp[index + i] = digit;
        }
      });
      setOtp(newOtp);
      // Focus on next empty or last input
      const nextIndex = Math.min(index + digits.length, 5);
      otpRefs.current[nextIndex]?.focus();
    } else {
      const newOtp = [...otp];
      newOtp[index] = value.replace(/\D/g, '');
      setOtp(newOtp);
      
      // Auto-focus next input
      if (value && index < 5) {
        otpRefs.current[index + 1]?.focus();
      }
    }
    setError(null);
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const sendOTP = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          phone: formData.phone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.already_verified) {
          setError('This email is already verified. You can sign in.');
        } else {
          setError(data.error || 'Failed to send verification code');
        }
        setLoading(false);
        return;
      }

      setStep('otp');
      setCountdown(60); // 60 second cooldown for resend
      setOtp(['', '', '', '', '', '']);
    } catch (err) {
      setError('Network error. Please try again.');
    }

    setLoading(false);
  };

  const verifyOTP = async () => {
    const code = otp.join('');
    if (code.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          code,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Invalid verification code');
        setLoading(false);
        return;
      }

      setStep('success');
    } catch (err) {
      setError('Network error. Please try again.');
    }

    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (step === 'input') {
      await sendOTP();
    } else if (step === 'otp') {
      await verifyOTP();
    }
  };

  const resendOTP = async () => {
    if (countdown > 0) return;
    await sendOTP();
  };

  return (
    <div className="py-12 min-h-[calc(100vh-200px)]">
      <div className="max-w-md mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-2">
            {step === 'success' ? '✅ Verified!' : 'Verify Your Account'}
          </h1>
          <p className="text-white/60">
            {step === 'input' && 'Enter your email and mobile number to receive a verification code.'}
            {step === 'otp' && `We sent a 6-digit code to ${formData.phone}`}
            {step === 'success' && 'Your phone and email have been verified successfully.'}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-gray-900/80 to-gray-900/40 border border-white/10 rounded-2xl p-8"
        >
          <AnimatePresence mode="wait">
            {step === 'input' && (
              <motion.form
                key="input"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 outline-none transition"
                    placeholder="you@company.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Mobile Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 outline-none transition"
                    placeholder="+1 (555) 123-4567"
                  />
                  <p className="text-white/40 text-xs mt-1">
                    Include country code (e.g., +1 for US)
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-emerald-500 text-black font-bold rounded-xl hover:bg-emerald-400 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      Sending code...
                    </>
                  ) : (
                    'Send Verification Code'
                  )}
                </button>
              </motion.form>
            )}

            {step === 'otp' && (
              <motion.form
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-4 text-center">
                    Enter the 6-digit code
                  </label>
                  <div className="flex gap-2 justify-center">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => { otpRefs.current[index] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        className="w-12 h-14 text-center text-2xl font-bold rounded-xl bg-white/5 border border-white/10 text-white focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 outline-none transition"
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.join('').length !== 6}
                  className="w-full py-4 bg-emerald-500 text-black font-bold rounded-xl hover:bg-emerald-400 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify Code'
                  )}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={resendOTP}
                    disabled={countdown > 0}
                    className="text-sm text-white/60 hover:text-emerald-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {countdown > 0 
                      ? `Resend code in ${countdown}s` 
                      : "Didn't get the code? Resend"}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setStep('input')}
                  className="w-full text-sm text-white/40 hover:text-white/60 transition"
                >
                  ← Change phone number
                </button>
              </motion.form>
            )}

            {step === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-4"
              >
                <div className="text-6xl mb-4">🎉</div>
                <p className="text-white/80 mb-6">
                  Your account is now verified. You can proceed to create your full account or sign in.
                </p>
                <div className="space-y-3">
                  <Link
                    href="/signup"
                    className="block w-full py-4 bg-emerald-500 text-black font-bold rounded-xl hover:bg-emerald-400 transition text-center"
                  >
                    Create Account
                  </Link>
                  <Link
                    href="/login"
                    className="block w-full py-4 bg-white/5 text-white font-medium rounded-xl hover:bg-white/10 transition text-center border border-white/10"
                  >
                    Sign In
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <p className="text-center text-white/30 text-xs mt-6">
          We respect your privacy. Your phone number is only used for verification.
        </p>
      </div>
    </div>
  );
}
