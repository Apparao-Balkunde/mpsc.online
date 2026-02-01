import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Subject, QuizQuestion, VocabWord, CurrentAffairItem, ExamType, VocabCategory, RuleExplanation, DescriptiveQA, DifficultyLevel } from '../types';

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const MODEL_FAST = 'gemini-3-flash-preview';
const MODEL_PRO = 'gemini-3-pro-preview';
const MODEL_TTS = 'gemini-2.5-flash-preview-tts';

// --- LOCAL DATA CENTER (CACHING SYSTEM) ---
const CACHE_PREFIX = 'MPSC_DATA_CENTER_V2_';

// Helper to generate consistent unique keys for storage
const getCacheKey = (...args: string[]) => {
  return CACHE_PREFIX + args.join('_').toUpperCase().replace(/[^A-Z0-9_]/g, '_');
};

// Retrieve from Local Data Center
const getFromDataCenter = <T>(key: string): T | null => {
  try {
    const item = localStorage.getItem(key);
    if (item) {
      console.log(`⚡ [Local Data Center] Serving instantly: ${key}`);
      return JSON.parse(item) as T;
    }
  } catch (e) {
    console.warn("Data Center retrieval error", e);
  }
  return null;
};

// Save to Local Data Center
const saveToDataCenter = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    console.log(`💾 [Local Data Center] Data stored: ${key}`);
  } catch (e) {
    console.warn("Data Center full. Clearing old MPSC data to make space...");
    try {
      // Smart cleanup: Only remove MPSC_DATA_CENTER keys to avoid messing with other apps
      Object.keys(localStorage).forEach(k => {
        if (k.startsWith(CACHE_PREFIX)) {
          localStorage.removeItem(k);
        }
      });
      localStorage.setItem(key, JSON.stringify(data));
    } catch (retryError) {
      console.error("Critical storage failure", retryError);
    }
  }
};
// --- END CACHING SYSTEM ---

// Audio Context Singleton
let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  }
  return audioContext;
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const playTextToSpeech = async (text: string): Promise<void> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_TTS,
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio data received");

    const ctx = getAudioContext();
    const audioBytes = decode(base64Audio);
    const audioBuffer = await decodeAudioData(audioBytes, ctx, 24000, 1);

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    source.start();

  } catch (error) {
    console.error("TTS Error:", error);
    throw error;
  }
};

export const generateStudyNotes = async (subject: Subject, topic: string): Promise<string> => {
  const cacheKey = getCacheKey('NOTES', subject, topic);
  const cached = getFromDataCenter<string>(cacheKey);
  if (cached) return cached;

  try {
    const prompt = `
      You are an expert tutor for the MPSC (Maharashtra Public Service Commission) exam.
      Subject: ${subject}
      Topic: ${topic}
      
      Please provide detailed study notes for this topic. 
      - If the subject is Marathi, strictly use Marathi language for explanation.
      - If the subject is English, use English language but you can provide Marathi translation for difficult concepts if helpful.
      - Include definitions, rules, examples, and exceptions relevant to MPSC pattern.
      - Format the output in clean Markdown.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: prompt,
    });

    const result = response.text || "No notes generated.";
    saveToDataCenter(cacheKey, result);
    return result;
  } catch (error) {
    console.error("Error generating notes:", error);
    throw error;
  }
};

export const generateConciseExplanation = async (subject: Subject, topic: string): Promise<RuleExplanation> => {
  const cacheKey = getCacheKey('RULE', subject, topic);
  const cached = getFromDataCenter<RuleExplanation>(cacheKey);
  if (cached) return cached;

  try {
    const prompt = `
      You are an expert MPSC (Maharashtra Public Service Commission) exam tutor.
      Subject: ${subject}
      Topic: ${topic}
      
      Provide a JSON object with:
      1. rule: A concise but comprehensive explanation (2-4 sentences) of the core grammar rule. Mention exceptions if crucial.
      2. examples: An array of 2-3 distinct, exam-oriented example sentences that demonstrate this rule. Include brief analysis in brackets if helpful.
      
      Language Requirement:
      - Marathi Subject: Explain STRICTLY in Marathi (Devanagari).
      - English Subject: Explain in English.
      
      Output JSON strictly.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            rule: { type: Type.STRING },
            examples: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["rule", "examples"]
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) return { rule: "Explanation not available", examples: [] };
    
    const data = JSON.parse(jsonText) as RuleExplanation;
    saveToDataCenter(cacheKey, data);
    return data;
  } catch (error) {
    console.error("Error generating explanation:", error);
    return { rule: "Could not load explanation.", examples: [] };
  }
};

