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
 * सुपाबेस मधील कॉलम नेम्सशी मॅच होणारा इंटरफेस
 */
export interface MPSCQuestion {
  id: number;
  question: string;
  options: string[]; 
  correct_answer_index: number;
  explanation: string;
  subject: string;
  sub_category?: string; // विषयांतर्गत घटक (उदा. भूगोल -> नदी प्रणाली)
  mnemonic?: string;     // लक्षात ठेवण्यासाठी ट्रिक (Short trick)
  exam_category?: 'RAJYASEVA' | 'COMBINED_B' | 'SARALSEVA' | string; // सुपाबेस फिल्टरसाठी
  year?: number; 
  exam_name?: string;
  created_at?: string;
}

/**
 * MockTest साठी विशेष इंटरफेस (गरज भासल्यास)
 * आपण MPSCQuestion सुद्धा वापरू शकतो, पण स्पष्टतेसाठी हे सोपे पडते.
 */
export interface QuizQuestion extends MPSCQuestion {}

/**
 * वर्णनात्मक प्रश्नांसाठी इंटरफेस (Optional & Current Affairs)
 */
export interface OptionalQuestion {
  id: number;
  question_title: string;  
  answer_details: string;  
  subject: string;         
  exam_name: string;       
  year: number; 
  created_at?: string;
}

/**
 * Loading State मध्ये आपण 'fetching' सुद्धा टाकू शकतो जर हवे असेल तर
 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';
