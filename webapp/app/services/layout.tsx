import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://greenline365.com';

export const metadata: Metadata = {
  title: {
    template: '%s | GreenLine365',
    default: 'Services — Find Trusted Local Pros | GreenLine365',
  },
  description: 'Browse verified home services, professional experts, and community resources across Florida on GreenLine365.',
  openGraph: {
    title: 'Services — GreenLine365',
    description: 'Find trusted local service providers across Florida.',
    url: `${siteUrl}/services`,
    images: [{ url: `${siteUrl}/og-image.png`, width: 1200, height: 630, alt: 'GreenLine365 Directory' }],
  },
  alternates: { canonical: `${siteUrl}/services` },
};

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
