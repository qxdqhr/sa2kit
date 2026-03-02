const DEFAULT_PORT = 8787;
const DEFAULT_PATH = '/ws';

export interface ResolveScreenReceiverSignalUrlOptions {
  signalUrl?: string;
  path?: string;
  port?: number;
}

export function resolveScreenReceiverSignalUrl(
  options: ResolveScreenReceiverSignalUrlOptions = {},
): string {
  const { signalUrl, path = DEFAULT_PATH, port = DEFAULT_PORT } = options;
  if (signalUrl && signalUrl.trim()) return signalUrl.trim();

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}${normalizedPath}`;
  }

  return `ws://127.0.0.1:${port}${normalizedPath}`;
}
