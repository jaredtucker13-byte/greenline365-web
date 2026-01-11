import { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://greenline365.com';

export const metadata: Metadata = {
  title: 'AI Automated Scheduling - 24/7 Appointment Booking System',
  description: 'Never miss a booking with AI-powered automated scheduling. 24/7 appointment booking, calendar sync, SMS reminders, and 40% increase in lead conversion. Zero missed calls.',
  keywords: [
    'AI scheduling software',
    'automated appointment booking',
    'AI booking tool',
    'automated client onboarding system',
    'intelligent business task management',
    'best AI booking tool for US small businesses',
    'AI-gated autonomous booking agent',
    'smart calendar integration',
  ],
  openGraph: {
    title: 'AI Automated Scheduling - Never Miss a Booking Again',
    description: '24/7 AI appointment booking with calendar sync, SMS reminders, and 40% more conversions. Turn missed calls into revenue.',
    url: `${siteUrl}/features/automated-scheduling`,
    type: 'website',
    images: [
      {
        url: `${siteUrl}/og-automated-scheduling.png`,
        width: 1200,
        height: 630,
        alt: 'GreenLine365 Automated Scheduling',
      },
    ],
  },
  alternates: {
    canonical: `${siteUrl}/features/automated-scheduling`,
  },
};

export default function AutomatedSchedulingLayout({
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
            name: 'Automated Scheduling',
            description: 'AI-powered 24/7 appointment booking system with calendar sync, SMS reminders, and intelligent conflict detection.',
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
              ratingValue: '4.9',
              ratingCount: '420',
            },
          }),
        }}
      />
      {children}
    </>
  );
}
