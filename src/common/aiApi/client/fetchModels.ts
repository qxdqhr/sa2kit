import type { AiClientSettings, AiModelsListResponse } from '../types';

export async function fetchAiModels(
  clientSettings?: AiClientSettings,
  options?: { signal?: AbortSignal; modelsEndpoint?: string; fetchImpl?: typeof fetch }
): Promise<AiModelsListResponse> {
  const fetchFn = options?.fetchImpl ?? fetch;
  const endpoint = options?.modelsEndpoint ?? '/api/ai/models';

  const response = await fetchFn(endpoint, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientSettings }),
    signal: options?.signal,
  });

  return (await response.json()) as AiModelsListResponse;
}
