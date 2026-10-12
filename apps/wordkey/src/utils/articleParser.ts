import { DictEntry, WordItem } from '../types';
import { readLimitedText } from './httpSafety';

export const STOP_WORDS = new Set([
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
  'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
  'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
  'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
  'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me',
  'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take',
  'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other',
  'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also',
  'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way',
  'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us',
  'is', 'are', 'was', 'were', 'been', 'has', 'had', 'did', 'does', 'am'
]);

export function cleanHtml(html: string): { title: string; text: string } {
  let title = 'Parsed Article';
  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    title = titleMatch[1].replace(/&[^;]+;/g, ' ').trim();
  }

  let clean = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, ' ')
    .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, ' ')
    .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, ' ')
    .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, ' ')
    .replace(/<aside\b[^<]*(?:(?!<\/aside>)<[^<]*)*<\/aside>/gi, ' ');

  clean = clean.replace(/<\/(p|div|h[1-6]|li|blockquote|tr)>/gi, '\n');
  clean = clean.replace(/<[^>]+>/g, ' ');
  clean = clean
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');

  clean = clean.replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim();

  return { title, text: clean };
}

export function tokenizeArticle(
  text: string,
  options: {
    mode: 'all_unique' | 'key_words' | 'full_text';
    includeStopWords: boolean;
    order: 'appearance' | 'frequency';
    maxWords: number;
  }
) {
  const { mode, includeStopWords, order, maxWords } = options;
  const sentences = text.match(/[^.!?\n]+(?:[.!?\n]+|$)/g) || [text];

  if (mode === 'full_text') {
    const list: Array<{ word: string; sentence: string; index: number }> = [];
    let idx = 0;
    for (const sentence of sentences) {
      const cleanSentence = sentence.trim();
      const rawWords = cleanSentence.match(/[a-zA-Z]+/g) || [];
      for (const w of rawWords) {
        const lower = w.toLowerCase();
        if (lower.length >= 1) {
          list.push({ word: lower, sentence: cleanSentence, index: idx++ });
          if (maxWords > 0 && list.length >= maxWords) break;
        }
      }
      if (maxWords > 0 && list.length >= maxWords) break;
    }
    return list;
  }

  const wordMap = new Map<string, { word: string; sentence: string; count: number; firstIndex: number }>();
  let globalWordIndex = 0;

  for (const sentence of sentences) {
    const cleanSentence = sentence.trim();
    const rawWords = cleanSentence.match(/[a-zA-Z]+/g) || [];
    for (const w of rawWords) {
      const lower = w.toLowerCase();
      globalWordIndex++;

      if (!includeStopWords && STOP_WORDS.has(lower)) {
        continue;
      }
      if (lower.length === 1 && lower !== 'a' && lower !== 'i') {
        continue;
      }

      if (!wordMap.has(lower)) {
        wordMap.set(lower, {
          word: lower,
          sentence: cleanSentence,
          count: 1,
          firstIndex: globalWordIndex,
        });
      } else {
        const item = wordMap.get(lower)!;
        item.count += 1;
      }
    }
  }

  const wordsArray = Array.from(wordMap.values());

  if (order === 'frequency') {
    wordsArray.sort((a, b) => b.count - a.count);
  } else {
    wordsArray.sort((a, b) => a.firstIndex - b.firstIndex);
  }

  if (maxWords > 0) {
    return wordsArray.slice(0, maxWords);
  }

  return wordsArray;
}

export async function fetchWordAnnotation(word: string): Promise<DictEntry | null> {
  const cleanWord = word.trim().toLowerCase();
  if (!/^[a-z]{1,40}$/.test(cleanWord)) return null;

  try {
    const res = await fetch(`https://dict.youdao.com/jsonapi?q=${encodeURIComponent(cleanWord)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(2500),
    });

    if (res.ok) {
      const data: any = JSON.parse(await readLimitedText(res.body, 128_000));
      const usphone = data.simple?.word?.[0]?.usphone || data.ec?.word?.[0]?.usphone || '';
      const ukphone = data.simple?.word?.[0]?.ukphone || data.ec?.word?.[0]?.ukphone || usphone;

      const trsList: string[] = [];
      if (data.ec?.word?.[0]?.trs) {
        for (const t of data.ec.word[0].trs) {
          if (t.tr?.[0]?.l?.i) {
            trsList.push(t.tr[0].l.i.join(' '));
          }
        }
      }

      if (trsList.length > 0) {
        const fullMeaning = trsList.join('； ');
        const posMatch = fullMeaning.match(/^([a-z]+\.)\s*/i);
        const pos = posMatch ? posMatch[1] : '';
        return {
          phoneticAmE: usphone ? `[${usphone}]` : '',
          phoneticBrE: ukphone ? `[${ukphone}]` : usphone ? `[${usphone}]` : '',
          pos,
          meaning: fullMeaning,
        };
      }
    }
  } catch {
    // Fallback to lightweight suggest API
  }

  try {
    const suggestRes = await fetch(
      `https://dict.youdao.com/suggest?q=${encodeURIComponent(cleanWord)}&num=1&doctype=json`,
      { signal: AbortSignal.timeout(2000) }
    );
    if (suggestRes.ok) {
      const suggestData: any = JSON.parse(await readLimitedText(suggestRes.body, 32_000));
      const explain = suggestData.data?.entries?.[0]?.explain;
      if (explain) {
        const posMatch = explain.match(/^([a-z]+\.)\s*/i);
        const pos = posMatch ? posMatch[1] : '';
        return {
          phoneticAmE: '',
          phoneticBrE: '',
          pos,
          meaning: explain,
        };
      }
    }
  } catch {
    // Ignore
  }

  return null;
}
