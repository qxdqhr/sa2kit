import { useState, useCallback, useRef, useEffect } from 'react';
import { createWorker, Worker } from 'tesseract.js';
import { OCRResult, OCROptions, OCRState } from '../types';

export const useOCR = (options: OCROptions = {}) => {
  const [state, setState] = useState<OCRState>({
    isProcessing: false,
    progress: 0,
    status: 'idle',
    error: null,
    result: null,
  });

  const workerRef = useRef<Worker | null>(null);

  const cleanup = useCallback(async () => {
    if (workerRef.current) {
      await workerRef.current.terminate();
      workerRef.current = null;
    }
  }, []);

  const recognize = useCallback(
    async (image: string | File | Blob | HTMLImageElement | HTMLCanvasElement) => {
      setState((prev) => ({
        ...prev,
        isProcessing: true,
        error: null,
        progress: 0,
        status: 'initializing',
      }));

      try {
        const worker = await createWorker(options.language || 'eng', 1, {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setState((prev) => ({
                ...prev,
                status: 'recognizing',
                progress: m.progress,
              }));
            }
            options.logger?.(m);
          },
        });

        workerRef.current = worker;

        const { data } = await worker.recognize(image);

        // In some versions of tesseract.js, words and lines are not directly on data
        // We extract them from blocks if needed
        const words = (data as any).words || data.blocks?.flatMap(b => b.paragraphs.flatMap(p => p.lines.flatMap(l => l.words))) || [];
        const lines = (data as any).lines || data.blocks?.flatMap(b => b.paragraphs.flatMap(p => p.lines)) || [];

        const result: OCRResult = {
          text: data.text,
          confidence: data.confidence,
          words: words.map((w: any) => ({
            text: w.text,
            confidence: w.confidence,
            bbox: w.bbox,
          })),
          lines: lines.map((l: any) => l.text),
        };

        setState((prev) => ({
          ...prev,
          isProcessing: false,
          progress: 1,
          status: 'completed',
          result,
        }));

        await worker.terminate();
        workerRef.current = null;

        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setState((prev) => ({
          ...prev,
          isProcessing: false,
          status: 'error',
          error,
        }));
        throw error;
      }
    },
    [options]
  );

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    ...state,
    recognize,
    cleanup,
  };
};




