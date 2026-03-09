import type { Metadata } from 'next';
import Breadcrumbs from '@/app/components/Breadcrumbs';
import JsonLd from '@/app/components/JsonLd';
import SpokeListingGrid from '@/app/components/SpokeListingGrid';

export const metadata: Metadata = {
  title: 'Professional Experts — Legal, Financial & Consulting | GreenLine365',
  description:
    'Connect with verified professional service providers in Florida. Attorneys, accountants, financial advisors, insurance agents, and consultants on GreenLine365.',
  openGraph: {
    title: 'Professional Experts — Legal, Financial & Consulting | GreenLine365',
    description:
      'Connect with verified professional service providers across Florida.',
    url: 'https://greenline365.com/services/professional',
  },
  alternates: { canonical: 'https://greenline365.com/services/professional' },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Professional Experts — Legal, Financial & Consulting',
  description:
    'Connect with verified professional service providers in Florida. Attorneys, accountants, financial advisors, and consultants.',
  url: 'https://greenline365.com/services/professional',
  mainEntity: {
    '@type': 'ItemList',
    itemListElement: [
      {
        '@type': 'ProfessionalService',
        name: 'Florida Professional Services Directory',
        description:
          'Browse verified attorneys, accountants, financial advisors, and professional experts across Florida.',
      },
    ],
  },
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://greenline365.com' },
      { '@type': 'ListItem', position: 2, name: 'Services', item: 'https://greenline365.com/services' },
      { '@type': 'ListItem', position: 3, name: 'Professional Experts' },
    ],
  },
};

const expertCategories = [
  { label: 'Attorneys', icon: '⚖️', desc: 'Legal counsel' },
  { label: 'Accountants', icon: '📊', desc: 'Tax & bookkeeping' },
  { label: 'Financial Advisors', icon: '💰', desc: 'Investment planning' },
  { label: 'Insurance', icon: '🛡️', desc: 'Coverage & claims' },
  { label: 'Real Estate', icon: '🏢', desc: 'Buy, sell, rent' },
  { label: 'IT Services', icon: '💻', desc: 'Tech support' },
];

export default function ProfessionalServicesPage() {
  return (
    <div data-theme="services" className="min-h-screen bg-[#0A0A0A]">
      <JsonLd data={jsonLd} />

      {/* Hero */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-5xl mx-auto">
          <Breadcrumbs
            items={[
              { label: 'Services', href: '/services' },
              { label: 'Professional Experts' },
            ]}
          />
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-light text-white tracking-tight mt-8 mb-4">
            Professional <span className="text-gradient-gold font-semibold">Experts</span>
          </h1>
          <p className="text-lg text-white/50 max-w-2xl font-body leading-relaxed">
            Legal, financial, and consulting professionals you can trust — verified and reviewed by
            Florida residents.
          </p>
        </div>
      </section>

      {/* Expert category quick links */}
      <section className="pb-12 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {expertCategories.map((cat) => (
              <div
                key={cat.label}
                className="rounded-[20px] border border-white/10 bg-white/[0.02] p-4 text-center transition-all duration-300 hover:scale-[1.03] hover:border-gold/30 hover:bg-white/[0.04] cursor-default"
              >
                <span className="text-xl mb-2 block">{cat.icon}</span>
                <h3 className="text-xs font-heading font-semibold text-white mb-0.5">
                  {cat.label}
                </h3>
                <p className="text-[10px] text-white/30">{cat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Listings */}
      <section className="pb-24 px-6">
        <div className="max-w-5xl mx-auto">
          <SpokeListingGrid
            industry="professional-services"
            limit={24}
            emptyTitle="Coming Soon"
            emptyDescription="Browse attorneys, accountants, financial advisors, insurance agents, and more across Florida."
          />
        </div>
      </section>
    </div>
  );
}
