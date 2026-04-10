import { UserProgress, QuizQuestion, SavedNote } from '../types';

const STORAGE_KEY = 'mpsc_sarathi_progress';
const NOTES_KEY = 'mpsc_sarathi_notes';

export const getProgress = (): UserProgress => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : {
    totalQuestionsAttempted: 0,
    correctAnswers: 0,
    subjectMastery: {},
    bookmarks: { questions: [], articles: [] },
    recentActivity: [],
    viewedTopics: [] // हे नवीन फील्ड ॲड करा
  };
};

// --- नवीन फंक्शन्स जे बिल्ड एरर फिक्स करतील ---

export const markTopicViewed = (subject: string, topicId: string): void => {
  const progress = getProgress();
  // viewedTopics array नसेल तर तो तयार करा
  if (!progress.viewedTopics) progress.viewedTopics = [];
  
  const uniqueId = `${subject}:${topicId}`;
  if (!progress.viewedTopics.includes(uniqueId)) {
    progress.viewedTopics.push(uniqueId);
    saveProgress(progress);
  }
};

export const saveNote = (note: SavedNote): void => {
  const notes = JSON.parse(localStorage.getItem(NOTES_KEY) || '[]');
  notes.push({ ...note, id: Date.now().toString() });
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
};

// --- जुने फंक्शन्स ---

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
