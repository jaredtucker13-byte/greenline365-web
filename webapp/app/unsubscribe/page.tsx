/**
 * Unsubscribe Page
 * 
 * Allows users to easily unsubscribe from emails with one click.
 * Supports unsubscribing from specific lists or all communications.
 */

'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';

type Status = 'loading' | 'confirm' | 'success' | 'error';

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const list = searchParams.get('list') || 'all'; // waitlist, newsletter, marketing, all
  const token = searchParams.get('token') || '';
  
  const [status, setStatus] = useState<Status>('confirm');
  const [message, setMessage] = useState('');
  const [inputEmail, setInputEmail] = useState(email);

  // Auto-unsubscribe if token is provided (one-click unsubscribe)
  useEffect(() => {
    if (token && email) {
      handleUnsubscribe();
    }
  }, []);

  const handleUnsubscribe = async () => {
    if (!inputEmail) {
      setMessage('Please enter your email address');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const response = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: inputEmail, 
          list,
          token 
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStatus('success');
        setMessage(data.message || 'You have been unsubscribed.');
      } else {
        setStatus('error');
        setMessage(data.error || 'Failed to unsubscribe. Please try again.');
      }
    } catch (err) {
      setStatus('error');
      setMessage('Something went wrong. Please try again.');
    }
  };

  const listLabels: Record<string, string> = {
    waitlist: 'Waitlist Updates',
    newsletter: 'Newsletter',
    marketing: 'Marketing Emails',
    all: 'All Communications',
  };

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
            <h1 className="text-2xl font-bold text-white mb-2">Processing...</h1>
            <p className="text-gray-400">Please wait while we update your preferences.</p>
          </div>
        )}

        {/* Confirmation State */}
        {status === 'confirm' && (
          <div className="bg-gradient-to-br from-gray-900/80 to-gray-900/40 border border-white/10 rounded-2xl p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">📧</span>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Unsubscribe</h1>
              <p className="text-gray-400">
                {email 
                  ? `Unsubscribe ${email} from ${listLabels[list] || 'our emails'}?`
                  : `Enter your email to unsubscribe from ${listLabels[list] || 'our emails'}.`
                }
              </p>
            </div>

            <div className="space-y-4">
              {!email && (
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Email Address</label>
                  <input
                    type="email"
                    value={inputEmail}
                    onChange={(e) => setInputEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 outline-none transition"
                  />
                </div>
              )}

              {message && (
                <p className="text-red-400 text-sm text-center">{message}</p>
              )}

              <button
                onClick={handleUnsubscribe}
                disabled={!inputEmail}
                className="w-full py-4 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Unsubscribe
              </button>

              <Link
                href="/"
                className="block text-center text-gray-400 hover:text-white text-sm"
              >
                ← Back to Homepage
              </Link>
            </div>
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
            <h1 className="text-2xl font-bold text-white mb-2">Unsubscribed</h1>
            <p className="text-gray-400 mb-6">{message}</p>
            <p className="text-gray-500 text-sm mb-8">
              We're sorry to see you go. You can always resubscribe later.
            </p>
            <Link
              href="/"
              className="inline-block px-8 py-3 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition"
            >
              Return to Homepage
            </Link>
          </div>
        )}

        {/* Error State */}
        {status === 'error' && (
          <div className="bg-gradient-to-br from-gray-900/80 to-gray-900/40 border border-red-500/30 rounded-2xl p-8 text-center">
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-5xl">❌</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Something Went Wrong</h1>
            <p className="text-gray-400 mb-6">{message}</p>
            <button
              onClick={() => setStatus('confirm')}
              className="inline-block px-8 py-3 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-gray-600 text-xs">
            Questions? Contact us at{' '}
            <a href="mailto:greenline365help@gmail.com" className="text-emerald-400 hover:underline">
              greenline365help@gmail.com
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
