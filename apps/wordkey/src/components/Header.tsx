import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  Shuffle,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Keyboard,
  Settings,
  Pause,
  Play,
  FileText,
  RotateCcw,
  Sparkles,
  ChevronDown,
  Layers,
  BookMarked,
  ArrowLeft,
  Maximize2,
  Minimize2,
  Award,
  Printer,
} from 'lucide-react';
import { UserSettings } from '../types';

interface HeaderProps {
  articleTitle: string;
  currentIndex: number;
  totalTaskWords: number;
  currentTaskIndex: number;
  totalTasks: number;
  taskSize: number;
  totalArticleWords: number;
  settings: UserSettings;
  isPaused: boolean;
  notebookCount?: number;
  isPracticeMode?: boolean;
  isZenMode?: boolean;
  onToggleZenMode?: () => void;
  onUpdateSettings: (updater: (prev: UserSettings) => UserSettings) => void;
  onTogglePause: () => void;
  onOpenImport: () => void;
  onOpenSettings: () => void;
  onOpenShortcuts: () => void;
  onOpenNotebook: () => void;
  onOpenBadges?: () => void;
  onOpenWorksheet?: () => void;
  onExitPracticeMode?: () => void;
  onResetProgress: () => void;
  onShuffleWords: () => void;
  onSelectTask: (taskIdx: number) => void;
}

