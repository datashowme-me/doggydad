import React from 'react';
import { Trophy, RotateCcw, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { TypingStats, WordItem, TaskProgressPoint } from '../types';
import { AccuracyTrendChart } from './AccuracyTrendChart';

interface CompletionModalProps {
  isOpen: boolean;
  stats: TypingStats;
  mistakenWords: WordItem[];
  sessionProgressHistory?: TaskProgressPoint[];
  articleTitle: string;
  onRestart: () => void;
  onReviewMistakes: () => void;
  onOpenImport: () => void;
}

export const CompletionModal: React.FC<CompletionModalProps> = ({
  isOpen,
  stats,
  mistakenWords,
  sessionProgressHistory = [],
  articleTitle,
  onRestart,
  onReviewMistakes,
  onOpenImport,
}) => {
  if (!isOpen) return null;

  const formatTime = (totalSec: number) => {
    const minutes = Math.floor(totalSec / 60);
    const seconds = totalSec % 60;
    return `${minutes}分${seconds}秒`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-700 overflow-hidden text-center p-6 sm:p-8 my-8">
        {/* Trophy icon */}
        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center mb-4 shadow-lg shadow-amber-500/10">
          <Trophy className="w-8 h-8" />
        </div>

        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          🎉 恭喜完成本篇默写练习！
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          文章：《{articleTitle}》
        </p>

        {/* Stats summary grid */}
        <div className="grid grid-cols-3 gap-3 my-5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/60">
          <div>
            <div className="font-mono-code font-bold text-2xl text-indigo-600 dark:text-indigo-400">
              {stats.wpm}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">WPM 速度</div>
          </div>
          <div>
            <div className="font-mono-code font-bold text-2xl text-emerald-600 dark:text-emerald-400">
              {stats.accuracy}%
            </div>
            <div className="text-xs text-slate-400 mt-0.5">正确率</div>
          </div>
          <div>
            <div className="font-mono-code font-bold text-xl text-slate-700 dark:text-slate-200">
              {formatTime(stats.elapsedSeconds)}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">总用时</div>
          </div>
        </div>

        {/* Accuracy Trend Chart (Data Visualization) */}
        <AccuracyTrendChart
          data={sessionProgressHistory}
          title="全篇练习准确率与速度变化趋势"
        />

        {/* Mistaken words list */}
        {mistakenWords.length > 0 ? (
          <div className="text-left my-5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-rose-500 mb-2 flex items-center gap-1.5">
              <span>需巩固错词 ({mistakenWords.length}个):</span>
            </h4>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30">
              {mistakenWords.map((w) => (
                <span
                  key={w.id}
                  className="px-2 py-1 rounded-md text-xs font-mono-code bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-rose-200 dark:border-rose-900/40"
                >
                  {w.word}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs my-5 flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>太棒了！所有单词零错误一次通过！</span>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-2.5 mt-2">
          {mistakenWords.length > 0 && (
            <button
              onClick={onReviewMistakes}
              className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-medium text-sm transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>专项强化错词</span>
            </button>
          )}

          <button
            onClick={onRestart}
            className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-medium text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>重新练习本篇</span>
          </button>

          <button
            onClick={onOpenImport}
            className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-colors flex items-center justify-center gap-2 shadow-md shadow-indigo-500/20 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>解析新文章</span>
          </button>
        </div>
      </div>
    </div>
  );
};
