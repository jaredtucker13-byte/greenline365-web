import { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://greenline365.com';

export const metadata: Metadata = {
  title: 'AI Automation for Restaurants - Increase Reservations by 45%',
  description: 'AI-powered restaurant automation: 24/7 booking, automated social media, local trend tracking, and smart table management. Reduce no-shows by 90% and fill every table.',
  keywords: [
    'restaurant automation software',
    'AI for restaurants',
    'restaurant booking system',
    'restaurant reservation software',
    'automated restaurant marketing',
    'restaurant AI assistant',
    'table management system',
    'restaurant social media automation',
  ],
  openGraph: {
    title: 'AI Automation for Restaurants - Fill Every Table',
    description: '24/7 AI booking, automated social content, and local trend tracking for restaurants. +45% reservations, 90% fewer no-shows.',
    url: `${siteUrl}/industries/restaurants`,
    type: 'website',
    images: [
      {
        url: `${siteUrl}/og-restaurants.png`,
        width: 1200,
        height: 630,
        alt: 'GreenLine365 for Restaurants',
      },
    ],
  },
  alternates: {
    canonical: `${siteUrl}/industries/restaurants`,
  },
};

export default function RestaurantsLayout({
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
            '@type': 'Service',
            serviceType: 'Restaurant Automation Software',
            provider: {
              '@type': 'Organization',
              name: 'GreenLine365',
            },
            areaServed: {
              '@type': 'Country',
              name: 'United States',
            },
            audience: {
              '@type': 'Audience',
              audienceType: 'Restaurants',
            },
          }),
        }}
      />
      {children}
    </>
  );
}
