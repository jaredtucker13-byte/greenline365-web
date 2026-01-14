/**
 * Email Verification Page
 * 
 * Handles:
 * 1. Magic link verification (when user clicks link in email)
 * 2. Code entry verification (when user manually enters 6-digit code)
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';

type Status = 'loading' | 'success' | 'expired' | 'invalid' | 'error' | 'enter-code';

export default function VerifyEmailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const token = params.token as string;
  const emailFromUrl = searchParams.get('email') || '';
  
  const [status, setStatus] = useState<Status>('loading');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState(emailFromUrl);
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);

  // Auto-verify if token is provided (magic link click)
  useEffect(() => {
    const verifyToken = async () => {
      if (!token || token === 'enter-code') {
        setStatus('enter-code');
        return;
      }

      try {
        const response = await fetch(`/api/verify-email/${token}`, {
          method: 'POST',
        });

        const data = await response.json();

        if (data.success) {
          setStatus('success');
          setMessage(data.message || 'Email verified successfully!');
        } else if (data.expired) {
          setStatus('expired');
          setMessage('This verification link has expired. Please use the code from your email instead.');
        } else if (data.invalid) {
          setStatus('invalid');
          setMessage('This verification link is invalid. Please use the code from your email instead.');
        } else {
          setStatus('error');
          setMessage(data.error || 'Verification failed. Please try using the code instead.');
        }
      } catch (err) {
        setStatus('error');
        setMessage('Failed to verify. Please try using the code instead.');
      }
    };

    verifyToken();
  }, [token]);

  // Handle code verification
  const handleCodeVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !code || code.length !== 6) {
      setMessage('Please enter your email and 6-digit code');
      return;
    }

    setVerifying(true);
    setMessage('');

    try {
      const response = await fetch('/api/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();

      if (data.success) {
        setStatus('success');
        setMessage(data.message || 'Email verified successfully!');
      } else {
        setMessage(data.error || 'Invalid code. Please try again.');
      }
    } catch (err) {
      setMessage('Verification failed. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  // Show code entry form for invalid/expired links
  const showCodeEntry = status === 'enter-code' || status === 'invalid' || status === 'expired' || status === 'error';

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        {/* Loading State */}
        {status === 'loading' && (
          <div className="bg-gradient-to-br from-gray-900/80 to-gray-900/40 border border-white/10 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
              <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Verifying...</h1>
            <p className="text-gray-400">Please wait while we verify your email.</p>
          </div>
        )}

        {/* Success State */}
        {status === 'success' && (
          <div className="bg-gradient-to-br from-gray-900/80 to-gray-900/40 border border-emerald-500/30 rounded-2xl p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <span className="text-5xl">✅</span>
            </motion.div>
            <h1 className="text-2xl font-bold text-white mb-2">Email Verified!</h1>
            <p className="text-gray-400 mb-6">{message}</p>
            <p className="text-emerald-400 text-sm mb-8">
              You're now on the GreenLine365 waitlist. We'll notify you when we launch!
            </p>
            <Link
              href="/"
              className="inline-block px-8 py-3 bg-emerald-500 text-black font-bold rounded-xl hover:bg-emerald-400 transition"
            >
              Return to Homepage →
            </Link>
          </div>
        )}

        {/* Code Entry Form (for invalid/expired/manual entry) */}
        {showCodeEntry && (
          <div className="bg-gradient-to-br from-gray-900/80 to-gray-900/40 border border-white/10 rounded-2xl p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">🔐</span>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Enter Verification Code</h1>
              <p className="text-gray-400 text-sm">
                Enter the 6-digit code from your email to verify.
              </p>
              {(status === 'invalid' || status === 'expired') && (
                <p className="text-yellow-400 text-sm mt-2">
                  {status === 'expired' ? 'Your link expired.' : 'Link invalid.'} Use the code instead.
                </p>
              )}
            </div>

            <form onSubmit={handleCodeVerify} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">6-Digit Code</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  maxLength={6}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-center text-2xl tracking-[0.5em] font-mono placeholder:text-white/30 placeholder:tracking-normal placeholder:text-base focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 outline-none transition"
                />
              </div>

              {message && !['success'].includes(status) && (
                <p className="text-red-400 text-sm text-center">{message}</p>
              )}

              <button
                type="submit"
                disabled={verifying || code.length !== 6 || !email}
                className="w-full py-4 bg-emerald-500 text-black font-bold rounded-xl hover:bg-emerald-400 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {verifying ? (
                  <>
                    <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify Email'
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-white/10 text-center">
              <p className="text-gray-500 text-sm">
                Didn't receive the email? Check your spam folder.
              </p>
              <Link href="/waitlist" className="text-emerald-400 text-sm hover:underline mt-2 inline-block">
                ← Back to Waitlist
              </Link>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
