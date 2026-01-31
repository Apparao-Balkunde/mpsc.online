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
  CURRENT_AFFAIRS = 'CURRENT_AFFAIRS'
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
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

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';