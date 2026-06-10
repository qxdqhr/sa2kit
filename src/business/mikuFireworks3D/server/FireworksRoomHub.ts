import type {
  DanmakuBroadcastEvent,
  FireworkBroadcastEvent,
  FireworksClientMessage,
  FireworksConnection,
  FireworksConnectionTransport,
  FireworksRoomHubOptions,
  FireworksServerMessage,
  FireworksUserIdentity,
} from './types';

interface Session {
  id: string;
  transport: FireworksConnectionTransport;
  roomId?: string;
  user?: FireworksUserIdentity;
}

interface RoomState {
  id: string;
  connections: Set<string>;
  usersByConnection: Map<string, FireworksUserIdentity>;
  danmakuHistory: DanmakuBroadcastEvent[];
  fireworkHistory: FireworkBroadcastEvent[];
  seq: number;
}

const DEFAULT_MAX_USERS_PER_ROOM = 200;
const DEFAULT_HISTORY_LIMIT = 50;
const DEFAULT_MAX_DANMAKU_LENGTH = 64;

export class FireworksRoomHub {
  private readonly rooms = new Map<string, RoomState>();
  private readonly sessions = new Map<string, Session>();
  private readonly maxUsersPerRoom: number;
  private readonly historyLimit: number;
  private readonly maxDanmakuLength: number;
  private readonly logger?: Pick<Console, 'info' | 'warn' | 'error'>;

  constructor(options?: FireworksRoomHubOptions) {
    this.maxUsersPerRoom = options?.maxUsersPerRoom ?? DEFAULT_MAX_USERS_PER_ROOM;
    this.historyLimit = options?.historyLimit ?? DEFAULT_HISTORY_LIMIT;
    this.maxDanmakuLength = options?.maxDanmakuLength ?? DEFAULT_MAX_DANMAKU_LENGTH;
    this.logger = options?.logger;
  }

  connect(transport: FireworksConnectionTransport, id?: string): FireworksConnection {
    const connectionId = id ?? createId('conn');
    const session: Session = {
      id: connectionId,
      transport,
    };

    this.sessions.set(connectionId, session);

    return {
      id: connectionId,
      handleMessage: (raw) => this.handleRawMessage(connectionId, raw),
      disconnect: (reason) => this.disconnect(connectionId, reason),
      send: (message) => this.sendToConnection(connectionId, message),
    };
  }

  disconnect(connectionId: string, reason?: string): void {
    const session = this.sessions.get(connectionId);
    if (!session) {
      return;
    }

    this.leaveRoom(session, false);
    this.sessions.delete(connectionId);

    if (reason) {
      this.logger?.info?.(`[FireworksRoomHub] disconnected ${connectionId}: ${reason}`);
    }
  }

  getStats(): { rooms: number; connections: number } {
    return {
      rooms: this.rooms.size,
      connections: this.sessions.size,
    };
  }

  getRoomOnlineCount(roomId: string): number {
    return this.rooms.get(roomId)?.connections.size ?? 0;
  }

  private handleRawMessage(connectionId: string, raw: unknown): void {
    const message = parseClientMessage(raw);
    if (!message.ok) {
      this.sendError(connectionId, 'BAD_MESSAGE', message.error);
      return;
    }

    const session = this.sessions.get(connectionId);
    if (!session) {
      return;
    }

    const clientMessage = message.value;

    switch (clientMessage.type) {
      case 'join': {
        this.joinRoom(session, clientMessage.roomId, clientMessage.user);
        return;
      }
      case 'leave': {
        this.leaveRoom(session, true);
        return;
      }
      case 'danmaku.send': {
        this.handleDanmaku(session, clientMessage.payload);
        return;
      }
      case 'firework.launch': {
        this.handleFirework(session, clientMessage.payload);
        return;
      }
      case 'ping': {
        this.sendToConnection(connectionId, {
          type: 'pong',
          ts: clientMessage.ts ?? Date.now(),
        });
        return;
      }
      default: {
        this.sendError(connectionId, 'UNSUPPORTED_MESSAGE', 'Unsupported message type.');
      }
    }
  }

  private joinRoom(session: Session, roomId: string, user: FireworksUserIdentity): void {
    const normalizedRoomId = roomId.trim();
    const normalizedUserId = user.userId.trim();

    if (!normalizedRoomId) {
      this.sendError(session.id, 'ROOM_ID_REQUIRED', 'roomId is required.');
      return;
    }
    if (!normalizedUserId) {
      this.sendError(session.id, 'USER_ID_REQUIRED', 'user.userId is required.');
      return;
    }

    if (session.roomId && session.roomId !== normalizedRoomId) {
      this.leaveRoom(session, true);
    }

    const room = this.rooms.get(normalizedRoomId) ?? this.createRoom(normalizedRoomId);
    if (room.connections.size >= this.maxUsersPerRoom && !room.connections.has(session.id)) {
      this.sendError(session.id, 'ROOM_FULL', 'Room is full.');
      return;
    }

    const identity: FireworksUserIdentity = {
      userId: normalizedUserId,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
    };

    const wasMember = room.connections.has(session.id);
    room.connections.add(session.id);
    room.usersByConnection.set(session.id, identity);

    session.roomId = normalizedRoomId;
    session.user = identity;

    this.sendToConnection(session.id, {
      type: 'joined',
      roomId: normalizedRoomId,
      self: identity,
      onlineCount: room.connections.size,
    });

    this.sendToConnection(session.id, {
      type: 'room.snapshot',
      roomId: normalizedRoomId,
      users: Array.from(room.usersByConnection.values()),
      danmakuHistory: [...room.danmakuHistory],
      fireworkHistory: [...room.fireworkHistory],
    });

    if (!wasMember) {
      this.broadcastToRoom(normalizedRoomId, {
        type: 'room.user_joined',
        roomId: normalizedRoomId,
        user: identity,
        onlineCount: room.connections.size,
      }, session.id);
    }
  }