export const Header: React.FC<HeaderProps> = ({
  articleTitle,
  currentIndex,
  totalTaskWords,
  currentTaskIndex,
  totalTasks,
  taskSize,
  totalArticleWords,
  settings,
  isPaused,
  notebookCount = 0,
  isPracticeMode = false,
  isZenMode = false,
  onToggleZenMode,
  onUpdateSettings,
  onTogglePause,
  onOpenImport,
  onOpenSettings,
  onOpenShortcuts,
  onOpenNotebook,
  onOpenBadges,
  onOpenWorksheet,
  onExitPracticeMode,
  onResetProgress,
  onShuffleWords,
  onSelectTask,
}) => {
  const [isTaskDropdownOpen, setIsTaskDropdownOpen] = useState(false);

  if (isZenMode) {
    return null;
  }

  const toggleAccent = () => {
    onUpdateSettings((prev) => ({
      ...prev,
      accent: prev.accent === 'us' ? 'uk' : 'us',
    }));
  };

  const toggleAutoPlay = () => {
    onUpdateSettings((prev) => ({
      ...prev,
      autoPlayAudio: !prev.autoPlayAudio,
    }));
  };

  const toggleDictation = () => {
    onUpdateSettings((prev) => ({
      ...prev,
      dictationMode: !prev.dictationMode,
    }));
  };

  const toggleTheme = () => {
    onUpdateSettings((prev) => ({
      ...prev,
      theme: prev.theme === 'light' ? 'dark' : 'light',
    }));
  };

  return (
    <header className="w-full max-w-7xl mx-auto pt-4 pb-1 px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-3 transition-all duration-300">
      {/* Left: Brand + Article Breadcrumb */}
      <div className="flex items-center gap-2.5 sm:gap-3 w-full md:w-auto justify-between md:justify-start">
        {/* Brand */}
        <div className="flex items-center gap-2 cursor-pointer group shrink-0" onClick={onOpenImport}>
          <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-b from-indigo-500 to-indigo-600 shadow-sm shadow-indigo-500/20 flex items-center justify-center text-white font-bold text-base transform group-hover:-translate-y-0.5 transition-transform duration-150 border-b-2 border-indigo-700">
            <span className="font-mono-code">W</span>
          </div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-lg font-bold tracking-tight text-indigo-600 dark:text-indigo-400">
              WordKey
            </h1>
            <span className="text-[10px] font-semibold tracking-wider px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
              文键
            </span>
          </div>
        </div>

        {/* Divider */}
        <span className="text-slate-300 dark:text-slate-600 select-none">/</span>

        {/* Article Title & Chapter dropdown */}
        <div className="flex items-center gap-2 min-w-0">
          <div
            onClick={onOpenImport}
            className="truncate text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer transition-colors max-w-[140px] sm:max-w-[220px]"
            title={`当前文章: ${articleTitle} (点击换文章)`}
          >
            {articleTitle || '牛津核心词库'}
          </div>

          {/* Chapter Selector Dropdown */}
          <div className="relative shrink-0">
            <button
              onClick={() => setIsTaskDropdownOpen((prev) => !prev)}
              className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-200/60 dark:bg-slate-700/60 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium transition-colors cursor-pointer"
              title="切换任务章节"
            >
              <span>第 {currentTaskIndex + 1}/{totalTasks} 组</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {/* Task Selector Dropdown Menu */}
            {isTaskDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setIsTaskDropdownOpen(false)}
                />
                <div className="absolute top-full left-0 mt-1.5 w-60 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 py-2 z-40 text-xs animate-fade-in">
                  <div className="px-3 pb-2 border-b border-slate-100 dark:border-slate-700/60">
                    <div className="flex justify-between items-center text-[11px] text-slate-500 font-semibold mb-1.5">
                      <span>任务组选择 (共 {totalTasks} 组)</span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-bold">{totalArticleWords} 词</span>
                    </div>

                    {/* Quick Jump Input */}
                    <div className="flex items-center gap-1.5 pt-1">
                      <span className="text-slate-400 text-[11px] whitespace-nowrap">跳转到:</span>
                      <input
                        type="number"
                        min="1"
                        max={totalTasks}
                        placeholder={`1-${totalTasks}`}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const val = parseInt((e.target as HTMLInputElement).value, 10);
                            if (!isNaN(val) && val >= 1 && val <= totalTasks) {
                              onSelectTask(val - 1);
                              setIsTaskDropdownOpen(false);
                            }
                          }
                        }}
                        className="w-16 px-1.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-center font-mono-code text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <span className="text-slate-400 text-[11px]">组 (回车)</span>
                    </div>

                    {/* Prev / Next Task Quick Switch */}
                    <div className="flex items-center gap-1.5 mt-2">
                      <button
                        type="button"
                        disabled={currentTaskIndex === 0}
                        onClick={() => {
                          onSelectTask(currentTaskIndex - 1);
                          setIsTaskDropdownOpen(false);
                        }}
                        className="flex-1 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 disabled:opacity-40 text-[11px] font-medium text-slate-700 dark:text-slate-200 cursor-pointer"
                      >
                        ◀ 上一组
                      </button>
                      <button
                        type="button"
                        disabled={currentTaskIndex >= totalTasks - 1}
                        onClick={() => {
                          onSelectTask(currentTaskIndex + 1);
                          setIsTaskDropdownOpen(false);
                        }}
                        className="flex-1 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 cursor-pointer"
                      >
                        下一组 ▶
                      </button>
                    </div>
                  </div>

                  {/* Scrollable list */}
                  <div className="max-h-60 overflow-y-auto py-1 px-1">
                    {Array.from({ length: totalTasks }).map((_, idx) => {
                      const startWord = idx * taskSize + 1;
                      const endWord = Math.min((idx + 1) * taskSize, totalArticleWords);
                      const isCurrent = idx === currentTaskIndex;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            onSelectTask(idx);
                            setIsTaskDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-1.5 text-left rounded-lg transition-colors flex items-center justify-between cursor-pointer ${
                            isCurrent
                              ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-300 font-semibold'
                              : 'hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          <span>第 {idx + 1} 组</span>
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono-code">
                            {startWord}-{endWord} 词
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Current word in task */}
          <div className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold shrink-0 whitespace-nowrap pl-1">
            {totalTaskWords > 0 ? currentIndex + 1 : 0}/{totalTaskWords}
          </div>
        </div>
      </div>

      {/* Right: Key Action Pills & Sleek Tool Group */}
      <div className="flex items-center gap-2 flex-wrap justify-end">
        {/* Practice Mode Return Button */}
        {isPracticeMode && onExitPracticeMode && (
          <button
            onClick={onExitPracticeMode}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-300 transition-colors border border-rose-200 dark:border-rose-900/40 cursor-pointer shadow-xs animate-pulse"
            title="退出生词本练习，返回原文章"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>退出练习</span>
          </button>
        )}

        {/* Import Article URL Button */}
        <button
          onClick={onOpenImport}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-300 transition-colors border border-indigo-100 dark:border-slate-700 shadow-xs cursor-pointer"
          title="输入网址或文本解析文章单词"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          <span>解析新文章</span>
        </button>

        {/* Notebook Button */}
        <button
          onClick={onOpenNotebook}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-amber-50 hover:bg-amber-100/80 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 transition-colors border border-amber-200/80 dark:border-amber-800/60 shadow-xs cursor-pointer"
          title="打开生词本 (本地持久化)"
        >
          <BookMarked className="w-3.5 h-3.5 text-amber-500" />
          <span>生词本</span>
          {notebookCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-mono-code font-bold animate-pop">
              {notebookCount}
            </span>
          )}
        </button>

        {/* A4 Printable Worksheet Button */}
        {onOpenWorksheet && (
          <button
            onClick={onOpenWorksheet}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/40 dark:hover:bg-sky-900/50 text-sky-700 dark:text-sky-300 transition-colors border border-sky-200 dark:border-sky-800/60 shadow-xs cursor-pointer"
            title="打印 A4 纸质单词打卡卷与临摹字帖"
          >
            <Printer className="w-3.5 h-3.5 text-sky-500" />
            <span>A4字帖</span>
          </button>
        )}

        {/* Badges Wall Button */}
        {onOpenBadges && (
          <button
            onClick={onOpenBadges}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 transition-colors border border-amber-400/30 shadow-xs cursor-pointer"
            title="查看我的成就勋章墙"
          >
            <Award className="w-3.5 h-3.5 text-amber-500" />
            <span>勋章</span>
          </button>
        )}

        {/* Sleek Tool Icon Group (Integrated Glass Bar) */}
        <div className="flex items-center gap-0.5 p-1 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-xl border border-slate-200/70 dark:border-slate-700/60 shadow-xs">
          {/* Dictation Mode */}
          <button
            onClick={toggleDictation}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              settings.dictationMode
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
            title={settings.dictationMode ? '默写模式已开启（隐藏字母拼写）' : '开启默写模式（盲打拼写）'}
          >
            {settings.dictationMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>

          {/* Sound Auto-play toggle */}
          <button
            onClick={toggleAutoPlay}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              settings.autoPlayAudio
                ? 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40'
                : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
            title={settings.autoPlayAudio ? '自动发音: 开启' : '自动发音: 关闭'}
          >
            {settings.autoPlayAudio ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {/* Shuffle */}
          <button
            onClick={onShuffleWords}
            className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title="乱序当前任务组"
          >
            <Shuffle className="w-3.5 h-3.5" />
          </button>

          {/* Zen Mode Toggle */}
          {onToggleZenMode && (
            <button
              onClick={onToggleZenMode}
              className="p-1.5 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              title="切换极简专注模式 (快捷键: Alt + Z)"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title={settings.theme === 'light' ? '深色模式' : '浅色模式'}
          >
            {settings.theme === 'light' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>

          {/* Keyboard Shortcuts */}
          <button
            onClick={onOpenShortcuts}
            className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer hidden sm:block"
            title="键盘快捷键"
          >
            <Keyboard className="w-3.5 h-3.5" />
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title="系统设置"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>

          {/* Reset progress */}
          <button
            onClick={onResetProgress}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title="重置当前组进度"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Pause / Resume */}
          <button
            onClick={onTogglePause}
            className={`ml-0.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all shadow-xs cursor-pointer ${
              isPaused
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200'
            }`}
            title={isPaused ? '继续练习 (Esc)' : '暂停练习 (Esc)'}
          >
            <span className="flex items-center gap-1">
              {isPaused ? <Play className="w-3 h-3 fill-current" /> : <Pause className="w-3 h-3 fill-current" />}
              <span>{isPaused ? '继续' : '暂停'}</span>
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
