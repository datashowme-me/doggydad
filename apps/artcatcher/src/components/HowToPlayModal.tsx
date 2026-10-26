import React from 'react';
import { sound } from '../utils/audio';
import { X, Gamepad2, Eye, Award, Sparkles } from 'lucide-react';

interface HowToPlayModalProps {
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl p-6 md:p-7 text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-black text-white">玩法指南</h2>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Steps */}
        <div className="space-y-2.5 text-xs text-slate-300">
          <div className="flex gap-3 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center font-bold text-amber-400 shrink-0">
              1
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-100 mb-0.5">移动与旋转视角</h4>
              <p className="leading-relaxed text-slate-400">
                使用左下角摇杆或键盘 <kbd className="px-1 py-0.5 bg-slate-800 rounded font-mono text-amber-300">WASD</kbd> 移动天车；在画面任意空白处拖动可 360° 自由旋转视角。
              </p>
            </div>
          </div>

          <div className="flex gap-3 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
            <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center font-bold text-sky-400 shrink-0">
              2
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-100 mb-0.5">对准锁敌</h4>
              <p className="leading-relaxed text-slate-400">
                观察地面准心与进深雷达，对准手办时准心将直接点亮绿色锁定。推荐切换为「45° 黄金」机位，立体纵深一目了然。
              </p>
            </div>
          </div>

          <div className="flex gap-3 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center font-bold text-rose-400 shrink-0">
              3
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-100 mb-0.5">一键下爪抓取</h4>
              <p className="leading-relaxed text-slate-400">
                锁定后按下 <span className="text-rose-400 font-semibold">“下爪 (DROP)”</span> 或敲击键盘 <kbd className="px-1 py-0.5 bg-slate-800 rounded font-mono text-rose-300">空格键</kbd>，三爪自动垂降抓取并将战利品带回出奖口。
              </p>
            </div>
          </div>

          <div className="flex gap-3 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center font-bold text-purple-400 shrink-0">
              4
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-100 mb-0.5">点亮艺术展柜</h4>
              <p className="leading-relaxed text-slate-400">
                抓中的名画与手办将永久收录于个人展柜，可 360° 旋转检视细节、品读画作馆藏故事并领取成就代币奖励。
              </p>
            </div>
          </div>
        </div>

        {/* Footer Button */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors"
          >
            开始游戏
          </button>
        </div>
      </div>
    </div>
  );
};
