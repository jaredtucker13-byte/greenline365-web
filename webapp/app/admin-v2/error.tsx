'use client';

import { useEffect } from 'react';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Admin Error]', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
          <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-heading font-bold text-white mb-2">Something went wrong</h2>
          <p className="text-white/50 text-sm">
            An error occurred in the command center. This has been logged.
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="btn-primary text-sm"
          >
            Try Again
          </button>
          <a href="/admin-v2" className="btn-ghost text-sm">
            Go to Dashboard
          </a>
        </div>
        {process.env.NODE_ENV === 'development' && (
          <pre className="mt-4 text-left text-xs text-red-400/70 bg-red-500/5 rounded-lg p-3 overflow-auto max-h-40">
            {error.message}
          </pre>
        )}
      </div>
    </div>
  );
}
