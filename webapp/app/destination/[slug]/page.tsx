import { Metadata } from 'next';
import DestinationGuideClient from './DestinationGuideClient';

const DESTINATIONS: Record<string, { label: string; tagline: string }> = {
  'st-pete-beach':  { label: 'St. Pete Beach',  tagline: "Florida's Sunshine City" },
  'key-west':       { label: 'Key West',         tagline: 'Close to Perfect, Far from Normal' },
  'sarasota':       { label: 'Sarasota',         tagline: 'Where Arts Meet the Gulf' },
  'ybor-city':      { label: 'Ybor City',        tagline: "Tampa's Historic Latin Quarter" },
  'daytona':        { label: 'Daytona Beach',    tagline: "World's Most Famous Beach" },
  'orlando':        { label: 'Orlando',          tagline: 'The City Beautiful' },
  'miami':          { label: 'Miami',            tagline: 'Neon Nights & Coastal Luxury' },
  'jacksonville':   { label: 'Jacksonville',     tagline: 'Gridiron Grit & Riverfront Views' },
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
