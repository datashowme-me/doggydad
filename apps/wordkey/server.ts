import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { COMMON_DICTIONARY, DictEntry } from './src/data/commonDictionary.ts';
import { callDeepSeek } from './src/utils/deepseek.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));
app.use('/dicts', express.static(path.join(__dirname, 'public/dicts')));

// In-memory cache for word annotations to make lookups instantaneous
const annotationCache = new Map<string, DictEntry>();

// Pre-fill cache with common dictionary
for (const [w, entry] of Object.entries(COMMON_DICTIONARY)) {
  annotationCache.set(w.toLowerCase(), entry);
}

// Common English stop words
const STOP_WORDS = new Set([
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

// Helper to strip HTML tags and scripts
function cleanHtml(html: string): { title: string; text: string } {
  let title = 'Parsed Article';
  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    title = titleMatch[1].replace(/&[^;]+;/g, ' ').trim();
  }

  // Remove scripts, styles, svg, header, footer, nav
  let clean = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, ' ')
    .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, ' ')
    .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, ' ')
    .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, ' ')
    .replace(/<aside\b[^<]*(?:(?!<\/aside>)<[^<]*)*<\/aside>/gi, ' ');

  // Replace block tags with newlines
  clean = clean.replace(/<\/(p|div|h[1-6]|li|blockquote|tr)>/gi, '\n');
  // Strip all remaining tags
  clean = clean.replace(/<[^>]+>/g, ' ');
  // Decode common HTML entities
  clean = clean
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');

  // Collapse whitespace
  clean = clean.replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim();

  return { title, text: clean };
}

// Fetch dictionary annotation with phonetics and Chinese meaning
async function fetchOnlineWordAnnotation(word: string): Promise<DictEntry | null> {
  const cleanWord = word.trim().toLowerCase();
  if (!cleanWord) return null;

  if (annotationCache.has(cleanWord)) {
    return annotationCache.get(cleanWord)!;
  }

  try {
    // Attempt 1: Fetch comprehensive Youdao JSON dictionary API
    const res = await fetch(`https://dict.youdao.com/jsonapi?q=${encodeURIComponent(cleanWord)}`, {
      signal: AbortSignal.timeout(3000),
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });

    if (res.ok) {
      const data = JSON.parse(await res.text());
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
        // Extract pos if present at beginning like "n. " or "adj. "
        const posMatch = fullMeaning.match(/^([a-z]+\.)\s*/i);
        const pos = posMatch ? posMatch[1] : 'n./v.';
        const entry: DictEntry = {
          phoneticAmE: usphone ? `[${usphone}]` : `[${cleanWord}]`,
          phoneticBrE: ukphone ? `[${ukphone}]` : usphone ? `[${usphone}]` : `[${cleanWord}]`,
          pos,
          meaning: fullMeaning,
        };
        annotationCache.set(cleanWord, entry);
        return entry;
      }
    }
  } catch {
    // Ignore and fallback to suggest API
  }

  try {
    // Attempt 2: Fetch Youdao suggest API (super fast lightweight backup)
    const suggestRes = await fetch(
      `https://dict.youdao.com/suggest?q=${encodeURIComponent(cleanWord)}&num=1&doctype=json`,
      { signal: AbortSignal.timeout(2000) }
    );
    if (suggestRes.ok) {
      const suggestData = JSON.parse(await suggestRes.text());
      const explain = suggestData.data?.entries?.[0]?.explain;
      if (explain) {
        const posMatch = explain.match(/^([a-z]+\.)\s*/i);
        const pos = posMatch ? posMatch[1] : 'n./v.';
        const entry: DictEntry = {
          phoneticAmE: `[${cleanWord}]`,
          phoneticBrE: `[${cleanWord}]`,
          pos,
          meaning: explain,
        };
        annotationCache.set(cleanWord, entry);
        return entry;
      }
    }
  } catch {
    // Ignore
  }

  return null;
}

