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
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <Gamepad2 className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-black text-white">游戏操作与技巧秘籍</h2>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps */}
        <div className="space-y-4 text-xs text-slate-300">
          <div className="flex gap-3.5 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center font-bold text-amber-400 shrink-0">
              1
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-100 mb-0.5">摇杆微调悬臂</h4>
              <p className="leading-relaxed text-slate-400">
                使用界面左下方的 3D 虚拟摇杆，或电脑键盘的 <kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-amber-300">WASD</kbd> / 方向键，可平滑微移上方机械抓斗天车。观察地板上的黄色准心光圈进行对位。
              </p>
            </div>
          </div>

          <div className="flex gap-3.5 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center font-bold text-sky-400 shrink-0">
              2
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-100 mb-0.5">3D 自由旋转与进深雷达</h4>
              <p className="leading-relaxed text-slate-400">
                可直接在画面空白处<span className="text-sky-300 font-semibold">拖动鼠标/手指 360° 旋转视角</span>！推荐选用 <span className="text-amber-300 font-semibold">“45° 黄金立体”</span> 视角，纵深一览无余；摇杆旁的 <span className="text-cyan-300 font-semibold">“进深雷达”</span> 与机内垂直激光柱会实时显示准心高度，对准手办时将直接点亮绿色锁定！
              </p>
            </div>
          </div>

          <div className="flex gap-3.5 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center font-bold text-rose-400 shrink-0">
              3
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-100 mb-0.5">下爪抓取与物理搬运</h4>
              <p className="leading-relaxed text-slate-400">
                对准后按下 <span className="text-rose-400 font-semibold">“下爪 (DROP)”</span> 或按键盘 <kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-rose-300">空格键</kbd>。三爪臂在重力下垂降并闭合抓取，带回出奖滑道后自动松脱。
              </p>
            </div>
          </div>

          <div className="flex gap-3.5 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center font-bold text-purple-400 shrink-0">
              4
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-100 mb-0.5">艺术展柜 360° 鉴赏</h4>
              <p className="leading-relaxed text-slate-400">
                抓中的名画与卡通手办将永久收藏于个人展柜。进入展柜可 360° 旋转检视 3D 手办细节、细读作品创作历史与馆藏机构背后的精彩故事！
              </p>
            </div>
          </div>
        </div>

        {/* Footer Button */}
        <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors"
          >
            我明白了，立即开始游戏
          </button>
        </div>
      </div>
    </div>
  );
};
