import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://greenline365.com';

export const metadata: Metadata = {
  title: 'About GreenLine365 — Our Story',
  description: 'GreenLine365 is building the gold standard in verified local business directories. Learn about our mission to connect communities with trusted businesses through AI-powered technology.',
  openGraph: {
    title: 'About GreenLine365 — Our Story',
    description: 'Building the gold standard in verified local business directories. AI-powered technology connecting communities with trusted businesses.',
    url: `${siteUrl}/about`,
    images: [{ url: `${siteUrl}/og-image.png`, width: 1200, height: 630, alt: 'About GreenLine365' }],
  },
  alternates: { canonical: `${siteUrl}/about` },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
