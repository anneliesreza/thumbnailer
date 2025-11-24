declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio?: AIStudio;
  }
}

export interface GeneratedImagePart {
  inlineData?: {
    mimeType: string;
    data: string;
  };
  text?: string;
}