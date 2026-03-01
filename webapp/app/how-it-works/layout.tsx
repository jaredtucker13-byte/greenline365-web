import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://greenline365.com';

export const metadata: Metadata = {
  title: 'How It Works — Get Started with GreenLine365',
  description: 'See how GreenLine365 works in three simple steps: book a demo, get onboarded, and launch your AI-powered business operations. From directory listing to full command center.',
  openGraph: {
    title: 'How GreenLine365 Works — Get Started Today',
    description: 'Three simple steps to transform your business: book a demo, get onboarded, and launch your AI-powered operations.',
    url: `${siteUrl}/how-it-works`,
    images: [{ url: `${siteUrl}/og-image.png`, width: 1200, height: 630, alt: 'How GreenLine365 Works' }],
  },
  alternates: { canonical: `${siteUrl}/how-it-works` },
};

export default function HowItWorksLayout({ children }: { children: React.ReactNode }) {
  return children;
}
