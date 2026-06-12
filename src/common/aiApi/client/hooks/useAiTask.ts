'use client';

import { useCallback, useState } from 'react';
import type { AiClientSettings, AiApiResponse } from '../../types';
import { runAiTask } from '../aiApiClient';

export function useAiTask<TInput, TOutput>(taskId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AiApiResponse<TOutput> | null>(null);

  const execute = useCallback(
    async (
      input: TInput,
      options?: { signal?: AbortSignal; clientSettings?: AiClientSettings }
    ) => {
      setLoading(true);
      setError(null);
      try {
        const response = await runAiTask<TInput, TOutput>(taskId, input, options);
        setResult(response);
        if (!response.success) {
          setError(response.error?.message ?? 'AI 任务失败');
        }
        return response;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'AI 任务失败';
        setError(message);
        const failed: AiApiResponse<TOutput> = {
          success: false,
          taskId,
          error: { code: 'AI_REQUEST_FAILED', message },
        };
        setResult(failed);
        return failed;
      } finally {
        setLoading(false);
      }
    },
    [taskId]
  );

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setResult(null);
  }, []);

  return { execute, loading, error, result, reset };
}
