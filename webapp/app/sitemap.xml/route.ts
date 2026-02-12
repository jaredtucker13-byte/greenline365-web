import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const SITE_URL = 'https://greenline365.com';

export async function GET() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Get all listing slugs
  const { data: listings } = await supabase
    .from('directory_listings')
    .select('slug, updated_at, industry')
    .order('updated_at', { ascending: false });

  const now = new Date().toISOString().split('T')[0];

  // Static pages
  const staticPages = [
    { url: '/', priority: '1.0', changefreq: 'daily' },
    { url: '/pricing', priority: '0.8', changefreq: 'weekly' },
    { url: '/services', priority: '0.8', changefreq: 'weekly' },
    { url: '/about', priority: '0.6', changefreq: 'monthly' },
    { url: '/blog', priority: '0.7', changefreq: 'weekly' },
    { url: '/login', priority: '0.3', changefreq: 'monthly' },
    { url: '/register-business', priority: '0.7', changefreq: 'monthly' },
    { url: '/privacy', priority: '0.3', changefreq: 'monthly' },
    { url: '/terms', priority: '0.3', changefreq: 'monthly' },
    { url: '/trust', priority: '0.3', changefreq: 'monthly' },
    { url: '/how-it-works', priority: '0.6', changefreq: 'monthly' },
    { url: '/use-cases', priority: '0.6', changefreq: 'monthly' },
    { url: '/newsletter', priority: '0.5', changefreq: 'monthly' },
  ];

  // Destination guide pages
  const destinations = ['st-pete-beach', 'key-west', 'sarasota', 'daytona', 'ybor-city', 'orlando', 'miami', 'jacksonville'];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

  // Static pages
  for (const page of staticPages) {
    xml += `  <url>
    <loc>${SITE_URL}${page.url}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
  }

  // Destination guides
  for (const dest of destinations) {
    xml += `  <url>
    <loc>${SITE_URL}/destination/${dest}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
  }

  // All business listings
  if (listings) {
    for (const listing of listings) {
      const lastmod = listing.updated_at ? listing.updated_at.split('T')[0] : now;
      xml += `  <url>
    <loc>${SITE_URL}/listing/${listing.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
`;
    }
  }

  xml += `</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
