import type {
  FireworkKind,
  FireworkLaunchPayload,
  FireworksRealtimeConfig,
  FireworksRealtimeState,
  FireworksRealtimeUser,
} from '../types';

interface RealtimeDanmakuEvent {
  id: string;
  roomId: string;
  text: string;
  color?: string;
  kind?: FireworkKind;
  user: FireworksRealtimeUser;
  timestamp: number;
}

interface RealtimeFireworkEvent {
  id: string;
  roomId: string;
  payload: FireworkLaunchPayload;
  user: FireworksRealtimeUser;
  timestamp: number;
}

type ClientMessage =
  | {
      type: 'join';
      roomId: string;
      user: FireworksRealtimeUser;
    }
  | {
      type: 'leave';
    }
  | {
      type: 'danmaku.send';
      payload: {
        text: string;
        color?: string;
        kind?: FireworkKind;
      };
    }
  | {
      type: 'firework.launch';
      payload: FireworkLaunchPayload;
    };

type ServerMessage =
  | {
      type: 'joined';
      roomId: string;
      onlineCount: number;
      self: FireworksRealtimeUser;
    }
  | {
      type: 'room.snapshot';
      roomId: string;
      users: FireworksRealtimeUser[];
      danmakuHistory: RealtimeDanmakuEvent[];
      fireworkHistory: RealtimeFireworkEvent[];
    }
  | {
      type: 'room.user_joined';
      roomId: string;
      user: FireworksRealtimeUser;
      onlineCount: number;
    }
  | {
      type: 'room.user_left';
      roomId: string;
      userId: string;
      onlineCount: number;
    }
  | {
      type: 'danmaku.broadcast';
      roomId: string;
      event: RealtimeDanmakuEvent;
    }
  | {
      type: 'firework.broadcast';
      roomId: string;
      event: RealtimeFireworkEvent;
    }
  | {
      type: 'error';
      code: string;
      message: string;
    }
  | {
      type: 'pong';
      ts: number;
    };

export interface WebSocketTransportCallbacks {
  onStateChange?: (state: FireworksRealtimeState) => void;
  onDanmakuBroadcast?: (event: RealtimeDanmakuEvent) => void;
  onFireworkBroadcast?: (event: RealtimeFireworkEvent) => void;
  onSnapshot?: (snapshot: Extract<ServerMessage, { type: 'room.snapshot' }>) => void;
  onError?: (error: Error) => void;
}

export class WebSocketTransport {
  private socket: WebSocket | null = null;
  private reconnectTimer: number | null = null;
  private isManualClose = false;
  private readonly pendingQueue: ClientMessage[] = [];
  private readonly config: FireworksRealtimeConfig;
  private readonly callbacks: WebSocketTransportCallbacks;
  private state: FireworksRealtimeState;

  constructor(config: FireworksRealtimeConfig, callbacks?: WebSocketTransportCallbacks) {
    this.config = config;
    this.callbacks = callbacks || {};
    this.state = {
      connected: false,
      joined: false,
      onlineCount: 0,
      roomId: config.roomId,
    };
  }

  connect(): void {
    if (this.socket && (this.socket.readyState === window.WebSocket.OPEN || this.socket.readyState === window.WebSocket.CONNECTING)) {
      return;
    }

    this.isManualClose = false;

    try {
      this.socket = this.config.protocols
        ? new window.WebSocket(this.config.serverUrl, this.config.protocols)
        : new window.WebSocket(this.config.serverUrl);
      this.socket.binaryType = 'arraybuffer';
    } catch {
      this.callbacks.onError?.(new Error('Failed to create WebSocket connection.'));
      return;
    }

    this.socket.onopen = () => {
      this.updateState({ connected: true, joined: false });
      this.send({
        type: 'join',
        roomId: this.config.roomId,
        user: this.config.user,
      });
    };

    this.socket.onmessage = (event) => {
      const parsed = parseServerMessage(event.data);
      if (!parsed) {
        return;
      }
      this.handleServerMessage(parsed);
    };

    this.socket.onerror = () => {
      this.callbacks.onError?.(new Error('WebSocket transport error.'));
    };

    this.socket.onclose = () => {
      this.updateState({ connected: false, joined: false });
      this.scheduleReconnect();
    };
  }

