import React from 'react';
import { CheckCircle2, ArrowRight, RotateCcw, Award } from 'lucide-react';
import { TypingStats, WordItem, TaskProgressPoint } from '../types';
import { AccuracyTrendChart } from './AccuracyTrendChart';

interface TaskMilestoneModalProps {
  isOpen: boolean;
  currentTaskIndex: number;
  totalTasks: number;
  taskSize: number;
  totalArticleWords: number;
  stats: TypingStats;
  taskMistakes: WordItem[];
  taskProgressHistory?: TaskProgressPoint[];
  onNextTask: () => void;
  onRepeatTask: () => void;
}

export const TaskMilestoneModal: React.FC<TaskMilestoneModalProps> = ({
  isOpen,
  currentTaskIndex,
  totalTasks,
  taskSize,
  totalArticleWords,
  stats,
  taskMistakes,
  taskProgressHistory = [],
  onNextTask,
  onRepeatTask,
}) => {
  if (!isOpen) return null;

  const currentTaskNum = currentTaskIndex + 1;
  const startWordNum = currentTaskIndex * taskSize + 1;
  const endWordNum = Math.min((currentTaskIndex + 1) * taskSize, totalArticleWords);
  const wordsInThisTask = endWordNum - startWordNum + 1;
  const isLastTask = currentTaskNum >= totalTasks;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-700 overflow-hidden text-center p-6 sm:p-7 my-8">
        {/* Milestone Icon */}
        <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3 shadow-md shadow-indigo-500/10">
          <Award className="w-7 h-7" />
        </div>

        <div className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 mb-2 border border-indigo-200 dark:border-indigo-800">
          第 {currentTaskNum} / {totalTasks} 组小任务完成
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100">
          🎉 成功通关本组 {wordsInThisTask} 词！
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          已掌握单词进度：第 {startWordNum} ~ {endWordNum} 词（全篇共 {totalArticleWords} 词）
        </p>

        {/* Task progress bar */}
        <div className="my-3 px-2">
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium">
            <span>总进度</span>
            <span>{Math.round((endWordNum / totalArticleWords) * 100)}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${(endWordNum / totalArticleWords) * 100}%` }}
            />
          </div>
        </div>

        {/* Stats metrics */}
        <div className="grid grid-cols-3 gap-2 my-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/60 text-center">
          <div>
            <div className="font-mono-code font-bold text-xl text-indigo-600 dark:text-indigo-400">
              {stats.wpm}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">WPM 速度</div>
          </div>
          <div>
            <div className="font-mono-code font-bold text-xl text-emerald-600 dark:text-emerald-400">
              {stats.accuracy}%
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">正确率</div>
          </div>
          <div>
            <div className="font-mono-code font-bold text-xl text-slate-700 dark:text-slate-200">
              {stats.correctWords}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">本组完成词数</div>
          </div>
        </div>

        {/* Accuracy Trend Chart (Data Visualization) */}
        <AccuracyTrendChart
          data={taskProgressHistory}
          title={`第 ${currentTaskNum} 组准确率与速度变化趋势`}
        />

        {/* Mistakes in this task */}
        {taskMistakes.length > 0 && (
          <div className="text-left my-3">
            <div className="text-[11px] font-semibold text-rose-500 mb-1.5">
              本组需巩固词汇 ({taskMistakes.length}个):
            </div>
            <div className="flex flex-wrap gap-1 p-2 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 max-h-24 overflow-y-auto">
              {taskMistakes.map((w) => (
                <span
                  key={w.id}
                  className="px-2 py-0.5 rounded text-xs font-mono-code bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-rose-200 dark:border-rose-900/40"
                >
                  {w.word}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2.5 mt-4">
          <button
            onClick={onRepeatTask}
            className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-medium text-xs sm:text-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>重新练习本组</span>
          </button>

          {!isLastTask ? (
            <button
              onClick={onNextTask}
              className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs sm:text-sm transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-indigo-500/20 cursor-pointer"
            >
              <span>进入第 {currentTaskNum + 1} 组 ({endWordNum + 1}-{Math.min(endWordNum + taskSize, totalArticleWords)}词)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onNextTask}
              className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs sm:text-sm transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>查看全文通关总结</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
