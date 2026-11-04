import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import remarkDemoteFirstHeading from './src/lib/remark-demote-first-heading.mjs';
import { getSitemapDates } from './src/lib/sitemap-dates.mjs';

const site = process.env.SITE_URL || 'https://wordsmaster.app';
const { postDates, categoryDates, latestSiteDate } = getSitemapDates();

export default defineConfig({
  site,
  base: '/',
  output: 'static',
  server: {
    host: '0.0.0.0',
    port: 3000
  },
  vite: {
    server: {
      hmr: false
    },
    plugins: [
      {
        name: 'dev-sitemap-server',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            if (req.url === '/sitemap-index.xml' || req.url === '/sitemap-0.xml') {
              const filePath = path.resolve(`./dist${req.url}`);
              if (fs.existsSync(filePath)) {
                res.setHeader('Content-Type', 'application/xml; charset=utf-8');
                return res.end(fs.readFileSync(filePath));
              }
            }
            if (req.url === '/sitemap.xml') {
              res.statusCode = 301;
              res.setHeader('Location', '/sitemap-index.xml');
              return res.end();
            }
            next();
          });
        }
      }
    ]
  },
  integrations: [
    sitemap({
      customPages: [
        'https://wordsmaster.app/games/artcatcher/'
      ],
      filter: (page) =>
        !page.includes('/posts/general/getting-started') &&
        !page.includes('/sitemap.xml'),
      serialize(item) {
        const cleanUrl = item.url.replace(/\/$/, '');
        const origin = site.replace(/\/$/, '');

        // 1. Homepage
        if (cleanUrl === origin) {
          item.changefreq = 'daily';
          item.priority = 1.0;
          item.lastmod = new Date(latestSiteDate);
          return item;
        }

        // 2. Games hub & Game pages
        if (cleanUrl === `${origin}/games`) {
          item.changefreq = 'weekly';
          item.priority = 0.85;
          item.lastmod = new Date('2026-10-01');
          return item;
        }
        if (cleanUrl.startsWith(`${origin}/games/words`)) {
          item.changefreq = 'weekly';
          item.priority = 0.9;
          item.lastmod = new Date('2026-10-01');
          return item;
        }
        if (cleanUrl.startsWith(`${origin}/games/`)) {
          item.changefreq = 'weekly';
          item.priority = 0.85;
          item.lastmod = new Date('2026-09-15');
          return item;
        }

        // 3. Blog posts
        if (cleanUrl.startsWith(`${origin}/posts/`)) {
          const rawSlug = cleanUrl.slice(`${origin}/posts/`.length).toLowerCase();
          const dateStr = postDates.get(rawSlug);
          if (dateStr) {
            item.lastmod = new Date(dateStr);
          } else {
            item.lastmod = new Date('2025-12-14');
          }
          item.changefreq = 'weekly';
          item.priority = 0.85;
          return item;
        }

        // 4. Category pages
        if (cleanUrl.startsWith(`${origin}/category/`)) {
          const cat = cleanUrl.slice(`${origin}/category/`.length).toLowerCase();
          const dateStr = categoryDates.get(cat);
          if (dateStr) {
            item.lastmod = new Date(dateStr);
          } else {
            item.lastmod = new Date(latestSiteDate);
          }
          item.changefreq = 'weekly';
          item.priority = 0.75;
          return item;
        }

        // 5. Static info pages
        if (cleanUrl === `${origin}/about`) {
          item.changefreq = 'monthly';
          item.priority = 0.6;
          item.lastmod = new Date('2026-09-18');
          return item;
        }

        if (cleanUrl === `${origin}/search`) {
          item.changefreq = 'monthly';
          item.priority = 0.5;
          item.lastmod = new Date('2026-09-18');
          return item;
        }

        item.changefreq = 'monthly';
        item.priority = 0.6;
        item.lastmod = new Date('2026-09-18');
        return item;
      }
    })
  ],
  redirects: {
    '/games/artcatcher': '/games/artcatcher/index.html',
    '/games/artcatcher/': '/games/artcatcher/index.html',
    '/games/kousuan': '/games/math/',
    '/games/kousuan/': '/games/math/',
    '/sitemap.xml': '/sitemap-index.xml'
  },
  markdown: {
    remarkPlugins: [remarkDemoteFirstHeading],
    shikiConfig: {
      theme: 'github-dark',
      wrap: true
    }
  }
});
