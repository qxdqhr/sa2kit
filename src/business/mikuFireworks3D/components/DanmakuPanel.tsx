'use client';

import React, { useState } from 'react';

interface DanmakuPanelProps {
  onSend: (text: string) => void;
}

export function DanmakuPanel({ onSend }: DanmakuPanelProps) {
  const [text, setText] = useState('');

  const emit = () => {
    const value = text.trim();
    if (!value) {
      return;
    }
    onSend(value);
    setText('');
  };

  return (
    <div className="rounded-xl border border-slate-600/40 bg-slate-900/70 p-3 text-slate-100 backdrop-blur-sm">
      <div className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              emit();
            }
          }}
          placeholder="发送弹幕（支持 /miku /avatar /normal）"
          className="flex-1 rounded-md border border-slate-600 bg-slate-950 px-2.5 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400"
        />
        <button
          type="button"
          onClick={emit}
          className="rounded-md bg-cyan-400 px-3 py-2 text-sm font-medium text-slate-950 hover:bg-cyan-300"
        >
          发送
        </button>
      </div>
    </div>
  );
}
