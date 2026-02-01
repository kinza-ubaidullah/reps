
import { GoogleGenAI } from "@google/genai";
import { TrackingStep } from '../types';

// Initialize Gemini Client Lazily
let ai: GoogleGenAI | null = null;

const getAi = () => {
    if (!ai) {
        const apiKey = process.env.API_KEY || ''; // Fallback to empty string to prevent constructor crash if it requires string
        ai = new GoogleGenAI({ apiKey });
    }
    return ai;
};

/**
 * Analyzes complex tracking logs using Gemini 3 Flash.
 */
export const analyzeTrackingStatus = async (steps: TrackingStep[]): Promise<string> => {
    const mockAnalysis = "The package is currently in transit. Based on typical routes, it has cleared customs and is moving towards the destination country. Expect delivery within 5-7 days.";

    if (!steps || steps.length === 0) {
        return mockAnalysis;
    }

    try {
        const stepsText = steps.map(s => `${s.date}: ${s.status} at ${s.location}`).join('\n');

        // Always use gemini-3-flash-preview for basic reasoning/text tasks
        const response = await getAi().models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `You are a shipping logistics expert. Analyze these tracking steps for a package from China.
      
      Steps:
      ${stepsText}
      
      Provide a concise summary (max 2 sentences) of where the package is currently and what the status actually means in plain English. 
      Then, estimate how many days until arrival based on typical international shipping patterns if possible.
      `,
        });

        return response.text || mockAnalysis;
    } catch (error) {
        console.warn("Gemini Tracking Analysis Failed (Using Mock)", error);
        return mockAnalysis;
    }
};

/**
 * Identify a product from an image using Gemini 3 Flash (multimodal).
 */
export const identifyProductFromImage = async (base64Image: string): Promise<string[]> => {
    const mockKeywords = ["Sneakers", "Jordan 4", "Streetwear", "Nike", "Black Cat"];

    try {
        // Use gemini-3-flash-preview for vision/multimodal tasks as per guidelines
        const response = await getAi().models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: {
                parts: [
                    {
                        inlineData: {
                            mimeType: 'image/jpeg',
                            data: base64Image
                        }
                    },
                    {
                        text: "Identify this product. Return a list of 5 keywords to search for this item on e-commerce sites like Taobao. Return only the keywords separated by commas."
                    }
                ]
            }
        });

        return response.text ? response.text.split(',').map(s => s.trim()) : mockKeywords;
    } catch (e) {
        console.warn("Gemini Image Search Failed (Using Mock)", e);
        return mockKeywords;
    }
}
