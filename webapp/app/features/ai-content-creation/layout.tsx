import { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://greenline365.com';

export const metadata: Metadata = {
  title: 'AI Content Creation - Automated Blog & Social Media Content',
  description: 'Generate high-quality blog posts, social media content, and marketing copy in minutes. AI-powered content creation at scale with 85% time savings and SEO optimization built-in.',
  keywords: [
    'AI content creation',
    'AI-powered content creation at scale',
    'automated blog generation for B2B',
    'AI writing assistant with citations',
    'automated content production systems',
    'can AI create human-like articles',
    'how to automate content scheduling with AI',
    'generative AI for marketing',
  ],
  openGraph: {
    title: 'AI Content Creation - Scale Your Content Production 10x',
    description: 'Generate blog posts, social media content, and marketing copy in minutes. AI-powered content creation with brand voice consistency and SEO optimization.',
    url: `${siteUrl}/features/ai-content-creation`,
    type: 'website',
    images: [
      {
        url: `${siteUrl}/og-content-creation.png`,
        width: 1200,
        height: 630,
        alt: 'GreenLine365 AI Content Creation',
      },
    ],
  },
  alternates: {
    canonical: `${siteUrl}/features/ai-content-creation`,
  },
};

export default function AIContentCreationLayout({
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
            name: 'AI Content Creation',
            description: 'AI-powered content creation platform for automated blog generation, social media content, and marketing copy.',
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
              ratingCount: '350',
            },
          }),
        }}
      />
      {children}
    </>
  );
}
