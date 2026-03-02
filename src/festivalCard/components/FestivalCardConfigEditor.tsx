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
    <div className="rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-sm">
      <div className="grid gap-3">
        <label className="grid gap-1.5">
          <span className="text-sm font-medium text-slate-700">页面数量</span>
          <input
            type="number"
            min={1}
            max={12}
            value={value.pages.length}
            onChange={(event) => onChange(resizeFestivalCardPages(value, Number(event.target.value)))}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
          />
        </label>

        <label className="grid gap-1.5">
          <span className="text-sm font-medium text-slate-700">背景音乐 URL</span>
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
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
          />
        </label>

        <label className="grid gap-1.5">
          <span className="text-sm font-medium text-slate-700">编辑页面</span>
          <select
            value={activePageIndex}
            onChange={(event) => setActivePageIndex(Number(event.target.value))}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
          >
            {pageOptions.map((index) => (
              <option key={index} value={index}>
                第 {index + 1} 页
              </option>
            ))}
          </select>
        </label>
      </div>

      {canEditPage ? (
        <div className="mt-4">
          <div className="mb-3 flex gap-2">
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
              className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white"
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
              className="rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white"
            >
              + 图片
            </button>
          </div>

          <div className="grid max-h-[340px] gap-2.5 overflow-auto pr-1">
            {(page?.elements ?? []).map((element) => (
              <div key={element.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="mb-2 text-xs font-semibold tracking-wide text-slate-500">{element.type.toUpperCase()}</div>
                {element.type === 'text' ? (
                  <textarea
                    value={element.content}
                    onChange={(event) => updateElement(element.id, { content: event.target.value })}
                    rows={3}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                  />
                ) : (
                  <div className="grid gap-2">
                    <input
                      type="url"
                      value={element.src}
                      onChange={(event) => updateElement(element.id, { src: event.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                    />
                    <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={Boolean(element.isBackground)}
                        onChange={(event) => updateElement(element.id, { isBackground: event.target.checked })}
                        className="h-4 w-4 rounded border-slate-300 text-sky-600"
                      />
                      作为本页背景图
                    </label>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};
