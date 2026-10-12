import { WordItem, NotebookWordItem } from '../types';

const STORAGE_KEY = 'wordkey_notebook_v1';

/**
 * Load all notebook entries from localStorage
 */
export function getNotebookWords(): NotebookWordItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (err) {
    console.error('Failed to load notebook words:', err);
    return [];
  }
}

/**
 * Save all notebook entries to localStorage
 */
export function saveNotebookWords(words: NotebookWordItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(words));
    // Trigger custom event so reactive components can update
    window.dispatchEvent(new CustomEvent('wordkey_notebook_updated'));
  } catch (err) {
    console.error('Failed to save notebook words:', err);
  }
}

/**
 * Record a mistake for a word in the notebook
 */
export function recordWordMistake(word: WordItem): void {
  const list = getNotebookWords();
  const existingIdx = list.findIndex(
    (item) => item.word.toLowerCase() === word.word.toLowerCase()
  );

  const now = Date.now();
  if (existingIdx >= 0) {
    const item = list[existingIdx];
    list[existingIdx] = {
      ...item,
      ...word, // keep latest annotation if available
      mistakeCount: (item.mistakeCount || 0) + 1,
      correctStreak: 0,
      isMastered: false, // reset mastered when a mistake occurs
      lastPracticedAt: now,
    };
  } else {
    list.unshift({
      ...word,
      mistakeCount: 1,
      correctStreak: 0,
      isFavorite: false,
      isMastered: false,
      addedAt: now,
      lastPracticedAt: now,
    });
  }

  saveNotebookWords(list);
}

/**
 * Record a successful completion of a word.
 * In notebook practice mode, if correctStreak reaches 2 or more, mark as mastered.
 */
export function recordWordSuccess(
  wordIdOrWord: string,
  isNotebookPractice = false
): { isNewlyMastered: boolean } {
  const list = getNotebookWords();
  const key = wordIdOrWord.toLowerCase();
  const existingIdx = list.findIndex(
    (item) => item.id === wordIdOrWord || item.word.toLowerCase() === key
  );

  if (existingIdx === -1) {
    return { isNewlyMastered: false };
  }

  const item = list[existingIdx];
  const nextStreak = (item.correctStreak || 0) + 1;
  let isNewlyMastered = false;
  let isMastered = item.isMastered || false;

  // If practicing inside notebook mode and correct streak reaches 2: auto-master!
  if (isNotebookPractice && nextStreak >= 2 && !item.isMastered) {
    isMastered = true;
    isNewlyMastered = true;
  }

  list[existingIdx] = {
    ...item,
    correctStreak: nextStreak,
    isMastered,
    lastPracticedAt: Date.now(),
  };

  saveNotebookWords(list);
  return { isNewlyMastered };
}

/**
 * Toggle favorite status of a word (manual bookmark)
 */
export function toggleWordFavorite(word: WordItem): boolean {
  const list = getNotebookWords();
  const key = word.word.toLowerCase();
  const existingIdx = list.findIndex((item) => item.word.toLowerCase() === key);

  let newFavoriteState = true;
  const now = Date.now();

  if (existingIdx >= 0) {
    const item = list[existingIdx];
    newFavoriteState = !item.isFavorite;
    list[existingIdx] = {
      ...item,
      isFavorite: newFavoriteState,
    };
  } else {
    newFavoriteState = true;
    list.unshift({
      ...word,
      mistakeCount: 0,
      correctStreak: 0,
      isFavorite: true,
      isMastered: false,
      addedAt: now,
      lastPracticedAt: now,
    });
  }

  saveNotebookWords(list);
  return newFavoriteState;
}

/**
 * Check if a word is currently bookmarked/favorited
 */
export function isWordFavorited(wordText: string): boolean {
  if (!wordText) return false;
  const list = getNotebookWords();
  const item = list.find((w) => w.word.toLowerCase() === wordText.toLowerCase());
  return !!item?.isFavorite;
}

/**
 * Toggle mastered state for a word
 */
export function toggleWordMastered(wordId: string): void {
  const list = getNotebookWords();
  const idx = list.findIndex((w) => w.id === wordId);
  if (idx >= 0) {
    list[idx].isMastered = !list[idx].isMastered;
    if (list[idx].isMastered) {
      list[idx].correctStreak = Math.max(list[idx].correctStreak, 2);
    }
    saveNotebookWords(list);
  }
}

/**
 * Delete a word from notebook
 */
export function deleteNotebookWord(wordId: string): void {
  const list = getNotebookWords().filter((w) => w.id !== wordId);
  saveNotebookWords(list);
}

/**
 * Clear all mastered words
 */
export function clearMasteredWords(): void {
  const list = getNotebookWords().filter((w) => !w.isMastered);
  saveNotebookWords(list);
}

/**
 * Clear all notebook words
 */
export function clearAllNotebookWords(): void {
  saveNotebookWords([]);
}

/**
 * Export notebook words into text / anki / markdown formats
 */
export function exportNotebookAs(
  words: NotebookWordItem[],
  format: 'txt' | 'csv' | 'anki' | 'json'
): string {
  if (format === 'json') {
    return JSON.stringify(words, null, 2);
  }

  if (format === 'csv') {
    const header = 'Word,Phonetic,Part of Speech,Meaning,Mistake Count,Mastered\n';
    const rows = words.map(
      (w) =>
        `"${w.word}","${w.phoneticAmE || ''}","${w.pos || ''}","${(w.meaning || '').replace(/"/g, '""')}",${w.mistakeCount},${w.isMastered ? 'Yes' : 'No'}`
    );
    return header + rows.join('\n');
  }

  if (format === 'anki') {
    // Tab-separated for Anki import: Word [tab] Phonetic Meaning [tab] Sentence
    return words
      .map(
        (w) =>
          `${w.word}\t${w.phoneticAmE || ''} ${w.pos || ''} ${w.meaning || ''}\t${w.sentence || ''} ${w.sentenceTranslation || ''}`
      )
      .join('\n');
  }

  // Default: txt format
  return words
    .map(
      (w, idx) =>
        `${idx + 1}. ${w.word}  ${w.phoneticAmE ? `[${w.phoneticAmE}]` : ''}  ${w.pos || ''} ${w.meaning || ''}${w.sentence ? `\n   例句: ${w.sentence}` : ''}`
    )
    .join('\n\n');
}
