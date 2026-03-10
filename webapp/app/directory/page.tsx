import { Suspense } from 'react';
import DirectoryClient from './DirectoryClient';

export const dynamic = 'force-dynamic';

export default function DirectoryPage() {
  return (
    <Suspense>
      <DirectoryClient />
    </Suspense>
  );
}
