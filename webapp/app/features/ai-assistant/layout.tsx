import { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://greenline365.com';

export const metadata: Metadata = {
  title: 'AI Business Assistant - Your 24/7 Virtual Employee | GreenLine365',
  description: 'An AI assistant that knows your business inside out. Answers customer questions, qualifies leads, drafts replies, and handles routine tasks so you can focus on growth.',
  keywords: [
    'AI business assistant',
    'AI virtual employee for small business',
    'AI customer service chatbot',
    'automated lead qualification',
    'AI receptionist for local business',
    'how to use AI assistant for business',
    'best AI chatbot for small businesses',
    'AI-powered customer engagement',
  ],
  openGraph: {
    title: 'AI Business Assistant - Your 24/7 Virtual Employee',
    description: 'An AI assistant that knows your business inside out. Answers questions, qualifies leads, and handles tasks around the clock.',
    url: `${siteUrl}/features/ai-assistant`,
    type: 'website',
    images: [
      {
        url: `${siteUrl}/og-ai-assistant.png`,
        width: 1200,
        height: 630,
        alt: 'GreenLine365 AI Assistant',
      },
    ],
  },
  alternates: {
    canonical: `${siteUrl}/features/ai-assistant`,
  },
};

export default function AIAssistantLayout({
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
            name: 'AI Business Assistant',
            description:
              'AI-powered business assistant that handles customer questions, lead qualification, and routine tasks 24/7.',
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
              ratingCount: '280',
            },
          }),
        }}
      />
      {children}
    </>
  );
}
