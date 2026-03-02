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
      <div
        style={{
          width: '100%',
          minHeight: 560,
          borderRadius: 24,
          padding: 24,
          background: `linear-gradient(145deg, ${normalized.background?.colorA || '#0c1a34'} 0%, ${normalized.background?.colorB || '#1f4f8a'} 100%)`,
          boxShadow: '0 26px 70px rgba(2, 6, 23, 0.45)',
        }}
      >
        <div
          style={{
            marginBottom: 14,
            color: '#f8fafc',
            fontSize: 14,
            opacity: 0.9,
            textAlign: 'center',
          }}
        >
          {normalized.coverTitle || 'Festival Card'} · 第 {currentPage + 1} / {pages.length} 页
        </div>

        <div style={{ perspective: 1400, width: '100%', maxWidth: 920, margin: '0 auto' }}>
          <div
            style={{
              position: 'relative',
              height: 460,
              transformStyle: 'preserve-3d',
            }}
          >
            {pages.map((page, index) => {
              const isFlipped = index < currentPage;
              const zIndex = pages.length - index;

              return (
                <div
                  key={page.id}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    transformStyle: 'preserve-3d',
                    transformOrigin: 'left center',
                    transform: `rotateY(${isFlipped ? -170 : 0}deg)`,
                    transition: 'transform 600ms cubic-bezier(0.2, 0.8, 0.2, 1)',
                    zIndex,
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backfaceVisibility: 'hidden',
                    }}
                  >
                    <FestivalCardPageRenderer page={page} />
                  </div>
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      transform: 'rotateY(180deg)',
                      backfaceVisibility: 'hidden',
                      borderRadius: 16,
                      background: '#0f172a',
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 18 }}>
          <button
            type="button"
            disabled={!canPrev}
            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            style={{
              border: 'none',
              borderRadius: 999,
              padding: '9px 16px',
              fontSize: 14,
              cursor: canPrev ? 'pointer' : 'not-allowed',
              opacity: canPrev ? 1 : 0.4,
            }}
          >
            上一页
          </button>
          <button
            type="button"
            disabled={!canNext}
            onClick={() => setCurrentPage((p) => Math.min(pages.length - 1, p + 1))}
            style={{
              border: 'none',
              borderRadius: 999,
              padding: '9px 16px',
              fontSize: 14,
              cursor: canNext ? 'pointer' : 'not-allowed',
              opacity: canNext ? 1 : 0.4,
            }}
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
          style={{ width: '100%', marginTop: 10 }}
        />
      ) : null}
    </div>
  );
};