// Tokenize text into words with sentence mapping
function tokenizeArticle(
  text: string,
  options: {
    mode: 'all_unique' | 'key_words' | 'full_text';
    includeStopWords: boolean;
    order: 'appearance' | 'frequency';
    maxWords: number; // 0 = no limit
  }
) {
  const { mode, includeStopWords, order, maxWords } = options;

  // Split into sentences
  const sentences = text.match(/[^.!?\n]+[.!?\n]+/g) || [text];

  if (mode === 'full_text') {
    // Full sequential text typing: keep every word in sentence order
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

  // For unique words (all_unique or key_words)
  const wordMap = new Map<string, { word: string; sentence: string; count: number; firstIndex: number }>();
  let globalWordIndex = 0;

  for (const sentence of sentences) {
    const cleanSentence = sentence.trim();
    const rawWords = cleanSentence.match(/[a-zA-Z]+/g) || [];
    for (const w of rawWords) {
      const lower = w.toLowerCase();
      globalWordIndex++;

      // Filter stop words if key_words mode or explicitly requested
      if (!includeStopWords && STOP_WORDS.has(lower)) {
        continue;
      }
      // Single letter words except 'a' and 'i' are usually noise
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

  let wordsArray = Array.from(wordMap.values());

  // Sort by appearance order or frequency
  if (order === 'frequency') {
    wordsArray.sort((a, b) => b.count - a.count);
  } else {
    // In order of appearance in the article
    wordsArray.sort((a, b) => a.firstIndex - b.firstIndex);
  }

  // Cap limit if specified and > 0 (0 means extract ALL words)
  if (maxWords > 0) {
    wordsArray = wordsArray.slice(0, maxWords);
  }

  return wordsArray;
}

// POST /api/parse-article
app.post('/api/parse-article', async (req: Request, res: Response) => {
  try {
    const {
      url,
      text: rawText,
      mode = 'all_unique', // 'all_unique' | 'key_words' | 'full_text'
      includeStopWords = true, // By default include all words
      order = 'appearance', // 'appearance' | 'frequency'
      maxWords = 0, // 0 = ALL words without limit
    } = req.body;

    let articleTitle = '未知文章';
    let articleContent = '';

    if (url) {
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            Accept: 'text/html,application/xhtml+xml,text/plain;q=0.9',
          },
          signal: AbortSignal.timeout(10000),
        });

        if (!response.ok) {
          throw new Error(`无法获取该网址内容 (HTTP ${response.status})`);
        }

        const html = await response.text();
        const cleaned = cleanHtml(html);
        articleTitle = cleaned.title || url;
        articleContent = cleaned.text;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'URL 获取失败';
        return res.status(400).json({
          error: `无法抓取该文章链接: ${message}。请直接粘贴文章正文进行解析。`,
        });
      }
    } else if (rawText) {
      articleContent = String(rawText);
      articleTitle = req.body.title || '粘贴的文章';
    } else {
      return res.status(400).json({ error: '请提供文章链接(URL)或文章文本' });
    }

    if (!articleContent || articleContent.trim().length < 10) {
      return res.status(400).json({
        error: '提取到的文章内容过短或无法读取正文，请尝试粘贴正文。',
      });
    }

    // Step 1: Tokenize ALL words from the actual article!
    const tokens = tokenizeArticle(articleContent, {
      mode: mode as 'all_unique' | 'key_words' | 'full_text',
      includeStopWords: Boolean(includeStopWords),
      order: order as 'appearance' | 'frequency',
      maxWords: Number(maxWords) || 0,
    });

    if (tokens.length === 0) {
      return res.status(400).json({ error: '未能从文章中提取出任何单词' });
    }

    // Collect unique words to annotate with Chinese definitions
    const uniqueWordSet = new Set<string>();
    tokens.forEach((t) => uniqueWordSet.add(t.word.toLowerCase()));
    const uniqueWordsList = Array.from(uniqueWordSet);

    // Step 2: Annotate words using dictionary lookups (in parallel batches)
    const batchSize = 10;
    const wordAnnotationMap = new Map<string, DictEntry>();

    for (let i = 0; i < uniqueWordsList.length; i += batchSize) {
      const chunk = uniqueWordsList.slice(i, i + batchSize);
      await Promise.all(
        chunk.map(async (word) => {
          const entry = await fetchOnlineWordAnnotation(word);
          if (entry) {
            wordAnnotationMap.set(word, entry);
          }
        })
      );
    }

    // Step 3: For words that still lack Chinese annotations, use DeepSeek as an intelligent fallback
    const missingChineseWords = uniqueWordsList.filter((w) => !wordAnnotationMap.has(w));
    const deepseekKey = process.env.DEEPSEEK_API_KEY;

    if (deepseekKey && missingChineseWords.length > 0) {
      try {
        const prompt = `请为以下英语单词提供规范的美式音标 (phoneticAmE)、英式音标 (phoneticBrE)、词性 (pos) 和详尽清晰的中文注释/释义 (meaning)。
必须以合法 JSON 格式输出，根对象格式为：
{
  "words": [
    {
      "word": "单词",
      "phoneticAmE": "[音标]",
      "phoneticBrE": "[音标]",
      "pos": "词性",
      "meaning": "中文释义"
    }
  ]
}
待查询单词列表: ${missingChineseWords.slice(0, 50).join(', ')}`;

        const parsed = await callDeepSeek(
          [
            { role: 'system', content: '你是一个专业的英语词典与翻译助手。请严格输出合法 JSON 格式数据。' },
            { role: 'user', content: prompt },
          ],
          deepseekKey
        );

        const list = Array.isArray(parsed) ? parsed : (parsed?.words || []);
        if (Array.isArray(list)) {
          list.forEach((item: any) => {
            const w = String(item.word || '').toLowerCase().trim();
            if (w) {
              const entry: DictEntry = {
                phoneticAmE: item.phoneticAmE || `[${w}]`,
                phoneticBrE: item.phoneticBrE || item.phoneticAmE || `[${w}]`,
                pos: item.pos || 'n./v.',
                meaning: item.meaning || `${w}`,
              };
              wordAnnotationMap.set(w, entry);
              annotationCache.set(w, entry);
            }
          });
        }
      } catch (aiErr) {
        console.error('DeepSeek fallback annotation error:', aiErr);
      }
    }

    // Step 4: Combine tokens into complete WordItem list with Chinese annotations
    const finalWordsList = tokens.map((token, idx) => {
      const w = token.word.toLowerCase();
      const annotation = wordAnnotationMap.get(w);

      const phoneticAmE = annotation?.phoneticAmE || `[${w}]`;
      const phoneticBrE = annotation?.phoneticBrE || phoneticAmE;
      const pos = annotation?.pos || (w.length > 6 ? 'n./adj.' : 'n./v.');
      const meaning = annotation?.meaning || `n./v. ${w}`;
      const frequency = 'count' in token ? (token as any).count : 1;

      return {
        id: `word-${idx}-${w}`,
        word: w,
        phoneticAmE,
        phoneticBrE,
        pos,
        meaning,
        sentence: token.sentence || `${w} is used in this article.`,
        sentenceTranslation: '',
        difficulty: (w.length > 7 ? 'hard' : w.length > 4 ? 'medium' : 'easy') as 'easy' | 'medium' | 'hard',
        frequency,
      };
    });

    const totalArticleWords = articleContent.split(/\s+/).filter(Boolean).length;

    return res.json({
      title: articleTitle,
      wordCount: totalArticleWords,
      totalUniqueWords: finalWordsList.length,
      mode,
      words: finalWordsList,
    });
  } catch (err: unknown) {
    console.error('Server error:', err);
    const message = err instanceof Error ? err.message : '服务器内部解析错误';
    return res.status(500).json({ error: message });
  }
});

