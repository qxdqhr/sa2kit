'use client';

import React from 'react';
import type { FestivalCardElement, FestivalCardPage } from '../types';

const elementStyle = (element: FestivalCardElement): React.CSSProperties => ({
  position: 'absolute',
  zIndex: 2,
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
  const backgroundElement = page.elements.find(
    (element): element is Extract<FestivalCardElement, { type: 'image' }> => element.type === 'image' && Boolean(element.isBackground)
  );
  const foregroundElements = page.elements.filter((element) => !(element.type === 'image' && element.isBackground));

  return (
    <div
      className="relative h-full w-full overflow-hidden rounded-2xl"
      style={{
        backgroundColor: page.background?.color || '#0f172a',
        backgroundImage: backgroundElement
          ? `url(${backgroundElement.src})`
          : page.background?.image
            ? `url(${page.background.image})`
            : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-slate-950/20" />
      {foregroundElements.map(renderElement)}
    </div>
  );
};
