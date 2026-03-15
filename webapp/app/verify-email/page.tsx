'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase/client';

export default function VerifyEmailPage() {
  const router = useRouter();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [initialSent, setInitialSent] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      setEmail(session.user.email || '');

      // Check if already verified
      const { data: profile } = await supabase
        .from('profiles')
        .select('email_verified, account_type, is_admin')
        .eq('id', session.user.id)
        .single();

      if (profile?.email_verified) {
        // Already verified, redirect to appropriate portal
        if (profile.is_admin) {
          router.push('/admin-v2');
        } else if (profile.account_type === 'business') {
          router.push('/admin-v2');
        } else {
          router.push('/portal/consumer');
        }
        return;
      }

      // Send initial verification email
      if (!initialSent) {
        setInitialSent(true);
        await sendVerificationEmail();
      }
    };
    checkAuth();
  }, []);

  const sendVerificationEmail = async () => {
    setSending(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/verify-email', { method: 'POST' });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to send verification email');
      } else {
        setCooldown(60);
      }
    } catch {
      setError('Failed to send verification email');
    }

    setSending(false);
  };

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    setError(null);

    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits entered
    if (value && index === 5 && newCode.every(d => d !== '')) {
      handleVerify(newCode.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      const newCode = pasted.split('');
      setCode(newCode);
      inputRefs.current[5]?.focus();
      handleVerify(pasted);
    }
  };

  const handleVerify = async (codeStr?: string) => {
    const fullCode = codeStr || code.join('');
    if (fullCode.length !== 6) {
      setError('Please enter the full 6-digit code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: fullCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Verification failed');
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(data.redirectTo || '/portal/consumer');
      }, 1500);
    } catch {
      setError('Verification failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8 text-center">
          {success ? (
            <>
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Email Verified!</h2>
              <p className="text-white/60">Redirecting you to your portal...</p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-gold-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gold-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>

              <h2 className="text-2xl font-bold text-white mb-2">Almost there!</h2>
              <h3 className="text-lg text-white/80 mb-4">Verify your email</h3>

              <p className="text-white/50 text-sm mb-2">
                We&apos;ve sent a verification code to
              </p>
              <p className="text-gold-400 font-medium mb-6">{email}</p>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm mb-4" role="alert">
                  {error}
                </div>
              )}

              {/* 6-digit code input */}
              <div className="flex justify-center gap-2 mb-6" onPaste={handlePaste}>
                {code.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    className="w-12 h-14 text-center text-2xl font-bold rounded-xl bg-white/5 border border-white/10 text-white focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/50 outline-none transition"
                    aria-label={`Digit ${i + 1}`}
                  />
                ))}
              </div>

              <button
                onClick={() => handleVerify()}
                disabled={loading || code.some(d => d === '')}
                className="w-full py-3.5 bg-gold-500 text-black font-bold rounded-xl hover:bg-gold-400 transition disabled:opacity-50 flex items-center justify-center gap-2 mb-4"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                ) : (
                  'Verify Email'
                )}
              </button>

              <div className="space-y-3">
                <button
                  onClick={sendVerificationEmail}
                  disabled={sending || cooldown > 0}
                  className="text-gold-400 hover:text-gold-300 text-sm disabled:text-white/30 disabled:cursor-not-allowed transition"
                >
                  {cooldown > 0 ? `Resend in ${cooldown}s` : sending ? 'Sending...' : 'Resend Email'}
                </button>

                <p className="text-white/30 text-xs">
                  Can&apos;t find the email? Check your Spam or Junk folder.
                </p>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
