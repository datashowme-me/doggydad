import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Volume2,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Star,
  Sparkles,
  Flame,
  Maximize2,
  Minimize2,
  Check,
} from 'lucide-react';
import { WordItem, UserSettings } from '../types';
import { soundManager } from '../utils/soundEffects';
import { isWordFavorited, toggleWordFavorite } from '../utils/notebookStorage';
import { wordkeyPixelFx } from '../utils/pixelFxEngine';

interface WordTypingBoardProps {
  currentWord: WordItem | null;
  prevWord: WordItem | null;
  nextWord: WordItem | null;
  settings: UserSettings;
  isPaused: boolean;
  streak?: number;
  isZenMode?: boolean;
  onToggleZenMode?: () => void;
  onWordComplete: (word: WordItem, mistakesCount: number) => void;
  onRecordKeystroke: (isCorrect: boolean) => void;
  onNavigatePrev: () => void;
  onNavigateNext: () => void;
  onToggleAccent: () => void;
  onSelectPrimaryDeck?: (deckId: string) => void;
  activeDeckId?: string;
}

export const WordTypingBoard: React.FC<WordTypingBoardProps> = ({
  currentWord,
  prevWord,
  nextWord,
  settings,
  isPaused,
  streak = 0,
  isZenMode = false,
  onToggleZenMode,
  onWordComplete,
  onRecordKeystroke,
  onNavigatePrev,
  onNavigateNext,
  onToggleAccent,
  onSelectPrimaryDeck,
  activeDeckId,
}) => {
  const [typedLetters, setTypedLetters] = useState<string>('');
  const [isError, setIsError] = useState<boolean>(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [isFavorited, setIsFavorited] = useState<boolean>(false);
  const [toastFeedback, setToastFeedback] = useState<string | null>(null);
  const mistakeCountRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync favorited state when word changes
  useEffect(() => {
    if (currentWord) {
      setIsFavorited(isWordFavorited(currentWord.word));
    } else {
      setIsFavorited(false);
    }
  }, [currentWord?.word]);

  // Preload next word's audio
  useEffect(() => {
    if (nextWord) {
      soundManager.preloadWords([nextWord.word], settings.accent);
    }
  }, [nextWord?.word, settings.accent]);

  // Play audio helper with audioRate and audioRepeat settings
  const playCurrentWordAudio = useCallback(async () => {
    if (!currentWord) return;
    setIsPlayingAudio(true);
    await soundManager.playPronunciation(currentWord.word, settings.accent, {
      rate: settings.audioRate,
      repeat: settings.audioRepeat,
    });
    setIsPlayingAudio(false);
  }, [currentWord, settings.accent, settings.audioRate, settings.audioRepeat]);

  // Toggle favorite bookmark with toast feedback
  const handleToggleFavorite = useCallback(() => {
    if (!currentWord) return;
    const newState = toggleWordFavorite(currentWord);
    setIsFavorited(newState);

    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastFeedback(newState ? '★ 已加入生词本 (Ctrl+B)' : '已从生词本移出');
    toastTimerRef.current = setTimeout(() => {
      setToastFeedback(null);
    }, 1500);
  }, [currentWord]);

  const handleBackspace = useCallback(() => {
    if (typedLetters.length > 0) {
      setTypedLetters((prev) => prev.slice(0, -1));
      setIsError(false);
      wordkeyPixelFx.triggerHaptic('tap');
    }
  }, [typedLetters]);

  const handleInputChar = useCallback(
    (pressedKey: string) => {
      if (!currentWord || isPaused) return;

      const targetWord = currentWord.word.trim().toLowerCase();
      const expectedIndex = typedLetters.length;
      const expectedLetter = targetWord[expectedIndex];
      const keyLower = pressedKey.toLowerCase();

      const boardRect = containerRef.current?.getBoundingClientRect();
      const cx = boardRect ? boardRect.left + boardRect.width / 2 : window.innerWidth / 2;
      const cy = boardRect ? boardRect.top + boardRect.height * 0.42 : window.innerHeight * 0.42;

      if (keyLower === expectedLetter) {
        const nextTyped = typedLetters + keyLower;
        setTypedLetters(nextTyped);
        setIsError(false);
        onRecordKeystroke(true);
        wordkeyPixelFx.triggerHaptic('tap');
        wordkeyPixelFx.triggerHitSpark(cx, cy);

        if (settings.keySound) {
          soundManager.playKeyClick();
        }

        if (nextTyped.length === targetWord.length) {
          if (settings.keySound) {
            soundManager.playSuccessSound();
          }
          wordkeyPixelFx.triggerHaptic('success');
          wordkeyPixelFx.triggerCollectBurst(cx, cy);
          wordkeyPixelFx.triggerCritNumber(cx, cy - 35, '+10 PERFECT');
          if (streak + 1 >= 5 && (streak + 1) % 5 === 0) {
            wordkeyPixelFx.triggerCombo(cx, cy - 65, streak + 1);
            wordkeyPixelFx.triggerHaptic('combo');
          }
          onWordComplete(currentWord, mistakeCountRef.current);
        }
      } else {
        setIsError(true);
        mistakeCountRef.current += 1;
        onRecordKeystroke(false);
        wordkeyPixelFx.triggerHaptic('error');
        wordkeyPixelFx.triggerShieldBlock(cx, cy);

        if (settings.keySound) {
          soundManager.playErrorSound();
        }

        setTimeout(() => {
          setIsError(false);
        }, 300);
      }
    },
    [currentWord, isPaused, typedLetters, onRecordKeystroke, onWordComplete, settings.keySound, streak]
  );

  // When current word changes: reset typing state & auto-play if enabled
  useEffect(() => {
    setTypedLetters('');
    setIsError(false);
    mistakeCountRef.current = 0;

    if (currentWord && settings.autoPlayAudio && !isPaused) {
      playCurrentWordAudio();
    }
  }, [currentWord?.id, settings.autoPlayAudio, isPaused]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      if (!currentWord || isPaused) return;

      const targetWord = currentWord.word.trim().toLowerCase();
      const expectedIndex = typedLetters.length;
      const expectedLetter = targetWord[expectedIndex];

      // Preserve Tab focus navigation for keyboard accessibility.
      if (e.key === 'Tab') {
        return;
      }

      // Enter: Skip / force advance
      if (e.key === 'Enter') {
        e.preventDefault();
        onNavigateNext();
        return;
      }

      // Arrow keys for navigation
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onNavigatePrev();
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        onNavigateNext();
        return;
      }

      // Backspace: delete last typed letter
      if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
        return;
      }

      // Ctrl+B / Cmd+B: toggle bookmark
      if ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        handleToggleFavorite();
        return;
      }

      // Shift key alone: toggle accent
      if (e.key === 'Shift') {
        return;
      }

      // Ignore other modifier combos
      if (e.ctrlKey || e.metaKey || e.altKey) {
        return;
      }

      const isSpaceKey = e.code === 'Space' || e.key === ' ' || e.key === 'Spacebar';

      if (isSpaceKey) {
        if (expectedLetter !== ' ' && !targetWord.includes(' ')) {
          e.preventDefault();
          playCurrentWordAudio();
          return;
        }
      }

      // Character typing: handles letters, spaces, hyphens, and apostrophes
      if (isSpaceKey || e.key.length === 1) {
        e.preventDefault();
        handleInputChar(isSpaceKey ? ' ' : e.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    currentWord,
    typedLetters,
    isPaused,
    handleInputChar,
    handleBackspace,
    onNavigateNext,
    onNavigatePrev,
    playCurrentWordAudio,
    handleToggleFavorite,
  ]);

  if (!currentWord) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
        <BookOpen className="w-12 h-12 mb-3 text-slate-300 dark:text-slate-600 animate-pulse" />
        <p className="text-lg font-medium text-slate-600 dark:text-slate-300">暂无单词数据</p>
        <p className="text-sm mt-1">请在上方输入文章链接解析单词，或选择示例文章开始练习</p>
      </div>
    );
  }

  const targetWord = currentWord.word.toLowerCase();
  const phoneticDisplay =
    settings.accent === 'us'
      ? `AmE: ${currentWord.phoneticAmE || `[${targetWord}]`}`
      : `BrE: ${currentWord.phoneticBrE || `[${targetWord}]`}`;

  // Calculate progress within current word
  const wordProgressPct = Math.round((typedLetters.length / targetWord.length) * 100);

  const candidateLetters = useMemo(() => {
    if (!currentWord) return [];
    const wordChars = Array.from(new Set(currentWord.word.toLowerCase().split('')));
    const common = ['a', 'e', 'i', 'o', 'u', 's', 't', 'r', 'n', 'l', 'd', 'c'].filter(
      (c) => !wordChars.includes(c)
    );
    const pool = [...wordChars, ...common.slice(0, Math.max(0, 10 - wordChars.length))].sort();
    return pool;
  }, [currentWord?.word]);

  // Render article sentence with the current word highlighted
  const renderContextSentence = () => {
    if (!currentWord.sentence) return null;
    const parts = currentWord.sentence.split(new RegExp(`(${currentWord.word})`, 'gi'));
    return (
      <div className="mt-5 px-5 py-3.5 max-w-xl text-center rounded-2xl bg-white/70 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 text-xs sm:text-sm leading-relaxed backdrop-blur-md shadow-xs transition-all">
        <p className="italic">
          &ldquo;
          {parts.map((part, i) =>
            part.toLowerCase() === targetWord ? (
              <span
                key={i}
                className="font-bold text-indigo-600 dark:text-indigo-400 underline decoration-indigo-400/50 dark:decoration-indigo-500/50 decoration-2 underline-offset-4 not-italic"
              >
                {part}
              </span>
            ) : (
              part
            )
          )}
          &rdquo;
        </p>
        {currentWord.sentenceTranslation && (
          <p className="mt-1.5 text-slate-400 dark:text-slate-400 text-xs font-normal not-italic">
            {currentWord.sentenceTranslation}
          </p>
        )}
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 w-full max-w-6xl mx-auto flex flex-col items-center justify-center px-4 relative select-none"
    >
      {/* Quick primary curriculum deck pills */}
      {!isZenMode && onSelectPrimaryDeck && (
        <div className="w-full max-w-4xl mx-auto mb-2 flex items-center justify-center gap-1.5 flex-wrap px-2">
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1 mr-1">
            🎒 小学教材一键切换:
          </span>
          {[
            { id: 'oxford-primary-g12', label: '牛津1-2年级' },
            { id: 'oxford-primary-g34', label: '牛津3-4年级' },
            { id: 'oxford-primary-g56', label: '牛津5-6年级' },
            { id: 'pep-primary-g3', label: 'PEP三年级' },
            { id: 'pep-primary-g4', label: 'PEP四年级' },
            { id: 'pep-primary-g5', label: 'PEP五年级' },
            { id: 'pep-primary-g6', label: 'PEP六年级' },
          ].map((deck) => (
            <button
              key={deck.id}
              type="button"
              onClick={() => onSelectPrimaryDeck(deck.id)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                activeDeckId === deck.id
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs scale-105'
                  : 'bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400 hover:text-indigo-600'
              }`}
            >
              {deck.label}
            </button>
          ))}
        </div>
      )}

      <label className="mb-4 w-full max-w-sm text-xs text-slate-500">
        点击输入框开始练习（支持手机键盘）
        <input
          aria-label="练习单词输入"
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white dark:bg-slate-800 px-3 py-2 text-base"
          type="text" value={typedLetters} disabled={isPaused}
          autoComplete="off" autoCapitalize="none" spellCheck={false} autoCorrect="off"
          onChange={(event) => {
            if (event.nativeEvent instanceof InputEvent && event.nativeEvent.isComposing) return;
            const value = event.target.value.toLowerCase();
            const key = value.length < typedLetters.length ? 'Backspace'
              : value.startsWith(typedLetters) && value.length === typedLetters.length + 1 ? value.slice(-1) : '';
            if (key) window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
          }}
        />
      </label>
      {/* Toast feedback for bookmarking */}
      {toastFeedback && (
        <div className="fixed top-20 z-50 px-4 py-2 rounded-full bg-slate-900/90 dark:bg-white/90 text-white dark:text-slate-900 text-xs font-medium shadow-xl backdrop-blur-md animate-pop flex items-center gap-1.5 border border-white/10 dark:border-slate-800/10">
          <Check className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
          <span>{toastFeedback}</span>
        </div>
      )}

      {/* Floating Zen Mode exit button when in Zen Mode */}
      {isZenMode && onToggleZenMode && (
        <button
          onClick={onToggleZenMode}
          className="fixed top-4 right-5 z-40 px-3.5 py-1.5 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-700/80 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
          title="退出沉浸专注模式 (快捷键: Alt + Z 或 Esc)"
        >
          <Minimize2 className="w-3.5 h-3.5" />
          <span>退出专注 (Esc)</span>
        </button>
      )}

      {/* 3-Column Qwerty Learner Display */}
      <div className="w-full grid grid-cols-1 md:grid-cols-5 items-center gap-4 my-auto py-6">
        {/* Left Column: Previous Word */}
        <div
          onClick={prevWord ? onNavigatePrev : undefined}
          className={`hidden md:flex flex-col items-start col-span-1 pl-4 transition-all duration-200 ${
            prevWord
              ? 'opacity-40 hover:opacity-80 cursor-pointer group'
              : 'opacity-0 pointer-events-none'
          }`}
        >
          <div className="flex items-center gap-1.5 font-mono-code text-lg text-slate-600 dark:text-slate-300 tracking-wide group-hover:-translate-x-1 transition-transform">
            <ChevronLeft className="w-4 h-4 text-slate-400" />
            <span className="font-medium">{prevWord?.word}</span>
          </div>
          {prevWord && settings.showMeaning && (
            <div className="text-xs text-slate-400 dark:text-slate-400 mt-1 line-clamp-2 pl-5">
              {prevWord.meaning}
            </div>
          )}
        </div>

        {/* Center Column: Active Typing Word */}
        <div className="col-span-1 md:col-span-3 flex flex-col items-center justify-center text-center px-2">
          {/* Streak Flame Badge */}
          {streak >= 2 && (
            <div className="mb-3 inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/10 dark:bg-amber-400/10 border border-amber-400/30 text-amber-600 dark:text-amber-400 text-xs font-mono-code font-bold tracking-wide animate-pop shadow-xs">
              <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500 animate-streak-glow" />
              <span>{streak} 连击 COMBO</span>
            </div>
          )}

          {/* Main Word Container */}
          <div
            className={`flex items-center justify-center gap-3 sm:gap-4 transition-transform duration-150 ${
              isError ? 'animate-shake' : ''
            }`}
          >
            {/* Spaced Letters */}
            <div className="flex items-center justify-center font-mono-code font-bold tracking-widest text-4xl sm:text-6xl text-slate-700 dark:text-slate-200 flex-wrap">
              {targetWord.split('').map((letter, idx) => {
                const isTyped = idx < typedLetters.length;
                const isCurrentCursor = idx === typedLetters.length;
                const isSpace = letter === ' ';

                // Dictation mode: mask untyped letters, but keep spaces clear
                const displayChar = isSpace
                  ? '␣'
                  : settings.dictationMode
                  ? isTyped
                    ? letter
                    : '_'
                  : letter;

                return (
                  <span
                    key={idx}
                    className={`inline-block mx-1 sm:mx-1.5 transition-colors duration-150 relative ${
                      isSpace ? 'min-w-[1.2ch] px-0.5' : ''
                    } ${
                      isTyped
                        ? 'text-indigo-600 dark:text-indigo-400'
                        : isCurrentCursor
                        ? isError
                          ? 'text-rose-500 scale-110'
                          : isSpace
                          ? 'text-indigo-500 dark:text-indigo-400 animate-pulse font-normal'
                          : 'text-slate-800 dark:text-slate-100'
                        : isSpace
                        ? 'text-slate-300 dark:text-slate-600 font-normal'
                        : 'text-slate-400/80 dark:text-slate-500/80'
                    }`}
                    title={isSpace ? '空格符 (按 Space 键输入)' : undefined}
                  >
                    {displayChar}
                    {/* Active blinking cursor underline */}
                    {isCurrentCursor && !isPaused && (
                      <span className="absolute -bottom-1.5 left-0 right-0 h-1 bg-indigo-500 dark:bg-indigo-400 rounded-full animate-cursor shadow-xs" />
                    )}
                  </span>
                );
              })}
            </div>

            {/* Pronunciation & Bookmark Actions */}
            <div className="flex items-center gap-1">
              <button
                onClick={playCurrentWordAudio}
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  isPlayingAudio
                    ? 'text-indigo-600 dark:text-indigo-400 scale-110 bg-indigo-50 dark:bg-indigo-950/50 ring-2 ring-indigo-500/20'
                    : 'text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title="播放单词发音（非词组时也可按空格）"
              >
                <Volume2 className={`w-6 h-6 sm:w-7 sm:h-7 ${isPlayingAudio ? 'animate-pulse' : ''}`} />
              </button>

              <button
                onClick={handleToggleFavorite}
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  isFavorited
                    ? 'text-amber-500 hover:text-amber-600 bg-amber-50/70 dark:bg-amber-950/40 ring-1 ring-amber-400/30'
                    : 'text-slate-300 dark:text-slate-600 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title={isFavorited ? '已收录进生词本 (点击取消，快捷键: Ctrl+B)' : '加入生词本收藏 (快捷键: Ctrl+B)'}
              >
                <Star className={`w-5 h-5 sm:w-6 sm:h-6 ${isFavorited ? 'fill-amber-500' : ''}`} />
              </button>
            </div>
          </div>

          {/* Helper badge when current cursor is expecting a space */}
          {targetWord[typedLetters.length] === ' ' && !isPaused && (
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-300 text-xs font-semibold animate-pulse shadow-xs">
              <span>此处为词组空格：请按键盘</span>
              <kbd className="px-1.5 py-0.5 text-[11px] font-mono-code font-bold rounded bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700 shadow-2xs">
                Space 空格键
              </kbd>
            </div>
          )}

          {/* Phonetic Pronunciation (AmE / BrE) */}
          {settings.showPhonetic && (
            <div className="mt-3 flex items-center justify-center">
              <button
                type="button"
                onClick={onToggleAccent}
                className="group inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-mono-code transition-colors cursor-pointer border border-slate-200/50 dark:border-slate-700/50"
                title="点击在美音和英音之间切换 (快捷键: Shift)"
              >
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                  {settings.accent === 'us' ? 'AmE' : 'BrE'}
                </span>
                <span className="tracking-wide">
                  {settings.accent === 'us'
                    ? currentWord.phoneticAmE || `[${targetWord}]`
                    : currentWord.phoneticBrE || `[${targetWord}]`}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300">
                  (Shift)
                </span>
              </button>
            </div>
          )}

          {/* Chinese Definition (中文注释 / 释义) */}
          {settings.showMeaning && (
            <div className="mt-3 max-w-xl flex flex-wrap items-center justify-center gap-1.5 text-center">
              {(() => {
                const text = currentWord.meaning || '';
                const posMatch = text.match(/^([a-z]+(\.[a-z]+)*\.)\s*(.*)$/i);
                if (posMatch) {
                  const pos = posMatch[1];
                  const rest = posMatch[3];
                  return (
                    <div className="flex items-center justify-center flex-wrap gap-1.5">
                      <span className="px-2 py-0.5 text-xs font-bold font-mono-code rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        {pos}
                      </span>
                      <span className="text-base sm:text-lg font-medium text-slate-800 dark:text-slate-100 tracking-wide">
                        {rest}
                      </span>
                    </div>
                  );
                }
                return (
                  <div className="text-base sm:text-lg font-medium text-slate-800 dark:text-slate-100 tracking-wide">
                    {text}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Dictation Mode Hint */}
          {settings.dictationMode && (
            <div className="mt-2 text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
              💡 默写模式已开启：根据发音与释义在键盘上盲打拼写
            </div>
          )}

          {/* Progress Bar under active word (Screenshot style) */}
          <div className="w-56 sm:w-72 h-1.5 bg-slate-200/80 dark:bg-slate-700/80 rounded-full mt-6 overflow-hidden shadow-inner">
            <div
              className="h-full bg-indigo-500 dark:bg-indigo-400 rounded-full transition-all duration-150 ease-out"
              style={{ width: `${wordProgressPct}%` }}
            />
          </div>

          {/* Context Sentence from the original Article */}
          {renderContextSentence()}

          {/* Mobile & Tablet Interactive Letter Bubbles (解决平板和触屏打字障碍) */}
          <div className="mt-5 w-full max-w-lg px-2 flex flex-col items-center">
            <span className="text-[11px] text-slate-400 dark:text-slate-500 mb-2 flex items-center gap-1 select-none">
              👆 点按字母气泡或敲击键盘键入：
            </span>
            <div className="flex items-center justify-center gap-1.5 flex-wrap">
              {candidateLetters.map((char, cIdx) => (
                <button
                  key={cIdx}
                  type="button"
                  onClick={() => handleInputChar(char)}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 text-slate-700 dark:text-slate-200 font-mono-code font-bold text-sm sm:text-base active:scale-90 transition-all shadow-xs flex items-center justify-center cursor-pointer select-none"
                >
                  {char === ' ' ? '␣' : char}
                </button>
              ))}
              <button
                type="button"
                onClick={handleBackspace}
                disabled={typedLetters.length === 0}
                className="px-2.5 h-9 sm:h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-mono-code text-xs active:scale-90 transition-all flex items-center justify-center cursor-pointer disabled:opacity-30"
                title="删除上一个字母"
              >
                ⌫ 退格
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Next Word (Screenshot layout) */}
        <div
          onClick={nextWord ? onNavigateNext : undefined}
          className={`hidden md:flex flex-col items-end col-span-1 pr-4 text-right transition-all duration-200 ${
            nextWord
              ? 'opacity-40 hover:opacity-80 cursor-pointer group'
              : 'opacity-0 pointer-events-none'
          }`}
        >
          <div className="flex items-center gap-1.5 font-mono-code text-xl text-slate-600 dark:text-slate-300 tracking-wide group-hover:translate-x-1 transition-transform">
            <span className="font-medium">{nextWord?.word}</span>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </div>
          {nextWord && settings.showMeaning && (
            <div className="text-xs text-slate-400 dark:text-slate-400 mt-1 line-clamp-2 pr-6">
              {nextWord.meaning}
            </div>
          )}
        </div>
      </div>

      {/* Paused Overlay */}
      {isPaused && (
        <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-xs flex items-center justify-center rounded-2xl z-10">
          <div className="bg-white dark:bg-slate-800 px-6 py-4 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 text-center">
            <p className="text-base font-semibold text-slate-800 dark:text-slate-100">已暂停练习</p>
            <p className="text-xs text-slate-400 mt-1">按 ESC 键或点击右上角 Resume 继续</p>
          </div>
        </div>
      )}
    </div>
  );
};
