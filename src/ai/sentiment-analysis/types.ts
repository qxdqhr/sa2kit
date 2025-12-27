export interface SentimentResult {
  label: string;
  score: number;
  sentiment: 'positive' | 'negative' | 'neutral';
}

export interface SentimentOptions {
  model?: string;
  language?: 'en' | 'zh' | 'auto';
}

export interface SentimentState {
  isProcessing: boolean;
  status: string;
  error: Error | null;
  result: SentimentResult | null;
}



