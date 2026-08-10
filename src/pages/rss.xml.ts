import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { getPostDate, withBase } from '../lib/blog';

const escapeXml = (value: string) => value.replace(/[<>&'\"]/g, (character) => ({
  '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;'
}[character] || character));

export const GET: APIRoute = async ({ site: astroSite }) => {
  const posts = (await getCollection('posts')).sort((a, b) => getPostDate(b).getTime() - getPostDate(a).getTime());
  const origin = astroSite || new URL('https://doggydad.pages.dev');
  const site = new URL(import.meta.env.BASE_URL, origin).toString().replace(/\/$/, '');
  const items = posts.map((post) => `
    <item>
      <title>${escapeXml(post.data.title)}</title>
      <link>${new URL(withBase(`/posts/${post.slug}/`), origin)}</link>
      <guid>${new URL(withBase(`/posts/${post.slug}/`), origin)}</guid>
      <pubDate>${getPostDate(post).toUTCString()}</pubDate>
      <description>${escapeXml(post.data.description)}</description>
    </item>`).join('');

  return new Response(`<?xml version="1.0" encoding="UTF-8" ?>
    <rss version="2.0"><channel>
      <title>DoggyDad</title>
      <link>${site}/</link>
      <description>把复杂的技术与思想，写成可以反复读的笔记。</description>
      <language>zh-CN</language>${items}
    </channel></rss>`, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};
