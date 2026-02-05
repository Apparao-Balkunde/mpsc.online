
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Subject, QuizQuestion, VocabWord, CurrentAffairItem, ExamType, GSSubCategory, VocabCategory, RuleExplanation, DescriptiveQA, DifficultyLevel, SubjectFocus, PYQSection, PYQStage } from '../types';

// Always initialize inside the function to ensure we use the latest key
const getAIClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_FAST = 'gemini-3-flash-preview';
const MODEL_PRO = 'gemini-3-pro-preview';
const MODEL_TTS = 'gemini-2.5-flash-preview-tts';

const CACHE_VERSION = 'MPSC_V24_'; 
const DB_NAME = 'MPSC_Sarathi_Storage';
const STORE_NAME = 'question_bank';

export interface CachedResponse<T> {
  data: T;
  fromCache: boolean;
}

// Cleaning logic to handle potential markdown blocks in response
const cleanJsonResponse = (text: string): string => {
  return text.replace(/```json/g, '').replace(/```/g, '').trim();
};

// Reusable Schema Definitions
const quizQuestionSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      question: { type: Type.STRING, description: "The MCQ question in Marathi" },
      options: { 
        type: Type.ARRAY, 
        items: { type: Type.STRING },
        description: "Exactly 4 options in Marathi"
      },
      correctAnswerIndex: { type: Type.INTEGER, description: "Index of correct option (0-3)" },
      explanation: { type: Type.STRING, description: "Detailed explanation in Marathi" }
    },
    required: ["question", "options", "correctAnswerIndex", "explanation"]
  }
};

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 4);
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

export const generateMockTest = async (examType: ExamType, totalCount: number = 10, focus: SubjectFocus = 'BALANCED', forceNew = false): Promise<CachedResponse<QuizQuestion[]>> => {
  const cacheKey = `${CACHE_VERSION}MOCK_${examType}_${totalCount}_${focus}`;
  
  if (!forceNew) {
    const cached = await getFromCache<QuizQuestion[]>(cacheKey);
    if (cached) return { data: cached, fromCache: true };
  }

  const ai = getAIClient();
  const batchSize = 5; // Smaller batches for better stability
  let allQuestions: QuizQuestion[] = [];
  const iterations = Math.ceil(totalCount / batchSize);

  for (let i = 0; i < iterations; i++) {
    const currentBatchCount = Math.min(batchSize, totalCount - allQuestions.length);
    if (currentBatchCount <= 0) break;

    try {
        const response = await ai.models.generateContent({
            model: MODEL_PRO, // Using PRO for better reasoning and schema adherence
            contents: [{ parts: [{ text: `Generate ${currentBatchCount} unique, high-difficulty MPSC questions for ${examType} exam. Focus on ${focus}. Each question must have 4 options, a correct index, and a deep Marathi explanation.` }] }],
            config: {
              responseMimeType: "application/json",
              responseSchema: quizQuestionSchema,
              systemInstruction: "You are a senior MPSC paper setter. Use formal Marathi for GS and Grammar. Return ONLY valid JSON array."
            }
          });
      
          if (response.text) {
            const cleaned = cleanJsonResponse(response.text);
            const batch = JSON.parse(cleaned) as QuizQuestion[];
            allQuestions = [...allQuestions, ...batch];
          }
    } catch (err) {
        console.error("Batch generation error:", err);
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
  
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: MODEL_PRO,
    contents: [{ parts: [{ text: `Generate 15 high-quality MPSC practice MCQs for ${subject}: ${topic} with ${difficulty} difficulty level in Marathi.` }] }],
    config: { 
        responseMimeType: "application/json",
        responseSchema: quizQuestionSchema
    }
  });
  
  const cleaned = cleanJsonResponse(response.text);
  const data = JSON.parse(cleaned);
  await saveToCache(key, data);
  return { data, fromCache: false };
};

