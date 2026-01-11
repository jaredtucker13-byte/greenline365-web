import { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://greenline365.com';

export const metadata: Metadata = {
  title: 'AI Automation for Healthcare - Reduce No-Shows by 75%',
  description: 'HIPAA-compliant AI automation for doctors, dentists, and therapists. 24/7 appointment booking, automated reminders, digital intake forms. Reduce no-shows by 75%, increase patient volume by 35%.',
  keywords: [
    'healthcare automation software',
    'AI for doctors',
    'medical practice automation',
    'dental practice software',
    'HIPAA compliant scheduling',
    'patient appointment booking',
    'reduce medical no-shows',
    'healthcare AI assistant',
  ],
  openGraph: {
    title: 'AI Automation for Healthcare - More Patients, Less Admin Burnout',
    description: 'HIPAA-compliant 24/7 booking, automated reminders, digital intake. 75% fewer no-shows, +35% patient volume.',
    url: `${siteUrl}/industries/healthcare`,
    type: 'website',
    images: [
      {
        url: `${siteUrl}/og-healthcare.png`,
        width: 1200,
        height: 630,
        alt: 'GreenLine365 for Healthcare',
      },
    ],
  },
  alternates: {
    canonical: `${siteUrl}/industries/healthcare`,
  },
};

export default function HealthcareLayout({
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
            serviceType: 'Healthcare Practice Automation Software',
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
              audienceType: 'Healthcare Providers',
            },
          }),
        }}
      />
      {children}
    </>
  );
}
