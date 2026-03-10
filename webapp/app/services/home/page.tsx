import type { Metadata } from 'next';
import Breadcrumbs from '@/app/components/Breadcrumbs';
import JsonLd from '@/app/components/JsonLd';
import SpokeListingGrid from '@/app/components/SpokeListingGrid';

export const metadata: Metadata = {
  title: 'Home Services — HVAC, Plumbing, Electrical & More | GreenLine365',
  description:
    'Find trusted home service professionals in Florida. HVAC, plumbing, electrical, roofing, pest control, and every trade you need — all verified on GreenLine365.',
  openGraph: {
    title: 'Home Services — HVAC, Plumbing, Electrical & More | GreenLine365',
    description:
      'Find trusted home service professionals in Florida — all verified on GreenLine365.',
    url: 'https://greenline365.com/services/home',
  },
  alternates: { canonical: 'https://greenline365.com/services/home' },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Home Services — HVAC, Plumbing, Electrical & More',
  description:
    'Find trusted home service professionals in Florida. HVAC, plumbing, electrical, roofing, pest control, and every trade you need.',
  url: 'https://greenline365.com/services/home',
  mainEntity: {
    '@type': 'ItemList',
    itemListElement: [
      {
        '@type': 'HomeAndConstructionBusiness',
        name: 'Florida Home Services Directory',
        description:
          'Browse verified HVAC, plumbing, electrical, and home service providers across Florida.',
      },
    ],
  },
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://greenline365.com' },
      { '@type': 'ListItem', position: 2, name: 'Services', item: 'https://greenline365.com/services' },
      { '@type': 'ListItem', position: 3, name: 'Home Services' },
    ],
  },
};

const tradeCategories = [
  { label: 'HVAC', icon: '❄️', desc: 'Heating & cooling' },
  { label: 'Plumbing', icon: '🔧', desc: 'Pipes & fixtures' },
  { label: 'Electrical', icon: '⚡', desc: 'Wiring & panels' },
  { label: 'Roofing', icon: '🏠', desc: 'Repair & install' },
  { label: 'Pest Control', icon: '🐛', desc: 'Treatment plans' },
  { label: 'Landscaping', icon: '🌿', desc: 'Lawn & garden' },
];

export default function HomeServicesPage() {
  return (
    <div data-theme="services" className="min-h-screen bg-[#0A0A0A]">
      <JsonLd data={jsonLd} />

      {/* Hero */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-5xl mx-auto">
          <Breadcrumbs
            items={[
              { label: 'Services', href: '/services' },
              { label: 'Home Services' },
            ]}
          />
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-light text-white tracking-tight mt-8 mb-4">
            Home <span className="text-gradient-gold font-semibold">Services</span>
          </h1>
          <p className="text-lg text-white/50 max-w-2xl font-body leading-relaxed">
            HVAC, Plumbing, Electrical, Roofing, Pest Control and every trade your Florida home
            needs — all verified and reviewed by your neighbors.
          </p>
        </div>
      </section>

      {/* Trade category quick links */}
      <section className="pb-12 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {tradeCategories.map((trade) => (
              <div
                key={trade.label}
                className="rounded-[20px] border border-white/10 bg-white/[0.02] p-4 text-center transition-all duration-300 hover:scale-[1.03] hover:border-gold/30 hover:bg-white/[0.04] cursor-default"
              >
                <span className="text-xl mb-2 block">{trade.icon}</span>
                <h3 className="text-xs font-heading font-semibold text-white mb-0.5">
                  {trade.label}
                </h3>
                <p className="text-[10px] text-white/30">{trade.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Listings */}
      <section className="pb-24 px-6">
        <div className="max-w-5xl mx-auto">
          <SpokeListingGrid
            industry="services"
            limit={24}
            emptyTitle="Coming Soon"
            emptyDescription="Full home services directory with category filters, verified pros, and real reviews from Florida homeowners."
          />
        </div>
      </section>
    </div>
  );
}
