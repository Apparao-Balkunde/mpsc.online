
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Subject, QuizQuestion, VocabWord, CurrentAffairItem, ExamType, GSSubCategory, VocabCategory, RuleExplanation, DescriptiveQA, DifficultyLevel } from '../types';

// Initializing the GoogleGenAI client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_FAST = 'gemini-3-flash-preview';
const MODEL_PRO = 'gemini-3-pro-preview';
const MODEL_TTS = 'gemini-2.5-flash-preview-tts';

// --- ROBUST LOCAL DATA CENTER (IndexedDB) ---
// Bumped to V13 to force clear old 'mixed' category data
const CACHE_VERSION_PREFIX = 'MPSC_SARATHI_V13_'; 
const DB_NAME = 'MPSC_Sarathi_Local_DB';
const STORE_NAME = 'exam_data_cache';

const getCacheKey = (type: string, ...parts: string[]) => {
  return (CACHE_VERSION_PREFIX + type + '_' + parts.join('_')).toUpperCase().replace(/[^A-Z0-9_]/g, '_');
};

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const getLocalData = async <T>(key: string): Promise<T | null> => {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);
      request.onsuccess = () => {
        if (request.result) {
          console.log(`[Cache Hit] Serving ${key} from Local DB`);
          resolve(request.result as T);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => resolve(null);
    });
  } catch (e) {
    return null;
  }
};

const saveLocalData = async (key: string, data: any) => {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.put(data, key);
  } catch (e) {
    console.error("Local storage failed", e);
  }
};

// --- API SERVICES ---

/**
 * Generates PYQs with strict sectional integrity.
 */
export const generatePYQs = async (subject: Subject, year: string, examType: ExamType, subCategory: GSSubCategory = 'ALL'): Promise<QuizQuestion[]> => {
  const key = getCacheKey('PYQ_STRICT', examType, year, subCategory);
  
  // 1. Check Local DB First (Fast, Offline-Friendly)
  const cached = await getLocalData<QuizQuestion[]>(key);
  if (cached) return cached;

  console.log(`[API Call] Fetching strict ${subCategory} set for ${examType} ${year}...`);
  
  const categoryContext = subCategory === 'ALL' 
    ? "General Studies (Mix of all subjects)" 
    : `STRICTLY ONLY ${subCategory} (Do not include other subjects like Polity if History is requested).`;

  const prompt = `
    You are an MPSC Subject Expert. Provide a comprehensive set of General Studies questions from the ${examType} ${year} Prelims.
    
    REQUIRED CATEGORY: ${categoryContext}
    
    STRICT RULES:
    1. CATEGORY ISOLATION: If the category is ${subCategory}, return ONLY questions belonging to ${subCategory}. 
    2. TARGET QUANTITY: Provide up to 100 questions. If 100 are not available for this specific category in the specific year, provide at least 40 high-quality authentic ones and fill the rest with very similar pattern questions from that specific era's MPSC papers.
    3. LANGUAGE: Pure Marathi (Devanagari) for all text.
    4. ANALYSIS: Provide a deep 150-word explanation for each question in Marathi, explaining WHY the option is correct and why others are wrong.
    5. DATA INTEGRITY: Ensure the 'subCategory' field in JSON strictly matches "${subCategory}".
    6. FORMAT: Strictly JSON array.
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
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctAnswerIndex: { type: Type.INTEGER },
            explanation: { type: Type.STRING },
            examSource: { type: Type.STRING },
            subCategory: { type: Type.STRING, description: "Must be " + subCategory }
          },
          required: ["question", "options", "correctAnswerIndex", "explanation", "examSource", "subCategory"]
        }
      }
    }
  });

  const data = JSON.parse(response.text) as QuizQuestion[];
  
  // Extra safeguard: Filter data locally before saving to ensure Gemini didn't hallucinate mixed results
  // Fixed redundant check: subCategory is narrowed to exclude 'ALL' in this branch, so || subCategory === 'ALL' is unnecessary.
  const filteredData = subCategory === 'ALL' 
    ? data 
    : data.filter(q => (q as any).subCategory === subCategory);

  await saveLocalData(key, filteredData);
  return filteredData;
};

export const generateVocab = async (subject: Subject, category: VocabCategory, forceRefresh = false): Promise<VocabWord[]> => {
  const key = getCacheKey('VOCAB_V13', subject, category);
  
  if (!forceRefresh) {
    const cached = await getLocalData<VocabWord[]>(key);
    if (cached) return cached;
  }

  const prompt = `
    Generate 50 high-yield MPSC vocabulary items for ${subject} ${category}.
    
    SPECIAL TASK - TRICKY COMPARISONS:
    For every word, you MUST identify and include a "TRICKY PAIR" or "CONFUSING WORD".
    
    EXAMPLES:
    - English: 'Device' (noun) vs 'Devise' (verb).
    - Marathi: 'पाणी' (Water) vs 'पाणि' (Hand).
    
    FORMAT for Tricky Pair: "VS: [word] - [meaning/nuance]"
    All meanings must be in Marathi.
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
            word: { type: Type.STRING },
            meaning: { type: Type.STRING },
            usage: { type: Type.STRING },
            type: { type: Type.STRING },
            relatedWords: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["word", "meaning", "usage", "type", "relatedWords"]
        }
      }
    }
  });

  
  const data = JSON.parse(response.text);
  await saveLocalData(key, data);
  return data;
};

