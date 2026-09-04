'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { NodeNoteNode } from '../../../domain/types';
import { DEFAULT_NODE_BG, DEFAULT_NODE_TEXT, normalizeHexColor } from '../../../domain/nodeStyle';

export type NoteNodeData = {
  node: NodeNoteNode;
  selected: boolean;
  connectSource?: boolean;
  isPreview?: boolean;
};

function NoteNodeComponent({ data }: NodeProps & { data: NoteNodeData }) {
  const { node, selected, connectSource, isPreview } = data;
  const preview = node.contentMd.trim().slice(0, 120);
  const bgColor = normalizeHexColor(node.bgColor, DEFAULT_NODE_BG);
  const textColor = normalizeHexColor(node.textColor, DEFAULT_NODE_TEXT);

  return (
    <div
      className={`nn-note-node rounded-xl border-2 shadow-sm transition-shadow duration-200 ${
        isPreview
          ? 'border-dashed border-[var(--nn-primary)] opacity-80'
          : connectSource
            ? 'border-emerald-500 shadow-md ring-2 ring-emerald-500/40'
            : selected
              ? 'border-[var(--nn-node-selected)] shadow-md ring-2 ring-[var(--nn-node-selected)]/30'
              : 'border-[var(--nn-node-border)]'
      }`}
      style={{
        width: node.width,
        minHeight: node.height,
        backgroundColor: bgColor,
        color: textColor,
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="nn-flow-handle !border-2 !border-[var(--nn-accent)] !bg-white"
        aria-label="连入"
      />
      <div className="border-b border-black/10 px-3 py-2">
        <h3 className="truncate text-sm font-semibold" style={{ color: textColor }}>
          {node.title}
        </h3>
      </div>
      <div className="px-3 py-2 text-xs leading-relaxed opacity-90">
        {preview || <span className="opacity-50">空节点，点击编辑</span>}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="nn-flow-handle !border-2 !border-[var(--nn-primary)] !bg-white"
        aria-label="连出"
      />
    </div>
  );
}

export const NoteNode = memo(NoteNodeComponent);
