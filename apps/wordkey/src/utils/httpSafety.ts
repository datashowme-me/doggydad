export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export async function readLimitedText(body: ReadableStream<Uint8Array> | null, maxBytes: number): Promise<string> {
  if (!body) return '';
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let size = 0;
  let result = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        throw new HttpError(413, '内容过大，请缩短文章后重试');
      }
      result += decoder.decode(value, { stream: true });
    }
    return result + decoder.decode();
  } finally { reader.releaseLock(); }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export async function readJson(request: Request): Promise<Record<string, unknown>> {
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
    throw new HttpError(415, '请使用 JSON 请求');
  }
  const text = await readLimitedText(request.body, 64_000);
  let value: unknown;
  try { value = JSON.parse(text); } catch { throw new HttpError(400, '请求格式不正确'); }
  if (!isRecord(value)) throw new HttpError(400, '请求必须是 JSON 对象');
  return value;
}

// An explicit public-origin allowlist prevents private-network fetches and DNS-rebinding
// through attacker-controlled hostnames. Unknown sites use the paste-text flow.
export const ARTICLE_HOSTS = ['en.wikipedia.org', 'developer.mozilla.org', 'github.com', 'raw.githubusercontent.com', 'www.bbc.com', 'www.theguardian.com', 'www.reuters.com'];
export function validateArticleUrl(value: string): URL {
  let url: URL;
  try { url = new URL(value); } catch { throw new HttpError(400, '网址格式不正确'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.port || !ARTICLE_HOSTS.includes(url.hostname)) {
    throw new HttpError(400, '该网站暂不支持直接抓取，请复制正文到「粘贴文章」');
  }
  return url;
}

export async function fetchArticle(value: string): Promise<string> {
  let url = validateArticleUrl(value);
  const signal = AbortSignal.timeout(12_000);
  for (let hop = 0; hop < 4; hop++) {
    const response = await fetch(url, { redirect: 'manual', signal, headers: { Accept: 'text/html,text/plain' } });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location');
      await response.body?.cancel();
      if (!location) throw new HttpError(400, '目标网站重定向无效');
      url = validateArticleUrl(new URL(location, url).href);
      continue;
    }
    if (!response.ok) { await response.body?.cancel(); throw new HttpError(400, '目标网页无法读取，请粘贴正文'); }
    if (!/^(text\/html|text\/plain|application\/xhtml\+xml)\b/i.test(response.headers.get('content-type') || '')) {
      await response.body?.cancel(); throw new HttpError(400, '仅支持 HTML 或纯文本文章');
    }
    return readLimitedText(response.body, 1_000_000);
  }
  throw new HttpError(400, '网页重定向次数过多，请粘贴正文');
}
