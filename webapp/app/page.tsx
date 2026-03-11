import { Suspense } from 'react';
import DirectoryClient from './directory/DirectoryClient';
import type { Metadata } from 'next';

export const revalidate = 60; // ISR: revalidate every 60s instead of force-dynamic

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://greenline365.com';

export const metadata: Metadata = {
  title: 'GreenLine365 — Verified Local Business Directory',
  description: 'Discover verified local businesses across dining, services, nightlife, wellness, and more. GreenLine365 is the gold standard directory connecting communities with trusted local businesses.',
  openGraph: {
    title: 'GreenLine365 — Verified Local Business Directory',
    description: 'Discover verified local businesses across dining, services, nightlife, wellness, and more.',
    url: siteUrl,
    images: [{ url: `${siteUrl}/og-image.png`, width: 1200, height: 630, alt: 'GreenLine365 Directory' }],
  },
  alternates: { canonical: siteUrl },
};

/**
 * Homepage - GL365 Directory
 * The directory is now the main landing page.
 * Previous homepage content moved to /services
 */
export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#C9A84C]/30 border-t-[#C9A84C] rounded-full animate-spin" />
      </div>
    }>
      <DirectoryClient />
    </Suspense>
  );
}
