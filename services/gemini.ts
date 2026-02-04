
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Subject, QuizQuestion, VocabWord, CurrentAffairItem, ExamType, GSSubCategory, VocabCategory, RuleExplanation, DescriptiveQA, DifficultyLevel } from '../types';

// Initializing the GoogleGenAI client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_FAST = 'gemini-3-flash-preview';
const MODEL_PRO = 'gemini-3-pro-preview';
const MODEL_TTS = 'gemini-2.5-flash-preview-tts';

// --- ROBUST LOCAL DATA CENTER (IndexedDB) ---
// Using V10 to ensure a clean slate and avoid any previous 'mixed' data
const CACHE_VERSION_PREFIX = 'MPSC_SARATHI_V10_';
const DB_NAME = 'MPSC_Sarathi_Local_DB';
const STORE_NAME = 'exam_data_cache';

/**
 * Generates a unique, strict key for each request type to prevent data pollution.
 */
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

/**
 * Strict Local Retrieval: If data exists, return it immediately.
 */
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

/**
 * Save data to Local DB for offline/subsequent use.
 */
const saveLocalData = async (key: string, data: any) => {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.put(data, key);
    console.log(`[Cache Save] Data for ${key} stored locally.`);
  } catch (e) {
    console.error("Local storage failed", e);
  }
};

// --- API SERVICES WITH STRICT CACHING ---

export const generatePYQs = async (subject: Subject, year: string, examType: ExamType, subCategory: GSSubCategory = 'ALL'): Promise<QuizQuestion[]> => {
  // Key now includes ExamType and SubCategory to prevent mixing
  const key = getCacheKey('PYQ', examType, year, subCategory);
  
  // 1. Check Local DB First
  const cached = await getLocalData<QuizQuestion[]>(key);
  if (cached) return cached;

  // 2. Call Gemini ONLY if not in local storage
  console.log(`[API Call] Fetching ${examType} ${year} GS from Gemini...`);
  const prompt = `
    STRICT MPSC GS ARCHIVE REQUEST.
    EXAM: MPSC ${examType}
    YEAR: ${year}
    SECTION: ${subCategory === 'ALL' ? 'Complete General Studies' : subCategory}
    
    RULES:
    - ONLY return questions from the actual ${examType} ${year} exam.
    - NO mixing with other exam types.
    - NO Marathi/English language or grammar questions.
    - ALL content (Q, Options, Explanation) MUST be in MARATHI.
    - Provide a deep 250-word analysis for each answer in Marathi.
    - Return a JSON array of 20 questions.
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
            examSource: { type: Type.STRING }
          },
          required: ["question", "options", "correctAnswerIndex", "explanation", "examSource"]
        }
      }
    }
  });

  const data = JSON.parse(response.text) as QuizQuestion[];
  
  // 3. Save for future local serving
  await saveLocalData(key, data);
  return data;
};

export const generateQuiz = async (subject: Subject, topic: string, difficulty: DifficultyLevel, subCategory?: GSSubCategory): Promise<QuizQuestion[]> => {
  const key = getCacheKey('QUIZ', subject, topic, difficulty, subCategory || 'NONE');
  
  const cached = await getLocalData<QuizQuestion[]>(key);
  if (cached) return cached;

  const prompt = `Generate 15 MPSC MCQs for ${subject}, Topic: ${topic}, Difficulty: ${difficulty}. Section: ${subCategory}. Everything in Marathi. Detailed 200-word analysis for each.`;
  
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
            explanation: { type: Type.STRING }
          },
          required: ["question", "options", "correctAnswerIndex", "explanation"]
        }
      }
    }
  });

  const data = JSON.parse(response.text);
  await saveLocalData(key, data);
  return data;
};

export const generateVocab = async (subject: Subject, category: VocabCategory, forceRefresh = false): Promise<VocabWord[]> => {
  const key = getCacheKey('VOCAB', subject, category);
  
  if (!forceRefresh) {
    const cached = await getLocalData<VocabWord[]>(key);
    if (cached) return cached;
  }

  const prompt = `Generate 50 MPSC high-yield vocab for ${subject} ${category}. Include Marathi meanings, usage, synonyms/antonyms. JSON format.`;
  
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

export const generateStudyNotes = async (subject: Subject, topic: string): Promise<string> => {
  const key = getCacheKey('NOTES', subject, topic);
  const cached = await getLocalData<string>(key);
  if (cached) return cached;

  const prompt = `Generate expert MPSC study notes for ${subject}: ${topic}. Use Markdown. Language: Marathi.`;
  const response = await ai.models.generateContent({ model: MODEL_FAST, contents: prompt });
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

// Simplified wrappers for other components
export const generateCurrentAffairs = async (category: string, language: string): Promise<CurrentAffairItem[]> => {
  const key = getCacheKey('NEWS', category, language);
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
  const key = getCacheKey('LIT', topic);
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
    const key = getCacheKey('EXPLAIN', subject, topic);
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
