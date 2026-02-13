export enum Mode {
  HOME = 'HOME',
  PRELIMS = 'PRELIMS',
  MAINS = 'MAINS',
  MOCK = 'MOCK', 
  VOCAB = 'VOCAB',
  LITERATURE = 'LITERATURE',
  MOCK_TEST = 'MOCK_TEST',     // आपण आधीच्या कोडमध्ये वापरलेला नवीन मोड
  CURRENT_AFFAIRS = 'CURRENT_AFFAIRS' // चालू घडामोडी मोड
}

export interface MPSCQuestion {
  id: number;
  question: string;
  options: string[];
  correct_answer_index: number;
  explanation: string;
  subject: string;
  year?: number; 
  exam_name: string;
}

// १. चालू घडामोडींसाठी नवीन इंटरफेस (Topic & Details Logic)
export interface CurrentAffairs {
  id: number;
  title: string;        // बातमीचा विषय (Topic)
  details: string;      // सविस्तर माहिती (Details)
  category?: string;    // राजकीय, क्रीडा, इ.
  image_url?: string;
  important_date: string;
  exam_name: string;
  year: number;
}

export interface DescriptiveQA {
  question: string;
  modelAnswer: string;
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';
