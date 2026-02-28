import { Metadata } from 'next';
import LoopDetailClient from './LoopDetailClient';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const formatted = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return {
    title: `${formatted} — GreenLine365 Experiences`,
    description: `Explore the ${formatted} experience loop. A curated itinerary featuring the best local businesses.`,
  };
}

export default async function LoopDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <LoopDetailClient slug={slug} />;
}
