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
  PYQ = 'PYQ'
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

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';