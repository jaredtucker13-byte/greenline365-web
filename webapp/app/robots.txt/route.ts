export async function GET() {
  const robotsTxt = `User-agent: *
Allow: /
Disallow: /admin-v2/
Disallow: /god-mode/
Disallow: /dashboard/
Disallow: /business-dashboard/
Disallow: /api/

Sitemap: https://greenline365.com/sitemap.xml
`;

  return new Response(robotsTxt, {
    headers: { 'Content-Type': 'text/plain' },
  });
}
