'use client';

import React, { useMemo, useState } from 'react';
import { normalizeFestivalCardConfig } from '../core';
import type { FestivalCardConfig } from '../types';
import { FestivalCardPageRenderer } from './FestivalCardPageRenderer';

interface FestivalCardMiniappProps {
  config: FestivalCardConfig;
}

export const FestivalCardMiniapp: React.FC<FestivalCardMiniappProps> = ({ config }) => {
  const normalized = useMemo(() => normalizeFestivalCardConfig(config), [config]);
  const [index, setIndex] = useState(0);
  const page = normalized.pages[index];

  if (!page) return null;

  return (
    <div>
      <div style={{ height: 420 }}>
        <FestivalCardPageRenderer page={page} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
        <button type="button" disabled={index <= 0} onClick={() => setIndex((v) => Math.max(0, v - 1))}>
          上一页
        </button>
        <div>
          {index + 1}/{normalized.pages.length}
        </div>
        <button
          type="button"
          disabled={index >= normalized.pages.length - 1}
          onClick={() => setIndex((v) => Math.min(normalized.pages.length - 1, v + 1))}
        >
          下一页
        </button>
      </div>
    </div>
  );
};
