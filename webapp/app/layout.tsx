import './globals.css';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ChatWidget from './components/ChatWidget';
import type { Metadata } from 'next';

// ===========================================
// SEO CONFIGURATION - GreenLine365
// ===========================================

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://greenline365.com';

export const metadata: Metadata = {
  // Basic Meta Tags - AEO Optimized
  title: {
    default: 'GreenLine365 - AI Business Automation Platform for Local Businesses',
    template: '%s | GreenLine365',
  },
  description: 'AI-powered business automation platform that connects local businesses with their community. Automated scheduling, AI content creation, and 24/7 smart booking. Built for real-world results.',
  keywords: [
    // Core AEO Keywords
    'AI business booking tool',
    'answer engine optimization',
    'AI automation platform',
    // AI Content & Automation
    'AI-powered content creation at scale',
    'automated blog generation for B2B',
    'AI content scheduling automation',
    // Business & Booking
    'all-in-one AI business automation',
    'automated client onboarding system',
    'AI scheduling software',
    'intelligent business task management',
    // Local Business Focus
    'local business AI tools',
    'AI for small businesses',
    'local economy automation',
    'foot traffic optimization',
    // Long-tail variations
    'best AI booking tool for US small businesses',
    'remote business automation platform',
    'unified AI operations platform',
  ],
  authors: [{ name: 'GreenLine365', url: siteUrl }],
  creator: 'GreenLine365',
  publisher: 'GreenLine365',
  
  // Favicon & Icons
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  
  // Open Graph (Facebook, LinkedIn)
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: 'GreenLine365',
    title: 'GreenLine365 - AI Business Automation Platform for Local Businesses',
    description: 'AI-powered business automation that connects local businesses with their community. Automated scheduling, content creation, and smart booking built for real-world results.',
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'GreenLine365 - AI Business Automation Platform',
      },
    ],
  },
  
  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: 'GreenLine365 - AI Business Automation for Local Businesses',
    description: 'AI automation platform connecting local businesses with their community. Automated scheduling, content creation, and smart booking.',
    images: [`${siteUrl}/og-image.png`],
    creator: '@greenline365',
  },
  
  // Robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  
  // Verification (add your codes when you have them)
  verification: {
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
    // bing: 'your-bing-verification-code',
  },
  
  // Canonical URL
  alternates: {
    canonical: siteUrl,
  },
  
  // Category
  category: 'technology',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* JSON-LD Structured Data for Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'GreenLine365',
              url: siteUrl,
              logo: `${siteUrl}/logo.png`,
              description: 'AI-powered business operating system for small businesses',
              sameAs: [
                'https://twitter.com/greenline365',
                'https://facebook.com/greenline365',
                'https://instagram.com/greenline365',
                'https://linkedin.com/company/greenline365',
              ],
              contactPoint: {
                '@type': 'ContactPoint',
                contactType: 'customer service',
                availableLanguage: 'English',
              },
            }),
          }}
        />
        {/* JSON-LD for SoftwareApplication */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'GreenLine365',
              applicationCategory: 'BusinessApplication',
              operatingSystem: 'Web',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
              },
              description: 'AI Business Operating System - Automate content, track local trends, and grow your small business.',
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: '4.8',
                ratingCount: '150',
              },
            }),
          }}
        />
      </head>
      <body className="min-h-screen bg-[#050a08]">
        <Navbar />
        <main>{children}</main>
        <ChatWidget />
        <Footer />
      </body>
    </html>
  );
}
