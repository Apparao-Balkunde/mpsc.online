import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Subject, QuizQuestion, VocabWord, CurrentAffairItem, ExamType, VocabCategory } from '../types';

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const MODEL_FAST = 'gemini-3-flash-preview';
const MODEL_PRO = 'gemini-3-pro-preview';
const MODEL_TTS = 'gemini-2.5-flash-preview-tts';

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

    return response.text || "No notes generated.";
  } catch (error) {
    console.error("Error generating notes:", error);
    throw error;
  }
};

export const generateConciseExplanation = async (subject: Subject, topic: string): Promise<string> => {
  try {
    const prompt = `
      You are an MPSC exam tutor.
      Subject: ${subject}
      Topic: ${topic}
      
      Provide a very concise explanation (max 3-4 sentences) of this rule or concept.
      - If the subject is Marathi, strictly use Marathi.
      - If English, use English (with optional Marathi context).
      - Focus on the key definition or rule used in exams.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: prompt,
    });

    return response.text || "No explanation available.";
  } catch (error) {
    console.error("Error generating explanation:", error);
    return "Could not load explanation.";
  }
};

export const generateQuiz = async (subject: Subject, topic: string): Promise<QuizQuestion[]> => {
  try {
    const prompt = `
      Generate 20 multiple choice questions (MCQs) for MPSC exam practice.
      Subject: ${subject}
      Topic: ${topic}
      Language: ${subject === Subject.MARATHI ? 'Marathi' : 'English'}
      
      Ensure questions cover various difficulty levels and aspects of the topic.
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
              explanation: { type: Type.STRING, description: "Short explanation of why the answer is correct" }
            },
            required: ["question", "options", "correctAnswerIndex", "explanation"]
          }
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Empty response from AI");
    
    return JSON.parse(jsonText) as QuizQuestion[];
  } catch (error) {
    console.error("Error generating quiz:", error);
    throw error;
  }
};

export const generatePYQs = async (subject: Subject, year: string, examType: ExamType = 'ALL'): Promise<QuizQuestion[]> => {
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
      Target Exams: ${examContext}.
      Target Year (Approximate): ${year}.
      
      Requirements:
      1. Provide exactly 15 questions.
      2. Include the specific exam name and year in the "examSource" field if possible (e.g., "MPSC Rajyaseva 2019" or "SSC CGL 2020").
      3. For Marathi subject, ensure questions are in Marathi script (Devanagari).
      4. For English subject, include questions on Grammar, Vocab, and Comprehension.
      
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
              question: { type: Type.STRING },
              options: { 
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              correctAnswerIndex: { type: Type.INTEGER },
              explanation: { type: Type.STRING },
              examSource: { type: Type.STRING, description: "The exam where this question appeared" }
            },
            required: ["question", "options", "correctAnswerIndex", "explanation"]
          }
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Empty response from AI");
    
    return JSON.parse(jsonText) as QuizQuestion[];
  } catch (error) {
    console.error("Error generating PYQs:", error);
    throw error;
  }
};

export const generateVocab = async (subject: Subject, category: VocabCategory): Promise<VocabWord[]> => {
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
      Generate 10 important ${categoryPrompt} for ${subject} subject specifically for MPSC/Competitive Exams.
      
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
    
    return JSON.parse(jsonText) as VocabWord[];

  } catch (error) {
    console.error("Error generating vocab:", error);
    throw error;
  }
}

export const generateCurrentAffairs = async (category: string, language: 'Marathi' | 'English' = 'Marathi'): Promise<CurrentAffairItem[]> => {
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
    
    return JSON.parse(jsonText) as CurrentAffairItem[];

  } catch (error) {
    console.error("Error generating current affairs:", error);
    throw error;
  }
}