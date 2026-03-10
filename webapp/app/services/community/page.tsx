import type { Metadata } from 'next';
import Breadcrumbs from '@/app/components/Breadcrumbs';
import JsonLd from '@/app/components/JsonLd';
import SpokeListingGrid from '@/app/components/SpokeListingGrid';

export const metadata: Metadata = {
  title: 'Community Resources — Education, Childcare & Pet Services | GreenLine365',
  description:
    'Find community resources in Florida. Schools, tutoring, daycare, pet services, and more — all verified on GreenLine365.',
  openGraph: {
    title: 'Community Resources — Education, Childcare & Pet Services | GreenLine365',
    description:
      'Find schools, tutoring, daycare, pet services, and community resources across Florida.',
    url: 'https://greenline365.com/services/community',
  },
  alternates: { canonical: 'https://greenline365.com/services/community' },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Community Resources — Education, Childcare & Pet Services',
  description:
    'Find community resources in Florida. Schools, tutoring, daycare, pet services, and more.',
  url: 'https://greenline365.com/services/community',
  mainEntity: {
    '@type': 'ItemList',
    itemListElement: [
      {
        '@type': 'EducationalOrganization',
        name: 'Florida Education & Childcare Directory',
        description: 'Browse schools, tutoring, and childcare services across Florida.',
      },
      {
        '@type': 'LocalBusiness',
        name: 'Florida Pet Services Directory',
        description: 'Find veterinarians, groomers, and pet services across Florida.',
      },
    ],
  },
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://greenline365.com' },
      { '@type': 'ListItem', position: 2, name: 'Services', item: 'https://greenline365.com/services' },
      { '@type': 'ListItem', position: 3, name: 'Community Resources' },
    ],
  },
};

const resourceCategories = [
  { label: 'Preschools', icon: '🎨', desc: 'Early learning' },
  { label: 'Tutoring', icon: '📚', desc: 'Academic support' },
  { label: 'Daycare', icon: '👶', desc: 'Child care' },
  { label: 'Veterinarians', icon: '🐾', desc: 'Pet health' },
  { label: 'Pet Grooming', icon: '✂️', desc: 'Grooming & spa' },
  { label: 'Music Lessons', icon: '🎵', desc: 'Learn to play' },
];

export default function CommunityResourcesPage() {
  return (
    <div data-theme="services" className="min-h-screen bg-[#0A0A0A]">
      <JsonLd data={jsonLd} />

      {/* Hero */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-5xl mx-auto">
          <Breadcrumbs
            items={[
              { label: 'Services', href: '/services' },
              { label: 'Community Resources' },
            ]}
          />
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-light text-white tracking-tight mt-8 mb-4">
            Community <span className="text-gradient-gold font-semibold">Resources</span>
          </h1>
          <p className="text-lg text-white/50 max-w-2xl font-body leading-relaxed">
            Education, childcare, and pet services for Florida families — trusted providers in your
            neighborhood.
          </p>
        </div>
      </section>

      {/* Resource category grid */}
      <section className="pb-12 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {resourceCategories.map((cat) => (
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

      {/* Education listings */}
      <section className="pb-12 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-heading font-light text-white mb-6">
            Education & <span className="text-gradient-gold font-semibold">Childcare</span>
          </h2>
          <SpokeListingGrid
            industry="education"
            limit={12}
            emptyTitle="Coming Soon"
            emptyDescription="Preschools, tutoring centers, and childcare services across Florida."
          />
        </div>
      </section>

      {/* Pet services listings */}
      <section className="pb-24 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-heading font-light text-white mb-6">
            Pet <span className="text-gradient-gold font-semibold">Services</span>
          </h2>
          <SpokeListingGrid
            industry="pets"
            limit={12}
            emptyTitle="Coming Soon"
            emptyDescription="Veterinarians, pet groomers, boarding, and pet services across Florida."
          />
        </div>
      </section>
    </div>
  );
}
