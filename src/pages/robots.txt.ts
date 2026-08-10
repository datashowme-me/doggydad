import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const sitemap = new URL(`${import.meta.env.BASE_URL}sitemap-index.xml`, site || 'https://doggydad.pages.dev');
  const llms = new URL(`${import.meta.env.BASE_URL}llms.txt`, site || 'https://doggydad.pages.dev');
  const robotsTxt = `User-agent: *
Allow: /

Sitemap: ${sitemap}
# LLMs: ${llms}
`;
  return new Response(robotsTxt, {
    headers: { 'Content-Type': 'text/plain' }
  });
};
