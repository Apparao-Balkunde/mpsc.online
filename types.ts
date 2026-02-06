export enum Subject {
  MARATHI = 'Marathi',
  ENGLISH = 'English',
  GS = 'General Studies'
}

export enum Mode {
  HOME = 'HOME',
  STUDY = 'STUDY',
  QUIZ = 'QUIZ',
  VOCAB = 'VOCAB',
  PYQ = 'PYQ',
  CURRENT_AFFAIRS = 'CURRENT_AFFAIRS',
  BOOKMARKS = 'BOOKMARKS',
  LITERATURE = 'LITERATURE',
  MOCK_TEST = 'MOCK_TEST',
  GLOBAL_LIBRARY = 'GLOBAL_LIBRARY'
}

export type ExamType = 'ALL' | 'RAJYASEVA' | 'GROUP_B' | 'GROUP_C';

export type GSSubCategory = 'ALL' | 'HISTORY' | 'GEOGRAPHY' | 'POLITY' | 'ECONOMICS' | 'SCIENCE' | 'ENVIRONMENT';

export type VocabCategory = 'IDIOMS' | 'SYNONYMS' | 'ANTONYMS' | 'ONE_WORD';

export type DifficultyLevel = 'EASY' | 'MEDIUM' | 'HARD';

// १. Quiz Question - Supabase Table Structure नुसार
export interface QuizQuestion {
  id?: string | number; // Database Primary Key
  question: string;
  options: string[];
  correct_answer_index: number; // Snake case for DB compatibility
  explanation: string;
  subject: Subject;
  topic?: string;
  exam_source?: string; // उदा. MPSC Pre 2023
  is_pyq: boolean;
  year?: number;
}

// २. प्रगती ट्रॅक करण्यासाठी (User Stats)
export interface QuizResultRecord {
  id?: string;
  topic: string;
  score: number;
  total: number;
  date: string;
  subject: Subject;
}

// ३. शब्दसंग्रह - Database Focus
export interface VocabWord {
  id?: string;
  word: string;
  meaning: string;
  usage: string;
  type: string; // उदा. नाम, सर्वनाम, Verb, Adjective
  synonyms: string[];
  antonyms: string[];
  subject: Subject;
  category: VocabCategory;
}

// ४. चालू घडामोडी
export interface CurrentAffairItem {
  id?: string;
  headline: string;
  description: string;
  date: string;
  category: string;
  relevance_score: string; // परीक्षेसाठी महत्त्व
}

// ५. अभ्यास साहित्य (Notes)
export interface SavedNote {
  id: string;
  subject: Subject;
  topic: string;
  content: string; // Markdown Content
  is_official: boolean; // आयोगाचे की युजरचे
  created_at: string;
}

// ६. युजरचा संपूर्ण डेटाबेस प्रोग्रेस
export interface UserProgress {
  studyTopicsViewed: string[];
  quizzesCompleted: QuizResultRecord[];
  bookmarks: {
    questions: string[]; // फक्त ID स्टोअर करा (Best Practice)
    vocab: string[];      // फक्त ID स्टोअर करा
    notes: string[];      // फक्त ID स्टोअर करा
  };
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// ७. डेटाबेस रिस्पॉन्स फॉरमॅट
export interface DBResponse<T> {
  data: T | null;
  error: string | null;
  count?: number;
}
