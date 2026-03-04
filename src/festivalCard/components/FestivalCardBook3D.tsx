'use client';

import React, { useMemo, useState } from 'react';
import { normalizeFestivalCardConfig } from '../core';
import type { FestivalCardConfig } from '../types';
import { FestivalCardPageRenderer } from './FestivalCardPageRenderer';

export interface FestivalCardBook3DProps {
  config: FestivalCardConfig;
  className?: string;
}

export const FestivalCardBook3D: React.FC<FestivalCardBook3DProps> = ({ config, className }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const normalized = useMemo(() => normalizeFestivalCardConfig(config), [config]);
  const pages = normalized.pages;

  const canPrev = currentPage > 0;
  const canNext = currentPage < pages.length - 1;

  return (
    <div className={className}>
      <div className="w-full min-h-screen px-0 py-4">
        <div className="mx-auto w-full text-center text-slate-100">
          <h3 className="mb-3 text-lg font-semibold">{normalized.coverTitle || 'Festival Card'}</h3>
        </div>

        <div className="mx-auto w-full">
          <div className="relative h-[calc(100vh-170px)] min-h-[460px]">
            {pages.map((page, index) => (
              <div
                key={page.id}
                className="absolute inset-0 transition-opacity duration-500 ease-out"
                style={{
                  opacity: index === currentPage ? 1 : 0,
                  pointerEvents: index === currentPage ? 'auto' : 'none',
                }}
              >
                <FestivalCardPageRenderer page={page} />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 flex justify-center gap-3">
          <button
            type="button"
            disabled={!canPrev}
            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            className="rounded-full bg-white px-5 py-2 text-sm font-medium text-slate-900 disabled:cursor-not-allowed disabled:opacity-45"
          >
            上一页
          </button>
          <button
            type="button"
            disabled={!canNext}
            onClick={() => setCurrentPage((p) => Math.min(pages.length - 1, p + 1))}
            className="rounded-full bg-sky-300 px-5 py-2 text-sm font-medium text-slate-900 disabled:cursor-not-allowed disabled:opacity-45"
          >
            下一页
          </button>
        </div>
      </div>

      {normalized.backgroundMusic?.src ? (
        <audio
          src={normalized.backgroundMusic.src}
          autoPlay={normalized.backgroundMusic.autoPlay}
          loop={normalized.backgroundMusic.loop}
          controls
          className="mt-3 w-full"
        />
      ) : null}
    </div>
  );
};
