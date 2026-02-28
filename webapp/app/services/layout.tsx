import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://greenline365.com';

export const metadata: Metadata = {
  title: 'AI Business Automation Platform',
  description: 'Transform your local business with AI-powered automation. 24/7 smart booking, AI content creation, reputation management, and a full command center — all in one platform.',
  openGraph: {
    title: 'GreenLine365 — AI Business Automation Platform',
    description: 'Transform your local business with AI-powered automation. Smart booking, content creation, and reputation management.',
    url: `${siteUrl}/services`,
    images: [{ url: `${siteUrl}/og-image.png`, width: 1200, height: 630, alt: 'GreenLine365 AI Platform' }],
  },
  alternates: { canonical: `${siteUrl}/services` },
};

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
