'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { WebSocketTransport } from '../client/WebSocketTransport';
import type {
  FireworkLaunchPayload,
  FireworksRealtimeConfig,
  FireworksRealtimeState,
  FireworkKind,
} from '../types';

interface UseFireworksRealtimeOptions {
  config?: FireworksRealtimeConfig;
  enabled?: boolean;
  onDanmakuBroadcast?: (event: {
    text: string;
    color?: string;
    kind?: FireworkKind;
    userId: string;
    timestamp: number;
    id: string;
  }) => void;
  onFireworkBroadcast?: (event: {
    id: string;
    payload: FireworkLaunchPayload;
    userId: string;
    timestamp: number;
  }) => void;
  onSnapshot?: (snapshot: {
    roomId: string;
    danmakuHistory: Array<{
      id: string;
      text: string;
      color?: string;
      kind?: FireworkKind;
      userId: string;
      timestamp: number;
    }>;
    fireworkHistory: Array<{
      id: string;
      payload: FireworkLaunchPayload;
      userId: string;
      timestamp: number;
    }>;
  }) => void;
  onError?: (error: Error) => void;
  onStateChange?: (state: FireworksRealtimeState) => void;
}

export function useFireworksRealtime(options: UseFireworksRealtimeOptions) {
  const { config, enabled, onDanmakuBroadcast, onFireworkBroadcast, onSnapshot, onError, onStateChange } = options;
  const transportRef = useRef<WebSocketTransport | null>(null);
  const callbackRef = useRef({
    onDanmakuBroadcast,
    onFireworkBroadcast,
    onSnapshot,
    onError,
    onStateChange,
  });
  const serverUrl = config?.serverUrl ?? '';
  const roomId = config?.roomId ?? '';
  const userId = config?.user.userId ?? '';
  const nickname = config?.user.nickname ?? '';
  const avatarUrl = config?.user.avatarUrl ?? '';
  const reconnect = config?.reconnect ?? true;
  const reconnectIntervalMs = config?.reconnectIntervalMs ?? 1500;
  const [state, setState] = useState<FireworksRealtimeState>({
    connected: false,
    joined: false,
    onlineCount: 0,
    roomId,
  });

  useEffect(() => {
    callbackRef.current = {
      onDanmakuBroadcast,
      onFireworkBroadcast,
      onSnapshot,
      onError,
      onStateChange,
    };
  }, [onDanmakuBroadcast, onError, onFireworkBroadcast, onSnapshot, onStateChange]);

  const normalizedConfig = useMemo(() => {
    if (!serverUrl || !roomId || !userId) {
      return undefined;
    }
    const protocols = Array.isArray(config?.protocols)
      ? [...config.protocols]
      : config?.protocols;

    return {
      serverUrl,
      roomId,
      user: {
        userId,
        nickname: nickname || undefined,
        avatarUrl: avatarUrl || undefined,
      },
      protocols,
      reconnect,
      reconnectIntervalMs,
    } satisfies FireworksRealtimeConfig;
  }, [avatarUrl, config?.protocols, nickname, reconnect, reconnectIntervalMs, roomId, serverUrl, userId]);

  useEffect(() => {
    if (!enabled || !normalizedConfig) {
      transportRef.current?.disconnect();
      transportRef.current = null;
      setState({
        connected: false,
        joined: false,
        onlineCount: 0,
        roomId: normalizedConfig?.roomId,
      });
      return;
    }

    const transport = new WebSocketTransport(normalizedConfig, {
      onStateChange: (nextState) => {
        setState(nextState);
        callbackRef.current.onStateChange?.(nextState);
      },
      onDanmakuBroadcast: (event) => {
        callbackRef.current.onDanmakuBroadcast?.({
          id: event.id,
          text: event.text,
          color: event.color,
          kind: event.kind,
          userId: event.user.userId,
          timestamp: event.timestamp,
        });
      },
      onFireworkBroadcast: (event) => {
        callbackRef.current.onFireworkBroadcast?.({
          id: event.id,
          payload: event.payload,
          userId: event.user.userId,
          timestamp: event.timestamp,
        });
      },
      onSnapshot: (snapshot) => {
        callbackRef.current.onSnapshot?.({
          roomId: snapshot.roomId,
          danmakuHistory: snapshot.danmakuHistory.map((item) => ({
            id: item.id,
            text: item.text,
            color: item.color,
            kind: item.kind,
            userId: item.user.userId,
            timestamp: item.timestamp,
          })),
          fireworkHistory: snapshot.fireworkHistory.map((item) => ({
            id: item.id,
            payload: item.payload,
            userId: item.user.userId,
            timestamp: item.timestamp,
          })),
        });
      },
      onError: (error) => {
        callbackRef.current.onError?.(error);
      },
    });

    transport.connect();
    transportRef.current = transport;

    return () => {
      transport.disconnect();
      if (transportRef.current === transport) {
        transportRef.current = null;
      }
    };
  }, [enabled, normalizedConfig]);

  return useMemo(
    () => ({
      state,
      sendDanmaku: (payload: { text: string; color?: string; kind?: FireworkKind }) => {
        transportRef.current?.sendDanmaku(payload);
      },
      sendFirework: (payload: FireworkLaunchPayload) => {
        transportRef.current?.sendFirework(payload);
      },
    }),
    [state]
  );
}
