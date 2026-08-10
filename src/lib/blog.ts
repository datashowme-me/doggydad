export const categories = {
  'reading-notes': {
    name: '读书笔记',
    description: '把一本书拆成可以带走的观点、方法与行动。',
    accent: '#a34a2a'
  },
  'turing-award': {
    name: '图灵奖系列',
    description: '沿着计算机科学先驱的工作，理解今天的技术从何而来。',
    accent: '#8b641f'
  },
  'tech-learning': {
    name: '技术学习',
    description: '记录工具、工程实践与正在形成的新技术范式。',
    accent: '#315f59'
  },
  general: {
    name: '随笔',
    description: '关于学习、工作与日常观察的零散记录。',
    accent: '#695b77'
  }
} as const;

export type CategoryKey = keyof typeof categories;

export function withBase(path = '/') {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${base}${suffix}` || '/';
}

export function getPostCategory(post: { slug: string; data: { category?: string } }): CategoryKey {
  const key = post.data.category || post.slug.split('/')[0];
  return (key in categories ? key : 'general') as CategoryKey;
}

export function getPostDate(post: { data: { date?: string | Date; publishDate?: string | Date } }) {
  return new Date(post.data.date || post.data.publishDate || 0);
}

export function formatDate(value?: string | Date) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function readingTime(body = '') {
  const chineseCharacters = (body.match(/[\u3400-\u9fff]/g) || []).length;
  const latinWords = body
    .replace(/[\u3400-\u9fff]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.ceil(chineseCharacters / 400 + latinWords / 220));
}

export function relatedPosts<T extends { slug: string; data: { tags?: string[]; category?: string } }>(
  current: T,
  allPosts: T[],
  limit = 3
) {
  const currentCategory = getPostCategory(current);
  const currentTags = new Set(current.data.tags || []);

  return allPosts
    .filter((post) => post.slug !== current.slug)
    .map((post) => {
      const tagMatches = (post.data.tags || []).filter((tag) => currentTags.has(tag)).length;
      const categoryMatch = getPostCategory(post) === currentCategory ? 2 : 0;
      return { post, score: tagMatches * 3 + categoryMatch };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || getPostDate(b.post).getTime() - getPostDate(a.post).getTime())
    .slice(0, limit)
    .map(({ post }) => post);
}
