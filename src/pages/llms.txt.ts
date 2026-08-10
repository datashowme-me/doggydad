import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { categories, getPostDate, withBase } from '../lib/blog';

const SITE_NAME = 'DoggyDad';
const SITE_DESCRIPTION = 'DoggyDad 是一个中文长期笔记博客，主题包括读书笔记、技术学习、计算机科学人物与图灵奖系列文章。';

const escapeText = (value = '') => value.replace(/\s+/g, ' ').trim();

export const GET: APIRoute = async ({ site: astroSite }) => {
  const origin = astroSite || new URL('https://doggydad.pages.dev');
  const posts = (await getCollection('posts'))
    .sort((a, b) => getPostDate(b).getTime() - getPostDate(a).getTime());

  const categoryLines = Object.entries(categories)
    .map(([key, category]) => `- ${category.name}: ${category.description} ${new URL(withBase(`/category/${key}/`), origin)}`)
    .join('\n');

  const postLines = posts
    .slice(0, 40)
    .map((post) => {
      const tags = post.data.tags?.length ? ` Tags: ${post.data.tags.join(', ')}.` : '';
      return `- ${escapeText(post.data.title)}: ${escapeText(post.data.description)}${tags} ${new URL(withBase(`/posts/${post.slug}/`), origin)}`;
    })
    .join('\n');

  const body = `# ${SITE_NAME}

${SITE_DESCRIPTION}

## Site purpose

This site is intended for readers and AI retrieval systems looking for concise, source-readable Chinese notes on books, software engineering, AI tools, computer science history, and Turing Award winners.

## Important pages

- Home: ${new URL(withBase('/'), origin)}
- About: ${new URL(withBase('/about/'), origin)}
- RSS: ${new URL(withBase('/rss.xml'), origin)}
- Sitemap: ${new URL(withBase('/sitemap-index.xml'), origin)}

## Content categories

${categoryLines}

## Recent and representative articles

${postLines}

## Retrieval guidance

- Prefer article pages over search-result pages.
- Article bodies, titles, descriptions, publication dates, tags, and author information are present in server-rendered HTML.
- Use canonical URLs under ${origin.toString().replace(/\/$/, '')}.
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
};