// POST /api/generate-vocab-pack for custom vocabulary expansion packs
app.post('/api/generate-vocab-pack', async (req: Request, res: Response) => {
  try {
    const { topic = '托福核心高频词汇', count = 40, level = 'advanced' } = req.body;
    const requestedCount = Math.min(100, Math.max(10, Number(count) || 40));

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return res.status(400).json({
        error: '需要配置 DEEPSEEK_API_KEY 才能动态生成拓展词库。请在根目录 .env 文件中添加 DEEPSEEK_API_KEY=sk-xxxx',
      });
    }

    const prompt = `你是一个顶级英语教学专家与词汇学导师。用户希望系统化拓展词汇量。
请根据主题/级别: "${topic}"，生成 ${requestedCount} 个最具代表性、高性价比、能显著提升英语词汇量的核心优质英语单词。
请以 JSON 格式输出，根对象结构必须如下：
{
  "title": "词包标题",
  "category": "分类标签",
  "words": [
    {
      "word": "单词小写原型",
      "phoneticAmE": "[美式音标]",
      "phoneticBrE": "[英式音标]",
      "pos": "词性",
      "meaning": "中文释义",
      "sentence": "自然地道英文例句",
      "sentenceTranslation": "例句中文翻译",
      "difficulty": "easy 或 medium 或 hard"
    }
  ]
}`;

    const parsed = await callDeepSeek(
      [
        { role: 'system', content: '你是一个顶级英语教育专家，精通词汇学与双语教学。请严格输出 JSON 格式。' },
        { role: 'user', content: prompt },
      ],
      apiKey
    );
    const wordsList = (parsed.words || []).map((item: any, idx: number) => ({
      id: `ai-pack-${Date.now()}-${idx}-${item.word}`,
      word: String(item.word || '').toLowerCase().trim().replace(/[^a-z\s-]/g, '').replace(/^-+|-+$/g, ''),
      phoneticAmE: item.phoneticAmE || `[${item.word}]`,
      phoneticBrE: item.phoneticBrE || item.phoneticAmE || `[${item.word}]`,
      pos: item.pos || 'n.',
      meaning: item.meaning || '',
      sentence: item.sentence || '',
      sentenceTranslation: item.sentenceTranslation || '',
      difficulty: ['easy', 'medium', 'hard'].includes(item.difficulty)
        ? item.difficulty
        : 'medium',
      frequency: 1,
    })).filter((w: any) => w.word.length > 1);

    return res.json({
      title: parsed.title || topic,
      category: parsed.category || '拓展词库',
      totalWords: wordsList.length,
      words: wordsList,
    });
  } catch (err: unknown) {
    console.error('generate-vocab-pack error:', err);
    const message = err instanceof Error ? err.message : '生成拓展词库失败';
    return res.status(500).json({ error: message });
  }
});

