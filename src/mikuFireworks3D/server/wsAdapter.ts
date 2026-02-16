import type { FireworksRoomHub } from './FireworksRoomHub';
import type { FireworksConnection, WsLikeSocket } from './types';

export interface BindWsSocketOptions {
  connectionId?: string;
  onConnected?: (connection: FireworksConnection) => void;
  onDisconnected?: (connectionId: string) => void;
}

/**
 * Bind a ws-like socket to FireworksRoomHub.
 *
 * Example (ws package):
 * const hub = new FireworksRoomHub();
 * wss.on('connection', (socket) => bindWsSocket(hub, socket));
 */
export function bindWsSocket(
  hub: FireworksRoomHub,
  socket: WsLikeSocket,
  options?: BindWsSocketOptions
): FireworksConnection {
  const connection = hub.connect(
    {
      send: (encodedMessage) => {
        socket.send(encodedMessage);
      },
    },
    options?.connectionId
  );

  options?.onConnected?.(connection);

  socket.on('message', (raw) => {
    connection.handleMessage(normalizeWsRawData(raw));
  });

  socket.on('close', () => {
    connection.disconnect('socket_closed');
    options?.onDisconnected?.(connection.id);
  });

  socket.on('error', () => {
    connection.disconnect('socket_error');
    options?.onDisconnected?.(connection.id);
  });

  return connection;
}

function normalizeWsRawData(raw: unknown): string {
  if (typeof raw === 'string') {
    return raw;
  }

  if (raw instanceof ArrayBuffer) {
    return new TextDecoder().decode(new Uint8Array(raw));
  }

  if (ArrayBuffer.isView(raw)) {
    return new TextDecoder().decode(raw);
  }

  return '';
}
