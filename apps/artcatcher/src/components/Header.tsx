import React from 'react';
import { sound } from '../utils/audio';
import { Volume2, VolumeX, Coins, PlusCircle } from 'lucide-react';

interface HeaderProps {
  coins: number;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenGallery: () => void;
  onOpenAchievements: () => void;
  onOpenHowToPlay: () => void;
  onAddCoin: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  coins,
  isMuted,
  onToggleMute,
  onOpenGallery,
  onOpenAchievements,
  onOpenHowToPlay,
  onAddCoin,
}) => {
  return (
    <header className="absolute top-0 left-0 right-0 h-16 px-4 md:px-8 flex items-center justify-between gap-8 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md z-30 pointer-events-auto select-none">
      {/* Zone 1: Brand Wordmark */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-lg md:text-xl font-black tracking-tight text-white whitespace-nowrap">
          ArtCatcher <span className="text-amber-400 font-extrabold">3D</span>
        </span>
      </div>

      {/* Zone 2: Single-line Nav Links */}
      <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-300">
        <button
          onClick={() => {
            sound.playClick();
            onOpenGallery();
          }}
          className="hover:text-amber-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          艺术名画展柜
        </button>
        <button
          onClick={() => {
            sound.playClick();
            onOpenAchievements();
          }}
          className="hover:text-amber-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          荣誉成就勋章
        </button>
        <button
          onClick={() => {
            sound.playClick();
            onOpenHowToPlay();
          }}
          className="hover:text-amber-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          玩法操作指南
        </button>
      </nav>

      {/* Mobile Quick Nav (visible on small screens) */}
      <div className="flex md:hidden items-center gap-2 text-xs">
        <button
          onClick={onOpenGallery}
          className="px-2.5 py-1 rounded-lg bg-slate-800/80 text-slate-200 border border-slate-700"
        >
          展柜
        </button>
        <button
          onClick={onOpenAchievements}
          className="px-2.5 py-1 rounded-lg bg-slate-800/80 text-slate-200 border border-slate-700"
        >
          成就
        </button>
      </div>

      {/* Zone 3: Primary Action & Coin Counter */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Mute Audio Toggle */}
        <button
          onClick={onToggleMute}
          title={isMuted ? '开启声音' : '静音'}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
        </button>

        {/* Arcade Coin Balance & Add Coin Action */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
          <Coins className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-xs font-bold font-mono tabular-nums text-amber-300">
            {coins} <span className="text-[11px] font-normal text-amber-400/80">代币</span>
          </span>
          <button
            onClick={() => {
              sound.playCoin();
              onAddCoin();
            }}
            title="免费投币"
            className="ml-1 p-0.5 text-amber-400 hover:text-amber-300 transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
