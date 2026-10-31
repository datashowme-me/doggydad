/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Header } from './components/Header';
import { WordTypingBoard } from './components/WordTypingBoard';
import { StatsFooter } from './components/StatsFooter';
import { ArticleImportModal } from './components/ArticleImportModal';
import { SettingsModal } from './components/SettingsModal';
import { ShortcutsModal } from './components/ShortcutsModal';
import { CompletionModal } from './components/CompletionModal';
import { TaskMilestoneModal } from './components/TaskMilestoneModal';
import { TrendModal } from './components/TrendModal';
import { NotebookModal } from './components/NotebookModal';
import { BadgesModal, BadgeItem } from './components/BadgesModal';
import { A4WorksheetModal } from './components/A4WorksheetModal';
import { WordItem, NotebookWordItem, UserSettings, TypingStats, TaskProgressPoint } from './types';
import { SAMPLE_ARTICLES, PRIMARY_CURRICULUM_ARTICLES } from './data/fallbackData';
import { loadOfficialDictionary } from './utils/dictionaryLoader';
import {
  getNotebookWords,
  recordWordMistake,
  recordWordSuccess,
} from './utils/notebookStorage';
import { wordkeyPixelFx } from './utils/pixelFxEngine';

const DEFAULT_BADGES: BadgeItem[] = [
  { id: 'first_word', name: '第一步踏出', desc: '在 WordKey 完成首个英文单词默写', icon: '🎯', unlocked: false },
  { id: 'combo_10', name: '连击大师', desc: '默写拼读达成 10 连击 COMBO', icon: '🔥', unlocked: false },
  { id: 'oxford_star', name: '牛津学霸', desc: '通关牛津版小学起步或进阶核心词库', icon: '🌟', unlocked: false },
  { id: 'pep_master', name: '人教先锋', desc: '通关统编人教版小学教材核心词库', icon: '📘', unlocked: false },
  { id: 'speed_rush', name: '闪电极速', desc: '单次练习打字速度突破 45 WPM', icon: '⚡', unlocked: false },
  { id: 'notebook_hero', name: '生词克星', desc: '将生词本中的生词成功强化攻克', icon: '🛡️', unlocked: false },
  { id: 'task_complete', name: '任务达人', desc: '完成整组 20 词小任务闯关', icon: '🏆', unlocked: false },
  { id: 'vocab_master', name: '博学之星', desc: '在 WordKey 累计练习超过 60 个单词', icon: '👑', unlocked: false },
];

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isBadgesOpen, setIsBadgesOpen] = useState<boolean>(false);
  const [isWorksheetOpen, setIsWorksheetOpen] = useState<boolean>(false);
  const [activeDeckId, setActiveDeckId] = useState<string>('oxford-primary-g12');

  const [badges, setBadges] = useState<BadgeItem[]>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('wordkey_badges') : null;
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (_) {}
    }
    return DEFAULT_BADGES;
  });

  // Initialize with the Oxford sample (matching user's screenshot)
  const defaultArticle = SAMPLE_ARTICLES[0];
  const [allWords, setAllWords] = useState<WordItem[]>(defaultArticle.words);
  const [articleTitle, setArticleTitle] = useState<string>(defaultArticle.title);

  // Notebook and Practice state
  const [isNotebookOpen, setIsNotebookOpen] = useState<boolean>(false);
  const [notebookCount, setNotebookCount] = useState<number>(() => getNotebookWords().length);
  const [isNotebookPractice, setIsNotebookPractice] = useState<boolean>(false);
  const originalArticleBackup = useRef<{
    words: WordItem[];
    title: string;
    taskIndex: number;
    wordIndex: number;
  } | null>(null);

  // Progress history for accuracy trend visualization
  const [taskProgressHistory, setTaskProgressHistory] = useState<TaskProgressPoint[]>([]);
  const [sessionProgressHistory, setSessionProgressHistory] = useState<TaskProgressPoint[]>([]);

  // User Settings
  const [settings, setSettings] = useState<UserSettings>(() => {
    return {
      accent: 'us', // 美音 (AmE) by default like screenshot
      dictationMode: false,
      autoPlayAudio: true,
      audioRate: 1.0, // 默认标准语速
      audioRepeat: 1, // 默认播放 1 次
      keySound: true,
      showMeaning: true,
      showPhonetic: true,
      wordFilter: 'all',
      theme: 'light',
      taskSize: 20, // 默认每组 20 词小任务
    };
  });

  const taskSize = settings.taskSize || 20;

  // Task & chapter pagination state
  const [currentTaskIndex, setCurrentTaskIndex] = useState<number>(0);
  const [taskWordIndex, setTaskWordIndex] = useState<number>(1); // Match screenshot on word 2 "clothes"

  // Modals state
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isTaskMilestoneOpen, setIsTaskMilestoneOpen] = useState<boolean>(false);
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const [isImportOpen, setIsImportOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);
  const [isTrendModalOpen, setIsTrendModalOpen] = useState<boolean>(false);
  const [isZenMode, setIsZenMode] = useState<boolean>(false);

  // Mistaken words
  const [allMistakenWords, setAllMistakenWords] = useState<WordItem[]>([]);
  const [taskMistakes, setTaskMistakes] = useState<WordItem[]>([]);

  // Task calculation
  const totalTasks = useMemo(() => {
    return Math.max(1, Math.ceil(allWords.length / taskSize));
  }, [allWords.length, taskSize]);

  // Current task words slice (e.g. 20 words)
  const currentTaskWords = useMemo(() => {
    const start = currentTaskIndex * taskSize;
    const end = start + taskSize;
    return allWords.slice(start, end);
  }, [allWords, currentTaskIndex, taskSize]);

  // Typing Statistics
  const [stats, setStats] = useState<TypingStats>({
    elapsedSeconds: 0,
    totalKeystrokes: 0,
    correctKeystrokes: 0,
    wrongKeystrokes: 0,
    correctWords: 0,
    wrongWords: 0,
    wpm: 0,
    accuracy: 100,
    streak: 0,
    maxStreak: 0,
  });

  // Sync notebook count with storage
  useEffect(() => {
    const handleStorageUpdate = () => {
      setNotebookCount(getNotebookWords().length);
    };
    window.addEventListener('wordkey_notebook_updated', handleStorageUpdate);
    return () => window.removeEventListener('wordkey_notebook_updated', handleStorageUpdate);
  }, []);

  // Sync theme with document element
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  // Load the full authentic Oxford 5000 dictionary (5,836 words) on initial mount
  useEffect(() => {
    loadOfficialDictionary('oxford5000')
      .then((data) => {
        if (data && data.words && data.words.length > 0) {
          setAllWords(data.words);
          setArticleTitle(data.title || '牛津 5000 核心词库 (完整版)');
          setCurrentTaskIndex(0);
          setTaskWordIndex(0);
        }
      })
      .catch((err) => {
        console.warn('Failed to load Oxford5000 on mount:', err);
      });
  }, []);

  // Global key for Pause (Escape) or Shift (toggle accent)
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      // Don't intercept when inside modal or inputs
      if (
        isImportOpen ||
        isSettingsOpen ||
        isShortcutsOpen ||
        isComplete ||
        isTaskMilestoneOpen
      ) {
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        if (isZenMode) {
          setIsZenMode(false);
        } else {
          setIsPaused((prev) => !prev);
        }
      } else if ((e.altKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        setIsZenMode((prev) => !prev);
      } else if (e.key === 'Shift' && !e.repeat) {
        // Toggle accent between AmE and BrE
        setSettings((prev) => ({
          ...prev,
          accent: prev.accent === 'us' ? 'uk' : 'us',
        }));
      }
    };

    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [
    isImportOpen,
    isSettingsOpen,
    isShortcutsOpen,
    isComplete,
    isTaskMilestoneOpen,
    isZenMode,
  ]);

  // Timer loop
  useEffect(() => {
    if (isPaused || isComplete || isTaskMilestoneOpen) return;

    const interval = setInterval(() => {
      setStats((prev) => {
        const nextSeconds = prev.elapsedSeconds + 1;
        const minutes = nextSeconds / 60;
        const wpm = minutes > 0 ? Math.round(prev.correctKeystrokes / 5 / minutes) : 0;
        const total = prev.correctKeystrokes + prev.wrongKeystrokes;
        const accuracy = total > 0 ? Math.round((prev.correctKeystrokes / total) * 100) : 100;

        return {
          ...prev,
          elapsedSeconds: nextSeconds,
          wpm: Math.max(0, wpm),
          accuracy: Math.min(100, Math.max(0, accuracy)),
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, isComplete, isTaskMilestoneOpen]);

  // Keystroke recording
  const handleRecordKeystroke = useCallback((isCorrect: boolean) => {
    setStats((prev) => {
      const nextTotal = prev.totalKeystrokes + 1;
      const nextCorrect = prev.correctKeystrokes + (isCorrect ? 1 : 0);
      const nextWrong = prev.wrongKeystrokes + (isCorrect ? 0 : 1);
      const accuracy = nextTotal > 0 ? Math.round((nextCorrect / nextTotal) * 100) : 100;
      const minutes = Math.max(prev.elapsedSeconds, 1) / 60;
      const wpm = Math.round(nextCorrect / 5 / minutes);

      return {
        ...prev,
        totalKeystrokes: nextTotal,
        correctKeystrokes: nextCorrect,
        wrongKeystrokes: nextWrong,
        accuracy,
        wpm,
      };
    });
  }, []);

  useEffect(() => {
    if (canvasRef.current) {
      wordkeyPixelFx.init(canvasRef.current);
    }
  }, []);

  const unlockBadge = useCallback((badgeId: string) => {
    setBadges((prev) => {
      const target = prev.find((b) => b.id === badgeId);
      if (!target || target.unlocked) return prev;
      wordkeyPixelFx.triggerAchievement();
      wordkeyPixelFx.triggerConfetti();
      const updated = prev.map((b) =>
        b.id === badgeId ? { ...b, unlocked: true, unlockedAt: new Date().toLocaleDateString('zh-CN') } : b
      );
      try {
        localStorage.setItem('wordkey_badges', JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });
  }, []);

  const handleSelectPrimaryDeck = useCallback((deckId: string) => {
    const deck = PRIMARY_CURRICULUM_ARTICLES.find((d) => d.id === deckId);
    if (!deck) return;
    setActiveDeckId(deckId);
    setAllWords(deck.words);
    setArticleTitle(deck.title);
    setCurrentTaskIndex(0);
    setTaskWordIndex(0);
    setAllMistakenWords([]);
    setTaskMistakes([]);
    setTaskProgressHistory([]);
    setSessionProgressHistory([]);
    setIsComplete(false);
    setIsTaskMilestoneOpen(false);
    setStats({
      elapsedSeconds: 0,
      totalKeystrokes: 0,
      correctKeystrokes: 0,
      wrongKeystrokes: 0,
      correctWords: 0,
      wrongWords: 0,
      wpm: 0,
      accuracy: 100,
    });
    wordkeyPixelFx.triggerLevelUp();
  }, []);

  // Single Word Completed within current task
  const handleWordComplete = useCallback(
    (completedWord: WordItem, mistakesCount: number) => {
      unlockBadge('first_word');
      if (mistakesCount === 0 && isNotebookPractice) {
        unlockBadge('notebook_hero');
      }

      if (mistakesCount > 0) {
        // Automatically persist mistake to local notebook
        recordWordMistake(completedWord);

        setAllMistakenWords((prev) => {
          if (!prev.some((w) => w.id === completedWord.id)) {
            return [...prev, completedWord];
          }
          return prev;
        });
        setTaskMistakes((prev) => {
          if (!prev.some((w) => w.id === completedWord.id)) {
            return [...prev, completedWord];
          }
          return prev;
        });
      } else {
        // Correct completion without mistakes
        recordWordSuccess(completedWord.id, isNotebookPractice);
      }

      setStats((prev) => {
        const nextCorrectWords = prev.correctWords + 1;
        const currentAcc = prev.accuracy;
        const currentWpm = prev.wpm;
        const wordTotal = completedWord.word.length + mistakesCount;
        const wordAcc = wordTotal > 0 ? Math.round((completedWord.word.length / wordTotal) * 100) : 100;

        const newPoint: TaskProgressPoint = {
          index: taskWordIndex + 1,
          word: completedWord.word,
          cumulativeAccuracy: currentAcc,
          wordAccuracy: wordAcc,
          wpm: currentWpm,
          mistakes: mistakesCount,
        };

        setTaskProgressHistory((th) => [...th, newPoint]);
        setSessionProgressHistory((sh) => [...sh, newPoint]);

        const nextStreak = mistakesCount === 0 ? (prev.streak || 0) + 1 : 0;
        const nextMaxStreak = Math.max(prev.maxStreak || 0, nextStreak);

        if (nextStreak >= 10) {
          unlockBadge('combo_10');
        }
        if (nextCorrectWords >= 60) {
          unlockBadge('vocab_master');
        }
        if (currentWpm >= 45) {
          unlockBadge('speed_rush');
        }

        return {
          ...prev,
          correctWords: nextCorrectWords,
          streak: nextStreak,
          maxStreak: nextMaxStreak,
        };
      });

      // Check if current task is done
      if (taskWordIndex + 1 < currentTaskWords.length) {
        setTaskWordIndex((prev) => prev + 1);
      } else {
        // Current 20-word task completed!
        wordkeyPixelFx.triggerLevelUp();
        wordkeyPixelFx.triggerConfetti();
        unlockBadge('task_complete');
        if (articleTitle.includes('牛津')) unlockBadge('oxford_star');
        if (articleTitle.includes('PEP') || articleTitle.includes('人教')) unlockBadge('pep_master');

        if (currentTaskIndex + 1 < totalTasks) {
          setIsTaskMilestoneOpen(true);
        } else {
          // All tasks in the entire article completed!
          setIsComplete(true);
        }
      }
    },
    [taskWordIndex, currentTaskWords.length, currentTaskIndex, totalTasks, isNotebookPractice, unlockBadge, articleTitle]
  );

  // Navigation within current task
  const handleNavigatePrev = () => {
    if (taskWordIndex > 0) {
      setTaskWordIndex((prev) => prev - 1);
    }
  };

  const handleNavigateNext = () => {
    if (taskWordIndex + 1 < currentTaskWords.length) {
      setTaskWordIndex((prev) => prev + 1);
    } else {
      if (currentTaskIndex + 1 < totalTasks) {
        setIsTaskMilestoneOpen(true);
      } else {
        setIsComplete(true);
      }
    }
  };

  // Jump to specific task group (e.g. 第 2 组)
  const handleSelectTask = (taskIdx: number) => {
    if (taskIdx >= 0 && taskIdx < totalTasks) {
      setCurrentTaskIndex(taskIdx);
      setTaskWordIndex(0);
      setTaskMistakes([]);
      setTaskProgressHistory([]);
      setIsTaskMilestoneOpen(false);
    }
  };

  // Move to next task group
  const handleNextTask = () => {
    setIsTaskMilestoneOpen(false);
    if (currentTaskIndex + 1 < totalTasks) {
      setCurrentTaskIndex((prev) => prev + 1);
      setTaskWordIndex(0);
      setTaskMistakes([]);
      setTaskProgressHistory([]);
    } else {
      setIsComplete(true);
    }
  };

  // Repeat current task group
  const handleRepeatTask = () => {
    setIsTaskMilestoneOpen(false);
    setTaskWordIndex(0);
    setTaskMistakes([]);
    setTaskProgressHistory([]);
  };

  // Reset entire article progress
  const handleResetProgress = () => {
    setCurrentTaskIndex(0);
    setTaskWordIndex(0);
    setAllMistakenWords([]);
    setTaskMistakes([]);
    setTaskProgressHistory([]);
    setSessionProgressHistory([]);
    setIsComplete(false);
    setIsTaskMilestoneOpen(false);
    setStats({
      elapsedSeconds: 0,
      totalKeystrokes: 0,
      correctKeystrokes: 0,
      wrongKeystrokes: 0,
      correctWords: 0,
      wrongWords: 0,
      wpm: 0,
      accuracy: 100,
    });
  };

  // Shuffle current task words
  const handleShuffleWords = () => {
    const shuffledTask = [...currentTaskWords].sort(() => Math.random() - 0.5);
    const newAllWords = [...allWords];
    const start = currentTaskIndex * taskSize;
    newAllWords.splice(start, currentTaskWords.length, ...shuffledTask);
    setAllWords(newAllWords);
    setTaskWordIndex(0);
    setTaskProgressHistory([]);
  };

  // Import new words from article URL or text
  const handleImportWords = (newWords: WordItem[], title: string) => {
    setAllWords(newWords);
    setArticleTitle(title);
    setCurrentTaskIndex(0);
    setTaskWordIndex(0);
    setAllMistakenWords([]);
    setTaskMistakes([]);
    setTaskProgressHistory([]);
    setSessionProgressHistory([]);
    setIsComplete(false);
    setIsTaskMilestoneOpen(false);
    setStats({
      elapsedSeconds: 0,
      totalKeystrokes: 0,
      correctKeystrokes: 0,
      wrongKeystrokes: 0,
      correctWords: 0,
      wrongWords: 0,
      wpm: 0,
      accuracy: 100,
    });
  };

  // Review mistaken words
  const handleReviewMistakes = () => {
    if (allMistakenWords.length > 0) {
      setAllWords([...allMistakenWords]);
      setArticleTitle(`错词专项强化 (${allMistakenWords.length}词)`);
      setCurrentTaskIndex(0);
      setTaskWordIndex(0);
      setAllMistakenWords([]);
      setTaskMistakes([]);
      setIsComplete(false);
      setIsTaskMilestoneOpen(false);
      setStats({
        elapsedSeconds: 0,
        totalKeystrokes: 0,
        correctKeystrokes: 0,
        wrongKeystrokes: 0,
        correctWords: 0,
        wrongWords: 0,
        wpm: 0,
        accuracy: 100,
      });
    }
  };

  // Start practice session with notebook words
  const handleStartNotebookPractice = (practiceWords: NotebookWordItem[], modeTitle: string) => {
    if (!isNotebookPractice) {
      originalArticleBackup.current = {
        words: allWords,
        title: articleTitle,
        taskIndex: currentTaskIndex,
        wordIndex: taskWordIndex,
      };
    }
    setAllWords([...practiceWords]);
    setArticleTitle(modeTitle);
    setCurrentTaskIndex(0);
    setTaskWordIndex(0);
    setIsNotebookPractice(true);
    setTaskMistakes([]);
    setAllMistakenWords([]);
    setTaskProgressHistory([]);
    setSessionProgressHistory([]);
    setIsComplete(false);
    setIsTaskMilestoneOpen(false);
    setStats({
      elapsedSeconds: 0,
      totalKeystrokes: 0,
      correctKeystrokes: 0,
      wrongKeystrokes: 0,
      correctWords: 0,
      wrongWords: 0,
      wpm: 0,
      accuracy: 100,
    });
  };

  // Exit notebook practice and restore previous article
  const handleExitNotebookPractice = () => {
    if (originalArticleBackup.current) {
      const backup = originalArticleBackup.current;
      setAllWords(backup.words);
      setArticleTitle(backup.title);
      setCurrentTaskIndex(backup.taskIndex);
      setTaskWordIndex(backup.wordIndex);
    }
    setIsNotebookPractice(false);
    setTaskMistakes([]);
    setTaskProgressHistory([]);
    setIsComplete(false);
    setIsTaskMilestoneOpen(false);
  };

  const currentWord = currentTaskWords[taskWordIndex] || null;
  const prevWord = taskWordIndex > 0 ? currentTaskWords[taskWordIndex - 1] : null;
  const nextWord = taskWordIndex + 1 < currentTaskWords.length ? currentTaskWords[taskWordIndex + 1] : null;

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#f4f6fa] dark:bg-[#121620] text-slate-800 dark:text-slate-100 transition-colors duration-200 relative">
      {/* PixelFX Canvas (patch-gg/pixelfx 像素粒子与光效画布) */}
      <canvas
        ref={canvasRef}
        id="wordkey-fx-canvas"
        className="fixed inset-0 pointer-events-none z-50 w-full h-full"
      />

      {/* Zen Mode Minimal Hairline Progress Bar */}
      {isZenMode && (
        <div className="fixed top-0 left-0 right-0 z-40 h-0.5 bg-slate-200/80 dark:bg-slate-800/80">
          <div
            className="h-full bg-indigo-500 dark:bg-indigo-400 transition-all duration-150"
            style={{
              width: `${Math.round(((taskWordIndex) / Math.max(1, currentTaskWords.length)) * 100)}%`
            }}
          />
        </div>
      )}

      {/* Top Header */}
      <Header
        articleTitle={articleTitle}
        currentIndex={taskWordIndex}
        totalTaskWords={currentTaskWords.length}
        currentTaskIndex={currentTaskIndex}
        totalTasks={totalTasks}
        taskSize={taskSize}
        totalArticleWords={allWords.length}
        settings={settings}
        isPaused={isPaused}
        notebookCount={notebookCount}
        isPracticeMode={isNotebookPractice}
        isZenMode={isZenMode}
        onToggleZenMode={() => setIsZenMode((prev) => !prev)}
        onUpdateSettings={setSettings}
        onTogglePause={() => setIsPaused((prev) => !prev)}
        onOpenImport={() => setIsImportOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onOpenNotebook={() => setIsNotebookOpen(true)}
        onOpenBadges={() => setIsBadgesOpen(true)}
        onOpenWorksheet={() => setIsWorksheetOpen(true)}
        onExitPracticeMode={handleExitNotebookPractice}
        onResetProgress={handleResetProgress}
        onShuffleWords={handleShuffleWords}
        onSelectTask={handleSelectTask}
      />

      {/* Main Typing Center Board */}
      <main className="flex-1 flex flex-col justify-center">
        <WordTypingBoard
          currentWord={currentWord}
          prevWord={prevWord}
          nextWord={nextWord}
          settings={settings}
          isPaused={isPaused || isImportOpen || isSettingsOpen || isShortcutsOpen || isNotebookOpen || isTrendModalOpen || isTaskMilestoneOpen || isComplete || isBadgesOpen || isWorksheetOpen}
          streak={stats.streak}
          isZenMode={isZenMode}
          onToggleZenMode={() => setIsZenMode((prev) => !prev)}
          onWordComplete={handleWordComplete}
          onRecordKeystroke={handleRecordKeystroke}
          onNavigatePrev={handleNavigatePrev}
          onNavigateNext={handleNavigateNext}
          onSelectPrimaryDeck={handleSelectPrimaryDeck}
          activeDeckId={activeDeckId}
          onToggleAccent={() =>
            setSettings((prev) => ({
              ...prev,
              accent: prev.accent === 'us' ? 'uk' : 'us',
            }))
          }
        />
      </main>

      {/* Bottom Floating Stats Dashboard Card */}
      <StatsFooter stats={stats} isZenMode={isZenMode} onOpenTrend={() => setIsTrendModalOpen(true)} />

      <footer className="py-3 text-center text-xs text-slate-500">
        <a href="https://wordsmaster.app/" className="underline mr-4">返回主站</a>
        <a href="/dicts/NOTICE.md" className="underline mr-4">词库来源与许可</a>
        <a href="https://github.com/datashowme-me/doggydad/tree/main/apps/wordkey" className="underline">源代码</a>
      </footer>
      {/* Modals */}
      <ArticleImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportWords={handleImportWords}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={setSettings}
      />

      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* Notebook Modal (Local Persistence) */}
      <NotebookModal
        isOpen={isNotebookOpen}
        onClose={() => setIsNotebookOpen(false)}
        settings={settings}
        onStartPractice={handleStartNotebookPractice}
      />

      {/* Real-time Trend Modal (can be opened anytime from footer) */}
      <TrendModal
        isOpen={isTrendModalOpen}
        taskData={taskProgressHistory}
        sessionData={sessionProgressHistory}
        currentTaskNum={currentTaskIndex + 1}
        onClose={() => setIsTrendModalOpen(false)}
      />

      {/* Milestone Modal after completing a 20-word small task */}
      <TaskMilestoneModal
        isOpen={isTaskMilestoneOpen}
        currentTaskIndex={currentTaskIndex}
        totalTasks={totalTasks}
        taskSize={taskSize}
        totalArticleWords={allWords.length}
        stats={stats}
        taskMistakes={taskMistakes}
        taskProgressHistory={taskProgressHistory}
        onNextTask={handleNextTask}
        onRepeatTask={handleRepeatTask}
      />

      {/* Full Article Completed Modal */}
      <CompletionModal
        isOpen={isComplete}
        stats={stats}
        mistakenWords={allMistakenWords}
        sessionProgressHistory={sessionProgressHistory}
        articleTitle={articleTitle}
        onRestart={handleResetProgress}
        onReviewMistakes={handleReviewMistakes}
        onOpenImport={() => {
          setIsComplete(false);
          setIsImportOpen(true);
        }}
      />

      {/* Badges Modal */}
      <BadgesModal
        isOpen={isBadgesOpen}
        onClose={() => setIsBadgesOpen(false)}
        badges={badges}
      />

      {/* A4 Printable Worksheet Modal */}
      <A4WorksheetModal
        isOpen={isWorksheetOpen}
        onClose={() => setIsWorksheetOpen(false)}
        words={currentTaskWords.length > 0 ? currentTaskWords : allWords}
        title={articleTitle}
      />
    </div>
  );
}
