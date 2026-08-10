import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import remarkDemoteFirstHeading from './src/lib/remark-demote-first-heading.mjs';

const site = process.env.SITE_URL || 'https://doggydad.pages.dev';

export default defineConfig({
  site,
  base: '/',
  output: 'static',
  integrations: [sitemap()],
  markdown: {
    remarkPlugins: [remarkDemoteFirstHeading],
    shikiConfig: {
      theme: 'github-dark',
      wrap: true
    }
  }
});
