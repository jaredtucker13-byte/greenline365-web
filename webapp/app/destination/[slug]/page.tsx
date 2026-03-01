import { Metadata } from 'next';
import DestinationGuideClient from './DestinationGuideClient';

const DESTINATIONS: Record<string, { label: string; tagline: string; region: string; stateAbbr: string }> = {
  'st-pete-beach':  { label: 'St. Pete Beach',  tagline: "Florida's Sunshine City",           region: 'Tampa Bay',    stateAbbr: 'FL' },
  'key-west':       { label: 'Key West',         tagline: 'Close to Perfect, Far from Normal', region: 'Florida Keys', stateAbbr: 'FL' },
  'sarasota':       { label: 'Sarasota',         tagline: 'Where Arts Meet the Gulf',          region: 'Gulf Coast',   stateAbbr: 'FL' },
  'ybor-city':      { label: 'Ybor City',        tagline: "Tampa's Historic Latin Quarter",    region: 'Tampa Bay',    stateAbbr: 'FL' },
  'daytona':        { label: 'Daytona Beach',    tagline: "World's Most Famous Beach",         region: 'East Coast',   stateAbbr: 'FL' },
  'orlando':        { label: 'Orlando',          tagline: 'The City Beautiful',                region: 'Central FL',   stateAbbr: 'FL' },
  'miami':          { label: 'Miami',            tagline: 'Neon Nights & Coastal Luxury',      region: 'South FL',     stateAbbr: 'FL' },
  'jacksonville':   { label: 'Jacksonville',     tagline: 'Gridiron Grit & Riverfront Views',  region: 'North FL',     stateAbbr: 'FL' },
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const dest = DESTINATIONS[slug];
  return {
    title: dest ? `${dest.label} Guide — GreenLine365` : 'Destination Guide — GreenLine365',
    description: dest
      ? `Your complete guide to ${dest.label}, ${dest.stateAbbr}. Find the best places to stay, eat, explore, and more — verified by GreenLine365.`
      : 'Explore destinations with GreenLine365.',
  };
}

export default async function DestinationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <DestinationGuideClient slug={slug} />;
}
