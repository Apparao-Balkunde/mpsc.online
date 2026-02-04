
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Subject, QuizQuestion, VocabWord, CurrentAffairItem, ExamType, GSSubCategory, VocabCategory, RuleExplanation, DescriptiveQA, DifficultyLevel, SubjectFocus } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_FAST = 'gemini-3-flash-preview';
const MODEL_PRO = 'gemini-3-pro-preview';
const MODEL_TTS = 'gemini-2.5-flash-preview-tts';

const CACHE_VERSION_PREFIX = 'MPSC_SARATHI_V18_MOCK_'; 
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
        if (request.result) resolve(request.result as T);
        else resolve(null);
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

export const generateMockTest = async (examType: ExamType, questionCount: number = 10, focus: SubjectFocus = 'BALANCED'): Promise<QuizQuestion[]> => {
  const key = getCacheKey('MOCK_TEST', examType, questionCount.toString(), focus);
  const cached = await getLocalData<QuizQuestion[]>(key);
  if (cached) return cached;

  console.log(`Generating Mock Test: ${examType}, Count: ${questionCount}`);

  let prompt = "";
  if (examType === 'RAJYASEVA') {
    prompt = `Generate a set of exactly ${questionCount} MCQs for MPSC Rajyaseva GS Paper 1. 
    Mix topics like History, Geography, Polity, Economics, and Science. 
    Questions must be in Marathi (Devanagari). 
    Return as a JSON array where each object has: question, options (4 strings), correctAnswerIndex (0-3), and explanation (detailed Marathi analysis).`;
  } else {
    let mixDescription = "Balanced mix of Marathi, English, and GS";
    if (focus === 'MARATHI_HEAVY') mixDescription = "Focusing mostly on Marathi Grammar";
    if (focus === 'ENGLISH_HEAVY') mixDescription = "Focusing mostly on English Grammar";
    if (focus === 'GS_HEAVY') mixDescription = "Focusing mostly on General Studies";

    prompt = `Generate a set of exactly ${questionCount} MCQs for MPSC Combined (Group B/C) Exam.
    Subject Priority: ${mixDescription}.
    Marathi and GS questions in Marathi, English questions in English (explanations in Marathi).
    Return as a JSON array where each object has: question, options (4 strings), correctAnswerIndex (0-3), and explanation (detailed Marathi analysis).`;
  }

  try {
    const isLargeBatch = questionCount > 20;
    const response = await ai.models.generateContent({
      model: isLargeBatch ? MODEL_PRO : MODEL_FAST,
      contents: prompt,
      config: {
        systemInstruction: "You are a professional MPSC exam paper setter. Provide high-yield, exam-oriented questions strictly in JSON format. Ensure all Marathi text is valid Devanagari.",
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: isLargeBatch ? 4096 : 0 },
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

    if (!response.text) throw new Error("AI returned empty content");
    const data = JSON.parse(response.text) as QuizQuestion[];
    await saveLocalData(key, data);
    return data;
  } catch (err) {
    console.error("Mock generation failed:", err);
    throw err;
  }
};

export const generatePYQs = async (subject: Subject, year: string, examType: ExamType, subCategory: GSSubCategory = 'ALL'): Promise<QuizQuestion[]> => {
  const key = getCacheKey('PYQ_STRICT', examType, year, subCategory);
  const cached = await getLocalData<QuizQuestion[]>(key);
  if (cached) return cached;
  const prompt = `Provide GS questions from ${examType} ${year} Prelims. Category: ${subCategory}. Return exactly as JSON array. Marathi.`;
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
            subCategory: { type: Type.STRING }
          },
          required: ["question", "options", "correctAnswerIndex", "explanation", "examSource", "subCategory"]
        }
      }
    }
  });
  const data = JSON.parse(response.text) as QuizQuestion[];
  await saveLocalData(key, data);
  return data;
};

export const generateVocab = async (subject: Subject, category: VocabCategory, forceRefresh = false): Promise<VocabWord[]> => {
  const key = getCacheKey('VOCAB_V14', subject, category);
  if (!forceRefresh) {
    const cached = await getLocalData<VocabWord[]>(key);
    if (cached) return cached;
  }
  const prompt = `Generate 50 MPSC vocab for ${subject} ${category}. Tricky pair included. Marathi meanings.`;
  const response = await ai.models.generateContent({
    model: MODEL_FAST,
    contents: prompt,
    config: { responseMimeType: "application/json" }
  });
  const data = JSON.parse(response.text);
  await saveLocalData(key, data);
  return data;
};

export const generateQuiz = async (subject: Subject, topic: string, difficulty: DifficultyLevel, subCategory?: GSSubCategory): Promise<QuizQuestion[]> => {
  const key = getCacheKey('QUIZ_V14', subject, topic, difficulty, subCategory || 'NONE');
  const cached = await getLocalData<QuizQuestion[]>(key);
  if (cached) return cached;
  const response = await ai.models.generateContent({
    model: MODEL_FAST,
    contents: `Generate 20 MPSC MCQs for ${subject}, Topic: ${topic}, Difficulty: ${difficulty}. Marathi.`,
    config: { responseMimeType: "application/json" }
  });
  const data = JSON.parse(response.text);
  await saveLocalData(key, data);
  return data;
};

export const generateStudyNotes = async (subject: Subject, topic: string): Promise<string> => {
  const key = getCacheKey('NOTES_V14', subject, topic);
  const cached = await getLocalData<string>(key);
  if (cached) return cached;
  const response = await ai.models.generateContent({ model: MODEL_FAST, contents: `Generate MPSC study notes for ${subject}: ${topic} in Marathi.` });
  const data = response.text || "";
  if (data) await saveLocalData(key, data);
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
    contents: `Generate 6 MPSC news for ${category} in ${language}. JSON.`,
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
        contents: `Explain ${subject} ${topic} in detail. JSON.`,
        config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text);
};