export const generateQuiz = async (subject: Subject, topic: string, difficulty: DifficultyLevel = 'MEDIUM'): Promise<QuizQuestion[]> => {
  const cacheKey = getCacheKey('QUIZ', subject, topic, difficulty);
  const cached = getFromDataCenter<QuizQuestion[]>(cacheKey);
  if (cached) return cached;

  try {
    const prompt = `
      Generate 20 multiple choice questions (MCQs) for MPSC exam practice.
      Subject: ${subject}
      Topic: ${topic}
      Difficulty Level: ${difficulty}
      Language: ${subject === Subject.MARATHI ? 'Marathi' : 'English'}
      
      Requirements:
      1. Difficulty Guidelines:
         - EASY: Basic concepts, direct definitions, simple identification.
         - MEDIUM: Application of rules, exception identification, standard MPSC Prelims level.
         - HARD: Complex sentences, multi-statement questions (A, B, C correct), deep conceptual analysis, MPSC Mains level.
      2. Ensure questions cover various aspects of the topic.
      3. **Crucial**: The 'explanation' field MUST be detailed and educational (approx 30-50 words). 
         - If Marathi Grammar: Explain the rule (नियम) clearly in Marathi.
         - If English Grammar: Explain the rule in English.
         - Explain WHY the answer is correct and briefly why others are incorrect if relevant.
      
      Return the response in strictly valid JSON format.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: { 
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              correctAnswerIndex: { type: Type.INTEGER, description: "0-based index of the correct option" },
              explanation: { type: Type.STRING, description: "Detailed, educational explanation (30-50 words) of the answer and concept." }
            },
            required: ["question", "options", "correctAnswerIndex", "explanation"]
          }
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Empty response from AI");
    
    const data = JSON.parse(jsonText) as QuizQuestion[];
    saveToDataCenter(cacheKey, data);
    return data;
  } catch (error) {
    console.error("Error generating quiz:", error);
    throw error;
  }
};

export const generatePYQs = async (subject: Subject, year: string, examType: ExamType = 'ALL'): Promise<QuizQuestion[]> => {
  const cacheKey = getCacheKey('PYQ', subject, year, examType);
  const cached = getFromDataCenter<QuizQuestion[]>(cacheKey);
  if (cached) return cached;

  try {
    let examContext = '';
    
    if (subject === Subject.MARATHI) {
      if (examType === 'ALL') examContext = 'MPSC Rajyaseva, Group B (Combined), and Group C exams';
      else if (examType === 'RAJYASEVA') examContext = 'MPSC Rajyaseva (State Services) exams';
      else if (examType === 'GROUP_B') examContext = 'MPSC Group B Combined exams (PSI/STI/ASO)';
      else if (examType === 'GROUP_C') examContext = 'MPSC Group C exams';
    } else if (subject === Subject.ENGLISH) {
      // For English, broaden the scope as requested
      examContext = 'MPSC, SSC CGL, UPSC, CDS, and Banking exams (English Grammar is similar across these). Prioritize MPSC pattern.';
    } else {
      examContext = 'MPSC State Services and Combined exams';
    }

    const prompt = `
      Retrieve or generate 15 authentic Previous Year Questions (PYQs) for the subject: ${subject}.
      
      Filters to Apply:
      - Exam Context: ${examContext}
      - Specific Year: ${year} (approximate if exact match not found)
      
      Requirements:
      1. Provide exactly 15 questions.
      2. Include the specific exam name and year in the "examSource" field (e.g., "Rajyaseva 2019" or "Group B 2020").
      3. For Marathi subject, ensure questions are in Marathi script (Devanagari).
      4. For English subject, include questions on Grammar, Vocab, and Comprehension.
      5. **IMPORTANT**: Provide a DETAILED explanation for each question, explaining the concept or grammar rule involved clearly.
      
      Return strictly as JSON.
    `;

    // Use MODEL_FAST without search tools to improve reliability and prevent XHR timeouts.
    // Training data is sufficient for historical questions.
    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: { 
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              correctAnswerIndex: { type: Type.INTEGER },
              explanation: { type: Type.STRING, description: "Detailed explanation of why the answer is correct." },
              examSource: { type: Type.STRING, description: "The exam where this question appeared" }
            },
            required: ["question", "options", "correctAnswerIndex", "explanation"]
          }
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Empty response from AI");
    
    const data = JSON.parse(jsonText) as QuizQuestion[];
    saveToDataCenter(cacheKey, data);
    return data;
  } catch (error) {
    console.error("Error generating PYQs:", error);
    throw error;
  }
};

export const generateVocab = async (subject: Subject, category: VocabCategory): Promise<VocabWord[]> => {
  const cacheKey = getCacheKey('VOCAB', subject, category);
  const cached = getFromDataCenter<VocabWord[]>(cacheKey);
  if (cached) return cached;

  try {
    let categoryPrompt = '';
    
    if (subject === Subject.MARATHI) {
       if (category === 'IDIOMS') categoryPrompt = 'Mhani ani Vakprachar (म्हणी व वाक्प्रचार)';
       else if (category === 'SYNONYMS') categoryPrompt = 'Samanarthi Shabd (समानार्थी शब्द)';
       else if (category === 'ANTONYMS') categoryPrompt = 'Viruddharthi Shabd (विरुद्धार्थी शब्द)';
       else if (category === 'ONE_WORD') categoryPrompt = 'Shabdasamuhabaddal ek shabd (शब्दसमूहाबद्दल एक शब्द)';
    } else {
       if (category === 'IDIOMS') categoryPrompt = 'Idioms and Phrases';
       else if (category === 'SYNONYMS') categoryPrompt = 'Synonyms';
       else if (category === 'ANTONYMS') categoryPrompt = 'Antonyms';
       else if (category === 'ONE_WORD') categoryPrompt = 'One Word Substitution';
    }

    const prompt = `
      Generate 100 important ${categoryPrompt} for ${subject} subject specifically for MPSC/Competitive Exams.
      
      Output strictly in JSON.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              word: { type: Type.STRING, description: "The word, idiom, or phrase" },
              meaning: { type: Type.STRING },
              usage: { type: Type.STRING, description: "Example sentence" },
              type: { type: Type.STRING, description: "Category info" }
            },
            required: ["word", "meaning", "usage", "type"]
          }
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Empty response from AI");
    
    const data = JSON.parse(jsonText) as VocabWord[];
    saveToDataCenter(cacheKey, data);
    return data;

  } catch (error) {
    console.error("Error generating vocab:", error);
    throw error;
  }
}

