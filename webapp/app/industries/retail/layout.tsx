import { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://greenline365.com';

export const metadata: Metadata = {
  title: 'AI Automation for Retail Stores - Increase Foot Traffic by 60%',
  description: 'AI-powered retail automation: hyper-local marketing, automated product posts, and foot traffic intelligence. Turn local trends into store sales and compete with Amazon locally.',
  keywords: [
    'retail store automation',
    'AI for retail',
    'local retail marketing',
    'foot traffic optimization',
    'retail social media automation',
    'small retail store marketing',
    'compete with Amazon locally',
    'retail AI assistant',
  ],
  openGraph: {
    title: 'AI Automation for Retail - Drive Foot Traffic with Local Intelligence',
    description: 'Hyper-local marketing automation for retail stores. +60% foot traffic, automated product posts, and local trend intelligence.',
    url: `${siteUrl}/industries/retail`,
    type: 'website',
    images: [
      {
        url: `${siteUrl}/og-retail.png`,
        width: 1200,
        height: 630,
        alt: 'GreenLine365 for Retail',
      },
    ],
  },
  alternates: {
    canonical: `${siteUrl}/industries/retail`,
  },
};

export default function RetailLayout({
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
            serviceType: 'Retail Store Automation Software',
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
              audienceType: 'Retail Stores',
            },
          }),
        }}
      />
      {children}
    </>
  );
}
