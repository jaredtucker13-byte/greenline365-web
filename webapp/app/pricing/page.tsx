import ComingSoonPage from '../coming-soon/page';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing - Affordable AI Business Automation',
  description: 'Simple, transparent pricing for GreenLine365. Start free and scale as you grow. AI-powered automation for small businesses at every budget.',
  keywords: ['pricing', 'small business software pricing', 'AI automation cost', 'business tools pricing'],
  openGraph: {
    title: 'GreenLine365 Pricing - Start Growing Today',
    description: 'Simple, transparent pricing. Start free and scale as you grow.',
  },
};

export default function PricingPage() {
  return <ComingSoonPage />;
}
