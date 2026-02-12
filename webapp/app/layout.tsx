import './globals.css';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ChatWidget from './components/ChatWidget';
import ScrollToTop from './components/ScrollToTop';
import { ServiceWorkerProvider } from '@/lib/use-service-worker';
import { AdminEditModeProvider } from '@/components/editor';
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
              alternateName: 'GreenLine365 Business OS',
              url: siteUrl,
              logo: `${siteUrl}/logo.png`,
              description: 'Local business directory connecting consumers with verified businesses across Florida. Find dining, services, nightlife, wellness, and more.',
              foundingDate: '2024',
              contactPoint: {
                '@type': 'ContactPoint',
                contactType: 'customer service',
                email: 'greenline365help@gmail.com',
                availableLanguage: ['English'],
                areaServed: 'US',
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
              applicationSubCategory: 'Marketing Automation Software',
              operatingSystem: 'Web Browser',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
                availability: 'https://schema.org/InStock',
                'priceValidUntil': '2026-12-31',
              },
              description: 'Local business directory for Florida. Browse verified businesses across dining, services, nightlife, health & wellness, and more.',
              featureList: [
                'Verified local business listings',
                'Business detail pages with Google reviews',
                'Destination travel guides',
                'Category-based search and filtering',
                'Business owner dashboard',
              ],
              screenshot: `${siteUrl}/app-screenshot.png`,
              author: {
                '@type': 'Organization',
                name: 'GreenLine365',
              },
            }),
          }}
        />
        
        {/* JSON-LD for LocalBusiness Service */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'ProfessionalService',
              name: 'GreenLine365',
              image: `${siteUrl}/logo.png`,
              description: 'Local business directory serving businesses and consumers across Florida.',
              areaServed: {
                '@type': 'Country',
                name: 'United States',
              },
              serviceType: [
                'Local Business Directory',
                'Business Listings',
                'Destination Guides',
              ],
              priceRange: '$',
            }),
          }}
        />

        {/* JSON-LD for FAQ */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: [
                {
                  '@type': 'Question',
                  name: 'What is GreenLine365?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'GreenLine365 is a local business directory that helps consumers find verified, trusted businesses across Florida. We cover dining, services, nightlife, health & wellness, and more across 8+ destinations.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'How do businesses get listed?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Businesses are discovered through our data enrichment process using Google Places data. Business owners can then claim and manage their listing through our business dashboard.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'What do the directory tiers include?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Free listings include basic business info. Pro ($39/mo) adds a Verified badge, CTA buttons, and priority search. Premium ($59/mo) includes featured placement, all photos, analytics, and badge earning.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'How do I claim my business listing?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Contact our team at greenline365help@gmail.com to verify your ownership and receive a claim code. Once verified, you can manage your listing through the business dashboard.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'Is there a contract or commitment required?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'No long-term contracts required. Directory subscriptions are monthly billing with the flexibility to cancel anytime.',
                  },
                },
              ],
            }),
          }}
        />
      </head>
      <body className="min-h-screen bg-midnight-900">
        <ServiceWorkerProvider>
          <AdminEditModeProvider>
            <Navbar />
            <main>{children}</main>
            <ChatWidget />
            <Footer />
          </AdminEditModeProvider>
        </ServiceWorkerProvider>
      </body>
    </html>
  );
}
