import type { Metadata } from 'next';
import Breadcrumbs from '@/app/components/Breadcrumbs';
import JsonLd from '@/app/components/JsonLd';
import SpokeListingGrid from '@/app/components/SpokeListingGrid';

export const metadata: Metadata = {
  title: 'Quick Eats — Restaurants, Cafes & Food Trucks | GreenLine365',
  description:
    'Discover the best restaurants, cafes, food trucks, and dining spots across Florida. Real reviews from locals on GreenLine365.',
  openGraph: {
    title: 'Quick Eats — Restaurants, Cafes & Food Trucks | GreenLine365',
    description:
      'Discover the best restaurants, cafes, food trucks, and dining spots across Florida.',
    url: 'https://greenline365.com/explore/dining',
  },
  alternates: { canonical: 'https://greenline365.com/explore/dining' },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Quick Eats — Restaurants, Cafes & Food Trucks',
  description:
    'Discover the best restaurants, cafes, food trucks, and dining spots across Florida.',
  url: 'https://greenline365.com/explore/dining',
  mainEntity: {
    '@type': 'ItemList',
    itemListElement: [
      {
        '@type': 'FoodEstablishment',
        name: 'Florida Dining Directory',
        description: 'Browse restaurants, cafes, and food trucks across Florida on GreenLine365.',
      },
    ],
  },
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://greenline365.com' },
      { '@type': 'ListItem', position: 2, name: 'Explore', item: 'https://greenline365.com/explore/dining' },
      { '@type': 'ListItem', position: 3, name: 'Quick Eats' },
    ],
  },
};

export default function DiningPage() {
  return (
    <div data-theme="explore" className="min-h-screen bg-[#0A0A0A]">
      <JsonLd data={jsonLd} />

      {/* Hero */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-5xl mx-auto">
          <Breadcrumbs
            items={[
              { label: 'Explore', href: '/explore/dining' },
              { label: 'Quick Eats' },
            ]}
          />
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-light text-white tracking-tight mt-8 mb-4">
            Quick <span className="text-gradient-gold font-semibold">Eats</span>
          </h1>
          <p className="text-lg text-white/50 max-w-2xl font-body leading-relaxed">
            From food trucks to fine dining — discover Florida&apos;s best restaurants, cafes, and
            hidden gems rated by real locals.
          </p>
        </div>
      </section>

      {/* Listings */}
      <section className="pb-24 px-6">
        <div className="max-w-5xl mx-auto">
          <SpokeListingGrid
            industry="dining"
            limit={24}
            emptyTitle="Coming Soon"
            emptyDescription="Browse dining spots by cuisine, location, and vibe — with real ratings from Florida foodies."
          />
        </div>
      </section>
    </div>
  );
}
