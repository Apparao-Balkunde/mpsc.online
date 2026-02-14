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

// १. मुख्य MCQ प्रश्नांसाठी इंटरफेस (Prelims, Mains, Mock)
export interface MPSCQuestion {
  id: number;
  question: string;
  options: string[]; 
  correct_answer_index: number;
  explanation: string;
  
  // मुख्य परीक्षेच्या नवीन पेपरनुसार विषयांची यादी अपडेट केली आहे
  subject: 
    | 'History' | 'Geography' | 'Polity' | 'Economics' | 'Science' | 'Environment' | 'Current Affairs' | 'GS Paper 2' // Prelims
    | 'Marathi' | 'English' // Mains Common
    | 'Paper 1 (History & Geo)' | 'Paper 2 (Polity)' | 'Paper 3 (HR & HRD)' | 'Paper 4 (Sci-Tech & Econ)' // Rajyaseva Mains
    | 'Paper 1 (Lang)' | 'Paper 2 (GS)' // Combined Group B & C Mains
    | string;

  year: number; 
  exam_name: 'Rajyaseva' | 'Combined Group B' | 'Combined Group C' | string;
  created_at?: string;
}

// २. चालू घडामोडींसाठी इंटरफेस
export interface CurrentAffairs {
  id: number;
  title: string;        
  details: string;      
  category?: string;    
  image_url?: string;
  important_date: string;
  exam_name: string;
  year: number;
}

// ३. OPTIONAL (Descriptive) साठी इंटरफेस
export interface OptionalQuestion {
  id: number;
  question_title: string;  
  answer_details: string;  
  subject: string;         
  exam_name: string;       
  year?: number;
  created_at?: string;
}

// ४. इतर साह्यकारी टाइप्स
export interface DescriptiveQA {
  question: string;
  modelAnswer: string;
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';
