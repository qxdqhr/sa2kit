'use client';

import React, { useEffect, useState } from 'react';
import { normalizeFestivalCardConfig } from '../core';
import { useFestivalCardConfig } from '../hooks/useFestivalCardConfig';
import type { FestivalCardConfig, FestivalCardElement } from '../types';
import { FestivalCardBook3D } from './FestivalCardBook3D';
import { FestivalCardConfigEditor } from './FestivalCardConfigEditor';

interface FestivalCardStudioProps {
  initialConfig?: FestivalCardConfig;
  fetchConfig?: () => Promise<FestivalCardConfig>;
  onSave?: (config: FestivalCardConfig) => Promise<void> | void;
}

export const FestivalCardStudio: React.FC<FestivalCardStudioProps> = ({ initialConfig, fetchConfig, onSave }) => {
  const { config, setConfig, loading, save, saving } = useFestivalCardConfig({
    initialConfig: normalizeFestivalCardConfig(initialConfig),
    fetchConfig,
    onSave,
  });
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  useEffect(() => {
    if (config.pages.length === 0) return;
    if (activePageIndex <= config.pages.length - 1) return;
    setActivePageIndex(config.pages.length - 1);
  }, [activePageIndex, config.pages.length]);

  const updateElementByPreview = (pageIndex: number, elementId: string, patch: Partial<FestivalCardElement>) => {
    setConfig((prev) => ({
      ...prev,
      pages: prev.pages.map((page, index) =>
        index === pageIndex
          ? {
              ...page,
              elements: page.elements.map((element) =>
                element.id === elementId ? ({ ...element, ...patch } as FestivalCardElement) : element
              ),
            }
          : page
      ),
    }));
  };

  if (loading) return <div>加载中...</div>;

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[1.45fr_1fr]">
      <FestivalCardBook3D
        config={config}
        className="h-full"
        editable
        currentPage={activePageIndex}
        onCurrentPageChange={(index) => {
          setActivePageIndex(index);
          setSelectedElementId(null);
        }}
        selectedElementId={selectedElementId}
        onSelectedElementChange={setSelectedElementId}
        onElementChange={updateElementByPreview}
      />
      <div className="lg:sticky lg:top-4">
        <FestivalCardConfigEditor
          value={config}
          onChange={setConfig}
          activePageIndex={activePageIndex}
          onActivePageIndexChange={(index) => {
            setActivePageIndex(index);
            setSelectedElementId(null);
          }}
          selectedElementId={selectedElementId}
        />
        {onSave ? (
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving}
            className="mt-3 w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {saving ? '保存中...' : '保存配置'}
          </button>
        ) : null}
      </div>
    </div>
  );
};
