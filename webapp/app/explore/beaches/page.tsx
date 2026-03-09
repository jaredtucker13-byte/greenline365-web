import type { Metadata } from 'next';
import Breadcrumbs from '@/app/components/Breadcrumbs';
import JsonLd from '@/app/components/JsonLd';
import SpokeListingGrid from '@/app/components/SpokeListingGrid';

export const metadata: Metadata = {
  title: 'Best Beaches in Florida — Sun, Sand & Coastal Adventures | GreenLine365',
  description:
    "Explore Florida's best beaches. From St. Pete Beach to Key West — find the perfect coastal destination with local tips and nearby businesses.",
  openGraph: {
    title: 'Best Beaches in Florida — Sun, Sand & Coastal Adventures | GreenLine365',
    description: "Explore Florida's best beaches with local tips and nearby businesses.",
    url: 'https://greenline365.com/explore/beaches',
  },
  alternates: { canonical: 'https://greenline365.com/explore/beaches' },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Best Beaches in Florida',
  description:
    "Explore Florida's best beaches. Find the perfect coastal destination with local tips and nearby businesses.",
  url: 'https://greenline365.com/explore/beaches',
  mainEntity: {
    '@type': 'ItemList',
    itemListElement: [
      {
        '@type': 'TouristAttraction',
        name: 'Florida Beaches Directory',
        description:
          'Discover beaches, water sports, and coastal adventures across Florida on GreenLine365.',
      },
    ],
  },
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://greenline365.com' },
      { '@type': 'ListItem', position: 2, name: 'Explore', item: 'https://greenline365.com/explore/beaches' },
      { '@type': 'ListItem', position: 3, name: 'Best Beaches' },
    ],
  },
};

const beachHighlights = [
  { name: 'St. Pete Beach', desc: 'Award-winning white sand and sunset views', icon: '🏖️' },
  { name: 'Key West', desc: 'Tropical vibes and ocean adventures', icon: '🌴' },
  { name: 'Clearwater Beach', desc: 'Crystal-clear water and dolphin tours', icon: '🐬' },
  { name: 'Siesta Key', desc: 'Powdery quartz sand and laid-back charm', icon: '☀️' },
];

export default function BeachesPage() {
  return (
    <div data-theme="explore" className="min-h-screen bg-[#0A0A0A]">
      <JsonLd data={jsonLd} />

      {/* Hero */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-5xl mx-auto">
          <Breadcrumbs
            items={[
              { label: 'Explore', href: '/explore/dining' },
              { label: 'Best Beaches' },
            ]}
          />
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-light text-white tracking-tight mt-8 mb-4">
            Best <span className="text-gradient-gold font-semibold">Beaches</span>
          </h1>
          <p className="text-lg text-white/50 max-w-2xl font-body leading-relaxed">
            Sun, sand, and coastal adventures — discover Florida&apos;s top beaches and the
            businesses that make them special.
          </p>
        </div>
      </section>

      {/* Beach highlights */}
      <section className="pb-12 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {beachHighlights.map((beach) => (
              <div
                key={beach.name}
                className="rounded-[24px] border border-white/10 bg-white/[0.02] p-6 transition-all duration-300 hover:scale-[1.02] hover:border-gold/30 hover:bg-white/[0.04]"
              >
                <span className="text-2xl mb-3 block">{beach.icon}</span>
                <h3 className="text-sm font-heading font-semibold text-white mb-1">
                  {beach.name}
                </h3>
                <p className="text-xs text-white/40">{beach.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Nearby businesses */}
      <section className="pb-24 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-heading font-light text-white mb-6">
            Businesses Near the <span className="text-gradient-gold font-semibold">Beach</span>
          </h2>
          <SpokeListingGrid
            industry="destinations"
            limit={12}
            emptyTitle="Coming Soon"
            emptyDescription="Beach guides with nearby dining, water sports, rentals, and local tips from Florida residents."
          />
        </div>
      </section>
    </div>
  );
}
