import type { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumbs from '@/app/components/Breadcrumbs';

const destinations = [
  { slug: 'st-pete-beach', label: 'St. Pete Beach', description: 'Award-winning beaches and waterfront dining' },
  { slug: 'key-west', label: 'Key West', description: 'Island vibes, sunsets, and ocean adventures' },
  { slug: 'sarasota', label: 'Sarasota', description: 'Arts, culture, and pristine Gulf shores' },
  { slug: 'daytona', label: 'Daytona Beach', description: 'Racing heritage and Atlantic coast fun' },
  { slug: 'ybor-city', label: 'Ybor City', description: 'Historic district with vibrant nightlife' },
  { slug: 'orlando', label: 'Orlando', description: 'Theme parks and world-class entertainment' },
  { slug: 'miami', label: 'Miami', description: 'Art deco, diverse cuisine, and beach culture' },
  { slug: 'jacksonville', label: 'Jacksonville', description: 'River city with beaches and Southern charm' },
];

export const metadata: Metadata = {
  title: 'Florida Destinations — Explore Cities Across the Sunshine State | GreenLine365',
  description: 'Explore Florida\'s best destinations. From Key West to Jacksonville — discover local businesses, dining, and activities in cities across the state.',
};

export default function DestinationsPage() {
  return (
    <div data-theme="explore" className="min-h-screen bg-[#0A0A0A]">
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-5xl mx-auto">
          <Breadcrumbs items={[{ label: 'Explore', href: '/explore/dining' }, { label: 'Destinations' }]} />
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-light text-white tracking-tight mt-8 mb-4">
            Florida <span className="text-gradient-gold font-semibold">Destinations</span>
          </h1>
          <p className="text-lg text-white/50 max-w-2xl font-body leading-relaxed">
            Explore cities across the Sunshine State — discover local businesses, dining, and experiences in every destination.
          </p>
        </div>
      </section>

      <section className="pb-24 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {destinations.map((dest) => (
            <Link
              key={dest.slug}
              href={`/explore/destinations/${dest.slug}`}
              className="group rounded-[32px] border border-white/10 bg-white/[0.02] p-8 hover:bg-white/5 hover:border-gold/20 transition-all duration-300"
            >
              <h3 className="text-xl font-heading font-semibold text-white group-hover:text-gold transition-colors duration-300 mb-2">
                {dest.label}
              </h3>
              <p className="text-sm text-white/40">{dest.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
