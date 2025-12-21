import { useState, useCallback, useRef } from 'react';
import { TextGenerationOptions, TextGenerationState } from '../types';

export const useTextGeneration = (options: TextGenerationOptions = {}) => {
  const [state, setState] = useState<TextGenerationState>({
    isProcessing: false,
    status: 'idle',
    error: null,
    result: null,
  });

  const pipelineRef = useRef<any | null>(null);

  const generate = useCallback(async (prompt: string) => {
    console.log('[AI] Generating for prompt:', prompt);
    
    setState((prev: TextGenerationState) => ({
      ...prev,
      isProcessing: true,
      error: null,
      status: 'initializing',
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
                value: { env: {}, versions: {}, release: { name: 'node' }, nextTick: (cb: any) => setTimeout(cb, 0), cwd: () => '/', browser: true },
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

        const modelName = options.model || 'Xenova/LaMini-Flan-T5-77M';
        pipelineRef.current = await pipeline('text2text-generation', modelName, {
          progress_callback: (info: any) => {
            if (info.status === 'progress') {
              setState((prev: TextGenerationState) => ({ ...prev, status: `loading model: ${Math.round(info.progress)}%` }));
            }
          }
        });
      }

      setState((prev: TextGenerationState) => ({ ...prev, status: 'thinking' }));
      
      // 优化生成参数，使其对小模型更友好
      const output = await pipelineRef.current(prompt, {
        max_new_tokens: options.max_new_tokens || 64,
        temperature: options.temperature || 0.5, // 稍微提高温度
        do_sample: true, // 开启采样，避免空输出
        top_k: 50,
        repetition_penalty: 1.1,
      });

      const result = output[0].generated_text || '';
      console.log('[AI] Raw result:', result);

      setState((prev: TextGenerationState) => ({
        ...prev,
        isProcessing: false,
        status: 'completed',
        result,
      }));

      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[AI] Error:', err);
      setState((prev: TextGenerationState) => ({ ...prev, isProcessing: false, status: 'error', error: new Error(msg) }));
      throw err;
    }
  }, [options.model, options.max_new_tokens, options.temperature]);

  return { ...state, generate };
};


