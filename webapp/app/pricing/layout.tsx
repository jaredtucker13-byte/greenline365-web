import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://greenline365.com';

export const metadata: Metadata = {
  title: 'Pricing — Directory Listing Plans',
  description: 'Choose the right directory listing plan for your business. Free, Pro ($45/mo), and Premium ($89/mo) tiers with verified badges, priority search, analytics, and lead capture.',
  openGraph: {
    title: 'GreenLine365 Pricing — Directory Listing Plans',
    description: 'Free, Pro, and Premium directory listing plans. Verified badges, priority search, analytics, and lead capture.',
    url: `${siteUrl}/pricing`,
    images: [{ url: `${siteUrl}/og-image.png`, width: 1200, height: 630, alt: 'GreenLine365 Pricing' }],
  },
  alternates: { canonical: `${siteUrl}/pricing` },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
