import React, { useEffect, useRef, useState, useCallback } from 'react';
import { CameraAngle, GameState, PrizeMetadata } from '../types';
import { sound } from '../utils/audio';
import { Eye, ArrowDownCircle, Compass, RotateCcw, Target, Sparkles, Navigation } from 'lucide-react';

interface ArcadeControlsProps {
  gameState: GameState;
  coins: number;
  cameraAngle: CameraAngle;
  onSetCameraAngle: (angle: CameraAngle) => void;
  onInputVector: (x: number, z: number) => void;
  onDrop: () => void;
  onInsertCoin: () => void;
  clawCoords?: { x: number; z: number; normX: number; normZ: number };
  lockedPrize?: PrizeMetadata | null;
}

export const ArcadeControls: React.FC<ArcadeControlsProps> = ({
  gameState,
  coins,
  cameraAngle,
  onSetCameraAngle,
  onInputVector,
  onDrop,
  onInsertCoin,
  clawCoords = { x: 0, z: 0, normX: 0, normZ: 0 },
  lockedPrize = null,
}) => {
  const [stickPos, setStickPos] = useState({ x: 0, y: 0 });
  const stickBaseRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  // Active keys tracking for keyboard control
  const keysPressed = useRef<{ [key: string]: boolean }>({});

  const updateKeyboardVector = useCallback(() => {
    let kx = 0;
    let kz = 0;
    if (keysPressed.current['ArrowLeft'] || keysPressed.current['a'] || keysPressed.current['A']) kx -= 1;
    if (keysPressed.current['ArrowRight'] || keysPressed.current['d'] || keysPressed.current['D']) kx += 1;
    if (keysPressed.current['ArrowUp'] || keysPressed.current['w'] || keysPressed.current['W']) kz -= 1;
    if (keysPressed.current['ArrowDown'] || keysPressed.current['s'] || keysPressed.current['S']) kz += 1;

    // Normalize diagonal
    if (kx !== 0 && kz !== 0) {
      kx *= 0.707;
      kz *= 0.707;
    }

    setStickPos({ x: kx * 32, y: kz * 32 });
    onInputVector(kx, kz);
  }, [onInputVector]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
      keysPressed.current[e.key] = true;
      if (e.code === 'Space') {
        if (gameState === 'IDLE' || gameState === 'MOVING') {
          onDrop();
        }
      } else {
        updateKeyboardVector();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key] = false;
      updateKeyboardVector();
    };

    const handleBlur = () => {
      keysPressed.current = {};
      updateKeyboardVector();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [gameState, onDrop, updateKeyboardVector]);

  // Touch / Mouse Joystick events
  const handlePointerDown = (e: React.PointerEvent) => {
    if (gameState !== 'IDLE' && gameState !== 'MOVING') return;
    isDraggingRef.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    handlePointerMove(e);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || !stickBaseRef.current) return;
    const rect = stickBaseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;
    const maxRadius = rect.width / 2 - 12;

    const dist = Math.sqrt(dx * dx + dy * dy);
    const clampedDist = Math.min(dist, maxRadius);
    const angle = Math.atan2(dy, dx);

    const nx = (Math.cos(angle) * clampedDist) / maxRadius;
    const ny = (Math.sin(angle) * clampedDist) / maxRadius;

    setStickPos({ x: Math.cos(angle) * clampedDist, y: Math.sin(angle) * clampedDist });
    onInputVector(nx, ny);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignored
    }
    setStickPos({ x: 0, y: 0 });
    onInputVector(0, 0);
  };

  const isBusy = gameState !== 'IDLE' && gameState !== 'MOVING';

  const cameraButtons: { id: CameraAngle; label: string; shortLabel: string; badge?: string }[] = [
    { id: 'ISOMETRIC', label: '45° 黄金立体', shortLabel: '45°', badge: '荐' },
    { id: 'FRONT', label: '正面全景', shortLabel: '正面' },
    { id: 'TOP_DOWN', label: '俯视对齐', shortLabel: '俯视' },
    { id: 'SIDE', label: '侧视进深', shortLabel: '侧面' },
    { id: 'CLOSE_UP', label: '爪斗特写', shortLabel: '特写' },
    { id: 'FREE', label: '360° 自由', shortLabel: '自由' },
  ];

  // Convert normalized [-1, 1] coords to radar percentage [5%, 95%]
  const radarXPercent = Math.max(8, Math.min(92, ((clawCoords.normX + 1) / 2) * 100));
  // In 3D: -Z is back, +Z is front
  const radarZPercent = Math.max(8, Math.min(92, ((clawCoords.normZ + 1) / 2) * 100));

  return (
    <div
      className="absolute left-2 right-2 sm:left-4 sm:right-4 flex flex-col gap-2 pointer-events-none z-20"
      style={{ bottom: 'var(--game-controls-bottom)' }}
    >
      {/* Top Banner: Targeting Lock Status or Rotation Hint */}
      <div className="flex items-center justify-between pointer-events-none px-1">
        {lockedPrize ? (
          <div className="pointer-events-auto flex min-w-0 items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-950/90 border border-emerald-500/70 shadow-lg shadow-emerald-900/40 text-emerald-200 text-[11px] sm:text-xs font-semibold backdrop-blur-md animate-pulse">
            <Target className="w-4 h-4 shrink-0 text-emerald-400" />
            <span className="hidden sm:inline">准心已精准对齐: </span>
            <span className="truncate text-white font-bold">{lockedPrize.name}</span>
            <span className="hidden sm:inline text-[10px] bg-emerald-500/30 px-2 py-0.5 rounded text-emerald-100">
              进深锁定 ★ 可直接下爪
            </span>
          </div>
        ) : (
          <div className="flex min-w-0 items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/75 border border-slate-700/50 backdrop-blur-md text-[11px] text-slate-300">
            <Navigation className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
            <span className="truncate"><span className="hidden sm:inline">提示: </span>滑动画面可旋转视角</span>
          </div>
        )}

        {/* Live Depth Coordinate Indicator */}
        <div className="hidden lg:flex items-center gap-3 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700/60 backdrop-blur-md text-[11px] text-slate-300 font-mono">
          <span className="text-slate-400">坐标:</span>
          <span>左右 X: <b className="text-cyan-300">{Math.round(radarXPercent)}%</b></span>
          <span className="text-slate-600">|</span>
          <span>前后进深 Z: <b className="text-amber-300">{Math.round(radarZPercent)}%</b></span>
        </div>
      </div>

      {/* Main Control Console Bar */}
      <div className="grid w-full min-w-0 grid-cols-[9.5rem_minmax(0,1fr)] gap-2 md:flex md:flex-row md:items-center md:justify-between md:gap-3 pointer-events-none">
        {/* Left: Joystick + 2D Top-Down Depth Radar Station */}
        <div className="pointer-events-auto col-start-1 row-start-2 bg-slate-900/90 backdrop-blur-md border border-slate-700/70 rounded-2xl p-2 sm:p-2.5 shadow-2xl flex items-center gap-2 sm:gap-3 md:order-none">
          {/* Virtual Joystick */}
          <div className="flex flex-col items-center">
            <div
              ref={stickBaseRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className={`relative w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-slate-950 border-2 border-amber-500/40 flex items-center justify-center cursor-grab active:cursor-grabbing touch-none select-none transition-shadow ${
                isBusy ? 'opacity-50 cursor-not-allowed' : 'hover:border-amber-400 shadow-inner'
              }`}
            >
              {/* Guide crosshairs */}
              <div className="absolute inset-x-2 top-1/2 h-[1px] bg-slate-800 -translate-y-1/2 pointer-events-none" />
              <div className="absolute inset-y-2 left-1/2 w-[1px] bg-slate-800 -translate-x-1/2 pointer-events-none" />

              {/* Joystick Ball Knob */}
              <div
                style={{
                  transform: `translate(${stickPos.x}px, ${stickPos.y}px)`,
                }}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 border-2 border-amber-200 shadow-lg flex items-center justify-center transition-transform duration-75"
              >
                <Compass className="w-4 h-4 sm:w-5 sm:h-5 text-amber-950" />
              </div>
            </div>
            <span className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 font-medium">
              <span className="sm:hidden">移动</span>
              <span className="hidden sm:inline">3D 摇杆 / WASD</span>
            </span>
          </div>

          {/* Top-Down Mini Depth Radar (Resolves 2D/3D depth ambiguity) */}
          <div className="flex flex-col items-center border-l border-slate-800 pl-2 sm:pl-2.5">
            <div className="relative w-13 h-13 sm:w-16 sm:h-16 bg-slate-950 border border-slate-700/80 rounded-xl overflow-hidden shadow-inner flex items-center justify-center">
              {/* Grid marks */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:10px_10px] opacity-40 pointer-events-none" />

              {/* Chute Corner (Front-Left) */}
              <div className="absolute bottom-0 left-0 w-4 h-4 sm:w-5 sm:h-5 bg-rose-500/30 border-t border-r border-rose-500/60 flex items-center justify-center">
                <span className="text-[7px] text-rose-300 font-bold leading-none">出口</span>
              </div>

              {/* Depth Axis labels */}
              <span className="absolute top-0.5 inset-x-0 text-center text-[7px] text-slate-500 font-mono">后(深)</span>
              <span className="absolute bottom-0.5 inset-x-0 text-center text-[7px] text-slate-500 font-mono">前</span>

              {/* Live Claw Position Blinking Dot & Crosshair */}
              <div
                style={{
                  left: `${radarXPercent}%`,
                  top: `${radarZPercent}%`,
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-75"
              >
                <div className={`w-3.5 h-3.5 rounded-full border ${lockedPrize ? 'border-emerald-400 bg-emerald-500/60 shadow-[0_0_8px_#10b981]' : 'border-cyan-400 bg-cyan-500/50 shadow-[0_0_8px_#06b6d4]'} flex items-center justify-center animate-ping`} />
                <div className={`absolute inset-0 w-2 h-2 -translate-x-1/4 -translate-y-1/4 rounded-full ${lockedPrize ? 'bg-emerald-300' : 'bg-cyan-300'}`} />
              </div>
            </div>
            <span className="text-[10px] text-cyan-400 mt-1 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="sm:hidden">进深</span>
              <span className="hidden sm:inline">进深雷达</span>
            </span>
          </div>

          {/* Directional Quick buttons */}
          <div className="hidden sm:grid grid-cols-3 gap-1 border-l border-slate-800 pl-3">
            <div />
            <button
              onPointerDown={() => onInputVector(0, -1)}
              onPointerUp={() => onInputVector(0, 0)}
              disabled={isBusy}
              className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-bold text-slate-300 flex items-center justify-center border border-slate-700"
            >
              ↑
            </button>
            <div />
            <button
              onPointerDown={() => onInputVector(-1, 0)}
              onPointerUp={() => onInputVector(0, 0)}
              disabled={isBusy}
              className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-bold text-slate-300 flex items-center justify-center border border-slate-700"
            >
              ←
            </button>
            <button
              onPointerDown={() => onInputVector(0, 1)}
              onPointerUp={() => onInputVector(0, 0)}
              disabled={isBusy}
              className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-bold text-slate-300 flex items-center justify-center border border-slate-700"
            >
              ↓
            </button>
            <button
              onPointerDown={() => onInputVector(1, 0)}
              onPointerUp={() => onInputVector(0, 0)}
              disabled={isBusy}
              className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-bold text-slate-300 flex items-center justify-center border border-slate-700"
            >
              →
            </button>
          </div>
        </div>

        {/* Center: Multi-angle Camera Switcher with 45° Isometric & 360 Free Rotation */}
        <div className="pointer-events-auto col-span-2 row-start-1 min-w-0 max-w-full overflow-x-auto bg-slate-900/90 backdrop-blur-md border border-slate-700/70 rounded-2xl px-1.5 py-1.5 sm:px-3 sm:py-2 shadow-2xl flex flex-nowrap items-center gap-1 sm:gap-1.5 justify-start md:w-auto md:flex-wrap md:justify-center md:overflow-visible">
          <div className="flex items-center gap-1 text-xs text-slate-400 mr-1 pl-1">
            <Eye className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden xl:inline font-medium">视角:</span>
          </div>
          {cameraButtons.map((btn) => (
            <button
              key={btn.id}
              onClick={() => {
                sound.playClick();
                onSetCameraAngle(btn.id);
              }}
              className={`relative min-h-10 shrink-0 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                cameraAngle === btn.id
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span className="sm:hidden">{btn.shortLabel}</span>
              <span className="hidden sm:inline">{btn.label}</span>
              {btn.badge && (
                <span className="text-[9px] bg-rose-600 text-white font-bold px-1 rounded-full leading-tight">
                  {btn.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Right: Big Illuminated Drop Arcade Button */}
        <div className="pointer-events-auto col-start-2 row-start-2 min-w-0 w-full self-center flex items-center justify-end">
          {coins <= 0 ? (
            <button
              onClick={() => {
                sound.playCoin();
                onInsertCoin();
              }}
              className="min-h-14 w-full max-w-36 justify-center px-2 sm:w-auto sm:max-w-none sm:px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs sm:text-sm shadow-xl flex items-center gap-2 transition-all transform active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="sm:hidden">免费投币</span>
              <span className="hidden sm:inline">投币续局 (免费获取 5 币)</span>
            </button>
          ) : (
            <button
              onClick={() => {
                if (!isBusy) {
                  onDrop();
                }
              }}
              disabled={isBusy}
              className={`group relative min-h-14 w-full max-w-36 justify-center px-2 sm:w-auto sm:max-w-none sm:px-8 py-3 sm:py-4 rounded-2xl font-black text-sm sm:text-base tracking-wide flex items-center gap-1.5 sm:gap-2 shadow-2xl transition-all transform active:scale-95 ${
                isBusy
                  ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                  : 'bg-gradient-to-b from-rose-500 via-rose-600 to-rose-700 hover:from-rose-400 hover:to-rose-600 text-white border-2 border-rose-300/40 shadow-rose-900/50 hover:shadow-rose-600/40'
              }`}
            >
              <ArrowDownCircle
                className={`w-6 h-6 transition-transform ${
                  !isBusy ? 'group-hover:translate-y-0.5' : ''
                }`}
              />
              <span className="sm:hidden">{isBusy ? '运作中' : '下爪'}</span>
              <span className="hidden sm:inline">{isBusy ? '抓斗运作中...' : '下 爪 (DROP)'}</span>
              <span className="text-xs bg-black/25 px-2 py-0.5 rounded-md font-mono text-rose-200 hidden sm:inline">
                SPACE
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
