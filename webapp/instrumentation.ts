// Instrumentation file for Next.js
// This file is used for server-side initialization

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Server-side error tracking is available via lib/error-tracking.ts
    // When upgrading to full @sentry/nextjs, initialize Sentry.init() here.
    console.log('[GL365] Server instrumentation initialized');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    console.log('[GL365] Edge runtime initialized');
  }
}
