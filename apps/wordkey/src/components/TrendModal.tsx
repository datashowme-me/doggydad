import React, { useState } from 'react';
import { X, TrendingUp, BarChart2 } from 'lucide-react';
import { TaskProgressPoint } from '../types';
import { AccuracyTrendChart } from './AccuracyTrendChart';

interface TrendModalProps {
  isOpen: boolean;
  taskData: TaskProgressPoint[];
  sessionData: TaskProgressPoint[];
  currentTaskNum: number;
  onClose: () => void;
}

export const TrendModal: React.FC<TrendModalProps> = ({
  isOpen,
  taskData,
  sessionData,
  currentTaskNum,
  onClose,
}) => {
  const [tab, setTab] = useState<'task' | 'session'>('task');

  if (!isOpen) return null;

  const currentData = tab === 'task' ? taskData : sessionData;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-700 overflow-hidden p-6 sm:p-7 text-left my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700/60">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100">
                打字准确率与进步趋势分析
              </h2>
              <p className="text-xs text-slate-400">
                实时追踪每个单词的键入精确度与速度演进
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

        {/* Tab switch between current 20-word task and entire session */}
        <div className="flex items-center gap-2 mt-4 mb-2">
          <button
            type="button"
            onClick={() => setTab('task')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              tab === 'task'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            当前第 {currentTaskNum} 组任务趋势 ({taskData.length} 词已记录)
          </button>
          <button
            type="button"
            onClick={() => setTab('session')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              tab === 'session'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            全篇累计进度趋势 ({sessionData.length} 词已记录)
          </button>
        </div>

        {/* Trend Chart */}
        <AccuracyTrendChart
          data={currentData}
          title={
            tab === 'task'
              ? `第 ${currentTaskNum} 组任务准确率演进图`
              : '全篇默写练习总体准确率演进图'
          }
        />

        {/* Footer */}
        <div className="flex justify-end mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-medium transition-colors cursor-pointer"
          >
            返回练习
          </button>
        </div>
      </div>
    </div>
  );
};
