'use client';

import { useEffect } from 'react';

export default function DirectoryError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Directory Error]', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center">
          <svg className="w-8 h-8 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-heading font-bold text-white mb-2">Directory Unavailable</h2>
          <p className="text-white/50 text-sm">
            We couldn&apos;t load the directory right now. Please try again.
          </p>
        </div>
        <button onClick={reset} className="btn-primary text-sm">
          Reload Directory
        </button>
      </div>
    </div>
  );
}
