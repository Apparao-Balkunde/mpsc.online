import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Subject, QuizQuestion, VocabWord } from '../types';

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const MODEL_FAST = 'gemini-3-flash-preview';
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
      Generate 5 multiple choice questions (MCQs) for MPSC exam practice.
      Subject: ${subject}
      Topic: ${topic}
      Language: ${subject === Subject.MARATHI ? 'Marathi' : 'English'}
      
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

export const generateVocab = async (subject: Subject): Promise<VocabWord[]> => {
  try {
    const prompt = `
      Generate 3 important vocabulary words (idioms, phrases, or difficult words) often asked in MPSC exams for the subject: ${subject}.
      If subject is Marathi, provide Marathi words/idioms (Mani/Vakprachar).
      If subject is English, provide English words/idioms.
      
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
              word: { type: Type.STRING },
              meaning: { type: Type.STRING },
              usage: { type: Type.STRING, description: "Example sentence" },
              type: { type: Type.STRING, description: "Part of speech or category (e.g. Idiom, Noun)" }
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