  private leaveRoom(session: Session, notify: boolean): void {
    const roomId = session.roomId;
    if (!roomId) {
      return;
    }

    const room = this.rooms.get(roomId);
    if (!room) {
      session.roomId = undefined;
      session.user = undefined;
      return;
    }

    const leavingUserId = room.usersByConnection.get(session.id)?.userId;

    room.connections.delete(session.id);
    room.usersByConnection.delete(session.id);

    session.roomId = undefined;
    session.user = undefined;

    if (notify && leavingUserId) {
      this.broadcastToRoom(roomId, {
        type: 'room.user_left',
        roomId,
        userId: leavingUserId,
        onlineCount: room.connections.size,
      });
    }

    if (room.connections.size === 0) {
      this.rooms.delete(roomId);
    }
  }

  private handleDanmaku(
    session: Session,
    payload: {
      text: string;
      color?: string;
      kind?: 'normal' | 'miku' | 'avatar';
    }
  ): void {
    if (!session.roomId || !session.user) {
      this.sendError(session.id, 'NOT_JOINED', 'Join a room before sending danmaku.');
      return;
    }

    const room = this.rooms.get(session.roomId);
    if (!room) {
      this.sendError(session.id, 'ROOM_NOT_FOUND', 'Room does not exist.');
      return;
    }

    const text = payload.text.trim().slice(0, this.maxDanmakuLength);
    if (!text) {
      this.sendError(session.id, 'EMPTY_DANMAKU', 'Danmaku text cannot be empty.');
      return;
    }

    const event: DanmakuBroadcastEvent = {
      id: `${session.roomId}-d-${room.seq++}`,
      roomId: session.roomId,
      text,
      color: payload.color,
      kind: payload.kind,
      user: session.user,
      timestamp: Date.now(),
    };

    room.danmakuHistory.push(event);
    trimHistory(room.danmakuHistory, this.historyLimit);

    this.broadcastToRoom(session.roomId, {
      type: 'danmaku.broadcast',
      roomId: session.roomId,
      event,
    });
  }

  private handleFirework(session: Session, payload: FireworkBroadcastEvent['payload']): void {
    if (!session.roomId || !session.user) {
      this.sendError(session.id, 'NOT_JOINED', 'Join a room before launching fireworks.');
      return;
    }

    const room = this.rooms.get(session.roomId);
    if (!room) {
      this.sendError(session.id, 'ROOM_NOT_FOUND', 'Room does not exist.');
      return;
    }

    const event: FireworkBroadcastEvent = {
      id: `${session.roomId}-f-${room.seq++}`,
      roomId: session.roomId,
      payload,
      user: session.user,
      timestamp: Date.now(),
    };

    room.fireworkHistory.push(event);
    trimHistory(room.fireworkHistory, this.historyLimit);

    this.broadcastToRoom(session.roomId, {
      type: 'firework.broadcast',
      roomId: session.roomId,
      event,
    });
  }

  private createRoom(roomId: string): RoomState {
    const room: RoomState = {
      id: roomId,
      connections: new Set(),
      usersByConnection: new Map(),
      danmakuHistory: [],
      fireworkHistory: [],
      seq: 1,
    };

    this.rooms.set(roomId, room);
    return room;
  }

  private sendToConnection(connectionId: string, message: FireworksServerMessage): void {
    const session = this.sessions.get(connectionId);
    if (!session) {
      return;
    }

    try {
      session.transport.send(JSON.stringify(message));
    } catch (error) {
      this.logger?.warn?.('[FireworksRoomHub] failed to send message', error);
    }
  }

  private broadcastToRoom(roomId: string, message: FireworksServerMessage, excludeConnectionId?: string): void {
    const room = this.rooms.get(roomId);
    if (!room) {
      return;
    }

    for (const connectionId of room.connections) {
      if (excludeConnectionId && connectionId === excludeConnectionId) {
        continue;
      }
      this.sendToConnection(connectionId, message);
    }
  }

  private sendError(connectionId: string, code: string, message: string): void {
    this.sendToConnection(connectionId, {
      type: 'error',
      code,
      message,
    });
  }
}

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function trimHistory<T>(history: T[], limit: number): void {
  if (history.length <= limit) {
    return;
  }
  history.splice(0, history.length - limit);
}

function parseClientMessage(raw: unknown):
  | { ok: true; value: FireworksClientMessage }
  | { ok: false; error: string } {
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw) as FireworksClientMessage;
      return { ok: true, value: parsed };
    } catch {
      return { ok: false, error: 'Invalid JSON payload.' };
    }
  }

  if (isObject(raw)) {
    return { ok: true, value: raw as FireworksClientMessage };
  }

  return { ok: false, error: 'Unsupported message payload.' };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
