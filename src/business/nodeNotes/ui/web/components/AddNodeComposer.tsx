'use client';

import { Loader2, MapPin, Plus, X } from 'lucide-react';
import { ColorStyleField } from './ColorStyleField';
import { DEFAULT_NODE_BG, DEFAULT_NODE_TEXT } from '../../../domain/nodeStyle';

export interface NewNodeDraft {
  title: string;
  contentMd: string;
  bgColor: string;
  textColor: string;
}

export const EMPTY_NODE_DRAFT: NewNodeDraft = {
  title: '新节点',
  contentMd: '',
  bgColor: DEFAULT_NODE_BG,
  textColor: DEFAULT_NODE_TEXT,
};

interface AddNodeComposerProps {
  open: boolean;
  creating: boolean;
  draft: NewNodeDraft;
  onChange: (patch: Partial<NewNodeDraft>) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export function AddNodeComposer({
  open,
  creating,
  draft,
  onChange,
  onConfirm,
  onCancel,
}: AddNodeComposerProps) {
  if (!open) return null;

  const canSubmit = draft.title.trim().length > 0 && !creating;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="关闭"
        onClick={onCancel}
      />
      <div
        className="relative flex max-h-[min(88dvh,720px)] w-full max-w-lg flex-col rounded-t-2xl border border-[var(--nn-shell-border)] bg-[var(--nn-shell-surface)] shadow-2xl sm:rounded-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="新建节点"
      >
        <div className="flex items-center justify-between border-b border-[var(--nn-shell-border)] px-4 py-3">
          <div>
            <h2 className="text-base font-semibold text-[var(--nn-shell-text)]">新建节点</h2>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-[var(--nn-shell-muted)]">
              <MapPin className="h-3.5 w-3.5" aria-hidden />
              将添加到当前视图中心（半透明预览）
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-lg text-[var(--nn-shell-muted)] hover:bg-[var(--nn-shell-bg)]"
            aria-label="关闭"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
          <div>
            <label htmlFor="new-node-title" className="mb-1 block text-sm font-medium">
              标题
            </label>
            <input
              id="new-node-title"
              value={draft.title}
              onChange={(e) => onChange({ title: e.target.value })}
              className="min-h-11 w-full rounded-lg border border-[var(--nn-shell-border)] bg-[var(--nn-shell-bg)] px-3 text-sm text-[var(--nn-shell-text)]"
              placeholder="节点标题"
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="new-node-content" className="mb-1 block text-sm font-medium">
              Markdown 内容
            </label>
            <textarea
              id="new-node-content"
              value={draft.contentMd}
              onChange={(e) => onChange({ contentMd: e.target.value })}
              rows={8}
              className="w-full resize-y rounded-lg border border-[var(--nn-shell-border)] bg-[var(--nn-shell-bg)] px-3 py-2 font-mono text-sm text-[var(--nn-shell-text)]"
              placeholder="在此编写正文，确认后一并保存到画布"
            />
          </div>

          <ColorStyleField
            id="new-node-bg"
            label="节点背景色"
            value={draft.bgColor}
            fallback={DEFAULT_NODE_BG}
            onChange={(bgColor) => onChange({ bgColor })}
          />
          <ColorStyleField
            id="new-node-text"
            label="字体颜色"
            value={draft.textColor}
            fallback={DEFAULT_NODE_TEXT}
            onChange={(textColor) => onChange({ textColor })}
          />
        </div>

        <div className="flex shrink-0 flex-col gap-2 border-t border-[var(--nn-shell-border)] p-4 sm:flex-row nn-safe-bottom">
          <button
            type="button"
            disabled={!canSubmit}
            onClick={onConfirm}
            className="inline-flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[var(--nn-primary)] px-4 text-sm font-medium text-white transition-colors duration-200 hover:bg-[var(--nn-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {creating ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Plus className="h-4 w-4" aria-hidden />
            )}
            确定添加节点
          </button>
          <button
            type="button"
            disabled={creating}
            onClick={onCancel}
            className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[var(--nn-shell-border)] px-4 text-sm text-[var(--nn-shell-text)] hover:bg-[var(--nn-shell-bg)] disabled:opacity-50"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
}
