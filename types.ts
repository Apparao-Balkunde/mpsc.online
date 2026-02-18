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
 * सुपाबेस मधील कॉलम नेम्सशी मॅच होणारा मुख्य इंटरफेस
 */
export interface MPSCQuestion {
  id: number;
  question: string;
  options: string[]; // सुपाबेसमध्ये JSONB फॉरमॅट हवा
  correct_answer_index: number;
  explanation: string;
  subject: string;
  sub_category?: string; 
  mnemonic?: string;     
  exam_category?: 'RAJYASEVA' | 'COMBINED_B' | 'COMBINED_C' | 'SARALSEVA' | string; 
  year?: number; 
  exam_name?: string;
  created_at?: string;
}

/**
 * Mock Test साठी विशेष इंटरफेस
 * यामध्ये आपण युजरने निवडलेले उत्तर आणि इतर गोष्टी ट्रॅक करू शकतो
 */
export interface QuizQuestion extends MPSCQuestion {
  // भविष्यात गरज पडल्यास इथे नवीन फील्ड्स ॲड करता येतील
}

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
 * Loading State
 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

/**
 * परीक्षेचा निकाल साठवण्यासाठी इंटरफेस (Analytics साठी)
 */
export interface ExamResult {
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  percentage: number;
  timeTaken: string;
  category: string;
  date: string;
}
