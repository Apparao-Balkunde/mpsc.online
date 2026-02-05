
import { UserProgress, QuizQuestion, VocabWord, SavedNote } from '../types';

const STORAGE_KEY = 'mpsc_user_progress_v35';

const DEFAULT_PROGRESS: UserProgress = { 
  studyTopicsViewed: [], 
  quizzesCompleted: [],
  bookmarks: {
    questions: [],
    vocab: [],
    notes: []
  },
  vocabSRS: {}
};

const SRS_INTERVALS = [0, 1, 3, 7, 14, 30]; // Days

export const getProgress = (): UserProgress => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return DEFAULT_PROGRESS;
    const parsed = JSON.parse(data);
    if (!parsed.bookmarks) parsed.bookmarks = DEFAULT_PROGRESS.bookmarks;
    if (!parsed.vocabSRS) parsed.vocabSRS = {};
    return parsed;
  } catch {
    return DEFAULT_PROGRESS;
  }
};

const saveProgress = (progress: UserProgress) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
};

export const markTopicViewed = (topic: string) => {
  const progress = getProgress();
  if (!progress.studyTopicsViewed.includes(topic)) {
    progress.studyTopicsViewed.push(topic);
    saveProgress(progress);
  }
};

export const saveQuizResult = (topic: string, score: number, total: number) => {
  const progress = getProgress();
  progress.quizzesCompleted.push({
    topic,
    score,
    total,
    date: new Date().toISOString()
  });
  saveProgress(progress);
};

export const toggleQuestionBookmark = (question: QuizQuestion): boolean => {
  const progress = getProgress();
  const index = progress.bookmarks.questions.findIndex(q => q.question === question.question);
  if (index > -1) {
    progress.bookmarks.questions.splice(index, 1);
  } else {
    progress.bookmarks.questions.push(question);
  }
  saveProgress(progress);
  return index === -1;
};

export const toggleVocabBookmark = (word: VocabWord): boolean => {
  const progress = getProgress();
  const index = progress.bookmarks.vocab.findIndex(v => v.word === word.word);
  if (index > -1) {
    progress.bookmarks.vocab.splice(index, 1);
    if (progress.vocabSRS?.[word.word]) delete progress.vocabSRS[word.word];
  } else {
    progress.bookmarks.vocab.push(word);
    if (!progress.vocabSRS) progress.vocabSRS = {};
    progress.vocabSRS[word.word] = { level: 0, nextReview: new Date().toISOString() };
  }
  saveProgress(progress);
  return index === -1;
};

export const updateVocabSRS = (word: string, success: boolean) => {
    const progress = getProgress();
    if (!progress.vocabSRS) progress.vocabSRS = {};
    const current = progress.vocabSRS[word] || { level: 0, nextReview: new Date().toISOString() };
    
    if (success) {
        current.level = Math.min(current.level + 1, SRS_INTERVALS.length - 1);
    } else {
        current.level = 0;
    }
    
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + SRS_INTERVALS[current.level]);
    current.nextReview = nextDate.toISOString();
    
    progress.vocabSRS[word] = current;
    saveProgress(progress);
};

export const saveNote = (note: SavedNote) => {
  const progress = getProgress();
  const exists = progress.bookmarks.notes.some(n => n.topic === note.topic && n.subject === note.subject);
  if (!exists) {
    progress.bookmarks.notes.unshift(note);
    saveProgress(progress);
  }
};

export const removeNote = (id: string) => {
  const progress = getProgress();
  progress.bookmarks.notes = progress.bookmarks.notes.filter(n => n.id !== id);
  saveProgress(progress);
};

export const exportLibrary = () => {
  const data = getProgress();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `mpsc_sarathi_backup_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const importLibrary = (jsonString: string): boolean => {
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed && parsed.bookmarks) {
      saveProgress(parsed);
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
};
