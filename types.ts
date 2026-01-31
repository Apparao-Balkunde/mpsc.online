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
  BOOKMARKS = 'BOOKMARKS'
}

export type ExamType = 'ALL' | 'RAJYASEVA' | 'GROUP_B' | 'GROUP_C';

export type VocabCategory = 'IDIOMS' | 'SYNONYMS' | 'ANTONYMS' | 'ONE_WORD';

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  examSource?: string; // e.g. "MPSC Rajyaseva 2018"
}

export interface QuizResult {
  total: number;
  correct: number;
  answers: number[]; // Index of selected answers
}

export interface VocabWord {
  word: string;
  meaning: string;
  usage: string;
  type: string; // Noun, Verb, etc.
}

export interface CurrentAffairItem {
  headline: string;
  description: string;
  date: string;
  category: string;
  examRelevance: string;
}

export interface RuleExplanation {
  rule: string;
  example: string;
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';