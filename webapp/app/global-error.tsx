'use client';

import NextError from 'next/error';
import { useEffect } from 'react';

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    // Report to error tracking (loads lib lazily to avoid bundling on every page)
    import('@/lib/error-tracking').then(({ captureException }) => {
      captureException(error, {
        source: 'global-error',
        extra: { digest: error.digest },
      });
    });
  }, [error]);

  return (
    <html lang="en">
      <body>
        <NextError statusCode={0} />
      </body>
    </html>
  );
}
