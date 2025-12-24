
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY;

export const generateAIResponse = async (history: { role: 'user' | 'model', text: string }[], userMessage: string) => {
  if (!apiKey) {
    return "API Key not configured. I'm just a simulation for now!";
  }

  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: "You are a friendly friend named 'Gemini AI Assistant' on a messaging app. Keep your responses concise, conversational, and use emojis. Act like a real person chatting on a phone.",
      }
    });

    const response = await chat.sendMessage({ message: userMessage });
    return response.text || "Sorry, I couldn't think of a reply!";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "I'm having trouble connecting right now. 📴";
  }
};
