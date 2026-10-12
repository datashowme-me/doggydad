import React, { useState } from 'react';
import {
  X,
  Link as LinkIcon,
  FileText,
  Sparkles,
  Loader2,
  BookOpen,
  AlertCircle,
  Layers,
  ListOrdered,
  Check,
} from 'lucide-react';
import { SAMPLE_ARTICLES, SAMPLE_CATEGORIES } from '../data/fallbackData';
import { WordItem, ExtractionMode } from '../types';
import { loadOfficialDictionary } from '../utils/dictionaryLoader';

interface ArticleImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportWords: (words: WordItem[], title: string, sourceUrl?: string) => void;
}

export const ArticleImportModal: React.FC<ArticleImportModalProps> = ({
  isOpen,
  onClose,
  onImportWords,
}) => {
  const [tab, setTab] = useState<'url' | 'text' | 'samples' | 'generator'>('samples');
  const [urlInput, setUrlInput] = useState<string>('');
  const [textInput, setTextInput] = useState<string>('');
  const [titleInput, setTitleInput] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('全部精选');

  // AI Generator state
  const [customTopic, setCustomTopic] = useState<string>('托福核心学术高频词汇');
  const [customWordCount, setCustomWordCount] = useState<number>(40);

  // Official full-size dictionaries (Oxford 5000, CET-4, CET-6, KaoYan, TOEFL, IELTS, Coder)
  const [officialDicts, setOfficialDicts] = useState<any[]>([
    {
      id: 'oxford5000',
      title: '牛津 5000 核心词库 (完整版)',
      category: '核心拓展词库',
      description: '社区整理的 Oxford 5000 词表，非官方产品。来源与许可见页面底部说明。',
      wordCount: 5836,
      totalTasks: 292,
      isOfficialLarge: true,
    },
    {
      id: 'cet4',
      title: '大学英语四级核心词汇 (CET-4)',
      category: '学术与考试',
      description: '大学四级考试核心必背高频词汇全集，分为 131 组 20 词小任务。',
      wordCount: 2607,
      totalTasks: 131,
      isOfficialLarge: true,
    },
    {
      id: 'cet6',
      title: '大学英语六级进阶词汇 (CET-6)',
      category: '学术与考试',
      description: '大学六级考试进阶高分词汇全集，分为 118 组 20 词小任务。',
      wordCount: 2345,
      totalTasks: 118,
      isOfficialLarge: true,
    },
    {
      id: 'kaoyan',
      title: '考研英语必背高频词汇全集',
      category: '学术与考试',
      description: '考研英语大纲高频核心词库，分为 187 组 20 词小任务。',
      wordCount: 3731,
      totalTasks: 187,
      isOfficialLarge: true,
    },
    {
      id: 'toefl',
      title: '托福学术高分必背词汇 (TOEFL)',
      category: '学术与考试',
      description: '托福阅读与听力核心学术高分词汇全集，分为 214 组 20 词小任务。',
      wordCount: 4264,
      totalTasks: 214,
      isOfficialLarge: true,
    },
    {
      id: 'ielts',
      title: '雅思核心高频词汇全集 (IELTS)',
      category: '学术与考试',
      description: '雅思考试真题高频核心冲刺词库，分为 179 组 20 词小任务。',
      wordCount: 3575,
      totalTasks: 179,
      isOfficialLarge: true,
    },
    {
      id: 'coder',
      title: '程序员与计算机极客专业英语',
      category: '计算机与科技',
      description: 'IT、编程、架构与算法高频专业英语全集，分为 85 组 20 词小任务。',
      wordCount: 1700,
      totalTasks: 85,
      isOfficialLarge: true,
    },
  ]);

  // Extraction options
  const [mode, setMode] = useState<ExtractionMode>('all_unique');
  const [extractAll, setExtractAll] = useState<boolean>(true); // Default to ALL words!
  const [maxWordsCount, setMaxWordsCount] = useState<number>(50);
  const [includeStopWords, setIncludeStopWords] = useState<boolean>(true);
  const [order, setOrder] = useState<'appearance' | 'frequency'>('appearance');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleParseUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) {
      setErrorMessage('请输入有效的文章网址链接');
      return;
    }

    let normalizedUrl = urlInput.trim();
    if (!/^https?:\/\//i.test(normalizedUrl)) {
      normalizedUrl = 'https://' + normalizedUrl;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setLoadingStep('正在抓取文章网页并清理正文...');

    try {
      const response = await fetch('/api/parse-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: normalizedUrl,
          mode,
          includeStopWords,
          order,
          maxWords: extractAll ? 0 : maxWordsCount,
        }),
      });

      setLoadingStep('正在提取文章全部单词并匹配美音/英音发音与释义...');

      const responseText = await response.text();
      let data: any;
      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(
          '当前环境网页抓取接口未响应，建议复制网页文章内容后，直接切换到「粘贴文章文本」模式进行解析！'
        );
      }

      if (!response.ok) {
        throw new Error(data.error || '解析文章失败');
      }

      if (!data.words || data.words.length === 0) {
        throw new Error('未能从该文章提取到有效单词，请尝试直接粘贴文本');
      }
      onImportWords(data.words, data.title || '提取的文章', normalizedUrl);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '解析文章失败';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  const handleParseText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) {
      setErrorMessage('请粘贴需要解析的英文文章正文');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setLoadingStep('正在提取全文单词并生成美音/英音音标与释义...');

    try {
      const response = await fetch('/api/parse-article', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textInput.trim(), title: titleInput.trim() || '自定义文章',
          mode, includeStopWords, order, maxWords: extractAll ? 0 : maxWordsCount }),
      });
      const data = JSON.parse(await response.text());
      if (!response.ok) throw new Error(data.error || '解析失败，请稍后重试');
      if (!Array.isArray(data.words) || !data.words.length) throw new Error('未提取到有效单词');
      onImportWords(data.words, data.title || '自定义文章');
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '解析文本失败';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  const handleSelectSample = (sample: typeof SAMPLE_ARTICLES[0]) => {
    onImportWords(sample.words, sample.title, sample.url);
    onClose();
  };

  const handleSelectOfficialDict = async (dictId: string) => {
    setIsLoading(true);
    setLoadingStep('正在加载社区词库...');
    setErrorMessage(null);
    try {
      const data = await loadOfficialDictionary(dictId);
      if (!data.words || data.words.length === 0) throw new Error('词库数据为空');
      onImportWords(data.words, data.title);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '加载词库失败';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  const handleGenerateCustomPack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTopic.trim()) {
      setErrorMessage('请输入您想拓展的词汇主题或考试类型');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setLoadingStep(`正在生成【${customTopic}】${customWordCount}个核心拓展词汇与音标释义...`);

    try {
      const response = await fetch('/api/generate-vocab-pack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: customTopic.trim(),
          count: customWordCount,
        }),
      });

      const data = JSON.parse(await response.text());
      if (!response.ok) {
        throw new Error(data.error || '生成拓展词库失败');
      }

      if (!data.words || data.words.length === 0) {
        throw new Error('未能生成有效单词列表');
      }
      onImportWords(data.words, data.title || customTopic);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '生成拓展词库失败';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  WordKey 词汇拓展与文章解析中心
                </h2>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-400">
                支持真题阅读解析、系统化大词库、以及AI专属词库定制
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="px-6 py-2 text-xs text-slate-500">
          AI 内容请核对。每次最多解析 20,000 字符 / 200 词；AI 生成 10–40 词。
          网址抓取支持 Wikipedia、MDN、GitHub、BBC、Guardian、Reuters，其他网站请粘贴正文。
          部分导入单词及原句会发送至 DeepSeek，请勿导入敏感资料。
        </p>
        {/* Tab Switcher */}
        <div className="flex border-b border-slate-100 dark:border-slate-700/60 px-6 pt-2 bg-slate-50/50 dark:bg-slate-800/40 overflow-x-auto">
          <button
            onClick={() => { setTab('samples'); setErrorMessage(null); }}
            className={`pb-3 px-2.5 text-xs sm:text-sm font-medium flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-colors ${
              tab === 'samples'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>精选拓展词库</span>
          </button>
          <button
            onClick={() => { setTab('generator'); setErrorMessage(null); }}
            className={`pb-3 px-2.5 text-xs sm:text-sm font-medium flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-colors ${
              tab === 'generator'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>智能拓展生成</span>
          </button>
          <button
            onClick={() => { setTab('url'); setErrorMessage(null); }}
            className={`pb-3 px-2.5 text-xs sm:text-sm font-medium flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-colors ${
              tab === 'url'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <LinkIcon className="w-4 h-4" />
            <span>输入文章网址</span>
          </button>
          <button
            onClick={() => { setTab('text'); setErrorMessage(null); }}
            className={`pb-3 px-2.5 text-xs sm:text-sm font-medium flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-colors ${
              tab === 'text'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>粘贴文章文本</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-300 text-xs sm:text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <div>{errorMessage}</div>
            </div>
          )}

          {/* TAB: AI Generator for Custom Vocabulary Expansion */}
          {tab === 'generator' && (
            <form onSubmit={handleGenerateCustomPack} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  想要拓展的词汇方向 / 考试或专业领域
                </label>
                <input
                  type="text"
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  placeholder="例如: 托福核心学术高频词汇、考研高频词、经济学人精选词..."
                  disabled={isLoading}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Quick Topic Chips */}
              <div>
                <span className="text-[11px] text-slate-400 mb-1.5 block">快捷推荐拓展方向:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    '托福核心学术高频词汇',
                    '考研英语高分深度核心词',
                    '雅思高分学术阅读词汇',
                    '程序员与计算机极客英语',
                    '国际商务与外企职场沟通',
                    'GRE核心思辨与精英词汇',
                  ].map((topic) => (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => setCustomTopic(topic)}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                        customTopic === topic
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-medium'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>

              {/* Word Count selection with task breakdown indicator */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    词汇量规模 (自动切分小任务)
                  </label>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    共 {customWordCount} 词 (切分为 {Math.ceil(customWordCount / 20)} 组 20 词小任务)
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { count: 20, desc: '1 组小任务' },
                    { count: 40, desc: '2 组小任务' },
                    { count: 10, desc: '轻量练习' },
                    { count: 30, desc: '进阶练习' },
                  ].map((item) => (
                    <button
                      key={item.count}
                      type="button"
                      onClick={() => setCustomWordCount(item.count)}
                      className={`py-2 px-1 rounded-xl border text-center transition-all ${
                        customWordCount === item.count
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold ring-2 ring-indigo-500/20'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="text-xs font-mono-code font-bold">{item.count} 词</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{item.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-medium text-sm transition-all shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{loadingStep || '正在生成拓展词库...'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>生成专属【{customTopic}】词库并开始练习</span>
                  </>
                )}
              </button>

              <div className="text-[11px] text-slate-400 dark:text-slate-500 text-center flex items-center justify-center gap-1">
                <span>💡 由 DeepSeek AI 智能驱动，自动配备英/美音标、精准备注与双语例句</span>
              </div>
            </form>
          )}

          {/* TAB 1: URL input */}
          {tab === 'url' && (
            <form onSubmit={handleParseUrl} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  文章网页地址 (URL)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <LinkIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://en.wikipedia.org/wiki/Artificial_intelligence"
                    disabled={isLoading}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[11px] text-slate-400">示例链接:</span>
                  <button
                    type="button"
                    onClick={() =>
                      setUrlInput('https://en.wikipedia.org/wiki/Generative_artificial_intelligence')
                    }
                    className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                  >
                    AI 维基百科
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setUrlInput('https://en.wikipedia.org/wiki/Touch_typing')
                    }
                    className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                  >
                    盲打原理 (Touch Typing)
                  </button>
                </div>
              </div>

              {/* Extraction Mode Selector */}
              <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-700/60">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  单词提取模式
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => { setMode('all_unique'); setIncludeStopWords(true); }}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      mode === 'all_unique'
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="font-semibold text-xs flex items-center justify-between">
                      <span>全部不重复单词</span>
                      {mode === 'all_unique' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">提取文章中每个词 (推荐)</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode('full_text')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      mode === 'full_text'
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="font-semibold text-xs flex items-center justify-between">
                      <span>全文逐词原序</span>
                      {mode === 'full_text' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">完整默写整篇文章</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setMode('key_words'); setIncludeStopWords(false); }}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      mode === 'key_words'
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="font-semibold text-xs flex items-center justify-between">
                      <span>核心生词提取</span>
                      {mode === 'key_words' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">过滤简单虚词专注重点</p>
                  </button>
                </div>
              </div>

              {/* Extraction Quantity */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    提取数量
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setExtractAll(true)}
                      className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                        extractAll
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      全部提取 (无上限)
                    </button>
                    <button
                      type="button"
                      onClick={() => setExtractAll(false)}
                      className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                        !extractAll
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      限制前 {maxWordsCount} 词
                    </button>
                  </div>
                </div>

                {!extractAll && (
                  <div className="pt-1">
                    <input
                      type="range"
                      min="20"
                      max="200"
                      step="10"
                      value={maxWordsCount}
                      onChange={(e) => setMaxWordsCount(Number(e.target.value))}
                      disabled={isLoading}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>20 词</span>
                      <span>50 词</span>
                      <span>100 词</span>
                      <span>200 词</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Fine-tuning toggles */}
              <div className="flex flex-col sm:flex-row gap-3 pt-1 text-xs text-slate-600 dark:text-slate-300">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeStopWords}
                    onChange={(e) => setIncludeStopWords(e.target.checked)}
                    className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                  />
                  <span>包含基础常用词 (如 the, is, a, of 等)</span>
                </label>

                <div className="flex items-center gap-1.5 ml-auto">
                  <span className="text-slate-400">排序:</span>
                  <select
                    value={order}
                    onChange={(e) => setOrder(e.target.value as 'appearance' | 'frequency')}
                    className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                  >
                    <option value="appearance">按文章先后顺序</option>
                    <option value="frequency">按出现频次高低</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-all shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{loadingStep || '正在解析文章...'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>{extractAll ? '提取文章全部单词并开始默写' : `提取前 ${maxWordsCount} 个单词并开始默写`}</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 2: Text input */}
          {tab === 'text' && (
            <form onSubmit={handleParseText} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  文章标题 (可选)
                </label>
                <input
                  type="text"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  placeholder="例如: My Daily Reading"
                  disabled={isLoading}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    英文文章正文
                  </label>
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <span className="text-slate-400">真题范文填入:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setTitleInput('CET-4 真题精读: 现代大学教育与人工智能变革');
                        setTextInput(`Higher education institutions are experiencing profound transformations driven by rapid technological advancements. Artificial intelligence and digital learning environments are redefining traditional classroom interactions. Faculty members must cultivate critical thinking and creative inquiry rather than mere rote memorization. Consequently, students need to develop adaptability, collaborative communication, and analytical problem-solving skills to navigate increasingly competitive and complex global career pathways.`);
                        setMode('key_words');
                      }}
                      className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 font-medium transition-colors"
                    >
                      CET-4 真题
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTitleInput('考研英语真题精读: 经济发展与生态环境治理');
                        setTextInput(`The debate over economic growth and environmental preservation has intensified dramatically in contemporary society. Policymakers often confront formidable challenges when attempting to balance industrial productivity with stringent ecological regulations. Empirical investigations demonstrate that technological innovation and sustainable business strategies can stimulate long-term economic prosperity without undermining natural resources. Therefore, comprehensive legislative reforms and transparent regulatory frameworks remain indispensable for achieving equitable social progress.`);
                        setMode('key_words');
                      }}
                      className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 font-medium transition-colors"
                    >
                      考研真题
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTitleInput('雅思学术阅读: 认知神经机制与行为模式');
                        setTextInput(`Psychological researchers have investigated how unconscious neurological mechanisms govern human decision-making and habit formation. When individuals encounter repetitive stimuli, neural pathways gradually reinforce automated behavioral patterns, reducing conscious cognitive burden. Understanding these intrinsic mechanisms enables behavioral economists and clinicians to devise targeted interventions that foster productive habits and alleviate anxiety disorders in demanding social environments.`);
                        setMode('key_words');
                      }}
                      className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 font-medium transition-colors"
                    >
                      雅思精读
                    </button>
                  </div>
                </div>
                <textarea
                  rows={5}
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="在此直接粘贴任何英文文章、新闻、技术文档或演讲稿，将提取文章中的全部单词进行默写打字..."
                  disabled={isLoading}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-mono-code text-xs leading-relaxed"
                />
              </div>

              {/* Extraction Mode Selector */}
              <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-700/60">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  单词提取模式
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => { setMode('all_unique'); setIncludeStopWords(true); }}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      mode === 'all_unique'
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="font-semibold text-xs flex items-center justify-between">
                      <span>全部不重复单词</span>
                      {mode === 'all_unique' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">提取文本全部词汇</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode('full_text')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      mode === 'full_text'
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="font-semibold text-xs flex items-center justify-between">
                      <span>全文逐词原序</span>
                      {mode === 'full_text' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">按原文顺序完整打字</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setMode('key_words'); setIncludeStopWords(false); }}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      mode === 'key_words'
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="font-semibold text-xs flex items-center justify-between">
                      <span>核心生词提取</span>
                      {mode === 'key_words' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">过滤简单虚词</p>
                  </button>
                </div>
              </div>

              {/* Extraction limit */}
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-semibold uppercase">提取数量:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setExtractAll(true)}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                      extractAll
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    全部提取 (无上限)
                  </button>
                  <button
                    type="button"
                    onClick={() => setExtractAll(false)}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                      !extractAll
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    限 50 词
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-all shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{loadingStep || '正在解析文本...'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>开始默写打字</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 3: Curated Samples */}
          {tab === 'samples' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">
                  精选文章与社区词库，预置 20 词小任务分组：
                </p>
                <span className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md">
                  共 {SAMPLE_ARTICLES.length} 个经典模块
                </span>
              </div>

              {/* Category Pills */}
              <div className="flex flex-wrap gap-1.5 pb-1">
                {SAMPLE_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      selectedCategory === cat
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Modules List */}
              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {/* 1. Official Large Dictionaries */}
                {officialDicts
                  .filter((d) => selectedCategory === '全部精选' || d.category === selectedCategory)
                  .map((dict) => (
                    <div
                      key={dict.id}
                      onClick={() => handleSelectOfficialDict(dict.id)}
                      className="p-3.5 rounded-xl border border-indigo-200/80 dark:border-indigo-900/60 bg-gradient-to-r from-indigo-50/60 via-white to-indigo-50/20 dark:from-indigo-950/30 dark:via-slate-900/40 dark:to-indigo-950/20 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all cursor-pointer group flex items-start justify-between gap-3 shadow-xs"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-600 text-white font-bold tracking-wider">
                            社区词库
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-medium">
                            {dict.category}
                          </span>
                          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {dict.title}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {dict.description}
                        </p>
                        <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-2.5">
                          <span className="font-bold text-indigo-600 dark:text-indigo-400 font-mono-code">
                            共 {dict.wordCount} 词
                          </span>
                          <span>•</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                            切分为 {dict.totalTasks} 组小任务 (20词/组)
                          </span>
                          <span>•</span>
                          <span>美音/英音发音</span>
                        </div>
                      </div>
                      <button className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 text-white shadow-xs group-hover:bg-indigo-700 transition-all cursor-pointer shrink-0">
                        载入全集
                      </button>
                    </div>
                  ))}

                {/* 2. Curated Literature Samples */}
                {SAMPLE_ARTICLES.filter(
                  (s) => selectedCategory === '全部精选' || s.category === selectedCategory
                ).map((sample) => (
                  <div
                    key={sample.id}
                    onClick={() => handleSelectSample(sample)}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-indigo-50/50 dark:hover:bg-slate-800 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all cursor-pointer group flex items-start justify-between gap-3"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-medium">
                          {sample.category}
                        </span>
                        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {sample.title}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {sample.description}
                      </p>
                      <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-2.5">
                        <span className="font-medium text-slate-600 dark:text-slate-300">
                          {sample.words.length} 词 / 组
                        </span>
                        <span>•</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                          独立 20 词小任务
                        </span>
                        <span>•</span>
                        <span>美音/英音发音</span>
                      </div>
                    </div>
                    <button className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 border border-slate-200 dark:border-slate-600 shadow-xs shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors cursor-pointer">
                      载入开始
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
