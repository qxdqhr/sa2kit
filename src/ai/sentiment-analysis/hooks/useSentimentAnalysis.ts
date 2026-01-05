import { useState, useCallback, useRef } from 'react';
import { SentimentResult, SentimentOptions, SentimentState } from '../types';

export const useSentimentAnalysis = (options: SentimentOptions = {}) => {
  const [state, setState] = useState<SentimentState>({
    isProcessing: false,
    status: 'idle',
    error: null,
    result: null,
  });

  const pipelineRef = useRef<any | null>(null);

  const analyze = useCallback(async (text: string) => {
    setState(prev => ({
      ...prev,
      isProcessing: true,
      error: null,
      status: 'loading model',
    }));

    try {
      if (!pipelineRef.current) {
        const originalKeys = Object.keys;
        const win = (typeof window !== 'undefined' ? window : globalThis) as any;
        const originalProcess = win.process;

        let transformers;
        try {
          (Object as any).keys = function(obj: any) {
            if (obj === null || obj === undefined) return [];
            return originalKeys.call(Object, obj);
          };
          if (typeof window !== 'undefined') {
            try {
              Object.defineProperty(win, 'process', {
                value: { env: {}, versions: {}, release: { name: 'node' }, nextTick: (cb: any) => setTimeout(cb, 0) },
                configurable: true,
                writable: true
              });
            } catch (e) {}
          }
          transformers = await import('@xenova/transformers');
        } finally {
          Object.keys = originalKeys;
          if (typeof window !== 'undefined' && originalProcess) {
            try {
              Object.defineProperty(win, 'process', { value: originalProcess, configurable: true, writable: true });
            } catch (e) {}
          }
        }

        const { pipeline, env } = transformers;
        env.allowLocalModels = false;
        if (env.backends?.onnx) {
          env.backends.onnx.wasm.proxy = true;
        }

        const defaultModel = 'Xenova/distilbert-base-multilingual-cased-sentiments-student';
        
        pipelineRef.current = await pipeline('sentiment-analysis', options.model || defaultModel);
      }

      setState(prev => ({ ...prev, status: 'analyzing' }));
      
      const output = await pipelineRef.current(text);
      const resultData = output[0];

      const label = resultData.label.toLowerCase();
      let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
      
      // 增强逻辑：针对中文常见消极词汇进行本地加权
      const negativeKeywords = ['累', '惨', '绝望', '难受', '伤心', '差', '坏', '糟', '不行'];
      const hasNegativeKeyword = negativeKeywords.some(k => text.includes(k));

      if (label.includes('positive') && !hasNegativeKeyword) {
        sentiment = 'positive';
      } else if (label.includes('negative') || label.includes('0') || hasNegativeKeyword) {
        sentiment = 'negative';
      }

      const result: SentimentResult = {
        label: resultData.label,
        score: resultData.score,
        sentiment,
      };

      setState(prev => ({
        ...prev,
        isProcessing: false,
        status: 'completed',
        result,
      }));

      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('AI Sentiment Error:', msg);
      setState(prev => ({ ...prev, isProcessing: false, status: 'error', error: new Error(msg) }));
      throw err;
    }
  }, [options.model]);

  return { ...state, analyze };
};







