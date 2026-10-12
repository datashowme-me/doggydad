import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
function checkDirectory(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) checkDirectory(path);
    else if (/\.tsx?$/.test(path)) {
      assert.doesNotMatch(readFileSync(path, 'utf8'),
        /proStorage|ProModal|canUserParseArticle|consumeParseQuota|wordkey_pro_|wordkey_daily_parse|升级 Pro|激活码/,
        `Paid-access code must not return: ${path}`);
    }
  }
}
checkDirectory(join(root, 'src'));
for (const path of ['src/components/ProModal.tsx', 'src/utils/proStorage.ts']) {
  assert.equal(existsSync(join(root, path)), false);
}
const importer = readFileSync(join(root, 'src/components/ArticleImportModal.tsx'), 'utf8');
for (const handler of ['handleParseUrl', 'handleParseText', 'handleGenerateCustomPack']) {
  assert.ok(importer.includes(`const ${handler} =`), `${handler} must remain available`);
}
assert.ok(importer.includes("fetch('/api/parse-article'"));
assert.ok(importer.includes("fetch('/api/generate-vocab-pack'"));
console.log('Free-access source regression checks passed.');
