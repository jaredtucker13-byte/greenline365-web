import { Metadata } from 'next';
import DestinationGuideClient from './DestinationGuideClient';

const DESTINATIONS: Record<string, { label: string; tagline: string }> = {
  'st-pete-beach':  { label: 'St. Pete Beach',  tagline: 'Sun-kissed shores & Gulf Coast charm' },
  'key-west':       { label: 'Key West',         tagline: 'Where the road ends and paradise begins' },
  'sarasota':       { label: 'Sarasota',         tagline: 'Culture, coastline & natural beauty' },
  'ybor-city':      { label: 'Ybor City',        tagline: 'Tampa\'s historic Latin quarter' },
  'daytona':        { label: 'Daytona Beach',    tagline: 'Speed, surf & endless summer' },
  'orlando':        { label: 'Orlando',          tagline: 'Theme park capital of the world' },
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const dest = DESTINATIONS[slug];
  return {
    title: dest ? `${dest.label} Guide — GreenLine365` : 'Destination Guide — GreenLine365',
    description: dest ? `Your complete guide to ${dest.label}, FL. Find the best places to stay, eat, explore, and more.` : 'Explore Florida destinations with GreenLine365.',
  };
}

export default async function DestinationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <DestinationGuideClient slug={slug} />;
}
