import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://greenline365.com';
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/pricing`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/services`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/register-business`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/how-it-works`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/use-cases`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/newsletter`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${baseUrl}/trust`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  ];

  // Destination guide pages
  const destinations = ['st-pete-beach', 'key-west', 'sarasota', 'daytona', 'ybor-city', 'orlando', 'miami', 'jacksonville'];
  const destPages: MetadataRoute.Sitemap = destinations.map(dest => ({
    url: `${baseUrl}/destination/${dest}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  // All business listing pages
  const { data: listings } = await supabase
    .from('directory_listings')
    .select('slug, updated_at')
    .order('updated_at', { ascending: false });

  const listingPages: MetadataRoute.Sitemap = (listings || []).map(l => ({
    url: `${baseUrl}/listing/${l.slug}`,
    lastModified: l.updated_at ? new Date(l.updated_at) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  return [...staticPages, ...destPages, ...listingPages];
}
