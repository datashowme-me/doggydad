import React from 'react';
import { X, Volume2, EyeOff, Music, Sliders, VolumeX } from 'lucide-react';
import { UserSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdateSettings: (updater: (prev: UserSettings) => UserSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              设置与偏好
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings options */}
        <div className="p-6 space-y-5">
          {/* Accent setting: AmE vs BrE */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              发音口音偏好
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() =>
                  onUpdateSettings((prev) => ({ ...prev, accent: 'us' }))
                }
                className={`py-2.5 px-3 rounded-xl border text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  settings.accent === 'us'
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                }`}
              >
                <span>🇺🇸 美式发音 (AmE)</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  onUpdateSettings((prev) => ({ ...prev, accent: 'uk' }))
                }
                className={`py-2.5 px-3 rounded-xl border text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  settings.accent === 'uk'
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                }`}
              >
                <span>🇬🇧 英式发音 (BrE)</span>
              </button>
            </div>
          </div>

          {/* Dictation Mode toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-700/60">
            <div className="flex items-center gap-2.5">
              <EyeOff className="w-5 h-5 text-amber-500" />
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                  默写模式 (听音辨词)
                </p>
                <p className="text-xs text-slate-400">
                  隐藏单词完整拼写，仅凭发音和释义在键盘盲打
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.dictationMode}
              onChange={(e) =>
                onUpdateSettings((prev) => ({
                  ...prev,
                  dictationMode: e.target.checked,
                }))
              }
              className="w-5 h-5 accent-indigo-600 cursor-pointer rounded"
            />
          </div>

          {/* Auto play pronunciation */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-700/60">
            <div className="flex items-center gap-2.5">
              <Volume2 className="w-5 h-5 text-indigo-500" />
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                  切换单词时自动朗读发音
                </p>
                <p className="text-xs text-slate-400">
                  进入下一个单词时自动播放对应美音/英音
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.autoPlayAudio}
              onChange={(e) =>
                onUpdateSettings((prev) => ({
                  ...prev,
                  autoPlayAudio: e.target.checked,
                }))
              }
              className="w-5 h-5 accent-indigo-600 cursor-pointer rounded"
            />
          </div>

          {/* Audio Speed Rate and Repeat */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-700/60 space-y-3">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                  发音朗读语速
                </p>
                <span className="text-xs font-mono-code font-bold text-indigo-600 dark:text-indigo-400">
                  {settings.audioRate || 1.0}x
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: '慢速 0.8x', val: 0.8 },
                  { label: '标准 1.0x', val: 1.0 },
                  { label: '快速 1.2x', val: 1.2 },
                ].map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() =>
                      onUpdateSettings((prev) => ({
                        ...prev,
                        audioRate: item.val,
                      }))
                    }
                    className={`py-1.5 rounded-lg text-xs font-medium transition-all ${
                      (settings.audioRate || 1.0) === item.val
                        ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-700 dark:text-slate-200">
                  切词发音重复次数
                </p>
                <p className="text-[11px] text-slate-400">
                  切入新词时连续播报 1 次或 2 次强化听感
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                {[1, 2].map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() =>
                      onUpdateSettings((prev) => ({
                        ...prev,
                        audioRepeat: cnt as 1 | 2,
                      }))
                    }
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                      (settings.audioRepeat || 1) === cnt
                        ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {cnt} 次
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Key sound effect */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-700/60">
            <div className="flex items-center gap-2.5">
              <Music className="w-5 h-5 text-emerald-500" />
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                  机械键盘敲击音效
                </p>
                <p className="text-xs text-slate-400">
                  按键时提供机械轴清脆反馈与完成提示音
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.keySound}
              onChange={(e) =>
                onUpdateSettings((prev) => ({
                  ...prev,
                  keySound: e.target.checked,
                }))
              }
              className="w-5 h-5 accent-indigo-600 cursor-pointer rounded"
            />
          </div>

          {/* Show Chinese meaning */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-700/60">
            <div>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                显示中文释义
              </p>
              <p className="text-xs text-slate-400">
                在单词下方显示词性与中文释义
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.showMeaning}
              onChange={(e) =>
                onUpdateSettings((prev) => ({
                  ...prev,
                  showMeaning: e.target.checked,
                }))
              }
              className="w-5 h-5 accent-indigo-600 cursor-pointer rounded"
            />
          </div>

          {/* Show phonetic */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-700/60">
            <div>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                显示国际音标
              </p>
              <p className="text-xs text-slate-400">
                展示 AmE 或 BrE 规范音标
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.showPhonetic}
              onChange={(e) =>
                onUpdateSettings((prev) => ({
                  ...prev,
                  showPhonetic: e.target.checked,
                }))
              }
              className="w-5 h-5 accent-indigo-600 cursor-pointer rounded"
            />
          </div>

          {/* Task Group Chunk Size (切成小任务: 默认20词) */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-700/60">
            <div className="flex justify-between items-center mb-2">
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                  小任务切分（每组单词数）
                </p>
                <p className="text-xs text-slate-400">
                  文章词汇过多时自动切分为小任务，每组打完自动进入下一组
                </p>
              </div>
              <span className="px-2 py-0.5 rounded text-xs font-bold font-mono-code bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                {settings.taskSize || 20} 词/组
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2 pt-1">
              {[15, 20, 25, 30].map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() =>
                    onUpdateSettings((prev) => ({ ...prev, taskSize: size }))
                  }
                  className={`py-1.5 rounded-lg text-xs font-semibold font-mono-code transition-all ${
                    (settings.taskSize || 20) === size
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {size} 词
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-700/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-colors cursor-pointer"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
};
