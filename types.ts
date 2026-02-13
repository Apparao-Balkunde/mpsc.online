export enum Mode {
  HOME = 'HOME',
  PRELIMS = 'PRELIMS',
  MAINS = 'MAINS',
  MOCK = 'MOCK', 
  VOCAB = 'VOCAB',
  LITERATURE = 'LITERATURE', // जुने साहित्य (गरज असल्यास ठेवा)
  OPTIONAL = 'OPTIONAL',     // नवीन: वैकल्पिक विषयांसाठी स्वतंत्र मोड
  MOCK_TEST = 'MOCK_TEST',   // सराव परीक्षा मोड
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

// १. चालू घडामोडींसाठी इंटरफेस (Topic & Details Logic)
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

// २. OPTIONAL (Descriptive) साठी नवीन इंटरफेस
// हा थेट तुझ्या 'optional_questions' टेबलच्या कॉलम्सशी मॅप होतो
export interface OptionalQuestion {
  id: number;
  question_title: string;  // मुख्य प्रश्न
  answer_details: string;  // सविस्तर उत्तर (मुद्देसूद)
  subject: string;         // Marathi Sahitya / Public Administration
  exam_name: string;
  year?: number;
  created_at?: string;
}

export interface DescriptiveQA {
  question: string;
  modelAnswer: string;
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';
