import { createScreenReceiverWebSocketServer } from './index';
import { getScreenReceiverServer, setScreenReceiverServer } from './registry';

const DEFAULT_REGISTRY_KEY = 'default';

export interface RegisterScreenReceiverNextOptions {
  port?: number;
  path?: string;
  /** 进程内 registry 键（替代 globalThis 单例，R2-234） */
  registryKey?: string;
  logger?: (message: string) => void;
}

export function registerScreenReceiverForNext(
  options: RegisterScreenReceiverNextOptions = {},
) {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return null;

  const port = options.port ?? Number(process.env.SCREEN_RECEIVER_WS_PORT || 8787);
  const path = options.path ?? process.env.SCREEN_RECEIVER_WS_PATH ?? '/ws';
  const key = options.registryKey ?? DEFAULT_REGISTRY_KEY;

  const existing = getScreenReceiverServer(key);
  if (existing) return existing;

  const server = createScreenReceiverWebSocketServer({
    serverOptions: { port, path },
    hubOptions: {
      logger: options.logger,
    },
  });

  setScreenReceiverServer(key, server);
  return server;
}
