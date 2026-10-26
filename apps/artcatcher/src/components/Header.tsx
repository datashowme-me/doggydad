import React, { useState } from 'react';
import { sound } from '../utils/audio';
import { Volume2, VolumeX, Coins, PlusCircle, Images, Award, Menu, X, CircleHelp } from 'lucide-react';

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const runMobileAction = (action: () => void) => {
    sound.playClick();
    setIsMobileMenuOpen(false);
    action();
  };

  return (
    <header className="absolute top-0 left-0 right-0 h-14 sm:h-16 px-3 sm:px-4 md:px-8 flex items-center justify-start gap-1.5 sm:gap-3 md:gap-8 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md z-30 pointer-events-auto select-none">
      {/* Zone 1: Brand Wordmark */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-base sm:text-lg md:text-xl font-black tracking-tight text-white whitespace-nowrap">
          ArtCatcher <span className="text-amber-400 font-extrabold">3D</span>
        </span>
      </div>

      {/* Zone 2: Single-line Nav Links */}
      <nav className="hidden md:flex flex-1 items-center justify-center gap-6 text-xs font-semibold text-slate-300">
        <button
          onClick={() => {
            sound.playClick();
            onOpenGallery();
          }}
          className="hover:text-amber-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          艺术展柜
        </button>
        <button
          onClick={() => {
            sound.playClick();
            onOpenAchievements();
          }}
          className="hover:text-amber-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          荣誉成就
        </button>
        <button
          onClick={() => {
            sound.playClick();
            onOpenHowToPlay();
          }}
          className="hover:text-amber-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          玩法指南
        </button>
      </nav>

      {/* Mobile menu keeps the header usable at narrow phone widths. */}
      <div className="relative ml-auto md:hidden">
        <button
          onClick={() => {
            sound.playClick();
            setIsMobileMenuOpen((open) => !open);
          }}
          title="游戏菜单"
          aria-label={isMobileMenuOpen ? '关闭游戏菜单' : '打开游戏菜单'}
          aria-expanded={isMobileMenuOpen}
          className="grid h-9 w-9 place-items-center rounded-lg bg-slate-800/80 text-slate-200 border border-slate-700"
        >
          {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>

        {isMobileMenuOpen && (
          <div className="absolute right-0 top-full mt-2 w-40 overflow-hidden rounded-xl border border-slate-700 bg-slate-950/95 p-1.5 text-sm text-slate-200 shadow-2xl backdrop-blur-md">
            <button
              onClick={() => runMobileAction(onOpenGallery)}
              className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-left hover:bg-slate-800"
            >
              <Images className="h-4 w-4 text-amber-400" />
              艺术展柜
            </button>
            <button
              onClick={() => runMobileAction(onOpenAchievements)}
              className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-left hover:bg-slate-800"
            >
              <Award className="h-4 w-4 text-amber-400" />
              荣誉成就
            </button>
            <button
              onClick={() => runMobileAction(onOpenHowToPlay)}
              className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-left hover:bg-slate-800"
            >
              <CircleHelp className="h-4 w-4 text-amber-400" />
              玩法指南
            </button>
          </div>
        )}
      </div>

      {/* Zone 3: Primary Action & Coin Counter */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Mute Audio Toggle */}
        <button
          onClick={onToggleMute}
          title={isMuted ? '开启声音' : '静音'}
          aria-label={isMuted ? '开启声音' : '静音'}
          className="grid h-9 w-9 place-items-center rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
        </button>

        {/* Arcade Coin Balance & Add Coin Action */}
        <div className="flex h-9 items-center gap-1 px-1.5 sm:px-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
          <Coins className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-xs font-bold font-mono tabular-nums text-amber-300">
            {coins} <span className="hidden sm:inline text-[11px] font-normal text-amber-400/80">代币</span>
          </span>
          <button
            onClick={() => {
              sound.playCoin();
              onAddCoin();
            }}
            title="免费投币"
            aria-label="免费投币"
            className="ml-0.5 grid h-7 w-7 place-items-center text-amber-400 hover:text-amber-300 transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
