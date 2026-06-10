import { useState, useCallback, useEffect } from 'react';
import { BackgroundRemovalOptions, BackgroundRemovalState } from '../types';

export const useBackgroundRemoval = (options: BackgroundRemovalOptions = {}) => {
  const [state, setState] = useState<BackgroundRemovalState>({
    isProcessing: false,
    progress: 0,
    status: 'idle',
    error: null,
    resultBlob: null,
    resultUrl: null,
  });

  const remove = useCallback(async (image: string | File | Blob | HTMLImageElement | URL) => {
    setState(prev => ({
      ...prev,
      isProcessing: true,
      error: null,
      progress: 0,
      status: 'initializing',
    }));

    try {
      const originalKeys = Object.keys;
      const win = (typeof window !== 'undefined' ? window : globalThis) as any;
      const originalProcess = win.process;
      let backgroundRemoval;

      try {
        // 环境盾牌：防止库初始化时 Object.keys(null) 崩溃
        (Object as any).keys = function(obj: any) {
          if (obj === null || obj === undefined) return [];
          return originalKeys.call(Object, obj);
        };

        if (typeof window !== 'undefined') {
          try {
            Object.defineProperty(win, 'process', {
              value: { env: {}, versions: {}, release: { name: 'node' } },
              configurable: true,
              writable: true
            });
          } catch (e) {}
        }
        
        backgroundRemoval = await import('@imgly/background-removal');
      } finally {
        Object.keys = originalKeys;
        if (typeof window !== 'undefined' && originalProcess) {
          try {
            Object.defineProperty(win, 'process', {
              value: originalProcess,
              configurable: true,
              writable: true
            });
          } catch (e) {}
        }
      }

      const { removeBackground } = backgroundRemoval;

      const config: any = {
        progress: (status: string, progress: number) => {
          setState(prev => ({
            ...prev,
            status,
            progress,
          }));
          options.progress?.(status, progress);
        },
        model: options.model || 'small',
        publicPath: options.publicPath,
        fetchArgs: options.fetchArgs,
      };

      const blob = await removeBackground(image, config);
      const url = URL.createObjectURL(blob);

      setState(prev => ({
        ...prev,
        isProcessing: false,
        progress: 1,
        status: 'completed',
        resultBlob: blob,
        resultUrl: url,
      }));

      return { blob, url };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('AI Background Removal Error:', msg);
      setState(prev => ({
        ...prev,
        isProcessing: false,
        status: 'error',
        error: new Error(msg),
      }));
      throw err;
    }
  }, [options]);

  const cleanup = useCallback(() => {
    if (state.resultUrl) {
      URL.revokeObjectURL(state.resultUrl);
    }
  }, [state.resultUrl]);

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  return {
    ...state,
    remove,
    cleanup,
  };
};
