import { randomUUID } from 'node:crypto';
import { WebSocketServer } from 'ws';
import type { RawData, ServerOptions, WebSocket } from 'ws';
import type {
  ScreenReceiverIncomingMessage,
  ScreenReceiverRole,
  ScreenReceiverSignalMessage,
} from '../types';

type PeerRecord = {
  peerId: string;
  roomId: string;
  role: ScreenReceiverRole;
  socket: WebSocket;
};

type RoomPeers = Map<string, PeerRecord>;

const WS_OPEN = 1;

export interface ScreenReceiverSignalingHubOptions {
  logger?: (message: string) => void;
  createPeerId?: () => string;
}

export interface CreateScreenReceiverWebSocketServerOptions {
  serverOptions: ServerOptions;
  hubOptions?: ScreenReceiverSignalingHubOptions;
}

export class ScreenReceiverSignalingHub {
  private readonly rooms = new Map<string, RoomPeers>();
  private readonly clients = new Map<WebSocket, PeerRecord>();
  private readonly logger?: (message: string) => void;
  private readonly createPeerId: () => string;

  constructor(options: ScreenReceiverSignalingHubOptions = {}) {
    this.logger = options.logger;
    this.createPeerId = options.createPeerId ?? randomUUID;
  }

  attachClient(socket: WebSocket) {
    socket.on('message', (raw) => {
      const message = this.parseMessage(raw);
      if (!message) {
        this.send(socket, { type: 'error', reason: 'invalid_json' });
        return;
      }
      this.handleMessage(socket, message);
    });

    socket.on('close', () => this.removeClient(socket));
    socket.on('error', () => this.removeClient(socket));
  }

  close() {
    for (const socket of this.clients.keys()) {
      socket.close();
    }
    this.rooms.clear();
    this.clients.clear();
  }

  private parseMessage(raw: RawData): ScreenReceiverIncomingMessage | null {
    try {
      if (typeof raw === 'string') return JSON.parse(raw);
      if (raw instanceof ArrayBuffer) return JSON.parse(Buffer.from(raw).toString('utf-8'));
      if (Array.isArray(raw)) return JSON.parse(Buffer.concat(raw).toString('utf-8'));
      return JSON.parse(raw.toString());
    } catch {
      return null;
    }
  }

  private handleMessage(socket: WebSocket, message: ScreenReceiverIncomingMessage) {
    if (isJoinMessage(message)) {
      this.joinRoom(socket, message);
      return;
    }

    const sender = this.clients.get(socket);
    if (!sender) {
      this.send(socket, { type: 'error', reason: 'join_first' });
      return;
    }

    if (isSignalMessage(message)) {
      this.forwardSignal(sender, message);
      return;
    }

    this.send(socket, { type: 'error', reason: 'unknown_type' });
  }

  private joinRoom(socket: WebSocket, message: { type: 'join'; roomId: string; role?: string; peerId?: string }) {
    const roomId = typeof message.roomId === 'string' ? message.roomId.trim() : '';
    if (!roomId) {
      this.send(socket, { type: 'error', reason: 'missing_room_id' });
      return;
    }

    this.removeClient(socket, false);

    const role: ScreenReceiverRole = message.role === 'broadcaster' ? 'broadcaster' : 'viewer';
    const peerId = typeof message.peerId === 'string' && message.peerId.trim() ? message.peerId : this.createPeerId();

    const record: PeerRecord = { peerId, roomId, role, socket };
    this.clients.set(socket, record);
    const room = this.rooms.get(roomId) ?? new Map<string, PeerRecord>();
    room.set(peerId, record);
    this.rooms.set(roomId, room);

    this.send(socket, { type: 'joined', roomId, peerId, role });
    this.send(socket, {
      type: 'room_state',
      roomId,
      peers: [...room.values()]
        .filter((peer) => peer.peerId !== peerId)
        .map((peer) => ({ peerId: peer.peerId, role: peer.role })),
    });
    this.broadcast(roomId, socket, { type: 'peer_joined', roomId, peerId, role });
    this.log(`[screenReceiver] peer ${peerId} joined room ${roomId} as ${role}`);
  }

  private forwardSignal(sender: PeerRecord, message: ScreenReceiverSignalMessage) {
    const room = this.rooms.get(sender.roomId);
    if (!room) return;
    const payload = { ...message, fromPeerId: sender.peerId };

    const targetPeerId = typeof message.targetPeerId === 'string' ? message.targetPeerId : undefined;
    if (targetPeerId) {
      const target = room.get(targetPeerId);
      if (!target) {
        this.send(sender.socket, { type: 'error', reason: 'target_not_found', targetPeerId });
        return;
      }
      this.send(target.socket, payload);
      return;
    }

    this.broadcast(sender.roomId, sender.socket, payload);
  }

  private broadcast(roomId: string, from: WebSocket, payload: unknown) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    for (const peer of room.values()) {
      if (peer.socket === from || peer.socket.readyState !== WS_OPEN) continue;
      this.send(peer.socket, payload);
    }
  }

  private removeClient(socket: WebSocket, notifyRoom = true) {
    const record = this.clients.get(socket);
    if (!record) return;
    this.clients.delete(socket);

    const room = this.rooms.get(record.roomId);
    if (!room) return;
    room.delete(record.peerId);
    if (room.size === 0) {
      this.rooms.delete(record.roomId);
    } else if (notifyRoom) {
      this.broadcast(record.roomId, socket, {
        type: 'peer_left',
        roomId: record.roomId,
        peerId: record.peerId,
      });
    }
    this.log(`[screenReceiver] peer ${record.peerId} left room ${record.roomId}`);
  }

  private send(socket: WebSocket, payload: unknown) {
    if (socket.readyState !== WS_OPEN) return;
    socket.send(JSON.stringify(payload));
  }

  private log(message: string) {
    this.logger?.(message);
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isJoinMessage(value: ScreenReceiverIncomingMessage): value is { type: 'join'; roomId: string; role?: string; peerId?: string } {
  return isObject(value) && value.type === 'join' && typeof value.roomId === 'string';
}

function isSignalMessage(value: ScreenReceiverIncomingMessage): value is ScreenReceiverSignalMessage {
  if (!isObject(value)) return false;
  return value.type === 'offer' || value.type === 'answer' || value.type === 'ice';
}

export function createScreenReceiverWebSocketServer(options: CreateScreenReceiverWebSocketServerOptions) {
  const hub = new ScreenReceiverSignalingHub(options.hubOptions);
  const wss = new WebSocketServer(options.serverOptions);
  wss.on('connection', (socket) => hub.attachClient(socket));

  return {
    wss,
    hub,
    close() {
      hub.close();
      wss.close();
    },
  };
}
