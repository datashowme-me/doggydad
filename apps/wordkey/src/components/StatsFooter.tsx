import React from 'react';
import { TrendingUp, Flame } from 'lucide-react';
import { TypingStats } from '../types';

interface StatsFooterProps {
  stats: TypingStats;
  isZenMode?: boolean;
  onOpenTrend?: () => void;
}

export const StatsFooter: React.FC<StatsFooterProps> = ({ stats, isZenMode = false, onOpenTrend }) => {
  if (isZenMode) return null;

  // Format seconds into MM:SS
  const formatTime = (totalSec: number) => {
    const minutes = Math.floor(totalSec / 60);
    const seconds = totalSec % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <footer className="w-full pb-6 pt-1 px-4 flex flex-col items-center justify-center gap-2 transition-all">
      {/* Sleek Lightweight Floating Card */}
      <div className="bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl shadow-xs border border-slate-200/70 dark:border-slate-700/60 px-6 sm:px-8 py-3.5 max-w-2xl w-full grid grid-cols-5 divide-x divide-slate-100 dark:divide-slate-700/50 transition-all">
        {/* Metric 1: 时间 (Time) */}
        <div className="flex flex-col items-center justify-center px-1 sm:px-2">
          <div className="font-mono-code font-bold text-xl sm:text-2xl text-slate-700 dark:text-slate-300 tracking-tight">
            {formatTime(stats.elapsedSeconds)}
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 font-medium">
            时间
          </div>
        </div>

        {/* Metric 2: 输入数 (Keystrokes) */}
        <div className="flex flex-col items-center justify-center px-1 sm:px-2">
          <div className="font-mono-code font-bold text-xl sm:text-2xl text-slate-700 dark:text-slate-300 tracking-tight">
            {stats.totalKeystrokes}
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 font-medium">
            输入数
          </div>
        </div>

        {/* Metric 3: WPM (Primary Metric) */}
        <div className="flex flex-col items-center justify-center px-1 sm:px-2">
          <div className="font-mono-code font-extrabold text-2xl sm:text-3xl text-indigo-600 dark:text-indigo-400 tracking-tight">
            {stats.wpm}
          </div>
          <div className="text-[11px] font-semibold text-indigo-500/80 dark:text-indigo-400/80 mt-0.5">
            WPM
          </div>
        </div>

        {/* Metric 4: 正确词 (Correct words) */}
        <div className="flex flex-col items-center justify-center px-1 sm:px-2">
          <div className="font-mono-code font-bold text-xl sm:text-2xl text-slate-700 dark:text-slate-300 tracking-tight">
            {stats.correctWords}
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 font-medium">
            正确词
          </div>
        </div>

        {/* Metric 5: 正确率 (Primary Metric) */}
        <div className="flex flex-col items-center justify-center px-1 sm:px-2">
          <div className={`font-mono-code font-extrabold text-2xl sm:text-3xl tracking-tight ${
            stats.accuracy >= 95
              ? 'text-emerald-600 dark:text-emerald-400'
              : stats.accuracy >= 85
              ? 'text-indigo-600 dark:text-indigo-400'
              : 'text-amber-500'
          }`}>
            {stats.accuracy}%
          </div>
          <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mt-0.5">
            正确率
          </div>
        </div>
      </div>

      {/* Optional Trend Quick-View Pill & Streak Indicator */}
      <div className="flex items-center gap-3">
        {stats.streak !== undefined && stats.streak >= 3 && (
          <div className="inline-flex items-center gap-1 text-[11px] font-mono-code font-semibold text-amber-600 dark:text-amber-400">
            <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            <span>连击 {stats.streak}</span>
          </div>
        )}

        {onOpenTrend && (
          <button
            type="button"
            onClick={onOpenTrend}
            className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>实时准确率趋势图</span>
          </button>
        )}
      </div>
    </footer>
  );
};
