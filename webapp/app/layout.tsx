import './globals.css';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ChatWidget from './components/ChatWidget';
import ScrollToTop from './components/ScrollToTop';
import { ServiceWorkerProvider } from '@/lib/use-service-worker';
import { AdminEditModeProvider } from '@/components/editor';
import { ToastProvider } from '@/components/ui/os/Toast';
import type { Metadata } from 'next';

// ===========================================
// SEO CONFIGURATION - GreenLine365
// ===========================================

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://greenline365.com';

export const metadata: Metadata = {
  // Basic Meta Tags - AEO Optimized
  title: {
    default: 'GreenLine365 — Community Resource Directory for Local Businesses, Trails & Services',
    template: '%s | GreenLine365',
  },
  description: 'Your community resource for finding verified local businesses, trails, and services across Florida. Browse by service area, check live hours of operation, and discover trusted professionals near you.',
  keywords: [
    // Community Resource Directory
    'local business directory Florida',
    'find businesses near me',
    'business hours of operation',
    'open now near me',
    // Service Areas
    'browse by service area',
    'businesses in Pinellas County',
    'businesses in Hillsborough County',
    'Florida business directory',
    // Trails & Outdoor
    'hiking trails Florida',
    'biking trails near me',
    'outdoor recreation Florida',
    'nature trails and parks',
    // Destinations
    'St Pete Beach guide',
    'Key West directory',
    'Florida destination guides',
    // Local Business Focus
    'verified local businesses',
    'community resource platform',
    'local business reviews',
    'trusted local professionals',
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
    title: 'GreenLine365 — Community Resource Directory for Local Businesses, Trails & Services',
    description: 'Your community resource for finding verified local businesses, trails, and services across Florida. Browse by service area, check live hours, and discover trusted professionals near you.',
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
    title: 'GreenLine365 — Community Resource Directory for Local Businesses & Services',
    description: 'Find verified local businesses, trails, and services across Florida. Browse by service area, check live hours of operation, and discover trusted professionals near you.',
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
    google: 'qm4py-pDUrA0Ip4UWQ8sp_22oD6KN4pTF56ZCUL3Izs',
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
              description: 'Community resource platform connecting consumers with verified local businesses, trails, and services across Florida. Browse by service area, find hours of operation, and discover trusted professionals near you.',
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
              description: 'Community resource platform for finding verified local businesses, trails, and services across Florida. Browse by service area, check hours of operation, and find pros nearest to you.',
              featureList: [
                'Verified local business directory with hours of operation',
                'Open/closed status and real-time business hours',
                'Browse by service area and proximity',
                'Destination guides with trails and outdoor recreation',
                'Category-based search with distance sorting',
                'Business owner dashboard and analytics',
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
              description: 'Community resource platform connecting consumers with verified local businesses, trails, and outdoor recreation across Florida. Browse by service area, check business hours, and find trusted pros near you.',
              areaServed: {
                '@type': 'State',
                name: 'Florida',
                containedIn: { '@type': 'Country', name: 'United States' },
              },
              serviceType: [
                'Community Resource Directory',
                'Local Business Listings with Hours',
                'Service Area Browsing',
                'Destination Guides with Trails',
                'Outdoor Recreation Guide',
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
                    text: 'GreenLine365 is a community resource platform that helps you find verified local businesses, trails, and services across Florida. Browse by service area, check live hours of operation, and discover trusted professionals nearest to you.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'Can I see if a business is open right now?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Yes! GreenLine365 shows real-time open/closed status for businesses that have listed their hours of operation. You can see at a glance whether a business is currently open, when it closes, and when it opens next.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'How do I find businesses near me?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'GreenLine365 uses your location to sort businesses by proximity, showing the nearest ones first. You can also browse by service area or county to find businesses that serve your region.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'What are destination guides?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Destination guides are curated regional pages covering 8+ Florida cities. Each guide includes local businesses, trails, outdoor recreation, dining, and things to do — plus curated experience loops to help you explore.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'How do I claim my business listing?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Contact our team at greenline365help@gmail.com to verify your ownership and receive a claim code. Once verified, you can manage your listing, add hours of operation, photos, and unlock premium features.',
                  },
                },
              ],
            }),
          }}
        />
      </head>
      <body className="min-h-screen bg-obsidian">
        <ServiceWorkerProvider>
          <ToastProvider>
            <AdminEditModeProvider>
              <ScrollToTop />
              <Navbar />
              <main>{children}</main>
              <ChatWidget />
              <Footer />
            </AdminEditModeProvider>
          </ToastProvider>
        </ServiceWorkerProvider>
      </body>
    </html>
  );
}
