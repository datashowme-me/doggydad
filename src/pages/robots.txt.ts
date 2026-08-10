import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const sitemap = new URL(`${import.meta.env.BASE_URL}sitemap-index.xml`, site || 'https://doggydad.pages.dev');
  const robotsTxt = `User-agent: *
Allow: /

Sitemap: ${sitemap}
`;
  return new Response(robotsTxt, {
    headers: { 'Content-Type': 'text/plain' }
  });
};
