'use client';

import { Maximize2 } from 'lucide-react';
import { ColorStyleField } from './ColorStyleField';
import { DEFAULT_CANVAS_BG } from '../../../domain/nodeStyle';

interface CanvasSettingsPanelProps {
  nodeCount: number;
  edgeCount: number;
  canvasBgColor: string;
  onCanvasBgChange: (color: string) => void;
  onFitAllNodes: () => void;
  embedded?: boolean;
}

export function CanvasSettingsPanel({
  nodeCount,
  edgeCount,
  canvasBgColor,
  onCanvasBgChange,
  onFitAllNodes,
  embedded,
}: CanvasSettingsPanelProps) {
  return (
    <aside
      className={`flex w-full flex-col gap-4 overflow-y-auto border-[var(--nn-shell-border)] bg-[var(--nn-shell-surface)] p-4 text-[var(--nn-shell-text)] ${
        embedded ? 'border-0 bg-transparent p-0' : 'border-l'
      }`}
    >
      <div>
        <h2 className="text-sm font-semibold">画布</h2>
        <p className="mt-1 text-xs text-[var(--nn-shell-muted)]">
          {nodeCount} 个节点 · {edgeCount} 条连接线
        </p>
      </div>

      <ColorStyleField
        id="canvas-bg-color"
        label="画布背景色"
        value={canvasBgColor}
        fallback={DEFAULT_CANVAS_BG}
        onChange={onCanvasBgChange}
      />

      <button
        type="button"
        onClick={onFitAllNodes}
        disabled={nodeCount === 0}
        className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-[var(--nn-shell-border)] px-3 text-sm transition-colors duration-200 hover:bg-[var(--nn-shell-bg)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Maximize2 className="h-4 w-4" aria-hidden />
        显示全部节点
      </button>

      <p className="text-xs leading-relaxed text-[var(--nn-shell-muted)]">
        点击画布上的节点或连接线可编辑内容与样式。若看不到节点，请点「显示全部节点」。
      </p>
    </aside>
  );
}