// Single word lookup endpoint for instant enrichment
app.get('/api/lookup-word', async (req: Request, res: Response) => {
  const word = String(req.query.word || '').trim().toLowerCase();
  if (!word) {
    return res.status(400).json({ error: 'word is required' });
  }
  const annotation = await fetchOnlineWordAnnotation(word);
  if (annotation) {
    return res.json(annotation);
  }
  return res.json({
    phoneticAmE: `[${word}]`,
    phoneticBrE: `[${word}]`,
    pos: 'n./v.',
    meaning: '暂无中文释义',
  });
});

// Helper functions for raw dictionary formatting
function cleanDictTrans(trans: any): string {
  if (Array.isArray(trans)) {
    return trans
      .filter((t: string) => !t.startsWith('时态:') && !t.startsWith('比较级:'))
      .join('； ');
  }
  return String(trans || '');
}

function extractDictPos(trans: any): string {
  const text = Array.isArray(trans) ? trans.join(' ') : String(trans || '');
  const match = text.match(/([a-z]{1,4}\.)/i);
  return match ? match[1].toLowerCase() : 'n./v.';
}

const OFFICIAL_DICTS: Record<string, { title: string; category: string; filename: string; description: string }> = {
  oxford5000: {
    title: '牛津 5000 核心词库 (完整版)',
    category: '权威分级词库',
    filename: 'Oxford5000.json',
    description: '牛津大学官方核心 5000+ 高频词汇全集，分为 292 组 20 词小任务。',
  },
  cet4: {
    title: '大学英语四级核心词汇 (CET-4)',
    category: '英语等级与升学',
    filename: 'CET4_T.json',
    description: '四级考试核心必背高频词汇全集，分为 130 组 20 词小任务。',
  },
  cet6: {
    title: '大学英语六级进阶词汇 (CET-6)',
    category: '英语等级与升学',
    filename: 'CET6_T.json',
    description: '六级考试进阶高分词汇全集，分为 117 组 20 词小任务。',
  },
  kaoyan: {
    title: '考研英语必背高频词汇全集',
    category: '学术与深度阅读',
    filename: 'KaoYan_2024.json',
    description: '考研大纲必背核心词库，分为 186 组 20 词小任务。',
  },
  toefl: {
    title: '托福学术高分必背词汇 (TOEFL)',
    category: '出国留学备考',
    filename: 'TOEFL_3_T.json',
    description: '托福阅读与听力核心学术高分词汇，分为 213 组 20 词小任务。',
  },
  ielts: {
    title: '雅思核心高频词汇全集 (IELTS)',
    category: '出国留学备考',
    filename: 'IELTS_3_T.json',
    description: '雅思考试真题高频核心词库，分为 178 组 20 词小任务。',
  },
  coder: {
    title: '程序员与计算机极客专业英语',
    category: '极客与职业技能',
    filename: 'coder.json',
    description: 'IT、编程、系统与网络开发高频专业英语，分为 85 组 20 词小任务。',
  },
};

