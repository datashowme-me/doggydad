import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Run after npm run build. --live also compares the deployed article bodies.
const sourceRoot = 'src/content/posts/investment';
const files = fs.readdirSync(sourceRoot).filter((name) => name.endsWith('.md')).sort();
assert.equal(files.length, 30, 'Expected the complete 30-question series');
const paths = files.map((name) => `/posts/investment/${name.slice(0, -3)}/`);
const prose = (html) => html.match(/<div class="prose"[^>]*>([\s\S]*?)<\/div>\s*<aside class="author-card"/)?.[1];
const documents = new Map();
let links = 0;
let sourceLinks = 0;
let characters = 0;

for (const [index, file] of files.entries()) {
  assert.equal(Number(file.slice(0, 2)), index + 1, `Sequence: ${file}`);
  const markdown = fs.readFileSync(path.join(sourceRoot, file), 'utf8');
  const body = markdown.split(/^---\s*$/m).slice(2).join('---');
  const html = fs.readFileSync(`dist${paths[index]}index.html`, 'utf8');
  assert.ok(prose(html)?.trim(), `Rendered article: ${file}`);
  assert.ok(html.includes(`rel="canonical" href="https://wordsmaster.app${paths[index]}"`), `Canonical: ${file}`);
  const graphs = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
    .flatMap((match) => {
      const data = JSON.parse(match[1]);
      return data['@graph'] || (Array.isArray(data) ? data : [data]);
    });
  assert.ok(graphs.some((node) => node['@type'] === 'BlogPosting'), `Structured article: ${file}`);
  assert.ok(!/TODO|待补充|xxxxxxxx/.test(body), `No placeholder: ${file}`);
  assert.ok(/\]\(https:\/\//.test(body), `Public references: ${file}`);
  sourceLinks += [...body.matchAll(/\]\(https:\/\//g)].length;
  characters += (body.match(/[\u3400-\u9fff]/g) || []).length;
  for (const match of body.matchAll(/\]\((\/[^)#]+)(?:#[^)]*)?\)/g)) {
    assert.ok(fs.existsSync(path.join('dist', match[1], 'index.html')), `Internal link ${match[1]} in ${file}`);
    links++;
  }
  const navigation = html.match(/<nav class="post-navigation"[\s\S]*?<\/nav>/)?.[0] || '';
  const actual = [...navigation.matchAll(/href="([^"]+)"[^>]*><span[^>]*>([^<]+)/g)]
    .map((match) => [match[2], match[1]]);
  const expected = [];
  if (index > 0) expected.push(['上一篇', paths[index - 1]]);
  if (index < files.length - 1) expected.push(['下一篇', paths[index + 1]]);
  assert.deepEqual(actual, expected, `Previous/next sequence: ${file}`);
  documents.set(paths[index], html);
}

const categoryPath = '/category/investment/';
const category = fs.readFileSync(`dist${categoryPath}index.html`, 'utf8');
const categoryOrder = [...category.matchAll(/class="post-card[\s\S]*?href="([^"]+)/g)]
  .map((match) => match[1]).filter((url) => url.startsWith('/posts/investment/'));
assert.deepEqual(categoryOrder, paths, 'Category displays the series in order');
console.log(`Local verification passed: 30 articles, ${characters} Chinese characters, ${sourceLinks} source links, ${links} internal links, canonicals, JSON-LD and series navigation.`);

if (process.argv.includes('--live')) {
  const queue = [...paths, categoryPath];
  const failures = [];
  let verified = 0;
  await Promise.all(Array.from({ length: 4 }, async () => {
    while (queue.length) {
      const pathname = queue.shift();
      try {
        const response = await fetch(`https://wordsmaster.app${pathname}`, {
          signal: AbortSignal.timeout(25000),
          headers: { 'cache-control': 'no-cache' }
        });
        assert.equal(response.status, 200, `HTTP status: ${pathname}`);
        const html = await response.text();
        if (pathname === categoryPath) {
          for (const url of paths) assert.ok(html.includes(`href="${url}"`), `Live category link: ${url}`);
          for (const local of documents.values()) {
            const title = local.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1];
            assert.ok(title && html.includes(title), `Live category title: ${title}`);
          }
        } else {
          assert.equal(prose(html), prose(documents.get(pathname)), `Live body differs: ${pathname}`);
          const localNavigation = documents.get(pathname).match(/<nav class="post-navigation"[\s\S]*?<\/nav>/)?.[0];
          assert.ok(html.includes(localNavigation), `Live navigation: ${pathname}`);
        }
        verified++;
      } catch (error) {
        failures.push(`${pathname}: ${error.message}`);
      }
    }
  }));
  assert.deepEqual(failures, [], failures.join('\n'));
  console.log(`Live verification passed: ${verified} URLs; all 30 article bodies and navigation match the local build.`);
}
