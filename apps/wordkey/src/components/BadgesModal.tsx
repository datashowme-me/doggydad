import React from 'react';
import { X, Award, CheckCircle2, Lock } from 'lucide-react';

export interface BadgeItem {
  id: string;
  name: string;
  desc: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
}

interface BadgesModalProps {
  isOpen: boolean;
  onClose: () => void;
  badges: BadgeItem[];
}

export const BadgesModal: React.FC<BadgesModalProps> = ({ isOpen, onClose, badges }) => {
  if (!isOpen) return null;

  const unlockedCount = badges.filter((b) => b.unlocked).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full p-6 text-slate-800 dark:text-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="关闭"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-400/10 flex items-center justify-center text-amber-500">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold">成就勋章墙</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              已解锁 {unlockedCount} / {badges.length} 枚专属荣誉勋章
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mb-5">
          <div
            className="bg-gradient-to-r from-amber-400 to-indigo-500 h-full transition-all duration-300"
            style={{ width: `${Math.round((unlockedCount / badges.length) * 100)}%` }}
          />
        </div>

        {/* Badges Grid */}
        <div className="grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
          {badges.map((b) => (
            <div
              key={b.id}
              className={`p-3.5 rounded-xl border flex items-start gap-3 transition-all ${
                b.unlocked
                  ? 'bg-amber-500/5 dark:bg-amber-400/5 border-amber-500/30 dark:border-amber-400/30'
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                  b.unlocked
                    ? 'bg-amber-500/20 text-amber-500 shadow-sm'
                    : 'bg-slate-200 dark:bg-slate-700 grayscale'
                }`}
              >
                {b.unlocked ? b.icon : <Lock className="w-4 h-4 text-slate-400" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <h4 className="font-semibold text-xs truncate">{b.name}</h4>
                  {b.unlocked && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-tight">
                  {b.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
