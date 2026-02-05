
import { GoogleGenAI, Type, Modality, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { Subject, QuizQuestion, VocabWord, CurrentAffairItem, ExamType, GSSubCategory, VocabCategory, RuleExplanation, DescriptiveQA, DifficultyLevel, SubjectFocus } from '../types';

// Robust initialization
const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please check your environment configuration.");
  }
  return new GoogleGenAI({ apiKey });
};

// Model definitions as per guidelines
const MODEL_FLASH = 'gemini-3-flash-preview';
const MODEL_PRO = 'gemini-3-pro-preview';
const MODEL_TTS = 'gemini-2.5-flash-preview-tts';

const CACHE_VERSION = 'MPSC_V27_'; 
const DB_NAME = 'MPSC_Sarathi_Storage';
const STORE_NAME = 'question_bank';

export interface CachedResponse<T> {
  data: T;
  fromCache: boolean;
}

/**
 * Robustly cleans model output to ensure valid JSON.
 * Handles thought tags, markdown, and malformed strings.
 */
const cleanJsonResponse = (text: string): string => {
  let cleaned = text.trim();
  
  // Remove <thought>...</thought> blocks if model uses reasoning
  cleaned = cleaned.replace(/<thought>[\s\S]*?<\/thought>/g, '');

  // Remove markdown wrappers if present
  if (cleaned.includes('```json')) {
    cleaned = cleaned.split('```json')[1].split('```')[0].trim();
  } else if (cleaned.includes('```')) {
    const parts = cleaned.split('```');
    if (parts.length >= 3) {
        cleaned = parts[1].trim();
    }
  }
  
  // Attempt to find the bounds of JSON array or object
  const startIdx = Math.min(
    cleaned.indexOf('[') === -1 ? Infinity : cleaned.indexOf('['),
    cleaned.indexOf('{') === -1 ? Infinity : cleaned.indexOf('{')
  );
  const endIdx = Math.max(
    cleaned.lastIndexOf(']'),
    cleaned.lastIndexOf('}')
  );

  if (startIdx !== Infinity && endIdx !== -1) {
    cleaned = cleaned.substring(startIdx, endIdx + 1);
  }

  return cleaned;
};

const quizQuestionSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      question: { type: Type.STRING, description: "MCQ question in Marathi" },
      options: { 
        type: Type.ARRAY, 
        items: { type: Type.STRING },
        description: "List of exactly 4 options"
      },
      correctAnswerIndex: { type: Type.INTEGER, description: "Index (0-3) of the correct answer" },
      explanation: { type: Type.STRING, description: "Detailed reasoning in Marathi" },
      subCategory: { type: Type.STRING, description: "Subject category (e.g., History, Polity, Marathi Grammar, English Grammar, Geography, Economics, Science)" }
    },
    required: ["question", "options", "correctAnswerIndex", "explanation", "subCategory"]
  }
};

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 6);
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

export const clearAllCache = async () => {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.clear();
    return true;
  } catch (e) { return false; }
};

export const getCachedMockKeys = async (): Promise<string[]> => {
    try {
        const db = await openDB();
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAllKeys();
        return new Promise((resolve) => {
            request.onsuccess = () => {
                const keys = (request.result as string[]).filter(k => k.startsWith(`${CACHE_VERSION}MOCK_`));
                resolve(keys);
            };
            request.onerror = () => resolve([]);
        });
    } catch { return []; }
};

/**
 * Attempts generation with fallback between FLASH and PRO models
 * Also applies broad safety settings to avoid false positive blocks in educational topics.
 */
