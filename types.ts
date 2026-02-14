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

/**
 * MCQ आधारित प्रश्नांसाठी इंटरफेस (Prelims, Mains, Mock)
 */
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

/**
 * वर्णनात्मक (Descriptive) प्रश्नांसाठी इंटरफेस (Optional & Current Affairs)
 * येथे 'year' आता अनिवार्य (Required) आहे.
 */
export interface OptionalQuestion {
  id: number;
  question_title: string;  
  answer_details: string;  
  subject: 'Marathi Literature' | 'Public Administration' | 'History' | 'Geography' | string;         
  exam_name: string;       
  year: number; 
  created_at?: string;
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';
