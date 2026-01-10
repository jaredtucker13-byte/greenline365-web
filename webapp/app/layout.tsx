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
  // Basic Meta Tags
  title: {
    default: 'GreenLine365 - AI Business Operating System for Small Businesses',
    template: '%s | GreenLine365',
  },
  description: 'Transform your small business with AI-powered automation. Get real-time local trends, automated content creation, smart scheduling, and 24/7 AI assistance. Stop guessing, start growing.',
  keywords: [
    'AI business automation',
    'small business software',
    'content automation',
    'local marketing',
    'business operating system',
    'AI marketing assistant',
    'Tampa small business',
    'social media automation',
    'business growth tools',
    'AI scheduling',
    'local trends',
    'content calendar',
    'business AI',
    'marketing automation',
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
    title: 'GreenLine365 - AI Business Operating System',
    description: 'Transform your small business with AI-powered automation. Real-time local trends, content creation, smart scheduling & 24/7 AI assistance.',
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'GreenLine365 - AI Business Operating System',
      },
    ],
  },
  
  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: 'GreenLine365 - AI Business Operating System',
    description: 'Transform your small business with AI-powered automation. Stop guessing, start growing.',
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
