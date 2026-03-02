import { createScreenReceiverWebSocketServer } from './index';

const DEFAULT_GLOBAL_KEY = '__sa2kit_screen_receiver_wss__';

type GlobalWithScreenReceiver = typeof globalThis & {
  [DEFAULT_GLOBAL_KEY]?: {
    close: () => void;
  };
};

export interface RegisterScreenReceiverNextOptions {
  port?: number;
  path?: string;
  globalKey?: string;
  logger?: (message: string) => void;
}

export function registerScreenReceiverForNext(options: RegisterScreenReceiverNextOptions = {}) {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return null;

  const port = options.port ?? Number(process.env.SCREEN_RECEIVER_WS_PORT || 8787);
  const path = options.path ?? process.env.SCREEN_RECEIVER_WS_PATH ?? '/ws';
  const key = options.globalKey ?? DEFAULT_GLOBAL_KEY;
  const globalRef = globalThis as GlobalWithScreenReceiver & Record<string, unknown>;
  if (globalRef[key]) return globalRef[key];

  const server = createScreenReceiverWebSocketServer({
    serverOptions: { port, path },
    hubOptions: {
      logger: options.logger ?? ((message) => console.log(message)),
    },
  });

  globalRef[key] = server;
  return server;
}
