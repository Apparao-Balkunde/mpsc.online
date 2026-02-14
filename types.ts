export enum Mode {
  HOME = 'HOME',
  PRELIMS = 'PRELIMS',
  MAINS = 'MAINS',
  MOCK = 'MOCK', 
  VOCAB = 'VOCAB',
  LITERATURE = 'LITERATURE', 
  OPTIONAL = 'OPTIONAL',      
  MOCK_TEST = 'MOCK_TEST',    
  CURRENT_AFFAIRS = 'CURRENT_AFFAIRS' 
}

export interface MPSCQuestion {
  id: number;
  question: string;
  options: string[]; 
  correct_answer_index: number;
  explanation: string;
  subject: string;
  year: number; 
  exam_name: string;
  created_at?: string;
}

// ३. OPTIONAL (Descriptive) साठी अपडेटेड इंटरफेस
export interface OptionalQuestion {
  id: number;
  question_title: string;  
  answer_details: string;  
  subject: 'Marathi Literature' | 'Public Administration' | string;         
  exam_name: string;       
  year: number; // वर्ष आता अनिवार्य आहे
  created_at?: string;
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';
