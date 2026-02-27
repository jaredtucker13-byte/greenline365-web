import { MetadataRoute } from 'next';

// ===========================================
// ROBOTS.TXT CONFIGURATION
// Guides search engine crawlers + AI agents
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
      // AI crawlers — allow them to read public pages + llms.txt
      {
        userAgent: 'GPTBot',
        allow: ['/', '/llms.txt', '/llms-full.txt'],
        disallow: ['/admin-v2/', '/god-mode/', '/api/', '/auth/', '/portal/', '/private/'],
      },
      {
        userAgent: 'ChatGPT-User',
        allow: ['/', '/llms.txt', '/llms-full.txt'],
        disallow: ['/admin-v2/', '/god-mode/', '/api/', '/auth/', '/portal/', '/private/'],
      },
      {
        userAgent: 'Claude-Web',
        allow: ['/', '/llms.txt', '/llms-full.txt'],
        disallow: ['/admin-v2/', '/god-mode/', '/api/', '/auth/', '/portal/', '/private/'],
      },
      {
        userAgent: 'PerplexityBot',
        allow: ['/', '/llms.txt', '/llms-full.txt'],
        disallow: ['/admin-v2/', '/god-mode/', '/api/', '/auth/', '/portal/', '/private/'],
      },
      {
        userAgent: 'Applebot-Extended',
        allow: ['/', '/llms.txt', '/llms-full.txt'],
        disallow: ['/admin-v2/', '/god-mode/', '/api/', '/auth/', '/portal/', '/private/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
