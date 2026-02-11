'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';

function SuccessContent() {
  const params = useSearchParams();
  const tier = params.get('tier') || 'free';
  const listingId = params.get('listing');

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full text-center"
      >
        <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-white mb-3" data-testid="success-title">
          You&apos;re Listed!
        </h1>
        <p className="text-white/50 mb-8">
          Your business is now live on the GreenLine365 directory
          {tier !== 'free' && ' with your ' + tier.charAt(0).toUpperCase() + tier.slice(1) + ' subscription'}.
        </p>

        <div className="space-y-3">
          <Link
            href="/"
            className="block w-full py-3.5 bg-emerald-500 text-black font-bold rounded-xl hover:bg-emerald-400 transition"
            data-testid="success-browse-btn"
          >
            Browse Directory
          </Link>
          <Link
            href="/admin-v2"
            className="block w-full py-3.5 border border-white/10 text-white font-medium rounded-xl hover:border-white/20 transition"
            data-testid="success-dashboard-btn"
          >
            Go to Dashboard
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
