'use client';

import React from 'react';
import type { FestivalCardElement, FestivalCardPage } from '../types';

const elementStyle = (element: FestivalCardElement): React.CSSProperties => ({
  position: 'absolute',
  left: `${element.x}%`,
  top: `${element.y}%`,
  width: `${element.width ?? 70}%`,
  height: element.height ? `${element.height}%` : undefined,
  transform: 'translate(-50%, -50%)',
});

const renderElement = (element: FestivalCardElement) => {
  if (element.type === 'text') {
    return (
      <div
        key={element.id}
        style={{
          ...elementStyle(element),
          color: element.color || '#f8fafc',
          fontSize: element.fontSize || 18,
          fontWeight: element.fontWeight || 500,
          textAlign: element.align || 'left',
          lineHeight: 1.45,
          whiteSpace: 'pre-wrap',
        }}
      >
        {element.content}
      </div>
    );
  }

  return (
    <img
      key={element.id}
      src={element.src}
      alt={element.alt || 'festival-card-image'}
      style={{
        ...elementStyle(element),
        objectFit: element.fit || 'cover',
        borderRadius: element.borderRadius || 0,
        overflow: 'hidden',
        boxShadow: '0 12px 30px rgba(2, 6, 23, 0.32)',
      }}
    />
  );
};

interface FestivalCardPageRendererProps {
  page: FestivalCardPage;
}

export const FestivalCardPageRenderer: React.FC<FestivalCardPageRendererProps> = ({ page }) => {
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        borderRadius: 16,
        backgroundColor: page.background?.color || '#0f172a',
        backgroundImage: page.background?.image ? `url(${page.background.image})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {page.elements.map(renderElement)}
    </div>
  );
};
