import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DIRECTORY_CATEGORIES, DIRECTORY_CITIES } from '@/lib/directory-config';
import CategoryLandingClient from './CategoryLandingClient';

export async function generateStaticParams() {
  return DIRECTORY_CATEGORIES.map((cat) => ({ category: cat.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params;
  const cat = DIRECTORY_CATEGORIES.find(c => c.id === category);
  if (!cat) return { title: 'Category Not Found' };
  return {
    title: `${cat.label} — Local Businesses & Services | GreenLine365 Directory`,
    description: cat.description,
    openGraph: {
      title: `${cat.label} — GreenLine365 Directory`,
      description: cat.description,
      type: 'website',
    },
  };
}

export default async function CategoryLandingPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const cat = DIRECTORY_CATEGORIES.find(c => c.id === category);
  if (!cat) notFound();

  return <CategoryLandingClient category={cat} cities={DIRECTORY_CITIES} />;
}
