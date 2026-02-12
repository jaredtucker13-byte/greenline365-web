import { MetadataRoute } from 'next';

// ===========================================
// ROBOTS.TXT CONFIGURATION
// Guides search engine crawlers
// ===========================================

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://greenline365.com';
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin-v2/',      // Admin dashboard - don't index
          '/god-mode/',      // Super admin - don't index
          '/business-dashboard/', // Business owner dashboard - don't index
          '/api/',           // API routes - don't index
          '/auth/',          // Auth routes - don't index
          '/_next/',         // Next.js internals
          '/private/',       // Any private routes
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/admin-v2/', '/god-mode/', '/api/', '/auth/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
