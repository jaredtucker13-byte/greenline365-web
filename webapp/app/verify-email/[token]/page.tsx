/**
 * Email Verification Page
 * 
 * When user clicks the verification link in their email, they land here.
 * This page verifies the token and marks the email as verified.
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';

type Status = 'loading' | 'success' | 'expired' | 'invalid' | 'error';

export default function VerifyEmailPage() {
  const params = useParams();
  const token = params.token as string;
  const [status, setStatus] = useState<Status>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
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
          setMessage('This verification link has expired. Please request a new one.');
        } else if (data.invalid) {
          setStatus('invalid');
          setMessage('This verification link is invalid.');
        } else {
          setStatus('error');
          setMessage(data.error || 'Verification failed');
        }
      } catch (err) {
        setStatus('error');
        setMessage('Failed to verify email. Please try again.');
      }
    };

    if (token) {
      verifyEmail();
    } else {
      setStatus('invalid');
      setMessage('No verification token provided');
    }
  }, [token]);

  const statusConfig = {
    loading: {
      icon: '⏳',
      title: 'Verifying...',
      bg: 'border-gray-500/30',
    },
    success: {
      icon: '✅',
      title: 'Email Verified!',
      bg: 'border-emerald-500/30',
    },
    expired: {
      icon: '⏰',
      title: 'Link Expired',
      bg: 'border-yellow-500/30',
    },
    invalid: {
      icon: '❌',
      title: 'Invalid Link',
      bg: 'border-red-500/30',
    },
    error: {
      icon: '⚠️',
      title: 'Verification Failed',
      bg: 'border-red-500/30',
    },
  };

  const config = statusConfig[status];

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`max-w-md w-full bg-gradient-to-br from-gray-900/80 to-gray-900/40 border ${config.bg} rounded-2xl p-8 text-center`}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <span className="text-5xl">{config.icon}</span>
        </motion.div>

        <h1 className="text-2xl font-bold text-white mb-4">{config.title}</h1>
        <p className="text-gray-400 mb-8">{message}</p>

        {status === 'loading' && (
          <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto" />
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <p className="text-emerald-400 text-sm">
              You can now close this page or continue to the website.
            </p>
            <Link
              href="/"
              className="inline-block px-8 py-3 bg-emerald-500 text-black font-bold rounded-xl hover:bg-emerald-400 transition"
            >
              Go to GreenLine365 →
            </Link>
          </div>
        )}

        {(status === 'expired' || status === 'invalid' || status === 'error') && (
          <div className="space-y-4">
            <Link
              href="/"
              className="inline-block px-8 py-3 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition"
            >
              Return to Homepage
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
}
