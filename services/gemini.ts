import { GoogleGenAI } from "@google/genai";

// Initialization check for the API Key manager window extension/environment
export const checkHasApiKey = async (): Promise<boolean> => {
  if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
    return await window.aistudio.hasSelectedApiKey();
  }
  // Fallback for development if manually set (though UI forbids asking)
  return !!process.env.API_KEY; 
};

export const openApiKeySelection = async (): Promise<void> => {
  if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
    await window.aistudio.openSelectKey();
  } else {
    console.warn("AI Studio window object not found. Ensure you are in a supported environment.");
  }
};

export const editThumbnail = async (base64Image: string, prompt: string): Promise<string> => {
  // Always create a new instance to ensure we grab the latest injected key
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image
            }
          },
          {
            text: prompt
          }
        ]
      }
    });

    // Iterate through parts to find the image
    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          return part.inlineData.data;
        }
      }
    }
    
    throw new Error("No image generated. The model might have returned only text.");
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};