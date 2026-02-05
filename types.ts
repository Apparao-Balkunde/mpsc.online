
export enum Subject {
  MARATHI = 'Marathi',
  ENGLISH = 'English',
  GS = 'General Studies'
}

export enum Mode {
  HOME = 'HOME',
  NOTES = 'NOTES',
  STUDY = 'STUDY',
  QUIZ = 'QUIZ',
  VOCAB = 'VOCAB',
  PYQ = 'PYQ',
  CURRENT_AFFAIRS = 'CURRENT_AFFAIRS',
  BOOKMARKS = 'BOOKMARKS',
  LITERATURE = 'LITERATURE',
  MOCK_TEST = 'MOCK_TEST'
}

export type ExamType = 'ALL' | 'RAJYASEVA' | 'GROUP_B' | 'GROUP_C';

export type SubjectFocus = 'BALANCED' | 'MARATHI_HEAVY' | 'ENGLISH_HEAVY' | 'GS_HEAVY';

export type GSSubCategory = 'ALL' | 'HISTORY' | 'GEOGRAPHY' | 'POLITY' | 'ECONOMICS' | 'SCIENCE' | 'ENVIRONMENT';

export type VocabCategory = 'IDIOMS' | 'SYNONYMS' | 'ANTONYMS' | 'ONE_WORD';

export type DifficultyLevel = 'EASY' | 'MEDIUM' | 'HARD';

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  examSource?: string;
  subCategory?: string;
}

export interface QuizResult {
  total: number;
  correct: number;
  answers: number[]; 
}

export interface VocabWord {
  word: string;
  meaning: string;
  usage: string;
  type: string; 
  relatedWords?: string[]; 
}

export interface CurrentAffairItem {
  headline: string;
  description: string;
  date: string;
  category: string;
  examRelevance: string;
}

export interface RuleExplanation {
  definition: string;
  importance: string;
  nuances: string;
  examples: string[];
}

export interface DescriptiveQA {
  question: string;
  modelAnswer: string;
  keyPoints: string[];
}

export interface QuizResultRecord {
    topic: string;
    score: number;
    total: number;
    date: string;
}

export interface UserProgress {
  studyTopicsViewed: string[];
  quizzesCompleted: QuizResultRecord[];
}

export interface NoteResource {
  id: string;
  title: string;
  subject: Subject | 'General';
  examType: ExamType;
  description: string;
  language: 'Marathi' | 'English' | 'Bilingual';
  tags: string[];
  updatedOn: string;
  notes: string;
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';