export const generateQuiz = async (subject: Subject, topic: string, difficulty: DifficultyLevel, subCategory?: GSSubCategory): Promise<QuizQuestion[]> => {
  const key = getCacheKey('QUIZ_V13', subject, topic, difficulty, subCategory || 'NONE');
  const cached = await getLocalData<QuizQuestion[]>(key);
  if (cached) return cached;

  const response = await ai.models.generateContent({
    model: MODEL_FAST,
    contents: `Generate 20 MPSC MCQs for ${subject}, Topic: ${topic}, Difficulty: ${difficulty}. Section: ${subCategory}. Everything in Marathi.`,
    config: { responseMimeType: "application/json" }
  });

  const data = JSON.parse(response.text);
  await saveLocalData(key, data);
  return data;
};

export const generateStudyNotes = async (subject: Subject, topic: string): Promise<string> => {
  const key = getCacheKey('NOTES_V13', subject, topic);
  const cached = await getLocalData<string>(key);
  if (cached) return cached;

  const response = await ai.models.generateContent({ model: MODEL_FAST, contents: `Generate MPSC study notes for ${subject}: ${topic} in Marathi.` });
  const data = response.text || "";
  if (data) await saveLocalData(key, data);
  return data;
};

export const playTextToSpeech = async (text: string): Promise<void> => {
  const key = getCacheKey('TTS', text.substring(0, 30));
  let base64 = await getLocalData<string>(key);
  if (!base64) {
    const response = await ai.models.generateContent({
      model: MODEL_TTS,
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
      },
    });
    base64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64) await saveLocalData(key, base64);
  }
  if (base64) {
    const audioBytes = atob(base64);
    const len = audioBytes.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = audioBytes.charCodeAt(i);
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const dataInt16 = new Int16Array(bytes.buffer);
    const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start();
  }
};

export const generateCurrentAffairs = async (category: string, language: string): Promise<CurrentAffairItem[]> => {
  const key = getCacheKey('NEWS_V13', category, language);
  const cached = await getLocalData<CurrentAffairItem[]>(key);
  if (cached) return cached;
  const response = await ai.models.generateContent({
    model: MODEL_FAST,
    contents: `Generate 6 MPSC news for ${category} in ${language}. JSON.`,
    config: { responseMimeType: "application/json" }
  });
  const data = JSON.parse(response.text);
  await saveLocalData(key, data);
  return data;
};

export const generateDescriptiveQA = async (topic: string): Promise<DescriptiveQA> => {
  const key = getCacheKey('LIT_V13', topic);
  const cached = await getLocalData<DescriptiveQA>(key);
  if (cached) return cached;
  const response = await ai.models.generateContent({
    model: MODEL_PRO,
    contents: `Literature analysis for ${topic}. JSON.`,
    config: { responseMimeType: "application/json" }
  });
  const data = JSON.parse(response.text);
  await saveLocalData(key, data);
  return data;
};

export const generateConciseExplanation = async (subject: Subject, topic: string): Promise<RuleExplanation> => {
    const key = getCacheKey('EXPLAIN_V13', subject, topic);
    const cached = await getLocalData<RuleExplanation>(key);
    if (cached) return cached;
    const response = await ai.models.generateContent({
        model: MODEL_FAST,
        contents: `Explain ${subject} ${topic} in detail. JSON.`,
        config: { responseMimeType: "application/json" }
    });
    const data = JSON.parse(response.text);
    await saveLocalData(key, data);
    return data;
};
