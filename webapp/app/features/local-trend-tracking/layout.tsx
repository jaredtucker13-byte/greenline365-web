import { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://greenline365.com';

export const metadata: Metadata = {
  title: 'Local Trend Tracking - Real-Time Market Intelligence for Local Businesses',
  description: 'AI-powered local trend tracking monitors 50+ sources to find what your community wants. Real-time insights, weather-based opportunities, and competitive intelligence for local success.',
  keywords: [
    'local business AI tools',
    'local economy automation',
    'foot traffic optimization',
    'local trend tracking',
    'real-time local insights',
    'community-focused marketing',
    'local market intelligence',
    'weather-based marketing opportunities',
  ],
  openGraph: {
    title: 'Local Trend Tracking - Know What Your Community Wants',
    description: 'Real-time local market intelligence. AI monitors 50+ sources to find trends, events, and opportunities in your area.',
    url: `${siteUrl}/features/local-trend-tracking`,
    type: 'website',
    images: [
      {
        url: `${siteUrl}/og-local-trends.png`,
        width: 1200,
        height: 630,
        alt: 'GreenLine365 Local Trend Tracking',
      },
    ],
  },
  alternates: {
    canonical: `${siteUrl}/features/local-trend-tracking`,
  },
};

export default function LocalTrendTrackingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: 'Local Trend Tracking',
            description: 'AI-powered local trend tracking that monitors 50+ data sources for real-time market intelligence, weather-based opportunities, and competitive insights.',
            brand: {
              '@type': 'Brand',
              name: 'GreenLine365',
            },
            offers: {
              '@type': 'Offer',
              availability: 'https://schema.org/InStock',
              priceCurrency: 'USD',
            },
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: '4.8',
              ratingCount: '380',
            },
          }),
        }}
      />
      {children}
    </>
  );
}
