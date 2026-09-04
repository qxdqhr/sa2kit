'use client';

import { Trash2 } from 'lucide-react';
import type { NodeNoteEdge } from '../../../domain/types';
import { ColorStyleField } from './ColorStyleField';
import { DEFAULT_EDGE_COLOR } from '../../../domain/nodeStyle';

interface EdgeStylePanelProps {
  edge: NodeNoteEdge;
  onChange: (patch: Partial<Pick<NodeNoteEdge, 'label' | 'color'>>) => void;
  onDelete: () => void;
  embedded?: boolean;
}

export function EdgeStylePanel({ edge, onChange, onDelete, embedded }: EdgeStylePanelProps) {
  const shellClass = embedded
    ? 'flex w-full flex-col text-[var(--nn-shell-text)]'
    : 'flex h-full w-full flex-col border-l border-[var(--nn-shell-border)] bg-[var(--nn-shell-surface)] text-[var(--nn-shell-text)] lg:w-80';

  return (
    <aside className={shellClass} aria-label="连接线样式">
      {!embedded ? (
        <div className="border-b border-[var(--nn-shell-border)] px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--nn-shell-muted)]">
            连接线样式
          </p>
        </div>
      ) : null}

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <ColorStyleField
          id="edge-color"
          label="线条颜色"
          value={edge.color ?? DEFAULT_EDGE_COLOR}
          fallback={DEFAULT_EDGE_COLOR}
          onChange={(color) => onChange({ color })}
        />

        <div>
          <label htmlFor="edge-label" className="mb-1 block text-sm font-medium">
            标签（可选）
          </label>
          <input
            id="edge-label"
            value={edge.label ?? ''}
            onChange={(e) => onChange({ label: e.target.value || null })}
            maxLength={50}
            placeholder="关系说明…"
            className="min-h-11 w-full rounded-lg border border-[var(--nn-shell-border)] bg-[var(--nn-shell-bg)] px-3 text-sm text-[var(--nn-shell-text)]"
          />
        </div>

        <p className="text-xs text-[var(--nn-shell-muted)]">
          桌面端可从圆点拖拽连线；移动端请用底部「连线」按钮，依次点击源节点与目标节点。
        </p>
      </div>

      <div className="border-t border-[var(--nn-shell-border)] p-4">
        <button
          type="button"
          onClick={onDelete}
          className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-[var(--nn-destructive)] px-3 text-sm text-[var(--nn-destructive)] transition-colors duration-200 hover:bg-[var(--nn-shell-bg)]"
        >
          <Trash2 className="h-4 w-4" aria-hidden />
          删除连接线
        </button>
      </div>
    </aside>
  );
}
