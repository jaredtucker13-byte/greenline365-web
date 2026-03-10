import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Breadcrumbs from '@/app/components/Breadcrumbs';

const cityData: Record<string, { label: string; description: string }> = {
  'st-pete-beach': { label: 'St. Pete Beach', description: 'Award-winning beaches, waterfront dining, and Gulf Coast relaxation.' },
  'key-west': { label: 'Key West', description: 'Island paradise with ocean adventures, sunset celebrations, and tropical vibes.' },
  'sarasota': { label: 'Sarasota', description: 'Arts, culture, pristine Gulf shores, and world-class dining.' },
  'daytona': { label: 'Daytona Beach', description: 'Atlantic coast fun, racing heritage, and family entertainment.' },
  'ybor-city': { label: 'Ybor City', description: 'Historic district with vibrant nightlife, Cuban heritage, and eclectic dining.' },
  'orlando': { label: 'Orlando', description: 'Theme parks, world-class entertainment, and diverse dining scene.' },
  'miami': { label: 'Miami', description: 'Art deco architecture, diverse cuisine, beach culture, and nightlife.' },
  'jacksonville': { label: 'Jacksonville', description: 'River city with beaches, Southern charm, and a growing food scene.' },
};

export async function generateStaticParams() {
  return Object.keys(cityData).map((city) => ({ city }));
}

export async function generateMetadata({ params }: { params: Promise<{ city: string }> }): Promise<Metadata> {
  const { city } = await params;
  const data = cityData[city];
  if (!data) return { title: 'Destination Not Found' };
  return {
    title: `${data.label} — Local Businesses & Attractions | GreenLine365`,
    description: `Explore ${data.label}: ${data.description} Find verified local businesses, dining, and services on GreenLine365.`,
  };
}

export default async function CityDestinationPage({ params }: { params: Promise<{ city: string }> }) {
  const { city } = await params;
  const data = cityData[city];
  if (!data) notFound();

  return (
    <div data-theme="explore" className="min-h-screen bg-[#0A0A0A]">
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-5xl mx-auto">
          <Breadcrumbs items={[
            { label: 'Explore', href: '/explore/dining' },
            { label: 'Destinations', href: '/explore/destinations' },
            { label: data.label },
          ]} />
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-light text-white tracking-tight mt-8 mb-4">
            {data.label}
          </h1>
          <p className="text-lg text-white/50 max-w-2xl font-body leading-relaxed">
            {data.description}
          </p>
        </div>
      </section>

      <section className="pb-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-[32px] border border-white/10 bg-white/[0.02] p-12 text-center">
            <p className="text-white/30 text-sm uppercase tracking-widest mb-3">Coming Soon</p>
            <p className="text-white/50 max-w-md mx-auto mb-6">
              Full destination guide for {data.label} with local businesses, dining, attractions, and insider tips.
            </p>
            <Link
              href={`/destination/${city}`}
              className="inline-block px-6 py-2.5 text-sm rounded-full border border-gold/30 text-gold hover:bg-gold/10 transition-all duration-300"
            >
              View Current Guide
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
