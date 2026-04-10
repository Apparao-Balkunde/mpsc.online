export enum Mode {
  HOME = 'HOME',
  PRELIMS = 'PRELIMS',
  MAINS = 'MAINS',
  MOCK = 'MOCK',
  SARALSEVA = 'SARALSEVA',
  MOCK_TEST = 'MOCK_TEST',
  CURRENT_AFFAIRS = 'CURRENT_AFFAIRS',
  VOCAB = 'VOCAB',
  LITERATURE = 'LITERATURE',
  SPARDHA = 'SPARDHA',
  QuizMode = 'QUIZ',
  QUIZ = 'QUIZ',
  BOOKMARKS = 'BOOKMARKS',
  PYQ = 'PYQ',
  FLASHCARD = 'FLASHCARD',
  REVISION = 'REVISION',
  CHALLENGE = 'CHALLENGE',
  DAILY = 'DAILY',
  PLANNER = 'PLANNER',
  AI_QUIZ = 'AI_QUIZ'
}

export interface MPSCQuestion {
  id: number;
  question: string;
  options: string[];
  correct_answer_index: number;
  explanation: string;
  subject: string;
  sub_category?: string;
  exam_category?: string;
  year?: number;
  exam_name?: string;
  created_at?: string;
}

export interface QuizQuestion extends MPSCQuestion {
  correctAnswerIndex: number;
  subCategory?: string;
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface UserProgress {
  totalAttempted: number;
  totalCorrect: number;
  streak: number;
  lastActiveDate: string;
}

// ── StudyMode साठी types ──────────────────────────────────────────────────
export enum Subject {
  MARATHI = 'MARATHI',
  ENGLISH = 'ENGLISH',
  GS      = 'GS',
}

export interface RuleExplanation {
  rule: string;
  explanation: string;
  examples: string[];
  mnemonics?: string;
}

export interface SavedNote {
  id: string;
  subject: Subject;
  topic: string;
  content: string;
  savedAt: string;
}
