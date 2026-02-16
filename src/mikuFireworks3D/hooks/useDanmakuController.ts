'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { DANMAKU_MAX_LENGTH, DANMAKU_TRACK_COUNT } from '../constants';
import type { DanmakuControllerOptions, DanmakuMessage, DanmakuSendResult, FireworkKind } from '../types';

export interface DanmakuOverlayItem extends DanmakuMessage {
  track: number;
  durationMs: number;
}

interface SendDanmakuOptions {
  optimistic?: boolean;
}

export function useDanmakuController(options?: DanmakuControllerOptions) {
  const [items, setItems] = useState<DanmakuOverlayItem[]>([]);
  const cursorRef = useRef(0);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const addIncoming = useCallback((message: DanmakuMessage) => {
    setItems((prev) => {
      const track = cursorRef.current % DANMAKU_TRACK_COUNT;
      const item: DanmakuOverlayItem = {
        ...message,
        track,
        durationMs: 8000 + Math.floor(Math.random() * 2800),
      };
      return [...prev.slice(-40), item];
    });
    cursorRef.current += 1;
  }, []);

  const send = useCallback(
    (text: string, color?: string, sendOptions?: SendDanmakuOptions): DanmakuSendResult | null => {
      const trimmed = text.trim();
      if (!trimmed) {
        return null;
      }

      const { content, launchKind } = parseCommand(trimmed);
      const safeText = content.slice(0, DANMAKU_MAX_LENGTH);
      if (!safeText) {
        return null;
      }

      const message: DanmakuMessage = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        text: safeText,
        color,
        timestamp: Date.now(),
      };

      const optimistic = sendOptions?.optimistic ?? true;
      if (optimistic) {
        addIncoming(message);
      }

      options?.onSend?.(message);

      return {
        message,
        launchKind,
      };
    },
    [addIncoming, options]
  );

  return useMemo(
    () => ({
      items,
      send,
      addIncoming,
      removeItem,
    }),
    [addIncoming, items, removeItem, send]
  );
}

function parseCommand(text: string): { content: string; launchKind?: FireworkKind } {
  if (text.startsWith('/miku ')) {
    return { launchKind: 'miku', content: text.replace('/miku ', '').trim() };
  }
  if (text === '/miku') {
    return { launchKind: 'miku', content: 'MIKU!' };
  }
  if (text.startsWith('/avatar ')) {
    return { launchKind: 'avatar', content: text.replace('/avatar ', '').trim() };
  }
  if (text === '/avatar') {
    return { launchKind: 'avatar', content: 'Avatar Firework!' };
  }
  if (text.startsWith('/normal ')) {
    return { launchKind: 'normal', content: text.replace('/normal ', '').trim() };
  }
  if (text === '/normal') {
    return { launchKind: 'normal', content: 'Fireworks!' };
  }
  return { content: text };
}
