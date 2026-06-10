export interface OCRResult {
  text: string;
  confidence: number;
  words: Array<{
    text: string;
    confidence: number;
    bbox: {
      x0: number;
      y0: number;
      x1: number;
      y1: number;
    };
  }>;
  lines: string[];
}

export interface OCROptions {
  language?: string;
  logger?: (message: any) => void;
}

export interface OCRState {
  isProcessing: boolean;
  progress: number;
  status: string;
  error: Error | null;
  result: OCRResult | null;
}









