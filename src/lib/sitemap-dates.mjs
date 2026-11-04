import fs from 'node:fs';
import path from 'node:path';

/**
 * Scans markdown posts to extract exact dates (updatedDate, date, publishDate)
 * to avoid emitting fake lastmod timestamps in sitemaps.
 */
export function getSitemapDates(postsDir = './src/content/posts') {
  const postDates = new Map();
  const categoryDates = new Map();
  const SITE_BASELINE_DATE = '2025-12-14';
  let latestSiteDate = '2026-09-18';

  function sanitizeDate(rawDate) {
    if (!rawDate) return null;
    // If post date is historical (e.g. Turing award year like 1966),
    // clamp to web publication baseline to prevent search engine invalid lastmod warnings
    if (rawDate < '2024-01-01') {
      return SITE_BASELINE_DATE;
    }
    return rawDate;
  }

  function scan(dir, baseDir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scan(fullPath, baseDir);
      } else if (entry.isFile() && (entry.name.endsWith('.md') || entry.name.endsWith('.mdx'))) {
        const relPath = path.relative(baseDir, fullPath);
        // Normalize slug: POSIX slashes, no extension, lowercase to match Astro content collections
        const slug = relPath
          .replace(/\\/g, '/')
          .replace(/\.(md|mdx)$/, '')
          .toLowerCase();

        const content = fs.readFileSync(fullPath, 'utf-8');
        const updatedMatch = content.match(/^updatedDate:\s*["']?([0-9]{4}-[0-9]{2}-[0-9]{2})/m);
        const dateMatch = content.match(/^date:\s*["']?([0-9]{4}-[0-9]{2}-[0-9]{2})/m);
        const publishMatch = content.match(/^publishDate:\s*["']?([0-9]{4}-[0-9]{2}-[0-9]{2})/m);

        const rawDate = (updatedMatch && updatedMatch[1]) ||
                        (dateMatch && dateMatch[1]) ||
                        (publishMatch && publishMatch[1]) ||
                        null;

        const dateStr = sanitizeDate(rawDate);

        if (dateStr) {
          postDates.set(slug, dateStr);
          if (dateStr > latestSiteDate) {
            latestSiteDate = dateStr;
          }
          const cat = slug.split('/')[0];
          const currCatDate = categoryDates.get(cat);
          if (!currCatDate || dateStr > currCatDate) {
            categoryDates.set(cat, dateStr);
          }
        }
      }
    }
  }

  scan(postsDir, postsDir);

  return {
    postDates,
    categoryDates,
    latestSiteDate
  };
}
