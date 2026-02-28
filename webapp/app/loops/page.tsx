import { Metadata } from 'next';
import LoopsClient from './LoopsClient';

export const metadata: Metadata = {
  title: 'Local Experiences — GreenLine365',
  description: 'Discover curated itineraries featuring the best of Florida. Date nights, family fun, foodie trails, nightlife loops, and more.',
};

export default function LoopsPage() {
  return <LoopsClient />;
}
