import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const sitemap = new URL(`${import.meta.env.BASE_URL}sitemap-index.xml`, site || 'https://doggydad.pages.dev');
  const llms = new URL(`${import.meta.env.BASE_URL}llms.txt`, site || 'https://doggydad.pages.dev');
  const robotsTxt = `User-agent: *
Allow: /

User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Applebot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: ClaudeBot
Allow: /

Sitemap: ${sitemap}
# LLMs: ${llms}
# Training-crawler policy is intentionally not finalized in robots.txt yet. See /seo_to_do.md in the repository.
`;
  return new Response(robotsTxt, {
    headers: { 'Content-Type': 'text/plain' }
  });
};
