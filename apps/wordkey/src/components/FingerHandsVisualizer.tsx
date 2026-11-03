import React, { useState, useEffect } from 'react';
import { FingerInfo, getFingerInfo, KEYBOARD_ROWS, FINGER_LEGEND, HOME_ROW_HINT } from '../utils/fingerMap';
import { Keyboard, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

interface FingerHandsVisualizerProps {
  currentKey: string | null;
  fingerInfo: FingerInfo | null;
  onKeyPress?: (char: string) => void;
  className?: string;
}

interface FingerNode {
  id: string; // e.g. 'left-pinky'
  fingerType: 'pinky' | 'ring' | 'middle' | 'index' | 'thumb';
  hand: 'left' | 'right';
  x: number;
  y: number; // tip y
  height: number;
  width: number;
  rx: number;
  rotate?: number;
  label: string;
}

// Left Hand anatomical fingers
const LEFT_FINGERS: FingerNode[] = [
  { id: 'left-pinky', fingerType: 'pinky', hand: 'left', x: 14, y: 22, height: 26, width: 9, rx: 4.5, label: '小指' },
  { id: 'left-ring', fingerType: 'ring', hand: 'left', x: 27, y: 13, height: 35, width: 9.5, rx: 4.75, label: '无名指' },
  { id: 'left-middle', fingerType: 'middle', hand: 'left', x: 40, y: 7, height: 41, width: 10, rx: 5, label: '中指' },
  { id: 'left-index', fingerType: 'index', hand: 'left', x: 53, y: 13, height: 35, width: 9.5, rx: 4.75, label: '食指' },
  { id: 'thumb', fingerType: 'thumb', hand: 'left', x: 67, y: 34, height: 25, width: 9.5, rx: 4.75, rotate: 32, label: '大拇指' },
];

// Right Hand anatomical fingers (mirror)
const RIGHT_FINGERS: FingerNode[] = [
  { id: 'thumb', fingerType: 'thumb', hand: 'right', x: 13, y: 34, height: 25, width: 9.5, rx: 4.75, rotate: -32, label: '大拇指' },
  { id: 'right-index', fingerType: 'index', hand: 'right', x: 27, y: 13, height: 35, width: 9.5, rx: 4.75, label: '食指' },
  { id: 'right-middle', fingerType: 'middle', hand: 'right', x: 40, y: 7, height: 41, width: 10, rx: 5, label: '中指' },
  { id: 'right-ring', fingerType: 'ring', hand: 'right', x: 53, y: 13, height: 35, width: 9.5, rx: 4.75, label: '无名指' },
  { id: 'right-pinky', fingerType: 'pinky', hand: 'right', x: 66, y: 22, height: 26, width: 9, rx: 4.5, label: '小指' },
];

export const FingerHandsVisualizer: React.FC<FingerHandsVisualizerProps> = ({
  currentKey,
  fingerInfo,
  onKeyPress,
  className = '',
}) => {
  // Remember user's preference for expanded virtual keyboard
  const [isKeyboardExpanded, setIsKeyboardExpanded] = useState<boolean>(() => {
    try {
      return localStorage.getItem('wordkey_virtual_keyboard_open') === 'true';
    } catch {
      return false;
    }
  });

  const toggleKeyboard = () => {
    setIsKeyboardExpanded((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('wordkey_virtual_keyboard_open', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const activeId = fingerInfo?.id;
  const isThumbActive = activeId === 'thumb' || fingerInfo?.finger === 'thumb';

  const renderHand = (side: 'left' | 'right', fingers: FingerNode[]) => {
    const isHandActive =
      (side === 'left' && (fingerInfo?.hand === 'left' || (isThumbActive && fingerInfo?.hand === 'both'))) ||
      (side === 'right' && (fingerInfo?.hand === 'right' || (isThumbActive && fingerInfo?.hand === 'both')));

    return (
      <div className="flex flex-col items-center">
        <svg
          viewBox="0 0 80 76"
          className="w-16 h-15 sm:w-20 sm:h-18 transition-transform duration-200"
          style={{ overflow: 'visible' }}
        >
          <defs>
            <filter id={`glow-${side}`} x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Hand Palm Outline */}
          <path
            d={
              side === 'left'
                ? 'M 14,44 C 14,38 18,34 26,34 L 54,34 C 64,34 70,44 68,54 C 66,66 58,74 40,74 C 22,74 14,66 14,44 Z'
                : 'M 66,44 C 66,38 62,34 54,34 L 26,34 C 16,34 10,44 12,54 C 14,66 22,74 40,74 C 58,74 66,66 66,44 Z'
            }
            className={`transition-colors duration-200 ${
              isHandActive
                ? 'fill-slate-100 dark:fill-slate-800/80 stroke-slate-300 dark:stroke-slate-600'
                : 'fill-slate-50 dark:fill-slate-900/60 stroke-slate-200 dark:stroke-slate-700/60'
            }`}
            strokeWidth="1.5"
          />

          {/* Fingers */}
          {fingers.map((f) => {
            const isActive =
              (f.id === 'thumb' && isThumbActive) ||
              (f.id === activeId);

            const fingerColor = isActive && fingerInfo ? fingerInfo.color : undefined;
            const tipX = f.x + f.width / 2;
            const tipY = f.y + f.width / 2;

            return (
              <g
                key={f.id + f.hand}
                transform={
                  f.rotate
                    ? `rotate(${f.rotate} ${f.x + f.width / 2} ${f.y + f.height / 2})`
                    : undefined
                }
              >
                {/* Finger Capsule Shaft */}
                <rect
                  x={f.x}
                  y={f.y}
                  width={f.width}
                  height={f.height}
                  rx={f.rx}
                  ry={f.rx}
                  strokeWidth={isActive ? '2' : '1.5'}
                  stroke={isActive && fingerColor ? fingerColor : 'currentColor'}
                  fill={isActive && fingerColor ? `${fingerColor}28` : 'currentColor'}
                  className={`transition-all duration-200 ${
                    isActive
                      ? ''
                      : 'text-slate-100 dark:text-slate-800/80 stroke-slate-300 dark:stroke-slate-600'
                  }`}
                />

                {/* Fingertip Active Beacon with Radiating Pulse */}
                {isActive && fingerColor && (
                  <>
                    {/* Radiating Ripple Ring */}
                    <circle
                      cx={tipX}
                      cy={tipY}
                      r={f.rx + 4}
                      fill="none"
                      stroke={fingerColor}
                      strokeWidth="1.5"
                      className="animate-ping origin-center opacity-75"
                    />
                    {/* Glowing Fingertip Node */}
                    <circle
                      cx={tipX}
                      cy={tipY}
                      r={f.rx - 0.5}
                      fill={fingerColor}
                      filter={`url(#glow-${side})`}
                    />
                    {/* Central Bright Point */}
                    <circle
                      cx={tipX}
                      cy={tipY}
                      r="1.8"
                      fill="#ffffff"
                    />
                  </>
                )}
              </g>
            );
          })}
        </svg>

        <span
          className={`text-[10px] font-medium tracking-tight mt-1 ${
            isHandActive
              ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
              : 'text-slate-400 dark:text-slate-500'
          }`}
        >
          {side === 'left' ? '左手' : '右手'}
        </span>
      </div>
    );
  };

  const keyDisplay = currentKey === ' ' ? 'Space' : currentKey?.toUpperCase() || '-';

  return (
    <div className={`w-full max-w-xl mx-auto flex flex-col items-center select-none ${className}`}>
      {/* 1. Compact Hand Silhouette Radar (双手机械微缩指示标) */}
      <div className="w-full flex items-center justify-between px-3 sm:px-4 py-2 rounded-2xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-sm backdrop-blur-md transition-all">
        {/* Left Hand Silhouette */}
        {renderHand('left', LEFT_FINGERS)}

        {/* Center: Dynamic Target Key & Finger Hint */}
        <div className="flex flex-col items-center px-2 py-0.5">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
              下一键
            </span>
            <div
              className="inline-flex items-center justify-center min-w-8 h-8 px-2 rounded-lg font-mono-code font-bold text-sm bg-slate-50 dark:bg-slate-800 border shadow-xs transition-all duration-150"
              style={{
                color: fingerInfo?.color || '#6366f1',
                borderColor: fingerInfo ? `${fingerInfo.color}88` : '#c7d2fe',
                backgroundColor: fingerInfo ? `${fingerInfo.color}15` : undefined,
                boxShadow: fingerInfo ? `0 0 12px ${fingerInfo.color}33` : undefined,
              }}
            >
              {keyDisplay}
            </div>
          </div>

          <div className="flex items-center gap-1.5 mt-1 text-xs">
            {fingerInfo ? (
              <span className="font-bold flex items-center gap-1" style={{ color: fingerInfo.color }}>
                <span
                  className="w-2 h-2 rounded-full inline-block animate-pulse"
                  style={{ backgroundColor: fingerInfo.color }}
                />
                {fingerInfo.label}
              </span>
            ) : (
              <span className="text-slate-400 text-xs">等待键入</span>
            )}
          </div>
        </div>

        {/* Right Hand Silhouette */}
        {renderHand('right', RIGHT_FINGERS)}

        {/* Keyboard Toggle Button */}
        <button
          type="button"
          onClick={toggleKeyboard}
          aria-expanded={isKeyboardExpanded}
          className={`ml-1 sm:ml-2 p-2 rounded-xl border flex items-center gap-1 text-xs transition-all cursor-pointer ${
            isKeyboardExpanded
              ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400'
              : 'bg-slate-100/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
          title={isKeyboardExpanded ? '收起完整指法键盘' : '展开 8 色指法全键位键盘'}
        >
          <Keyboard className="w-4 h-4" />
          <span className="hidden sm:inline font-medium">
            {isKeyboardExpanded ? '收起键盘' : '指法键盘'}
          </span>
          {isKeyboardExpanded ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* 2. Collapsible Full Interactive Finger-Color Virtual Keyboard */}
      {isKeyboardExpanded && (
        <div className="w-full mt-3 p-3 sm:p-4 rounded-2xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-md backdrop-blur-md animate-pop">
          <div className="flex items-center justify-between mb-2.5 px-1">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              标准 8 色指法键位图（点击或敲击按键即刻键入）
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">
              {HOME_ROW_HINT}
            </span>
          </div>

          {/* Virtual Keyboard Grid */}
          <div className="flex flex-col gap-1 sm:gap-1.5 items-center w-full">
            {KEYBOARD_ROWS.map((row, rIdx) => (
              <div key={rIdx} className="flex gap-1 sm:gap-1.5 justify-center w-full">
                {row.map((k) => {
                  const keyFinger = getFingerInfo(k.key);
                  const isTarget = currentKey?.toLowerCase() === k.key.toLowerCase();
                  const isHome = k.isHomeKey;

                  return (
                    <button
                      key={k.key}
                      type="button"
                      onClick={() => onKeyPress?.(k.key)}
                      title={keyFinger ? `${keyFinger.label} (${k.key.toUpperCase()})` : k.key}
                      style={{
                        borderColor: isTarget && keyFinger ? keyFinger.color : undefined,
                        boxShadow: isTarget && keyFinger ? `0 0 12px ${keyFinger.color}66` : undefined,
                      }}
                      className={`relative flex items-center justify-center rounded-lg font-mono-code font-bold transition-all cursor-pointer select-none ${
                        k.width || 'w-7 h-8 sm:w-9 sm:h-10 text-xs sm:text-sm'
                      } ${
                        isTarget
                          ? 'scale-110 z-10 bg-indigo-500 text-white dark:bg-indigo-600 ring-2 ring-indigo-400/50 shadow-md animate-pulse'
                          : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border border-slate-200/90 dark:border-slate-700/80 hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {/* Key Label */}
                      <span>{k.display || k.key.toUpperCase()}</span>

                      {/* Tactile Home Row Index Bumps on F & J */}
                      {isHome && (
                        <span
                          className={`absolute bottom-0.5 w-2 sm:w-2.5 h-0.5 rounded-full ${
                            isTarget ? 'bg-white' : 'bg-slate-400 dark:bg-slate-500'
                          }`}
                        />
                      )}

                      {/* Finger Color Accent Dot at corner */}
                      {keyFinger && !isTarget && (
                        <span
                          className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: keyFinger.color }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* 8-color finger legend bar at the bottom */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
            {FINGER_LEGEND.map((f) => {
              const isCurrent = fingerInfo?.id === f.id || (f.id === 'thumb' && isThumbActive);
              return (
                <div
                  key={f.id}
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] transition-colors ${
                    isCurrent
                      ? 'font-bold bg-slate-100 dark:bg-slate-800 ring-1 ring-slate-300 dark:ring-slate-600'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                  style={isCurrent ? { color: f.color } : undefined}
                >
                  <span
                    className={`w-2 h-2 rounded-full inline-block ${isCurrent ? 'animate-ping' : ''}`}
                    style={{ backgroundColor: f.color }}
                  />
                  <span>{f.short}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