export const generatePYQs = async (
  subject: Subject,
  year: string,
  examType: ExamType,
  subCategory: GSSubCategory = 'ALL',
  stage: PYQStage = 'PRELIMS',
  section: PYQSection = 'ALL'
): Promise<CachedResponse<QuizQuestion[]>> => {
    const key = `${CACHE_VERSION}PYQ_${examType}_${year}_${stage}_${section}_${subCategory}`;
    const cached = await getFromCache<QuizQuestion[]>(key);
    if (cached) return { data: cached, fromCache: true };
  
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: [{ parts: [{ text: `Provide 10 MPSC ${examType} ${stage} PYQs from year ${year}. Section focus: ${section}. GS sub-category focus: ${subCategory}. Return MCQs with detailed Marathi explanations.` }] }],
      config: { 
          responseMimeType: "application/json",
          responseSchema: quizQuestionSchema
      }
    });
    
    const cleaned = cleanJsonResponse(response.text);
    const data = JSON.parse(cleaned);
    await saveToCache(key, data);
    return { data, fromCache: false };
};

export const generateVocab = async (subject: Subject, category: VocabCategory, forceRefresh = false): Promise<CachedResponse<VocabWord[]>> => {
  const key = `${CACHE_VERSION}VOCAB_${subject}_${category}`;
  if (!forceRefresh) {
    const cached = await getFromCache<VocabWord[]>(key);
    if (cached) return { data: cached, fromCache: true };
  }
  
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: MODEL_FAST,
    contents: [{ parts: [{ text: `List 50 high-frequency MPSC vocabulary words for ${subject} under category ${category}. Provide meanings and usage in Marathi.` }] }],
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
                required: ["word", "meaning", "usage", "type"]
            }
        }
    }
  });
  const cleaned = cleanJsonResponse(response.text);
  const data = JSON.parse(cleaned);
  await saveToCache(key, data);
  return { data, fromCache: false };
};

export const generateStudyNotes = async (subject: Subject, topic: string): Promise<CachedResponse<string>> => {
  const key = `${CACHE_VERSION}NOTES_${subject}_${topic}`;
  const cached = await getFromCache<string>(key);
  if (cached) return { data: cached, fromCache: true };
  
  const ai = getAIClient();
  const response = await ai.models.generateContent({ 
    model: MODEL_FAST, 
    contents: [{ parts: [{ text: `Create comprehensive MPSC study notes for ${subject} on the topic: ${topic}. Use Marathi, include bullet points and examples.` }] }]
  });
  const data = response.text || "";
  if (data) await saveToCache(key, data);
  return { data, fromCache: false };
};

export const generateConciseExplanation = async (subject: Subject, rule: string): Promise<CachedResponse<RuleExplanation>> => {
    const key = `${CACHE_VERSION}RULE_${subject}_${rule}`;
    const cached = await getFromCache<RuleExplanation>(key);
    if (cached) return { data: cached, fromCache: true };
  
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: [{ parts: [{ text: `Explain MPSC ${subject} rule: ${rule} in a concise format with examples.` }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            definition: { type: Type.STRING },
            importance: { type: Type.STRING },
            nuances: { type: Type.STRING },
            examples: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["definition", "importance", "nuances", "examples"]
        }
      }
    });
  
    const cleaned = cleanJsonResponse(response.text);
    const data = JSON.parse(cleaned);
    await saveToCache(key, data);
    return { data, fromCache: false };
};

export const generateDescriptiveQA = async (topic: string): Promise<CachedResponse<DescriptiveQA>> => {
    const key = `${CACHE_VERSION}LIT_${topic}`;
    const cached = await getFromCache<DescriptiveQA>(key);
    if (cached) return { data: cached, fromCache: true };
  
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: MODEL_PRO,
      contents: [{ parts: [{ text: `Critically analyze the literature topic: ${topic}. Formulate a descriptive question and a model answer for MPSC Mains.` }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            modelAnswer: { type: Type.STRING },
            keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["question", "modelAnswer", "keyPoints"]
        }
      }
    });
  
    const cleaned = cleanJsonResponse(response.text);
    const data = JSON.parse(cleaned);
    await saveToCache(key, data);
    return { data, fromCache: false };
};

export const generateCurrentAffairs = async (category: string, language: string): Promise<CachedResponse<CurrentAffairItem[]>> => {
    const key = `${CACHE_VERSION}NEWS_${category}_${language}`;
    const cached = await getFromCache<CurrentAffairItem[]>(key);
    if (cached) return { data: cached, fromCache: true };
  
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: [{ parts: [{ text: `List 6 most important current events for MPSC in ${language} under category ${category}. Focus on facts relevant to exams.` }] }],
      config: { 
          responseMimeType: "application/json",
          responseSchema: {
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
          }
      }
    });
    const cleaned = cleanJsonResponse(response.text);
    const data = JSON.parse(cleaned);
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
