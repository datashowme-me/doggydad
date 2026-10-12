import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'A - Z', desc: '敲击字母进行打字默写输入' },
    { key: 'Space (空格键)', desc: '输入词组/短语中的空格（单个单词时可用于重播发音）' },
    { key: 'Tab', desc: '切换按钮和输入框焦点' },
    { key: 'Ctrl + B', desc: '加入 / 取消生词本星标收藏' },
    { key: 'Alt + Z', desc: '开启 / 退出极简沉浸专注模式 (Zen Mode)' },
    { key: 'Shift', desc: '在美式发音 (AmE) 与英式发音 (BrE) 之间快速切换' },
    { key: 'Enter / →', desc: '跳过当前单词，进入下一个单词' },
    { key: '←', desc: '返回上一个单词重新复习' },
    { key: 'Backspace', desc: '回退删除已输入的字母' },
    { key: 'Esc', desc: '退出专注模式 / 暂停与继续练习' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              键盘快捷键
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shortcuts list */}
        <div className="p-6 space-y-3">
          {shortcuts.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700/40 last:border-0"
            >
              <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                {item.desc}
              </span>
              <kbd className="px-2.5 py-1 text-xs font-mono-code font-semibold rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 shadow-2xs">
                {item.key}
              </kbd>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-700/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-colors cursor-pointer"
          >
            我知道了
          </button>
        </div>
      </div>
    </div>
  );
};