export const generateCurrentAffairs = async (category: string, language: 'Marathi' | 'English' = 'Marathi'): Promise<CurrentAffairItem[]> => {
  const cacheKey = getCacheKey('NEWS', category, language);
  const cached = getFromDataCenter<CurrentAffairItem[]>(cacheKey);
  if (cached) return cached;

  try {
    const langInstruction = language === 'Marathi' 
      ? "OUTPUT LANGUAGE: MARATHI (Devanagari script). Ensure headlines and descriptions are in formal, high-quality Marathi suitable for Rajyaseva." 
      : "OUTPUT LANGUAGE: ENGLISH. Ensure professional and formal tone.";

    const prompt = `
      You are an expert MPSC content curator.
      Task: Find 5 very recent and highly relevant current affairs topics for MPSC (Maharashtra Public Service Commission) exams.
      Category: ${category}
      
      Instructions:
      1. Use Google Search to find events from the last 3-6 months.
      2. FOCUS: Prioritize **Maharashtra-specific** news (Govt schemes, State awards, Appointments, Social reforms), then National news with high exam probability.
      3. ${langInstruction}
      4. Each item must explain WHY it is relevant for MPSC (Exam Relevance).
      
      Return strictly as JSON.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_PRO,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        tools: [{ googleSearch: {} }],
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              headline: { type: Type.STRING },
              description: { type: Type.STRING, description: "Brief summary of the event (50-60 words)" },
              date: { type: Type.STRING, description: "Approximate date or month of the event" },
              category: { type: Type.STRING },
              examRelevance: { type: Type.STRING, description: "Why this is important for MPSC exam?" }
            },
            required: ["headline", "description", "date", "category", "examRelevance"]
          }
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Empty response from AI");
    
    const data = JSON.parse(jsonText) as CurrentAffairItem[];
    saveToDataCenter(cacheKey, data);
    return data;

  } catch (error) {
    console.error("Error generating current affairs:", error);
    throw error;
  }
}

export const generateDescriptiveQA = async (topic: string): Promise<DescriptiveQA> => {
  const cacheKey = getCacheKey('LIT_QA_UNI', topic); // New key to force refresh for university content
  const cached = getFromDataCenter<DescriptiveQA>(cacheKey);
  if (cached) return cached;

  try {
    const prompt = `
      You are a distinguished Professor of Marathi Literature (Ph.D. level evaluator) at a top University.
      Topic: ${topic}
      
      Task:
      1. Generate a **PhD/University Level Descriptive Question** (Deep analytical, critical, or comparative).
         - The question should not be factual; it must challenge the student to critique, analyze, or synthesize literary theories (Samiksha).
         - Focus on: Literary Flows (Pravah), Aesthetics (Saundaryashastra), Feminist/Dalit/Gramin perspectives, or specific critical analysis of the topic.
      
      2. Provide a 'Model Research Answer' in highly academic Marathi (Praman Bhasha/Samiksha Bhasha) that includes:
         - **Prastavana (Introduction):** Historical context and literary significance.
         - **Gaba (Core Analysis):** Deep critical evaluation. You MUST reference famous critics (e.g., Bhalchandra Nemade, V.L. Kulkarni, Durga Bhagwat, M.P. Rege) where relevant.
         - **Taulanik Abhyas (Comparative):** Compare with other writers or eras if applicable.
         - **Nishkarsh (Conclusion):** Academic synthesis.
      
      3. Extract 3-5 **Key Scholarly Points (Siddhanta/Mudde)**: Use literary terminology (Samiksha Sandnya).
      
      Output in JSON.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_PRO,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING, description: "PhD/University level analytical question in Marathi" },
            modelAnswer: { type: Type.STRING, description: "Full academic answer in Marathi Markdown" },
            keyPoints: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Critical terms and points" }
          },
          required: ["question", "modelAnswer", "keyPoints"]
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Empty response from AI");
    
    const data = JSON.parse(jsonText) as DescriptiveQA;
    saveToDataCenter(cacheKey, data);
    return data;

  } catch (error) {
    console.error("Error generating literature content:", error);
    throw error;
  }
}