'use client';

import React, { useMemo, useState } from 'react';
import { resizeFestivalCardPages } from '../core';
import type { FestivalCardConfig, FestivalCardElement } from '../types';

interface FestivalCardConfigEditorProps {
  value: FestivalCardConfig;
  onChange: (config: FestivalCardConfig) => void;
}

const createTextElement = (pageIndex: number): FestivalCardElement => ({
  id: `text-${Date.now()}-${pageIndex}`,
  type: 'text',
  x: 50,
  y: 50,
  content: '请输入文字',
  fontSize: 18,
  fontWeight: 500,
  align: 'center',
  color: '#ffffff',
});

const createImageElement = (pageIndex: number): FestivalCardElement => ({
  id: `image-${Date.now()}-${pageIndex}`,
  type: 'image',
  x: 50,
  y: 50,
  width: 60,
  height: 40,
  src: 'https://images.unsplash.com/photo-1482517967863-00e15c9b44be?auto=format&fit=crop&w=1200&q=80',
  fit: 'cover',
  borderRadius: 12,
});

export const FestivalCardConfigEditor: React.FC<FestivalCardConfigEditorProps> = ({ value, onChange }) => {
  const [activePageIndex, setActivePageIndex] = useState(0);
  const page = value.pages[activePageIndex];
  const canEditPage = Boolean(page);
  const pageOptions = useMemo(() => value.pages.map((_, index) => index), [value.pages]);

  const updateElement = (elementId: string, patch: Partial<FestivalCardElement>) => {
    onChange({
      ...value,
      pages: value.pages.map((p, pIndex) =>
        pIndex === activePageIndex
          ? {
              ...p,
              elements: p.elements.map((el) => (el.id === elementId ? { ...el, ...patch } as FestivalCardElement : el)),
            }
          : p
      ),
    });
  };

  return (
    <div style={{ borderRadius: 16, background: '#0f172a', color: '#e2e8f0', padding: 16 }}>
      <div style={{ display: 'grid', gap: 12 }}>
        <label style={{ display: 'grid', gap: 6 }}>
          <span>页面数量</span>
          <input
            type="number"
            min={1}
            max={12}
            value={value.pages.length}
            onChange={(event) => onChange(resizeFestivalCardPages(value, Number(event.target.value)))}
          />
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          <span>背景音乐 URL</span>
          <input
            type="url"
            value={value.backgroundMusic?.src || ''}
            onChange={(event) =>
              onChange({
                ...value,
                backgroundMusic: {
                  ...value.backgroundMusic,
                  src: event.target.value,
                },
              })
            }
          />
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          <span>编辑页面</span>
          <select value={activePageIndex} onChange={(event) => setActivePageIndex(Number(event.target.value))}>
            {pageOptions.map((index) => (
              <option key={index} value={index}>
                第 {index + 1} 页
              </option>
            ))}
          </select>
        </label>
      </div>

      {canEditPage ? (
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <button
              type="button"
              onClick={() =>
                onChange({
                  ...value,
                  pages: value.pages.map((p, index) =>
                    index === activePageIndex ? { ...p, elements: [...p.elements, createTextElement(index)] } : p
                  ),
                })
              }
            >
              + 文字
            </button>
            <button
              type="button"
              onClick={() =>
                onChange({
                  ...value,
                  pages: value.pages.map((p, index) =>
                    index === activePageIndex ? { ...p, elements: [...p.elements, createImageElement(index)] } : p
                  ),
                })
              }
            >
              + 图片
            </button>
          </div>

          <div style={{ display: 'grid', gap: 10, maxHeight: 340, overflow: 'auto' }}>
            {(page?.elements ?? []).map((element) => (
              <div key={element.id} style={{ border: '1px solid #334155', borderRadius: 10, padding: 10 }}>
                <div style={{ marginBottom: 8 }}>{element.type.toUpperCase()}</div>
                {element.type === 'text' ? (
                  <textarea
                    value={element.content}
                    onChange={(event) => updateElement(element.id, { content: event.target.value })}
                    rows={3}
                    style={{ width: '100%' }}
                  />
                ) : (
                  <input
                    type="url"
                    value={element.src}
                    onChange={(event) => updateElement(element.id, { src: event.target.value })}
                    style={{ width: '100%' }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};
