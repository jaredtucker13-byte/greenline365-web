import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DIRECTORY_CATEGORIES, DIRECTORY_CITIES } from '@/lib/directory-config';
import CityCategoryClient from './CityCategoryClient';

export async function generateStaticParams() {
  const params: { category: string; city: string }[] = [];
  for (const cat of DIRECTORY_CATEGORIES) {
    for (const city of DIRECTORY_CITIES) {
      params.push({ category: cat.id, city: city.slug });
    }
  }
  return params;
}

export async function generateMetadata({ params }: { params: Promise<{ category: string; city: string }> }): Promise<Metadata> {
  const { category, city } = await params;
  const cat = DIRECTORY_CATEGORIES.find(c => c.id === category);
  const cty = DIRECTORY_CITIES.find(c => c.slug === city);
  if (!cat || !cty) return { title: 'Page Not Found' };

  const title = `${cat.label} in ${cty.label} — Local Businesses | GreenLine365`;
  const description = `Find the best ${cat.label.toLowerCase()} businesses in ${cty.label}. ${cty.description} Browse verified ${cat.subcategories.slice(0, 4).join(', ')} and more on GreenLine365.`;

  return {
    title,
    description,
    openGraph: { title, description, type: 'website' },
  };
}

export default async function CityCategoryPage({ params }: { params: Promise<{ category: string; city: string }> }) {
  const { category, city } = await params;
  const cat = DIRECTORY_CATEGORIES.find(c => c.id === category);
  const cty = DIRECTORY_CITIES.find(c => c.slug === city);
  if (!cat || !cty) notFound();

  return <CityCategoryClient category={cat} city={cty} allCities={DIRECTORY_CITIES} allCategories={DIRECTORY_CATEGORIES} />;
}
