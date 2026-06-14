import type { AppProviderId, AppReturnPayload } from '../types';

export type { AppReturnPayload };

export function parseReturnUrl(url: string): AppReturnPayload {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { url, params: {} };
  }

  const params: Record<string, string> = {};
  parsed.searchParams.forEach((value, key) => {
    params[key] = value;
  });

  const provider = parsed.searchParams.get('provider') as AppProviderId | null;

  return {
    provider: provider ?? undefined,
    action: parsed.searchParams.get('action') ?? undefined,
    url,
    params,
  };
}

type ReturnListener = (payload: AppReturnPayload) => void;

const listeners = new Set<ReturnListener>();

/** 宿主 App 在收到 deep link 回跳时调用，分发给 onReturn 订阅者 */
export function notifyAppReturn(payload: AppReturnPayload): void {
  listeners.forEach(listener => listener(payload));
}

export function subscribeAppReturn(listener: ReturnListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function matchesReturnUrl(
  incomingUrl: string,
  expectedReturnUrl?: string,
): boolean {
  if (!expectedReturnUrl) {
    return false;
  }

  if (incomingUrl === expectedReturnUrl) {
    return true;
  }

  try {
    const incoming = new URL(incomingUrl);
    const expected = new URL(expectedReturnUrl);
    return (
      incoming.protocol === expected.protocol &&
      incoming.hostname === expected.hostname &&
      incoming.pathname === expected.pathname
    );
  } catch {
    return incomingUrl.startsWith(expectedReturnUrl);
  }
}
