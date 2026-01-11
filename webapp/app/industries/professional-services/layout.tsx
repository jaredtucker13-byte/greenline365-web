import { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://greenline365.com';

export const metadata: Metadata = {
  title: 'AI Automation for Professional Services - Save 20 Hours Per Week',
  description: 'AI-powered automation for lawyers, accountants, and consultants. Automated client intake, smart scheduling, and follow-ups. Save 20 hours/week and take on 50% more clients.',
  keywords: [
    'professional services automation',
    'AI for lawyers',
    'AI for accountants',
    'consultant automation',
    'automated client onboarding',
    'law firm scheduling software',
    'accounting practice management',
    'consultant booking system',
  ],
  openGraph: {
    title: 'AI Automation for Professional Services - Focus on Clients, Not Admin',
    description: 'Automated client intake, scheduling, and follow-ups for professional service providers. Save 20hrs/week, +50% more clients.',
    url: `${siteUrl}/industries/professional-services`,
    type: 'website',
    images: [
      {
        url: `${siteUrl}/og-professional-services.png`,
        width: 1200,
        height: 630,
        alt: 'GreenLine365 for Professional Services',
      },
    ],
  },
  alternates: {
    canonical: `${siteUrl}/industries/professional-services`,
  },
};

export default function ProfessionalServicesLayout({
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
            serviceType: 'Professional Services Automation Software',
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
              audienceType: 'Professional Service Providers',
            },
          }),
        }}
      />
      {children}
    </>
  );
}
