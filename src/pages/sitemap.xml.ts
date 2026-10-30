import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ site: astroSite }) => {
  const origin = (astroSite || new URL('https://wordsmaster.app')).toString().replace(/\/$/, '');
  const sitemap0Url = `${origin}/sitemap-0.xml`;

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${sitemap0Url}</loc>
  </sitemap>
</sitemapindex>
`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, must-revalidate'
    }
  });
};