async function generateWithFallback(prompt: string, schema: any, modelPreference: string = MODEL_FLASH) {
  const ai = getAIClient();
  const modelsToTry = modelPreference === MODEL_PRO ? [MODEL_PRO, MODEL_FLASH] : [MODEL_FLASH, MODEL_PRO];
  
  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
          responseSchema: schema,
          temperature: 0.8,
          // Apply minimal safety blocking for history/polity topics
          safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE }
          ]
        }
      });
      
      if (response.text) {
        const cleaned = cleanJsonResponse(response.text);
        return JSON.parse(cleaned);
      }
    } catch (err: any) {
      console.warn(`Generation attempt with ${model} failed:`, err.message);
      lastError = err;
      // If it's a 429, don't immediately try the next model, might be same quota
      if (err.message?.includes('429')) break;
    }
  }
  
  throw lastError || new Error("Connection failed. Try again in 1 minute.");
}

export const generateMockTest = async (examType: ExamType, totalCount: number = 10, focus: SubjectFocus = 'BALANCED', forceNew = false): Promise<CachedResponse<QuizQuestion[]>> => {
  const cacheKey = `${CACHE_VERSION}MOCK_${examType}_${totalCount}_${focus}`;
  
  if (!forceNew) {
    const cached = await getFromCache<QuizQuestion[]>(cacheKey);
    if (cached) return { data: cached, fromCache: true };
  }

  const batchSize = 5; 
  let allQuestions: QuizQuestion[] = [];
  const iterations = Math.ceil(totalCount / batchSize);

  for (let i = 0; i < iterations; i++) {
    const currentBatchCount = Math.min(batchSize, totalCount - allQuestions.length);
    if (currentBatchCount <= 0) break;

    const prompt = `Act as an MPSC examiner. Generate ${currentBatchCount} distinct MCQs for the ${examType} exam. 
    Focus: ${focus}. Language: Marathi. Output ONLY the raw JSON array. 
    Each question MUST include a "subCategory" field indicating the subject (e.g. History, Polity, Geography, Marathi Grammar, English Grammar).
    Include complex reasoning in explanations. Ensure historical/political accuracy.`;
    
    try {
      const batch = await generateWithFallback(prompt, quizQuestionSchema, MODEL_PRO);
      allQuestions = [...allQuestions, ...batch];
    } catch (err) {
      if (allQuestions.length > 0) break; 
      throw err;
    }
  }

  if (allQuestions.length > 0) {
    await saveToCache(cacheKey, allQuestions);
  }
  
  return { data: allQuestions, fromCache: false };
};

export const generateQuiz = async (subject: Subject, topic: string, difficulty: DifficultyLevel, subCategory?: GSSubCategory): Promise<CachedResponse<QuizQuestion[]>> => {
  const key = `${CACHE_VERSION}QUIZ_${subject}_${topic}_${difficulty}`;
  const cached = await getFromCache<QuizQuestion[]>(key);
  if (cached) return { data: cached, fromCache: true };
  
  const prompt = `Generate exactly 15 MPSC practice MCQs for ${subject}: ${topic}. Difficulty: ${difficulty}. Language: Formal Marathi. Focus on key exam concepts. Ensure "subCategory" is set to "${subject}".`;
  
  const data = await generateWithFallback(prompt, quizQuestionSchema, MODEL_FLASH);
  await saveToCache(key, data);
  return { data, fromCache: false };
};

export const generatePYQs = async (subject: Subject, year: string, examType: ExamType, subCategory: GSSubCategory = 'ALL'): Promise<CachedResponse<QuizQuestion[]>> => {
    const key = `${CACHE_VERSION}PYQ_${examType}_${year}_${subCategory}`;
    const cached = await getFromCache<QuizQuestion[]>(key);
    if (cached) return { data: cached, fromCache: true };
  
    const prompt = `Retrieve 10 authentic General Studies questions from the MPSC ${examType} exam conducted in ${year}. Section: ${subCategory}. Provide detailed Marathi analysis. Set "subCategory" to the appropriate GS subject.`;
    
    const data = await generateWithFallback(prompt, quizQuestionSchema, MODEL_FLASH);
    await saveToCache(key, data);
    return { data, fromCache: false };
};

