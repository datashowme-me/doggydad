import React, { useState } from 'react';
import { X, Printer, FileText } from 'lucide-react';
import { WordItem } from '../types';

interface A4WorksheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  words: WordItem[];
  title: string;
}

export const A4WorksheetModal: React.FC<A4WorksheetModalProps> = ({
  isOpen,
  onClose,
  words,
  title,
}) => {
  const [printType, setPrintType] = useState<'copy' | 'dictation' | 'trans'>('copy');
  const [copyCount, setCopyCount] = useState<number>(2);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-100">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">A4 纸质单词打卡卷与临摹字帖</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                支持标准四线三格英文字母练字线、看中默英、看英写中，一键连接打印机
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options Toolbar */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-600 dark:text-slate-300">题型模式:</span>
            <div className="flex rounded-lg bg-white dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setPrintType('copy')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  printType === 'copy'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600'
                }`}
              >
                标准临摹字帖
              </button>
              <button
                type="button"
                onClick={() => setPrintType('dictation')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  printType === 'dictation'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600'
                }`}
              >
                看中默英 (留空)
              </button>
              <button
                type="button"
                onClick={() => setPrintType('trans')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  printType === 'trans'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600'
                }`}
              >
                看英写中 (翻译)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {printType === 'copy' && (
              <label className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <span>每词书写次数:</span>
                <select
                  value={copyCount}
                  onChange={(e) => setCopyCount(Number(e.target.value))}
                  className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-xs"
                >
                  <option value={1}>1 次</option>
                  <option value={2}>2 次 (标准)</option>
                  <option value={3}>3 次 (强化)</option>
                </select>
              </label>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>立即打印 / 存为PDF</span>
            </button>
          </div>
        </div>

        {/* Printable Paper Preview */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100 dark:bg-slate-950 flex justify-center">
          <div
            id="a4-printable-paper"
            className="w-full max-w-[210mm] min-h-[297mm] bg-white text-slate-900 p-8 shadow-md rounded-lg flex flex-col justify-between"
            style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
          >
            <div>
              {/* Worksheet Title Header */}
              <div className="border-b-2 border-slate-800 pb-3 mb-6 text-center">
                <h1 className="text-xl font-bold tracking-wide">{title} · 每日单词打卡练字卷</h1>
                <div className="flex justify-between items-center text-xs text-slate-500 mt-2 px-2">
                  <span>班级/姓名：_______________</span>
                  <span>打卡日期：{new Date().toLocaleDateString('zh-CN')}</span>
                  <span>得分 / 评价：⭐⭐⭐⭐⭐</span>
                </div>
              </div>

              {/* Words Rows Grid */}
              <div className="space-y-4">
                {words.slice(0, 16).map((item, idx) => {
                  const phonetic = item.phoneticAmE || item.phoneticBrE || '';
                  return (
                    <div
                      key={item.id || idx}
                      className="border border-slate-200 rounded-lg p-2.5 flex items-center justify-between gap-4"
                    >
                      <div className="w-1/3 min-w-[120px]">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-400 text-xs">{idx + 1}.</span>
                          <span className="font-bold text-sm">
                            {printType === 'dictation' ? '❓ [请默写]' : item.word}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 font-mono pl-4">
                          {phonetic}
                        </div>
                        <div className="text-xs text-slate-700 font-medium pl-4 mt-0.5">
                          {printType === 'trans' ? '_______________' : item.meaning}
                        </div>
                      </div>

                      {/* Four-line three-space handwriting guide */}
                      <div className="flex-1 flex gap-2">
                        {Array.from({ length: printType === 'copy' ? copyCount : 1 }).map((_, cIdx) => (
                          <div
                            key={cIdx}
                            className="flex-1 h-12 border-y-2 border-indigo-200 relative bg-indigo-50/20 rounded flex items-center justify-center"
                          >
                            <div className="absolute top-1/3 left-0 right-0 border-b border-dashed border-indigo-300" />
                            <div className="absolute top-2/3 left-0 right-0 border-b border-indigo-300" />
                            {printType === 'copy' && cIdx === 0 && (
                              <span
                                className="font-mono text-base font-medium text-slate-300 tracking-wider select-none"
                                style={{ fontFamily: 'JetBrains Mono, monospace' }}
                              >
                                {item.word}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Paper Footer */}
            <div className="mt-8 pt-4 border-t border-slate-200 text-center text-xs text-slate-400">
              WordsMaster 文键 · 练习网址: learn.wordsmaster.app · 坚持每日拼读打卡，稳步提升词汇积累！
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
