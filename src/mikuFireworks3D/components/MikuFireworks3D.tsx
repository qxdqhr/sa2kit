'use client';

import React, { useMemo, useState } from 'react';
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

  const { containerRef, canvasRef, launch, fps } = useFireworksEngine({
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
  const realtimeApi = useFireworksRealtime({
    enabled: realtimeEnabled,
    config: realtime,
    onStateChange: onRealtimeStateChange,
    onError,
    onDanmakuBroadcast: (event) => {
      addIncoming({
        id: event.id,
        userId: event.userId,
        text: event.text,
        color: event.color,
        timestamp: event.timestamp,
      });
    },
    onFireworkBroadcast: (payload) => {
      launch(payload);
    },
  });

  const handleLaunch = (kind: FireworkKind) => {
    const payload = {
      kind,
      avatarUrl: kind === 'avatar' ? avatarUrl || undefined : undefined,
    };

    if (realtimeEnabled && realtimeApi.state.connected) {
      realtimeApi.sendFirework(payload);
      return;
    }

    launch(payload);
  };

  const handleSendDanmaku = (text: string) => {
    const result = send(text, undefined, {
      optimistic: !(realtimeEnabled && realtimeApi.state.connected),
    });
    if (!result) {
      return;
    }

    const launchKind = result.launchKind ?? selectedKind;
    if (realtimeEnabled && realtimeApi.state.connected) {
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
