
import { GoogleGenAI, Type } from "@google/genai";

const API_KEY = process.env.API_KEY || '';

export const getHealthAdvice = async (vitals: any[], meds: any[]) => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const prompt = `
    As a senior health assistant, review the following records:
    Vitals: ${JSON.stringify(vitals)}
    Medications: ${JSON.stringify(meds)}
    
    Provide a friendly, very short, encouraging 2-sentence summary of their health status. 
    Use large-print-friendly, simple language.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.7,
        topP: 0.8,
      }
    });
    return response.text || "You're doing great today! Keep up the healthy habits.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Your health looks stable. Remember to stay hydrated!";
  }
};

export const getNaturalRemedies = async (category: 'pain' | 'energy') => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  const prompt = `
    As a geriatric nutritionist, recommend 3 specific natural foods or herbs for ${category === 'pain' ? 'joint pain and inflammation relief' : 'sustained energy and vitality'} suitable for a 70-year-old.
    Format the response as a JSON array of objects with keys: "food", "benefit", and "usage".
    Keep descriptions very short and easy to understand.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              food: { type: Type.STRING },
              benefit: { type: Type.STRING },
              usage: { type: Type.STRING }
            },
            required: ["food", "benefit", "usage"]
          }
        }
      }
    });
    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("Gemini Natural Error:", error);
    return [];
  }
};

// Encoding/Decoding helpers for Live API
export function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function decodeAudioData(
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
