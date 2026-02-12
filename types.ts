export enum Mode {
  HOME = 'HOME',
  PRELIMS = 'PRELIMS',
  MAINS = 'MAINS',
  MOCK = 'MOCK', // सराव परीक्षा मोड
  VOCAB = 'VOCAB',
  LITERATURE = 'LITERATURE'
}

export interface MPSCQuestion {
  id: number;
  question: string;
  options: string[];
  correct_answer_index: number;
  explanation: string;
  subject: string;
  year?: number; // सराव परीक्षेसाठी वर्ष Optional केले आहे (?)
  exam_name: string;
}

export interface DescriptiveQA {
  question: string;
  modelAnswer: string;
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';
