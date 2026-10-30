import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { categories, getPostDate } from '../lib/blog';

export const GET: APIRoute = async ({ site: astroSite }) => {
  const origin = (astroSite || new URL('https://wordsmaster.app')).toString().replace(/\/$/, '');
  const today = new Date().toISOString().split('T')[0];

  const posts = (await getCollection('posts'))
    .filter((post) => post.slug !== 'general/getting-started')
    .sort((a, b) => getPostDate(b).getTime() - getPostDate(a).getTime());

  const staticPages = [
    { url: `${origin}/`, changefreq: 'daily', priority: '1.0', lastmod: today },
    { url: `${origin}/about/`, changefreq: 'monthly', priority: '0.6', lastmod: today },
    { url: `${origin}/games/`, changefreq: 'weekly', priority: '0.8', lastmod: today },
    { url: `${origin}/games/math/`, changefreq: 'weekly', priority: '0.85', lastmod: today },
    { url: `${origin}/games/fruitwave/`, changefreq: 'weekly', priority: '0.85', lastmod: today },
    { url: `${origin}/games/artcatcher/`, changefreq: 'weekly', priority: '0.8', lastmod: today }
  ];

  const categoryPages = Object.keys(categories).map((catKey) => ({
    url: `${origin}/category/${catKey}/`,
    changefreq: 'weekly',
    priority: '0.75',
    lastmod: today
  }));

  const postPages = posts.map((post) => {
    const postDate = getPostDate(post);
    const dateStr = !isNaN(postDate.getTime()) && postDate.getTime() > 0
      ? postDate.toISOString().split('T')[0]
      : today;

    return {
      url: `${origin}/posts/${post.slug}/`,
      changefreq: 'weekly',
      priority: '0.85',
      lastmod: dateStr
    };
  });

  const allUrls = [...staticPages, ...categoryPages, ...postPages];

  const urlElements = allUrls
    .map(
      (item) => `  <url>
    <loc>${item.url}</loc>
    <lastmod>${item.lastmod}</lastmod>
    <changefreq>${item.changefreq}</changefreq>
    <priority>${item.priority}</priority>
  </url>`
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlElements}
</urlset>
`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, must-revalidate'
    }
  });
};
