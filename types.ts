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
 * MCQ आधारित प्रश्नांसाठी इंटरफेस (Prelims, Mains, MOCK_TEST)
 * विषय (Subject) मध्ये आपण सराव परीक्षेचे सर्व विषय दिले आहेत.
 */
export interface MPSCQuestion {
  id: number;
  question: string;
  options: string[]; 
  correct_answer_index: number;
  explanation: string;
  // विषय सूचीमध्ये Mock Test चे विषय समाविष्ट केले आहेत
  subject: 
    | 'History' 
    | 'Geography' 
    | 'Polity' 
    | 'Economics' 
    | 'Science' 
    | 'Environment' 
    | 'Current Affairs' 
    | string; 
  year?: number; 
  exam_name: string;
  created_at?: string;
}

/**
 * वर्णनात्मक प्रश्नांसाठी इंटरफेस (Optional & Current Affairs)
 */
export interface OptionalQuestion {
  id: number;
  question_title: string;  
  answer_details: string;  
  subject: 'Marathi Literature' | 'Public Administration' | 'History' | 'Geography' | 'Political Science' | string;         
  exam_name: string;       
  year: number; 
  created_at?: string;
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';