export const generateVocab = async (subject: Subject, category: VocabCategory, forceRefresh = false): Promise<CachedResponse<VocabWord[]>> => {
  const key = `${CACHE_VERSION}VOCAB_${subject}_${category}`;
  if (!forceRefresh) {
    const cached = await getFromCache<VocabWord[]>(key);
    if (cached) return { data: cached, fromCache: true };
  }
  
  const prompt = `Create a list of 20 high-frequency vocab words for MPSC ${subject}. Category: ${category}. Include meanings and sentence usage in Marathi.`;
  
  const schema = {
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
      required: ["word", "meaning", "usage", "type"]
    }
  };

  const data = await generateWithFallback(prompt, schema, MODEL_FLASH);
  await saveToCache(key, data);
  return { data, fromCache: false };
};

export const generateStudyNotes = async (subject: Subject, topic: string): Promise<CachedResponse<string>> => {
  const key = `${CACHE_VERSION}NOTES_${subject}_${topic}`;
  const cached = await getFromCache<string>(key);
  if (cached) return { data: cached, fromCache: true };
  
  const ai = getAIClient();
  const response = await ai.models.generateContent({ 
    model: MODEL_FLASH, 
    contents: [{ parts: [{ text: `Create detailed, bulleted MPSC study notes for ${subject} on: ${topic}. Use formal Marathi and highlight important terms for exams.` }] }]
  });
  const data = response.text || "";
  if (data) await saveToCache(key, data);
  return { data, fromCache: false };
};

export const generateConciseExplanation = async (subject: Subject, rule: string): Promise<CachedResponse<RuleExplanation>> => {
    const key = `${CACHE_VERSION}RULE_${subject}_${rule}`;
    const cached = await getFromCache<RuleExplanation>(key);
    if (cached) return { data: cached, fromCache: true };
  
    const prompt = `Analyze and explain the MPSC ${subject} concept: "${rule}". Provide definition, nuances, and exam-style examples in Marathi.`;
    
    const schema = {
      type: Type.OBJECT,
      properties: {
        definition: { type: Type.STRING },
        importance: { type: Type.STRING },
        nuances: { type: Type.STRING },
        examples: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["definition", "importance", "nuances", "examples"]
    };

    const data = await generateWithFallback(prompt, schema, MODEL_FLASH);
    await saveToCache(key, data);
    return { data, fromCache: false };
};

export const generateDescriptiveQA = async (topic: string): Promise<CachedResponse<DescriptiveQA>> => {
    const key = `${CACHE_VERSION}LIT_${topic}`;
    const cached = await getFromCache<DescriptiveQA>(key);
    if (cached) return { data: cached, fromCache: true };
  
    const prompt = `Write a descriptive analytical answer for MPSC Mains on the topic: "${topic}". Include a sample question and points for evaluation.`;
    
    const schema = {
      type: Type.OBJECT,
      properties: {
        question: { type: Type.STRING },
        modelAnswer: { type: Type.STRING },
        keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["question", "modelAnswer", "keyPoints"]
    };

    const data = await generateWithFallback(prompt, schema, MODEL_PRO);
    await saveToCache(key, data);
    return { data, fromCache: false };
};

export const generateCurrentAffairs = async (category: string, language: string): Promise<CachedResponse<CurrentAffairItem[]>> => {
    const key = `${CACHE_VERSION}NEWS_${category}_${language}`;
    const cached = await getFromCache<CurrentAffairItem[]>(key);
    if (cached) return { data: cached, fromCache: true };
  
    const prompt = `List 6 highly relevant current news items for MPSC in ${language}. Category: ${category}. Explain why they are important for the exam.`;
    
    const schema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          headline: { type: Type.STRING },
          description: { type: Type.STRING },
          date: { type: Type.STRING },
          category: { type: Type.STRING },
          examRelevance: { type: Type.STRING }
        },
        required: ["headline", "description", "date", "category", "examRelevance"]
      }
    };

    const data = await generateWithFallback(prompt, schema, MODEL_FLASH);
    await saveToCache(key, data);
    return { data, fromCache: false };
};

export const playTextToSpeech = async (text: string): Promise<void> => {
  const ai = getAIClient();
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
