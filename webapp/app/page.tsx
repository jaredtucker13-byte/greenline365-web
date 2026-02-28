import DirectoryClient from './directory/DirectoryClient';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

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
  return <DirectoryClient />;
}
