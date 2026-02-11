import './globals.css';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ChatWidget from './components/ChatWidget';
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
              description: 'AI-powered business automation platform that connects local businesses with their community through automated scheduling, content creation, and intelligent booking systems.',
              foundingDate: '2024',
              sameAs: [
                'https://twitter.com/greenline365',
                'https://facebook.com/greenline365',
                'https://instagram.com/greenline365',
                'https://linkedin.com/company/greenline365',
              ],
              contactPoint: {
                '@type': 'ContactPoint',
                contactType: 'customer service',
                availableLanguage: ['English'],
                areaServed: 'US',
              },
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: '4.8',
                ratingCount: '500',
                bestRating: '5',
                worstRating: '1',
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
              description: 'AI business automation platform for local businesses. Automate content creation, schedule appointments 24/7, and track local trends in real-time.',
              featureList: [
                'AI-powered content generation',
                'Automated scheduling and booking',
                'Real-time local trend tracking',
                '24/7 AI assistant',
                'Smart calendar integration',
                'Multi-channel content distribution',
              ],
              screenshot: `${siteUrl}/app-screenshot.png`,
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: '4.8',
                ratingCount: '500',
                bestRating: '5',
                worstRating: '1',
              },
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
              description: 'AI-powered business automation platform serving local businesses across the United States.',
              areaServed: {
                '@type': 'Country',
                name: 'United States',
              },
              serviceType: [
                'Business Automation',
                'AI Content Creation',
                'Appointment Scheduling',
                'Marketing Automation',
              ],
              priceRange: '$$',
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: '4.8',
                reviewCount: '500',
              },
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
                  name: 'How does GreenLine365 work?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'GreenLine365 is an AI-powered business operating system that connects your business with the local economy through automated scheduling and smart marketing. It provides AI-powered insights, 24/7 automation, and lead tracking to help local businesses grow.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'What makes GreenLine365 different from other tools?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'GreenLine365 is built specifically for local businesses. Our AI understands local markets and optimizes for real-world foot traffic, making it community-focused and designed for local success.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'How quickly can I start using GreenLine365?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Most businesses are fully onboarded within 24 hours. Our AI handles the heavy lifting with quick onboarding, simple setup, and instant results.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'Does GreenLine365 integrate with my existing tools?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Yes! GreenLine365 integrates with Google Calendar, Facebook, Instagram, Yelp, and 50+ other platforms with universal compatibility and one-click sync.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'What is the ROI of using GreenLine365?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Customers see an average 40% increase in lead conversion within the first 60 days, with most achieving first-month payback on their investment.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'Is there a contract or commitment required?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'No long-term contracts required. GreenLine365 offers monthly billing with the flexibility to cancel anytime. We don\'t lock you in.',
                  },
                },
              ],
            }),
          }}
        />
      </head>
      <body className="min-h-screen bg-[#050a08]">
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
