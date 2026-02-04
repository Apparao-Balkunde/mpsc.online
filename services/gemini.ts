
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Subject, QuizQuestion, VocabWord, CurrentAffairItem, ExamType, GSSubCategory, VocabCategory, RuleExplanation, DescriptiveQA, DifficultyLevel, SubjectFocus } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_FAST = 'gemini-3-flash-preview';
const MODEL_PRO = 'gemini-3-pro-preview';
const MODEL_TTS = 'gemini-2.5-flash-preview-tts';

// Stable cache prefix for persistent storage
const CACHE_VERSION = 'MPSC_V20_'; 
const DB_NAME = 'MPSC_Sarathi_Storage';
const STORE_NAME = 'question_bank';

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

const getFromCache = async <T>(key: string): Promise<T | null> => {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(key);
    return new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    });
  } catch { return null; }
};

const saveToCache = async (key: string, data: any) => {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.put(data, key);
  } catch (e) { console.error("Cache save failed", e); }
};

/**
 * Generates questions in batches to avoid Token Limit errors
 */
export const generateMockTest = async (examType: ExamType, totalCount: number = 10, focus: SubjectFocus = 'BALANCED'): Promise<QuizQuestion[]> => {
  const cacheKey = `${CACHE_VERSION}MOCK_${examType}_${totalCount}_${focus}`;
  const cached = await getFromCache<QuizQuestion[]>(cacheKey);
  if (cached) {
    console.log("Serving mock test from local cache...");
    return cached;
  }

  const batchSize = 5; // Small batches for reliability
  let allQuestions: QuizQuestion[] = [];
  const iterations = Math.ceil(totalCount / batchSize);

  console.log(`Starting Batch Generation: ${totalCount} questions in ${iterations} batches.`);

  for (let i = 0; i < iterations; i++) {
    const currentBatchCount = Math.min(batchSize, totalCount - allQuestions.length);
    if (currentBatchCount <= 0) break;

    const prompt = `Generate exactly ${currentBatchCount} unique MCQs for MPSC ${examType} exam. 
    Focus: ${focus}. Language: Marathi (except English section). 
    Return as JSON array with fields: question, options (4 strings), correctAnswerIndex (0-3), explanation (Marathi).`;

    try {
      const response = await ai.models.generateContent({
        model: MODEL_FAST,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          systemInstruction: "You are an expert MPSC examiner. Provide unique, difficult questions. Output ONLY valid JSON.",
        }
      });

      if (response.text) {
        const batchQuestions = JSON.parse(response.text) as QuizQuestion[];
        allQuestions = [...allQuestions, ...batchQuestions];
      }
    } catch (err) {
      console.error(`Batch ${i+1} failed:`, err);
      if (allQuestions.length > 0) break; // Return what we have if some batches succeed
      throw err;
    }
  }

  if (allQuestions.length > 0) {
    await saveToCache(cacheKey, allQuestions);
  }
  
  return allQuestions;
};

// Existing functions updated with persistent caching
export const generatePYQs = async (subject: Subject, year: string, examType: ExamType, subCategory: GSSubCategory = 'ALL'): Promise<QuizQuestion[]> => {
  const key = `${CACHE_VERSION}PYQ_${examType}_${year}_${subCategory}`;
  const cached = await getFromCache<QuizQuestion[]>(key);
  if (cached) return cached;

  const prompt = `MPSC ${examType} ${year} PYQs for ${subCategory}. Exactly 10 questions. Marathi. JSON format.`;
  const response = await ai.models.generateContent({
    model: MODEL_FAST,
    contents: prompt,
    config: { responseMimeType: "application/json" }
  });
  
  const data = JSON.parse(response.text) as QuizQuestion[];
  await saveToCache(key, data);
  return data;
};

export const generateVocab = async (subject: Subject, category: VocabCategory, forceRefresh = false): Promise<VocabWord[]> => {
  const key = `${CACHE_VERSION}VOCAB_${subject}_${category}`;
  if (!forceRefresh) {
    const cached = await getFromCache<VocabWord[]>(key);
    if (cached) return cached;
  }
  const prompt = `50 MPSC vocab for ${subject} ${category}. Marathi meanings. JSON.`;
  const response = await ai.models.generateContent({
    model: MODEL_FAST,
    contents: prompt,
    config: { responseMimeType: "application/json" }
  });
  const data = JSON.parse(response.text);
  await saveToCache(key, data);
  return data;
};

export const generateQuiz = async (subject: Subject, topic: string, difficulty: DifficultyLevel, subCategory?: GSSubCategory): Promise<QuizQuestion[]> => {
  const key = `${CACHE_VERSION}QUIZ_${subject}_${topic}_${difficulty}`;
  const cached = await getFromCache<QuizQuestion[]>(key);
  if (cached) return cached;
  
  const response = await ai.models.generateContent({
    model: MODEL_FAST,
    contents: `20 MPSC MCQs for ${subject}: ${topic} (${difficulty}). Marathi. JSON.`,
    config: { responseMimeType: "application/json" }
  });
  const data = JSON.parse(response.text);
  await saveToCache(key, data);
  return data;
};

export const generateStudyNotes = async (subject: Subject, topic: string): Promise<string> => {
  const key = `${CACHE_VERSION}NOTES_${subject}_${topic}`;
  const cached = await getFromCache<string>(key);
  if (cached) return cached;
  
  const response = await ai.models.generateContent({ model: MODEL_FAST, contents: `MPSC study notes for ${subject}: ${topic} in Marathi.` });
  const data = response.text || "";
  if (data) await saveToCache(key, data);
  return data;
};

export const playTextToSpeech = async (text: string): Promise<void> => {
  const response = await ai.models.generateContent({
    model: MODEL_TTS,
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
    },
  });
  const base64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
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
  const response = await ai.models.generateContent({
    model: MODEL_FAST,
    contents: `6 MPSC news for ${category} in ${language}. JSON.`,
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(response.text);
};

export const generateDescriptiveQA = async (topic: string): Promise<DescriptiveQA> => {
  const response = await ai.models.generateContent({
    model: MODEL_PRO,
    contents: `Literature analysis for ${topic}. JSON.`,
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(response.text);
};

export const generateConciseExplanation = async (subject: Subject, topic: string): Promise<RuleExplanation> => {
    const response = await ai.models.generateContent({
        model: MODEL_FAST,
        contents: `Explain ${subject} ${topic}. JSON.`,
        config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text);
};
