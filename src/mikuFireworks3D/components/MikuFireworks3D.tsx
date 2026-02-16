'use client';

import React, { useMemo, useState } from 'react';
import { DanmakuPanel } from './DanmakuPanel';
import { FireworksCanvas } from './FireworksCanvas';
import { FireworksControlPanel } from './FireworksControlPanel';
import { useDanmakuController } from '../hooks/useDanmakuController';
import { useFireworksEngine } from '../hooks/useFireworksEngine';
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

  const { items, send, removeItem } = useDanmakuController({
    onSend: onDanmakuSend,
  });

  const handleLaunch = (kind: FireworkKind) => {
    launch({
      kind,
      avatarUrl: kind === 'avatar' ? avatarUrl || undefined : undefined,
    });
  };

  const handleSendDanmaku = (text: string) => {
    const result = send(text);
    if (!result) {
      return;
    }

    const launchKind = result.launchKind ?? selectedKind;
    if (autoLaunch) {
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
      />

      <DanmakuPanel onSend={handleSendDanmaku} />

      <style>{`\n        @keyframes sa2kit-danmaku-move {\n          0% {\n            transform: translateX(0);\n            opacity: 1;\n          }\n          100% {\n            transform: translateX(-160vw);\n            opacity: 0.92;\n          }\n        }\n      `}</style>
    </div>
  );
}
