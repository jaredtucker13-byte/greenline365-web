import ComingSoonPage from '../coming-soon/page';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About GreenLine365 - Our Mission to Help Small Businesses Thrive',
  description: 'Learn about GreenLine365 and our mission to empower small businesses with AI automation. Based in Tampa, FL - helping local businesses grow.',
  keywords: ['about GreenLine365', 'Tampa business software', 'small business mission', 'AI company'],
  openGraph: {
    title: 'About GreenLine365 - Empowering Small Businesses',
    description: 'Our mission to help small businesses thrive with AI automation.',
  },
};

export default function AboutPage() {
  return <ComingSoonPage />;
}
