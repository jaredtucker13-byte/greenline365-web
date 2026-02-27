import { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://greenline365.com';

export const metadata: Metadata = {
  title: 'Analytics & Reporting - Real-Time Business Intelligence | GreenLine365',
  description: 'Track views, clicks, reviews, and conversions with real-time analytics dashboards. Know exactly what drives customers to your business.',
  keywords: [
    'business analytics dashboard',
    'local business analytics',
    'directory listing analytics',
    'customer engagement metrics',
    'review analytics',
    'small business reporting',
    'conversion tracking',
    'business intelligence platform',
  ],
  openGraph: {
    title: 'Analytics & Reporting - Know Your Numbers',
    description: 'Real-time dashboards tracking views, clicks, reviews, and conversions for your business listing.',
    url: `${siteUrl}/features/analytics-reporting`,
    type: 'website',
    images: [
      {
        url: `${siteUrl}/og-analytics.png`,
        width: 1200,
        height: 630,
        alt: 'GreenLine365 Analytics & Reporting',
      },
    ],
  },
  alternates: {
    canonical: `${siteUrl}/features/analytics-reporting`,
  },
};

export default function AnalyticsReportingLayout({
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
            name: 'Analytics & Reporting Dashboard',
            description:
              'Real-time business analytics tracking views, clicks, reviews, and conversions with actionable insights for local businesses.',
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
              ratingValue: '4.6',
              ratingCount: '145',
            },
          }),
        }}
      />
      {children}
    </>
  );
}
