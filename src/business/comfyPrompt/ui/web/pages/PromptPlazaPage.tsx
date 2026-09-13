'use client';

import React from 'react';

import { LayoutGrid } from 'lucide-react';

export default function PromptPlazaPage() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/5 px-6 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/20 text-violet-300">
        <LayoutGrid size={28} />
      </div>
      <h1 className="text-xl font-semibold">提示词广场</h1>
      <p className="mt-2 max-w-md text-sm text-slate-400">
        功能开发中，敬请期待。未来将在此浏览与分享社区提示词。
      </p>
    </div>
  );
}