// GET /api/dictionary-list
app.get('/api/dictionary-list', (_req: Request, res: Response) => {
  const list = Object.entries(OFFICIAL_DICTS).map(([id, meta]) => {
    let wordCount = 0;
    try {
      const filePath = path.join(__dirname, 'public/dicts', meta.filename);
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf-8');
        const data = JSON.parse(raw);
        wordCount = Array.isArray(data) ? data.length : 0;
      }
    } catch {
      wordCount = 0;
    }

    return {
      id,
      title: meta.title,
      category: meta.category,
      description: meta.description,
      wordCount,
      totalTasks: Math.max(1, Math.ceil(wordCount / 20)),
    };
  });

  return res.json(list);
});

// GET /api/dictionary/:id
app.get('/api/dictionary/:id', (req: Request, res: Response) => {
  const dictId = req.params.id;
  const meta = OFFICIAL_DICTS[dictId];
  if (!meta) {
    return res.status(404).json({ error: `未找到词库: ${dictId}` });
  }

  const filePath = path.join(__dirname, 'public/dicts', meta.filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: '词库数据文件不存在' });
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const rawData = JSON.parse(raw);
    if (!Array.isArray(rawData)) {
      return res.status(500).json({ error: '词库格式错误' });
    }

    const words = rawData.map((item: any, idx: number) => {
      const wordClean = String(item.name || item.word || '').toLowerCase().trim();
      const usphone = item.usphone || item.phon_n_am || '';
      const ukphone = item.ukphone || item.phon_br || usphone;
      const trans = item.trans || item.definition || item.meaning || '';

      return {
        id: `${dictId}-${idx}`,
        word: wordClean,
        phoneticAmE: usphone ? `[${usphone.replace(/^\[?|\/?|\]?$/g, '')}]` : `[${wordClean}]`,
        phoneticBrE: ukphone ? `[${ukphone.replace(/^\[?|\/?|\]?$/g, '')}]` : `[${wordClean}]`,
        pos: extractDictPos(trans),
        meaning: cleanDictTrans(trans) || '常用核心词汇',
        sentence: item.example || '',
        sentenceTranslation: '',
        frequency: 1,
      };
    }).filter((w: any) => w.word.length > 0);

    return res.json({
      id: dictId,
      title: meta.title,
      category: meta.category,
      totalWords: words.length,
      totalTasks: Math.max(1, Math.ceil(words.length / 20)),
      words,
    });
  } catch (err: unknown) {
    console.error('Error loading dict:', err);
    return res.status(500).json({ error: '加载词库数据异常' });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

startServer();
