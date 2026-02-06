import { UserProgress, QuizQuestion } from '../types';

const STORAGE_KEY = 'mpsc_sarathi_progress';

export const getProgress = (): UserProgress => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : {
    totalQuestionsAttempted: 0,
    correctAnswers: 0,
    subjectMastery: {},
    bookmarks: { questions: [], articles: [] },
    recentActivity: []
  };
};

export const toggleQuestionBookmark = (question: QuizQuestion): boolean => {
  const progress = getProgress();
  const index = progress.bookmarks.questions.findIndex(q => q.question === question.question);
  
  if (index === -1) {
    progress.bookmarks.questions.push(question);
    saveProgress(progress);
    return true;
  } else {
    progress.bookmarks.questions.splice(index, 1);
    saveProgress(progress);
    return false;
  }
};

const saveProgress = (progress: UserProgress) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
};
