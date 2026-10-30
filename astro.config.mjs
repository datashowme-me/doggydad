import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import remarkDemoteFirstHeading from './src/lib/remark-demote-first-heading.mjs';

const site = process.env.SITE_URL || 'https://wordsmaster.app';

export default defineConfig({
  site,
  base: '/',
  output: 'static',
  integrations: [
    sitemap({
      customPages: [
        'https://wordsmaster.app/games/artcatcher/'
      ],
      filter: (page) => !page.includes('/posts/general/getting-started') && !page.includes('/sitemap.xml'),
      serialize(item) {
        const url = item.url;
        if (url === 'https://wordsmaster.app/' || url === 'https://wordsmaster.app') {
          item.changefreq = 'daily';
          item.priority = 1.0;
        } else if (url.includes('/posts/')) {
          item.changefreq = 'weekly';
          item.priority = 0.85;
        } else if (url.includes('/category/')) {
          item.changefreq = 'weekly';
          item.priority = 0.75;
        } else if (url.includes('/games/')) {
          item.changefreq = 'weekly';
          item.priority = 0.8;
        } else {
          item.changefreq = 'monthly';
          item.priority = 0.6;
        }
        return item;
      }
    })
  ],
  redirects: {
    '/games/artcatcher': '/games/artcatcher/index.html',
    '/games/artcatcher/': '/games/artcatcher/index.html'
  },
  markdown: {
    remarkPlugins: [remarkDemoteFirstHeading],
    shikiConfig: {
      theme: 'github-dark',
      wrap: true
    }
  }
});
