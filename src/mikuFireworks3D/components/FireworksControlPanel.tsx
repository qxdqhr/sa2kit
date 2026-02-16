'use client';

import React from 'react';
import { FIREWORK_KIND_LABELS } from '../constants';
import type { FireworkKind } from '../types';

interface FireworksControlPanelProps {
  selectedKind: FireworkKind;
  onKindChange: (kind: FireworkKind) => void;
  autoLaunchOnDanmaku: boolean;
  onAutoLaunchChange: (value: boolean) => void;
  avatarUrl: string;
  onAvatarUrlChange: (value: string) => void;
  onLaunch: () => void;
  fps: number;
}

export function FireworksControlPanel({
  selectedKind,
  onKindChange,
  autoLaunchOnDanmaku,
  onAutoLaunchChange,
  avatarUrl,
  onAvatarUrlChange,
  onLaunch,
  fps,
}: FireworksControlPanelProps) {
  return (
    <div className="rounded-xl border border-slate-600/40 bg-slate-900/70 p-3 text-slate-100 backdrop-blur-sm">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {(Object.keys(FIREWORK_KIND_LABELS) as FireworkKind[]).map((kind) => {
          const active = kind === selectedKind;
          return (
            <button
              key={kind}
              type="button"
              onClick={() => onKindChange(kind)}
              className={`rounded-md px-3 py-1.5 text-sm transition ${
                active ? 'bg-cyan-500 text-slate-950' : 'bg-slate-700/70 hover:bg-slate-600/80'
              }`}
            >
              {FIREWORK_KIND_LABELS[kind]}
            </button>
          );
        })}

        <button
          type="button"
          onClick={onLaunch}
          className="ml-auto rounded-md bg-emerald-400 px-3 py-1.5 text-sm font-medium text-slate-900 hover:bg-emerald-300"
        >
          发射烟花
        </button>
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={autoLaunchOnDanmaku}
            onChange={(event) => onAutoLaunchChange(event.target.checked)}
          />
          发送弹幕后自动放烟花
        </label>

        <div className="text-sm text-slate-300">FPS: {fps}</div>
      </div>

      {selectedKind === 'avatar' ? (
        <div className="mt-2">
          <input
            type="url"
            value={avatarUrl}
            onChange={(event) => onAvatarUrlChange(event.target.value)}
            placeholder="头像图片 URL（用于头像烟花）"
            className="w-full rounded-md border border-slate-600 bg-slate-950 px-2.5 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400"
          />
        </div>
      ) : null}
    </div>
  );
}
