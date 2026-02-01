import { UserProgress } from '../types';

const STORAGE_KEY = 'mpsc_user_progress_v1';

export const getProgress = (): UserProgress => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : { studyTopicsViewed: [], quizzesCompleted: [] };
  } catch {
    return { studyTopicsViewed: [], quizzesCompleted: [] };
  }
};

export const markTopicViewed = (topic: string) => {
  const progress = getProgress();
  if (!progress.studyTopicsViewed.includes(topic)) {
    progress.studyTopicsViewed.push(topic);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
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
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
};
