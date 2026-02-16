import type { FireworkKind, FireworkLaunchPayload } from '../types';

export interface FireworksUserIdentity {
  userId: string;
  nickname?: string;
  avatarUrl?: string;
}

export interface DanmakuBroadcastEvent {
  id: string;
  roomId: string;
  text: string;
  color?: string;
  kind?: FireworkKind;
  user: FireworksUserIdentity;
  timestamp: number;
}

export interface FireworkBroadcastEvent {
  id: string;
  roomId: string;
  payload: FireworkLaunchPayload;
  user: FireworksUserIdentity;
  timestamp: number;
}

export type FireworksClientMessage =
  | {
      type: 'join';
      roomId: string;
      user: FireworksUserIdentity;
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
    }
  | {
      type: 'ping';
      ts?: number;
    };

export type FireworksServerMessage =
  | {
      type: 'joined';
      roomId: string;
      self: FireworksUserIdentity;
      onlineCount: number;
    }
  | {
      type: 'room.snapshot';
      roomId: string;
      users: FireworksUserIdentity[];
      danmakuHistory: DanmakuBroadcastEvent[];
      fireworkHistory: FireworkBroadcastEvent[];
    }
  | {
      type: 'room.user_joined';
      roomId: string;
      user: FireworksUserIdentity;
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
      event: DanmakuBroadcastEvent;
    }
  | {
      type: 'firework.broadcast';
      roomId: string;
      event: FireworkBroadcastEvent;
    }
  | {
      type: 'pong';
      ts: number;
    }
  | {
      type: 'error';
      code: string;
      message: string;
    };

export interface FireworksConnectionTransport {
  send: (encodedMessage: string) => void;
  close?: (code?: number, reason?: string) => void;
}

export interface FireworksConnection {
  id: string;
  handleMessage: (raw: unknown) => void;
  disconnect: (reason?: string) => void;
  send: (message: FireworksServerMessage) => void;
}

export interface FireworksRoomHubOptions {
  maxUsersPerRoom?: number;
  historyLimit?: number;
  maxDanmakuLength?: number;
  logger?: Pick<Console, 'info' | 'warn' | 'error'>;
}

export interface FireworksHubStats {
  rooms: number;
  connections: number;
}

export interface WsLikeSocket {
  send: (data: string) => void;
  on: (event: 'message' | 'close' | 'error', listener: (...args: unknown[]) => void) => void;
}
