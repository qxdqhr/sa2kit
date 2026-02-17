'use client';

import React, { useMemo, useRef, useState } from 'react';
import { DanmakuPanel } from './DanmakuPanel';
import { FireworksCanvas } from './FireworksCanvas';
import { FireworksControlPanel } from './FireworksControlPanel';
import { useDanmakuController } from '../hooks/useDanmakuController';
import { useFireworksEngine } from '../hooks/useFireworksEngine';
import { useFireworksRealtime } from '../hooks/useFireworksRealtime';
import type { FireworkKind, MikuFireworks3DProps } from '../types';

export function MikuFireworks3D({
  width = '100%',
  height = 520,
  className,
  defaultKind = 'normal',
  autoLaunchOnDanmaku = true,
  maxParticles,
  maxActiveFireworks,
  defaultAvatarUrl = '',
  onLaunch,
  onDanmakuSend,
  onError,
  onFpsReport,
  onRealtimeStateChange,
  realtime,
}: MikuFireworks3DProps) {
  const [selectedKind, setSelectedKind] = useState<FireworkKind>(defaultKind);
  const [avatarUrl, setAvatarUrl] = useState(defaultAvatarUrl);
  const [autoLaunch, setAutoLaunch] = useState(autoLaunchOnDanmaku);
  const seenDanmakuIdsRef = useRef<Set<string>>(new Set());
  const seenFireworkIdsRef = useRef<Set<string>>(new Set());

  const {
    containerRef,
    canvasRef,
    launch,
    fps,
    engineReady,
    pendingLaunchCount,
  } = useFireworksEngine({
    maxParticles,
    maxActiveFireworks,
    onLaunch,
    onError,
    onFpsReport,
  });

  const { items, send, addIncoming, removeItem } = useDanmakuController({
    onSend: onDanmakuSend,
  });

  const realtimeEnabled = Boolean(realtime && (realtime.enabled ?? true));
  const debugSync = typeof window !== 'undefined' && (process.env.NODE_ENV !== 'production');

  const logSync = (phase: string, eventId: string, extra?: Record<string, unknown>) => {
    if (!debugSync) {
      return;
    }
    const payload = {
      phase,
      eventId,
      engineReady,
      pendingLaunchCount,
      connected: realtimeApi.state.connected,
      joined: realtimeApi.state.joined,
      ...extra,
    };
    const rawConsole = (globalThis as { console?: Console }).console;
    rawConsole?.log('[MikuFireworks3D][sync_event]', payload);
  };

  const realtimeApi = useFireworksRealtime({
    enabled: realtimeEnabled,
    config: realtime,
    onStateChange: onRealtimeStateChange,
    onError,
    onDanmakuBroadcast: (event) => {
      if (seenDanmakuIdsRef.current.has(event.id)) {
        return;
      }
      seenDanmakuIdsRef.current.add(event.id);
      addIncoming({
        id: event.id,
        userId: event.userId,
        text: event.text,
        color: event.color,
        timestamp: event.timestamp,
      });
    },
    onFireworkBroadcast: (event) => {
      logSync('firework.broadcast.received', event.id, { kind: event.payload.kind });
      if (seenFireworkIdsRef.current.has(event.id)) {
        logSync('firework.broadcast.deduped', event.id);
        return;
      }
      seenFireworkIdsRef.current.add(event.id);
      launch(event.payload);
      logSync('firework.broadcast.dispatched', event.id, { kind: event.payload.kind });
    },
    onSnapshot: (snapshot) => {
      for (const danmaku of snapshot.danmakuHistory) {
        if (seenDanmakuIdsRef.current.has(danmaku.id)) {
          continue;
        }
        seenDanmakuIdsRef.current.add(danmaku.id);
        addIncoming({
          id: danmaku.id,
          userId: danmaku.userId,
          text: danmaku.text,
          color: danmaku.color,
          timestamp: danmaku.timestamp,
        });
      }
      for (const firework of snapshot.fireworkHistory) {
        logSync('firework.snapshot.received', firework.id, { kind: firework.payload.kind });
        if (seenFireworkIdsRef.current.has(firework.id)) {
          logSync('firework.snapshot.deduped', firework.id);
          continue;
        }
        seenFireworkIdsRef.current.add(firework.id);
        launch(firework.payload);
        logSync('firework.snapshot.dispatched', firework.id, { kind: firework.payload.kind });
      }
    },
  });

  const handleLaunch = (kind: FireworkKind) => {
    const payload = {
      kind,
      avatarUrl: kind === 'avatar' ? avatarUrl || undefined : undefined,
    };

    if (realtimeEnabled) {
      realtimeApi.sendFirework(payload);
      return;
    }

    launch(payload);
  };

  const handleSendDanmaku = (text: string) => {
    const result = send(text, undefined, {
      optimistic: !realtimeEnabled,
    });
    if (!result) {
      return;
    }

    const launchKind = result.launchKind ?? selectedKind;
    if (realtimeEnabled) {
      realtimeApi.sendDanmaku({
        text: result.message.text,
        color: result.message.color,
        kind: result.launchKind,
      });

      if (autoLaunch) {
        realtimeApi.sendFirework({
          kind: launchKind,
          avatarUrl: launchKind === 'avatar' ? avatarUrl || undefined : undefined,
          message: result.message,
        });
      }
      return;
    }

    if (autoLaunch || result.launchKind) {
      launch({
        kind: launchKind,
        avatarUrl: launchKind === 'avatar' ? avatarUrl || undefined : undefined,
        message: result.message,
      });
    }
  };

  const containerStyle = useMemo<React.CSSProperties>(
    () => ({
      width,
      height,
      minHeight: 360,
    }),
    [height, width]
  );

  return (
    <div className={`mx-auto flex w-full max-w-5xl flex-col gap-3 ${className || ''}`}>
      <div ref={containerRef} className="relative overflow-hidden rounded-2xl border border-slate-700" style={containerStyle}>
        <FireworksCanvas canvasRef={canvasRef} />

        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {items.map((item) => (
            <div
              key={item.id}
              onAnimationEnd={() => removeItem(item.id)}
              className="absolute right-[-30%] whitespace-nowrap text-sm font-semibold text-white drop-shadow"
              style={{
                top: `${8 + item.track * 11}%`,
                color: item.color || '#ffffff',
                animation: `sa2kit-danmaku-move ${item.durationMs}ms linear forwards`,
              }}
            >
              {item.text}
            </div>
          ))}
        </div>
      </div>

      <FireworksControlPanel
        selectedKind={selectedKind}
        onKindChange={setSelectedKind}
        autoLaunchOnDanmaku={autoLaunch}
        onAutoLaunchChange={setAutoLaunch}
        avatarUrl={avatarUrl}
        onAvatarUrlChange={setAvatarUrl}
        onLaunch={() => handleLaunch(selectedKind)}
        fps={fps}
        realtimeConnected={realtimeEnabled ? realtimeApi.state.connected : undefined}
        onlineCount={realtimeEnabled ? realtimeApi.state.onlineCount : undefined}
      />

      <DanmakuPanel onSend={handleSendDanmaku} />

      <style>{`\n        @keyframes sa2kit-danmaku-move {\n          0% {\n            transform: translateX(0);\n            opacity: 1;\n          }\n          100% {\n            transform: translateX(-160vw);\n            opacity: 0.92;\n          }\n        }\n      `}</style>
    </div>
  );
}
