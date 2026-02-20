import { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://greenline365.com';

export const metadata: Metadata = {
  title: 'Calendar Integration - Unified Scheduling Across Every Platform | GreenLine365',
  description: 'Sync bookings, content schedules, campaigns, and team availability in one unified calendar. Two-way sync with Google Calendar, Outlook, and Cal.com.',
  keywords: [
    'unified business calendar',
    'calendar integration for small business',
    'Google Calendar booking sync',
    'content calendar automation',
    'campaign scheduling tool',
    'multi-source calendar for marketing',
    'Cal.com integration',
    'automated calendar management',
  ],
  openGraph: {
    title: 'Calendar Integration - One Calendar for Everything',
    description: 'Sync bookings, content, campaigns, and availability in a single unified calendar with two-way sync.',
    url: `${siteUrl}/features/calendar-integration`,
    type: 'website',
    images: [
      {
        url: `${siteUrl}/og-calendar-integration.png`,
        width: 1200,
        height: 630,
        alt: 'GreenLine365 Calendar Integration',
      },
    ],
  },
  alternates: {
    canonical: `${siteUrl}/features/calendar-integration`,
  },
};

export default function CalendarIntegrationLayout({
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
            name: 'Unified Calendar Integration',
            description:
              'Unified calendar that syncs bookings, content schedules, email campaigns, and team availability across Google Calendar, Outlook, and Cal.com.',
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
              ratingValue: '4.7',
              ratingCount: '190',
            },
          }),
        }}
      />
      {children}
    </>
  );
}
