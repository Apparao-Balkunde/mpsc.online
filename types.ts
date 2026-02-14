export enum Mode {
  HOME = 'HOME',
  PRELIMS = 'PRELIMS',
  MAINS = 'MAINS',
  MOCK = 'MOCK', 
  VOCAB = 'VOCAB',
  LITERATURE = 'LITERATURE', 
  OPTIONAL = 'OPTIONAL',      // वैकल्पिक विषयांसाठी
  MOCK_TEST = 'MOCK_TEST',    // सराव परीक्षा मोड
  CURRENT_AFFAIRS = 'CURRENT_AFFAIRS' // चालू घडामोडी मोड
}

// १. मुख्य MCQ प्रश्नांसाठी इंटरफेस (Prelims, Mains, Mock)
export interface MPSCQuestion {
  id: number;
  question: string;
  options: string[]; // JSONB मधील डेटा ऑरे म्हणून येईल
  correct_answer_index: number;
  explanation: string;
  subject: 'History' | 'Geography' | 'Polity' | 'Economics' | 'Science' | 'Environment' | 'Current Affairs' | 'GS Paper 2' | string;
  year: number; 
  exam_name: 'Rajyaseva' | 'Combined Group B' | 'Combined Group C' | string;
  created_at?: string;
}

// २. चालू घडामोडींसाठी इंटरफेस (Topic & Details Logic)
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

// ३. OPTIONAL (Descriptive) साठी इंटरफेस
export interface OptionalQuestion {
  id: number;
  question_title: string;  // मुख्य प्रश्न
  answer_details: string;  // सविस्तर उत्तर (मुद्देसूद)
  subject: string;         // उदा. Marathi Sahitya
  exam_name: string;       // उदा. Rajyaseva / UPSC
  year?: number;
  created_at?: string;
}

// ४. इतर साह्यकारी टाइप्स
export interface DescriptiveQA {
  question: string;
  modelAnswer: string;
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';
