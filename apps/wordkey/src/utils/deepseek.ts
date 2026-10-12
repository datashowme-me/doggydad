import { HttpError, readLimitedText } from './httpSafety';

export async function callDeepSeek(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  apiKey?: string,
  customBaseUrl?: string
): Promise<any> {
  const key = apiKey || (typeof process !== 'undefined' ? process.env?.DEEPSEEK_API_KEY : undefined);
  if (!key) {
    throw new Error('未检测到 DEEPSEEK_API_KEY，请在 .env 文件或 Cloudflare 环境变量中配置');
  }

  const rawBaseUrl = customBaseUrl || (typeof process !== 'undefined' ? process.env?.DEEPSEEK_BASE_URL : undefined) || 'https://api.deepseek.com';
  const endpoint = rawBaseUrl.endsWith('/chat/completions')
    ? rawBaseUrl
    : `${rawBaseUrl.replace(/\/+$/, '')}/chat/completions`;

  // Bound worst-case cost: <= 12 KB input, <= 8192 output tokens, one call, no retry.
  if (new TextEncoder().encode(JSON.stringify(messages)).byteLength > 12_000) {
    throw new HttpError(413, 'AI 输入过长，请缩短内容');
  }

  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: 'deepseek-flash',
        thinking: { type: 'disabled' },
        max_tokens: 8192,
        messages,
        response_format: { type: 'json_object' },
        temperature: 0.3,
      }),
      signal: AbortSignal.timeout(60000), // 60s timeout protection
    });
  } catch (netErr: any) {
    if (netErr.name === 'TimeoutError') {
      throw new Error('DeepSeek API 请求超时（超过60秒），请检查网络连接或稍后重试');
    }
    throw new HttpError(502, 'AI 服务暂时无法连接，请稍后重试');
  }

  if (!res.ok) {
    await res.body?.cancel();
    if (res.status === 401) {
      throw new Error('DeepSeek API 鉴权失败 (401)，请检查 DEEPSEEK_API_KEY 是否正确');
    }
    if (res.status === 402) {
      throw new Error('DeepSeek 账户余额不足 (402)，请前往 DeepSeek 开放平台充值');
    }
    if (res.status === 429) {
      throw new Error('DeepSeek API 请求频次超限 (429)，请稍候重试');
    }
    throw new HttpError(502, 'AI 服务暂时不可用，请稍后重试');
  }

  const data: any = JSON.parse(await readLimitedText(res.body, 256_000));
  if (data.choices?.[0]?.finish_reason === 'length') throw new HttpError(502, 'AI 结果过长，请减少生成词数');
  let content = data.choices?.[0]?.message?.content || '{}';

  // Strip <think>...</think> reasoning traces if deepseek-reasoner or thinking mode is enabled
  content = content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

  // Strip Markdown code block decorators
  if (content.startsWith('```json')) {
    content = content.slice(7);
  } else if (content.startsWith('```')) {
    content = content.slice(3);
  }
  if (content.endsWith('```')) {
    content = content.slice(0, -3);
  }
  content = content.trim();

  // Extract outermost JSON block if any surrounding text remains
  const firstBrace = content.indexOf('{');
  const lastBrace = content.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    content = content.substring(firstBrace, lastBrace + 1);
  }

  try {
    return JSON.parse(content);
  } catch (parseErr) {
    throw new HttpError(502, 'AI 返回格式不正确，请稍后重试');
  }
}
