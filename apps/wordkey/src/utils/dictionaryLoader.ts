import { WordItem } from '../types';

export const DICTIONARY_META: Record<
  string,
  { title: string; category: string; filename: string; description: string }
> = {
  oxford5000: {
    title: '牛津 5000 核心词库 (完整版)',
    category: '分级词库',
    filename: 'Oxford5000.json',
    description: '社区整理的 Oxford 5000 词表，来源与许可见词库说明，非官方产品。',
  },
  cet4: {
    title: '大学英语四级核心词汇 (CET-4)',
    category: '英语等级与升学',
    filename: 'CET4_T.json',
    description: '四级考试核心必背高频词汇全集，分为 131 组 20 词小任务。',
  },
  cet6: {
    title: '大学英语六级进阶词汇 (CET-6)',
    category: '英语等级与升学',
    filename: 'CET6_T.json',
    description: '六级考试进阶高分词汇全集，分为 118 组 20 词小任务。',
  },
  kaoyan: {
    title: '考研英语必背高频词汇全集',
    category: '学术与深度阅读',
    filename: 'KaoYan_2024.json',
    description: '考研大纲必背核心词库，分为 187 组 20 词小任务。',
  },
  toefl: {
    title: '托福学术高分必背词汇 (TOEFL)',
    category: '出国留学备考',
    filename: 'TOEFL_3_T.json',
    description: '托福阅读与听力核心学术高分词汇，分为 214 组 20 词小任务。',
  },
  ielts: {
    title: '雅思核心高频词汇全集 (IELTS)',
    category: '出国留学备考',
    filename: 'IELTS_3_T.json',
    description: '雅思考试真题高频核心词库，分为 179 组 20 词小任务。',
  },
  coder: {
    title: '程序员与计算机极客专业英语',
    category: '极客与职业技能',
    filename: 'coder.json',
    description: 'IT、编程、系统与网络开发高频专业英语，分为 85 组 20 词小任务。',
  },
};

function cleanDictTrans(trans: unknown): string {
  if (Array.isArray(trans)) {
    return trans
      .filter((t: string) => !t.startsWith('时态:') && !t.startsWith('比较级:'))
      .join('； ');
  }
  return String(trans || '');
}

function extractDictPos(trans: unknown): string {
  const text = Array.isArray(trans) ? trans.join(' ') : String(trans || '');
  const match = text.match(/([a-z]{1,4}\.)/i);
  return match ? match[1].toLowerCase() : '';
}

export async function loadOfficialDictionary(dictId: string): Promise<{
  id: string;
  title: string;
  category: string;
  words: WordItem[];
}> {
  const meta = DICTIONARY_META[dictId];
  if (!meta) {
    throw new Error(`未找到词库配置: ${dictId}`);
  }

  // 1. First attempt: call backend API route (if running in Node.js server)
  try {
    const res = await fetch(`/api/dictionary/${dictId}`);
    if (res.ok) {
      const data = JSON.parse(await res.text());
      if (data && Array.isArray(data.words) && data.words.length > 0) {
        return data;
      }
    }
  } catch {
    // If API route is not available (e.g. static Cloudflare Pages), fall through to static asset fetch
  }

  // 2. Fallback: fetch static JSON directly from Cloudflare Pages CDN (/dicts/*.json)
  const staticUrl = `/dicts/${meta.filename}`;
  const staticRes = await fetch(staticUrl);
  if (!staticRes.ok) {
    throw new Error(`无法从静态文件加载词库 (${meta.filename}): HTTP ${staticRes.status}`);
  }

  const rawData = await staticRes.json();
  if (!Array.isArray(rawData)) {
    throw new Error('词库格式不正确');
  }

  const words: WordItem[] = rawData
    .map((item: any, idx: number) => {
      const wordClean = String(item.name || item.word || '').toLowerCase().trim();
      const usphone = item.usphone || item.phon_n_am || '';
      const ukphone = item.ukphone || item.phon_br || usphone;
      const trans = item.trans || item.definition || item.meaning || '';

      return {
        id: `${dictId}-${idx}`,
        word: wordClean,
        phoneticAmE: usphone ? `[${usphone.replace(/^\[?|\/?|\]?$/g, '')}]` : '',
        phoneticBrE: ukphone ? `[${ukphone.replace(/^\[?|\/?|\]?$/g, '')}]` : '',
        pos: extractDictPos(trans),
        meaning: cleanDictTrans(trans) || '暂无释义',
        sentence: item.example || '',
        sentenceTranslation: '',
        frequency: 1,
      };
    })
    .filter((w: WordItem) => w.word.length > 0);

  return {
    id: dictId,
    title: meta.title,
    category: meta.category,
    words,
  };
}
