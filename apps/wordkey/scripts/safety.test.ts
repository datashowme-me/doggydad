import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import worker from '../src/worker';
import { validateArticleUrl, readLimitedText, fetchArticle } from '../src/utils/httpSafety';
import { tokenizeArticle } from '../src/utils/articleParser';
import { RESERVE_SQL, RESERVATION_FEN, MONTHLY_BUDGET_FEN, budgetMonth } from '../src/utils/aiBudget';

test('URL allowlist excludes private origins, credentials, ports and lookalikes', () => {
  for (const url of ['http://en.wikipedia.org/', 'https://127.0.0.1/', 'https://[::1]/', 'https://en.wikipedia.org.evil.test/', 'https://a:b@github.com/', 'https://github.com:8000/']) {
    assert.throws(() => validateArticleUrl(url));
  }
  assert.equal(validateArticleUrl('https://en.wikipedia.org/wiki/English').hostname, 'en.wikipedia.org');
});

test('stream reader enforces byte bounds', async () => {
  assert.equal(await readLimitedText(new Response('hello').body, 5), 'hello');
  await assert.rejects(readLimitedText(new Response('你好').body, 5));
});

test('redirect targets are checked before fetching', async () => {
  const saved = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => { calls++; return new Response(null, { status: 302, headers: { Location: 'http://127.0.0.1/' } }); };
  try { await assert.rejects(fetchArticle('https://github.com/')); assert.equal(calls, 1); }
  finally { globalThis.fetch = saved; }
});

test('last sentence without punctuation is preserved', () => {
  const words = tokenizeArticle('Hello world. Final sentence', { mode: 'all_unique', includeStopWords: true, order: 'appearance', maxWords: 200 });
  assert.deepEqual(words.map(w => w.word), ['hello', 'world', 'final', 'sentence']);
});

test('atomic budget SQL stops at 30 yuan and resets by Shanghai calendar month', () => {
  const db = new DatabaseSync(':memory:');
  db.exec(readFileSync(new URL('../migrations/0001_ai_budget.sql', import.meta.url), 'utf8'));
  const stmt = db.prepare(RESERVE_SQL);
  for (let i = 0; i < 150; i++) assert.ok(stmt.get('2026-10', RESERVATION_FEN, MONTHLY_BUDGET_FEN));
  assert.equal(stmt.get('2026-10', RESERVATION_FEN, MONTHLY_BUDGET_FEN), undefined);
  assert.ok(stmt.get('2026-11', RESERVATION_FEN, MONTHLY_BUDGET_FEN));
  assert.equal(budgetMonth(new Date('2026-10-31T16:00:00Z')), '2026-11');
  db.close();
});

// Runtime bindings are mocked only for handler tests. Wrangler smoke tests separately
// exercise actual Assets, D1 and rate-limit bindings.
const env = (row: object | null = null): any => ({
  ASSETS: { fetch: async () => new Response('asset') },
  AI_ENABLED: 'true', DEEPSEEK_API_KEY: 'test-only',
  API_RATE_LIMIT: { limit: async () => ({ success: true }) },
  BUDGET_DB: { prepare: () => ({ bind: () => ({ first: async () => row }) }) },
});
const request = (body: unknown, path = '/api/generate-vocab-pack') => new Request('https://learn.wordsmaster.app' + path,
  { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

test('exhausted budget refuses AI without upstream calls; learning assets stay available', async () => {
  const saved = globalThis.fetch; let calls = 0;
  globalThis.fetch = async () => { calls++; throw new Error('Unexpected upstream call'); };
  try {
    assert.equal((await worker.fetch(request({ topic: 'coding', count: 10 }), env())).status, 503);
    assert.equal(calls, 0);
    assert.equal(await (await worker.fetch(new Request('https://learn.wordsmaster.app/'), env())).text(), 'asset');
  } finally { globalThis.fetch = saved; }
});

test('method, JSON, origin and input bounds reject invalid requests', async () => {
  assert.equal((await worker.fetch(new Request('https://learn.wordsmaster.app/api/parse-article'), env())).status, 405);
  assert.equal((await worker.fetch(request({ topic: 'x', count: 100 }), env())).status, 400);
  assert.equal((await worker.fetch(request({ text: 'x'.repeat(20_001) }, '/api/parse-article'), env())).status, 413);
  const cross = request({ topic: 'coding', count: 10 }); cross.headers.set('Origin', 'https://evil.test');
  assert.equal((await worker.fetch(cross, env())).status, 403);
  const bad = new Request('https://learn.wordsmaster.app/api/parse-article', { method: 'POST', headers: {'Content-Type':'application/json'}, body: '{' });
  assert.equal((await worker.fetch(bad, env())).status, 400);
});

test('AI output is bounded and malformed entries are filtered', async () => {
  const saved = globalThis.fetch;
  globalThis.fetch = async (_url, options) => {
    const payload = JSON.parse(String(options?.body));
    assert.equal(payload.model, 'deepseek-flash'); assert.equal(payload.max_tokens, 8192);
    assert.equal(payload.thinking.type, 'disabled');
    return Response.json({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify({ words: [
      { word: 'hello', meaning: '你好' }, { word: '<script>' }, { word: 'hello' }, null,
    ] }) } }] });
  };
  try {
    const response = await worker.fetch(request({ topic: 'greetings', count: 10 }), env({ reserved_fen: 20 }));
    const data = await response.json() as { words: Array<{word: string; phoneticAmE: string}> };
    assert.equal(response.status, 200); assert.equal(data.words.length, 1); assert.equal(data.words[0].phoneticAmE, '');
  } finally { globalThis.fetch = saved; }
});
