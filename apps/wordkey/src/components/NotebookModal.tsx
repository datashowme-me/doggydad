import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  BookMarked,
  Search,
  Star,
  Trash2,
  Volume2,
  PlayCircle,
  Download,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  Filter,
} from 'lucide-react';
import { NotebookWordItem, UserSettings } from '../types';
import {
  getNotebookWords,
  deleteNotebookWord,
  toggleWordFavorite,
  toggleWordMastered,
  clearMasteredWords,
  clearAllNotebookWords,
  exportNotebookAs,
} from '../utils/notebookStorage';
import { soundManager } from '../utils/soundEffects';

interface NotebookModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onStartPractice: (words: NotebookWordItem[], modeTitle: string) => void;
}

type TabType = 'all' | 'mistakes' | 'favorites' | 'mastered';

export const NotebookModal: React.FC<NotebookModalProps> = ({
  isOpen,
  onClose,
  settings,
  onStartPractice,
}) => {
  const [words, setWords] = useState<NotebookWordItem[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);
  const [playingWord, setPlayingWord] = useState<string | null>(null);

  // Load words when opened
  const loadWords = () => {
    setWords(getNotebookWords());
  };

  useEffect(() => {
    if (isOpen) {
      loadWords();
    }
  }, [isOpen]);

  // Listen to external updates
  useEffect(() => {
    const handleUpdate = () => {
      loadWords();
    };
    window.addEventListener('wordkey_notebook_updated', handleUpdate);
    return () => window.removeEventListener('wordkey_notebook_updated', handleUpdate);
  }, []);

  // Filtered words
  const filteredWords = useMemo(() => {
    return words.filter((w) => {
      // Tab filter
      if (activeTab === 'mistakes' && (w.mistakeCount || 0) === 0) return false;
      if (activeTab === 'favorites' && !w.isFavorite) return false;
      if (activeTab === 'mastered' && !w.isMastered) return false;

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchWord = w.word.toLowerCase().includes(query);
        const matchMeaning = (w.meaning || '').toLowerCase().includes(query);
        const matchSentence = (w.sentence || '').toLowerCase().includes(query);
        if (!matchWord && !matchMeaning && !matchSentence) return false;
      }

      return true;
    });
  }, [words, activeTab, searchQuery]);

  // Tab stats
  const stats = useMemo(() => {
    const total = words.length;
    const mistakes = words.filter((w) => (w.mistakeCount || 0) > 0).length;
    const favorites = words.filter((w) => w.isFavorite).length;
    const mastered = words.filter((w) => w.isMastered).length;
    return { total, mistakes, favorites, mastered };
  }, [words]);

  const handlePlayAudio = async (wordText: string) => {
    setPlayingWord(wordText);
    await soundManager.playPronunciation(wordText, settings.accent, {
      rate: settings.audioRate,
      repeat: 1,
    });
    setPlayingWord(null);
  };

  const handleToggleFav = (word: NotebookWordItem) => {
    toggleWordFavorite(word);
    loadWords();
  };

  const handleToggleMaster = (id: string) => {
    toggleWordMastered(id);
    loadWords();
  };

  const handleDelete = (id: string) => {
    deleteNotebookWord(id);
    loadWords();
  };

  const handleClearMastered = () => {
    if (window.confirm('确定要清理所有已掌握的生词吗？')) {
      clearMasteredWords();
      loadWords();
    }
  };

  const handleClearAll = () => {
    if (window.confirm('⚠️ 确定要清空全部生词本记录吗？此操作无法撤销。')) {
      clearAllNotebookWords();
      loadWords();
    }
  };

  const handleExport = (format: 'txt' | 'anki' | 'json') => {
    const content = exportNotebookAs(filteredWords, format);
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `生词本_${activeTab}_${Date.now()}.${format === 'anki' ? 'txt' : format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopy = (format: 'txt' | 'anki') => {
    const content = exportNotebookAs(filteredWords, format);
    navigator.clipboard.writeText(content).then(() => {
      setCopiedFormat(format);
      setTimeout(() => setCopiedFormat(null), 2000);
    });
  };

  const handleStartPracticeSession = () => {
    if (filteredWords.length === 0) return;
    const tabNameMap: Record<TabType, string> = {
      all: '全部生词本专项练习',
      mistakes: '高频错词强化练习',
      favorites: '我的收藏词汇专项',
      mastered: '已掌握词汇巩固复查',
    };
    onStartPractice(filteredWords, tabNameMap[activeTab]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-4xl w-full border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Top Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs">
              <BookMarked className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  专属生词本 (本地持久化)
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full font-mono-code bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-medium">
                  {words.length} 词
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                自动收录练习错词与收藏重点，无需登录，永久保存在本浏览器中
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab & Search Bar */}
        <div className="p-4 sm:px-6 border-b border-slate-100 dark:border-slate-700/60 bg-white dark:bg-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              全部 ({stats.total})
            </button>
            <button
              onClick={() => setActiveTab('mistakes')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'mistakes'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              高频错词 ({stats.mistakes})
            </button>
            <button
              onClick={() => setActiveTab('favorites')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'favorites'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              星标收藏 ({stats.favorites})
            </button>
            <button
              onClick={() => setActiveTab('mastered')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'mastered'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              已掌握 ({stats.mastered})
            </button>
          </div>

          {/* Search box */}
          <div className="relative min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索单词、中文释义或例句..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Word List Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {filteredWords.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <BookMarked className="w-12 h-12 mx-auto mb-3 opacity-30 stroke-[1.5]" />
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {searchQuery
                  ? '没有搜索到匹配的单词'
                  : activeTab === 'all'
                  ? '生词本当前为空，日常练习中拼错或主动星标的单词会自动收录在此！'
                  : `当前分类下暂无单词`}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredWords.map((item) => {
                const isPlaying = playingWord === item.word;
                return (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${
                      item.isMastered
                        ? 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700/50 opacity-75'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600/60 shadow-xs'
                    }`}
                  >
                    <div>
                      {/* Top row: Word, Phonetic, Pos, Actions */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono-code text-base font-bold text-slate-800 dark:text-slate-100">
                            {item.word}
                          </span>
                          <button
                            onClick={() => handlePlayAudio(item.word)}
                            className={`p-1 rounded-lg transition-colors ${
                              isPlaying
                                ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600 animate-pulse'
                                : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-700'
                            }`}
                            title="播放发音"
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>
                          {item.phoneticAmE && (
                            <span className="text-xs text-indigo-600/80 dark:text-indigo-400 font-mono-code">
                              {item.phoneticAmE}
                            </span>
                          )}
                          {item.pos && (
                            <span className="text-[11px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-semibold">
                              {item.pos}
                            </span>
                          )}
                        </div>

                        {/* Top Right Badges & Star */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleToggleFav(item)}
                            className={`p-1 rounded-lg transition-colors ${
                              item.isFavorite
                                ? 'text-amber-500 hover:text-amber-600'
                                : 'text-slate-300 dark:text-slate-600 hover:text-amber-500'
                            }`}
                            title={item.isFavorite ? '取消收藏' : '加入收藏'}
                          >
                            <Star
                              className={`w-4 h-4 ${
                                item.isFavorite ? 'fill-amber-500' : ''
                              }`}
                            />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1 rounded-lg text-slate-300 dark:text-slate-600 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="从生词本删除"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Meaning */}
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 line-clamp-2">
                        {item.meaning || '暂无详细中文释义'}
                      </p>

                      {/* Sentence */}
                      {item.sentence && (
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 italic line-clamp-1">
                          “{item.sentence}”
                        </p>
                      )}
                    </div>

                    {/* Bottom Status Row */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2">
                        {(item.mistakeCount || 0) > 0 ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40">
                            错 {item.mistakeCount} 次
                          </span>
                        ) : (
                          <span className="text-slate-400">已收录</span>
                        )}

                        {(item.correctStreak || 0) > 0 && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40">
                            连对 {item.correctStreak} 次
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => handleToggleMaster(item.id)}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-lg font-medium transition-colors cursor-pointer ${
                          item.isMastered
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{item.isMastered ? '已掌握' : '标记已掌握'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Bottom Actions Bar */}
        <div className="p-4 sm:px-6 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-700/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Left tools: Export / Copy / Clear */}
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => handleCopy('txt')}
              disabled={filteredWords.length === 0}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-40 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              {copiedFormat === 'txt' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>已复制</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>复制列表</span>
                </>
              )}
            </button>

            <button
              onClick={() => handleExport('anki')}
              disabled={filteredWords.length === 0}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-40 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              title="导出为 Anki 记忆卡片导入格式 (TSV)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Anki 卡片</span>
            </button>

            {stats.mastered > 0 && (
              <button
                onClick={handleClearMastered}
                className="px-2.5 py-1.5 rounded-xl text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-colors whitespace-nowrap cursor-pointer"
              >
                清理已掌握
              </button>
            )}

            {words.length > 0 && (
              <button
                onClick={handleClearAll}
                className="px-2.5 py-1.5 rounded-xl text-xs text-rose-500 hover:text-rose-600 transition-colors whitespace-nowrap cursor-pointer"
              >
                清空全部
              </button>
            )}
          </div>

          {/* Right CTA: Start Practice Mode */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleStartPracticeSession}
              disabled={filteredWords.length === 0}
              className="w-full sm:w-auto px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-medium text-xs sm:text-sm shadow-md shadow-indigo-500/20 disabled:opacity-40 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <PlayCircle className="w-4 h-4" />
              <span>开始本组生词练习 ({filteredWords.length}词)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