  disconnect(): void {
    this.isManualClose = true;
    this.pendingQueue.length = 0;
    if (this.reconnectTimer != null) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (!this.socket) {
      return;
    }

    this.send({ type: 'leave' });
    this.socket.close();
    this.socket = null;
  }

  sendDanmaku(payload: { text: string; color?: string; kind?: FireworkKind }): void {
    this.send({
      type: 'danmaku.send',
      payload,
    });
  }

  sendFirework(payload: FireworkLaunchPayload): void {
    this.send({
      type: 'firework.launch',
      payload,
    });
  }

  getState(): FireworksRealtimeState {
    return this.state;
  }

  private send(message: ClientMessage): void {
    if (!this.socket || this.socket.readyState !== window.WebSocket.OPEN) {
      if (message.type === 'danmaku.send' || message.type === 'firework.launch') {
        this.pendingQueue.push(message);
      }
      return;
    }

    if ((message.type === 'danmaku.send' || message.type === 'firework.launch') && !this.state.joined) {
      this.pendingQueue.push(message);
      return;
    }

    this.socket.send(JSON.stringify(message));
  }

  private updateState(partial: Partial<FireworksRealtimeState>): void {
    this.state = {
      ...this.state,
      ...partial,
    };
    this.callbacks.onStateChange?.(this.state);
  }

  private handleServerMessage(message: ServerMessage): void {
    if (message.type === 'joined') {
      this.updateState({ roomId: message.roomId, onlineCount: message.onlineCount, joined: true });
      this.flushPendingQueue();
      return;
    }

    if (message.type === 'room.user_joined' || message.type === 'room.user_left') {
      this.updateState({ onlineCount: message.onlineCount, roomId: message.roomId, joined: true });
      this.flushPendingQueue();
      return;
    }

    if (message.type === 'room.snapshot') {
      this.updateState({ roomId: message.roomId, onlineCount: message.users.length, joined: true });
      this.flushPendingQueue();
      this.callbacks.onSnapshot?.(message);
      return;
    }

    if (message.type === 'danmaku.broadcast') {
      if (!this.state.joined) {
        this.updateState({ joined: true, roomId: message.roomId });
        this.flushPendingQueue();
      }
      this.callbacks.onDanmakuBroadcast?.(message.event);
      return;
    }

    if (message.type === 'firework.broadcast') {
      if (!this.state.joined) {
        this.updateState({ joined: true, roomId: message.roomId });
        this.flushPendingQueue();
      }
      this.callbacks.onFireworkBroadcast?.(message.event);
      return;
    }

    if (message.type === 'error') {
      this.callbacks.onError?.(new Error(`${message.code}: ${message.message}`));
    }
  }

  private scheduleReconnect(): void {
    const reconnect = this.config.reconnect ?? true;
    if (this.isManualClose || !reconnect) {
      return;
    }

    if (this.reconnectTimer != null) {
      return;
    }

    const delay = this.config.reconnectIntervalMs ?? 1500;
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  private flushPendingQueue(): void {
    if (!this.socket || this.socket.readyState !== window.WebSocket.OPEN || !this.state.joined) {
      return;
    }

    while (this.pendingQueue.length > 0) {
      const message = this.pendingQueue.shift();
      if (!message) {
        break;
      }
      this.socket.send(JSON.stringify(message));
    }
  }
}

function parseServerMessage(raw: unknown): ServerMessage | null {
  const text = decodeMessage(raw);
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as ServerMessage;
  } catch {
    return null;
  }
}

function decodeMessage(raw: unknown): string | null {
  if (typeof raw === 'string') {
    return raw;
  }

  if (raw instanceof ArrayBuffer) {
    return new TextDecoder().decode(new Uint8Array(raw));
  }

  if (ArrayBuffer.isView(raw)) {
    return new TextDecoder().decode(raw);
  }

  return null;
}
