'use client';

import React, { useMemo, useState } from 'react';
import { resizeFestivalCardPages } from '../core';
import type { FestivalCardConfig, FestivalCardElement } from '../types';

interface FestivalCardConfigEditorProps {
  value: FestivalCardConfig;
  onChange: (config: FestivalCardConfig) => void;
  activePageIndex?: number;
  onActivePageIndexChange?: (index: number) => void;
  selectedElementId?: string | null;
}

const createTextElement = (pageIndex: number): FestivalCardElement => ({
  id: `text-${Date.now()}-${pageIndex}`,
  type: 'text',
  x: 50,
  y: 50,
  width: 70,
  content: '请输入文字',
  fontSize: 18,
  fontWeight: 500,
  align: 'center',
  color: '#ffffff',
  fontFamily: 'inherit',
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

export const FestivalCardConfigEditor: React.FC<FestivalCardConfigEditorProps> = ({
  value,
  onChange,
  activePageIndex: activePageIndexProp,
  onActivePageIndexChange,
  selectedElementId,
}) => {
  const [internalActivePageIndex, setInternalActivePageIndex] = useState(0);
  const activePageIndex = activePageIndexProp ?? internalActivePageIndex;
  const setActivePageIndex = (index: number) => {
    if (typeof activePageIndexProp === 'number') {
      onActivePageIndexChange?.(index);
      return;
    }
    setInternalActivePageIndex(index);
  };
  const page = value.pages[activePageIndex];
  const canEditPage = Boolean(page);
  const pageOptions = useMemo(() => value.pages.map((_, index) => index), [value.pages]);

  const handlePageCountChange = (nextRaw: number) => {
    const next = Number.isFinite(nextRaw) ? Math.max(1, Math.min(12, Math.floor(nextRaw))) : value.pages.length;
    const resized = resizeFestivalCardPages(value, next);
    onChange(resized);
    if (activePageIndex > resized.pages.length - 1) {
      setActivePageIndex(resized.pages.length - 1);
    }
  };

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

  const removeElement = (elementId: string) => {
    onChange({
      ...value,
      pages: value.pages.map((p, pIndex) =>
        pIndex === activePageIndex
          ? {
              ...p,
              elements: p.elements.filter((el) => el.id !== elementId),
            }
          : p
      ),
    });
  };

  const updatePage = (patch: Partial<FestivalCardConfig['pages'][number]>) => {
    onChange({
      ...value,
      pages: value.pages.map((p, index) => (index === activePageIndex ? { ...p, ...patch } : p)),
    });
  };

  const numberFieldClassName =
    'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100';

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
            onChange={(event) => handlePageCountChange(Number(event.target.value))}
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
          <span className="text-sm font-medium text-slate-700">页面标题</span>
          <input
            type="text"
            value={page?.title || ''}
            onChange={(event) => updatePage({ title: event.target.value })}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
          />
        </label>

        <div className="grid gap-2 sm:grid-cols-2">
          <label className="grid gap-1.5">
            <span className="text-sm font-medium text-slate-700">页面背景色</span>
            <input
              type="color"
              value={page?.background?.color || '#0f172a'}
              onChange={(event) =>
                updatePage({
                  background: {
                    ...page?.background,
                    color: event.target.value,
                  },
                })
              }
              className="h-10 w-full rounded-lg border border-slate-300 bg-white p-1"
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-sm font-medium text-slate-700">页面背景图 URL</span>
            <input
              type="url"
              value={page?.background?.image || ''}
              onChange={(event) =>
                updatePage({
                  background: {
                    ...page?.background,
                    image: event.target.value,
                  },
                })
              }
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            />
          </label>
        </div>

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
              <div
                key={element.id}
                className={`rounded-xl border bg-slate-50 p-3 ${
                  selectedElementId === element.id ? 'border-sky-400 ring-2 ring-sky-100' : 'border-slate-200'
                }`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-xs font-semibold tracking-wide text-slate-500">{element.type.toUpperCase()}</div>
                  <button
                    type="button"
                    onClick={() => removeElement(element.id)}
                    className="rounded-md border border-rose-300 bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700"
                  >
                    删除
                  </button>
                </div>
                {element.type === 'text' ? (
                  <div className="grid gap-2">
                    <textarea
                      value={element.content}
                      onChange={(event) => updateElement(element.id, { content: event.target.value })}
                      rows={3}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                    />
                    <div className="grid gap-2 sm:grid-cols-2">
                      <label className="grid gap-1 text-xs text-slate-600">
                        X(%)
                        <input
                          type="number"
                          value={element.x}
                          onChange={(event) => updateElement(element.id, { x: Number(event.target.value) })}
                          className={numberFieldClassName}
                        />
                      </label>
                      <label className="grid gap-1 text-xs text-slate-600">
                        Y(%)
                        <input
                          type="number"
                          value={element.y}
                          onChange={(event) => updateElement(element.id, { y: Number(event.target.value) })}
                          className={numberFieldClassName}
                        />
                      </label>
                      <label className="grid gap-1 text-xs text-slate-600">
                        宽度(%)
                        <input
                          type="number"
                          value={element.width ?? 70}
                          onChange={(event) => updateElement(element.id, { width: Number(event.target.value) })}
                          className={numberFieldClassName}
                        />
                      </label>
                      <label className="grid gap-1 text-xs text-slate-600">
                        字号(px)
                        <input
                          type="number"
                          value={element.fontSize ?? 18}
                          onChange={(event) => updateElement(element.id, { fontSize: Number(event.target.value) })}
                          className={numberFieldClassName}
                        />
                      </label>
                      <label className="grid gap-1 text-xs text-slate-600">
                        字重
                        <input
                          type="number"
                          min={100}
                          max={900}
                          step={100}
                          value={element.fontWeight ?? 500}
                          onChange={(event) => updateElement(element.id, { fontWeight: Number(event.target.value) })}
                          className={numberFieldClassName}
                        />
                      </label>
                      <label className="grid gap-1 text-xs text-slate-600">
                        对齐
                        <select
                          value={element.align || 'left'}
                          onChange={(event) =>
                            updateElement(element.id, { align: event.target.value as 'left' | 'center' | 'right' })
                          }
                          className={numberFieldClassName}
                        >
                          <option value="left">left</option>
                          <option value="center">center</option>
                          <option value="right">right</option>
                        </select>
                      </label>
                      <label className="grid gap-1 text-xs text-slate-600 sm:col-span-2">
                        字体
                        <input
                          type="text"
                          value={element.fontFamily || ''}
                          onChange={(event) => updateElement(element.id, { fontFamily: event.target.value })}
                          placeholder="inherit / serif / sans-serif / PingFang SC"
                          className={numberFieldClassName}
                        />
                      </label>
                      <label className="grid gap-1 text-xs text-slate-600 sm:col-span-2">
                        文字颜色
                        <div className="grid grid-cols-[64px_1fr] gap-2">
                          <input
                            type="color"
                            value={element.color || '#ffffff'}
                            onChange={(event) => updateElement(element.id, { color: event.target.value })}
                            className="h-10 rounded-lg border border-slate-300 bg-white p-1"
                          />
                          <input
                            type="text"
                            value={element.color || '#ffffff'}
                            onChange={(event) => updateElement(element.id, { color: event.target.value })}
                            className={numberFieldClassName}
                          />
                        </div>
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-2">
                    <input
                      type="url"
                      value={element.src}
                      onChange={(event) => updateElement(element.id, { src: event.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                    />
                    <div className="grid gap-2 sm:grid-cols-2">
                      <label className="grid gap-1 text-xs text-slate-600">
                        X(%)
                        <input
                          type="number"
                          value={element.x}
                          onChange={(event) => updateElement(element.id, { x: Number(event.target.value) })}
                          className={numberFieldClassName}
                        />
                      </label>
                      <label className="grid gap-1 text-xs text-slate-600">
                        Y(%)
                        <input
                          type="number"
                          value={element.y}
                          onChange={(event) => updateElement(element.id, { y: Number(event.target.value) })}
                          className={numberFieldClassName}
                        />
                      </label>
                      <label className="grid gap-1 text-xs text-slate-600">
                        宽度(%)
                        <input
                          type="number"
                          value={element.width ?? 60}
                          onChange={(event) => updateElement(element.id, { width: Number(event.target.value) })}
                          className={numberFieldClassName}
                        />
                      </label>
                      <label className="grid gap-1 text-xs text-slate-600">
                        高度(%)
                        <input
                          type="number"
                          value={element.height ?? 40}
                          onChange={(event) => updateElement(element.id, { height: Number(event.target.value) })}
                          className={numberFieldClassName}
                        />
                      </label>
                      <label className="grid gap-1 text-xs text-slate-600">
                        圆角(px)
                        <input
                          type="number"
                          value={element.borderRadius ?? 0}
                          onChange={(event) => updateElement(element.id, { borderRadius: Number(event.target.value) })}
                          className={numberFieldClassName}
                        />
                      </label>
                      <label className="grid gap-1 text-xs text-slate-600">
                        填充
                        <select
                          value={element.fit || 'cover'}
                          onChange={(event) => updateElement(element.id, { fit: event.target.value as 'cover' | 'contain' })}
                          className={numberFieldClassName}
                        >
                          <option value="cover">cover</option>
                          <option value="contain">contain</option>
                        </select>
                      </label>
                    </div>
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
