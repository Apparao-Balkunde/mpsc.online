export enum Mode {
  HOME = 'HOME',
  PRELIMS = 'PRELIMS',
  MAINS = 'MAINS',
  MOCK = 'MOCK',
  VOCAB = 'VOCAB'
}

export interface MPSCQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  subject: string;
  year?: number;
  exam_name?: string;
  exam_type: 'PRELIMS' | 'MAINS' | 'MOCK';
}
