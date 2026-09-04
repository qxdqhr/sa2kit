'use client';

import {
  Focus,
  Link2,
  Loader2,
  MoreHorizontal,
  PenLine,
  Plus,
  Trash2,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface MobileCanvasToolbarProps {
  connectMode: boolean;
  connectSourceId: string | null;
  hasSelection: boolean;
  selectionLabel: string;
  importing: boolean;
  exportingPng: boolean;
  onBeginAddNode: () => void;
  onToggleConnect: () => void;
  onFitView: () => void;
  onEditSelection: () => void;
  onDeleteSelection: () => void;
  onImport: () => void;
  onExportMd: () => void;
  onExportPngViewport: () => void;
  onExportPngFull: () => void;
}

export function MobileCanvasToolbar({
  connectMode,
  connectSourceId,
  hasSelection,
  selectionLabel,
  importing,
  exportingPng,
  onBeginAddNode,
  onToggleConnect,
  onFitView,
  onEditSelection,
  onDeleteSelection,
  onImport,
  onExportMd,
  onExportPngViewport,
  onExportPngFull,
}: MobileCanvasToolbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as HTMLElement)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuOpen]);

  const connectHint = connectMode
    ? connectSourceId
      ? '再点目标节点'
      : '点源节点'
    : '连线';

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col items-center gap-2 px-3 pb-3 nn-safe-bottom lg:hidden">
      {hasSelection ? (
        <div className="pointer-events-auto flex w-full max-w-md items-center gap-2 rounded-full border border-[var(--nn-shell-border)] bg-[var(--nn-shell-surface)]/95 px-2 py-1.5 shadow-lg backdrop-blur-sm">
          <span className="min-w-0 flex-1 truncate pl-2 text-sm text-[var(--nn-shell-text)]">
            {selectionLabel}
          </span>
          <button
            type="button"
            onClick={onEditSelection}
            className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full bg-[var(--nn-primary)] px-4 text-sm font-medium text-white"
          >
            <PenLine className="h-4 w-4" aria-hidden />
            编辑
          </button>
          <button
            type="button"
            onClick={onDeleteSelection}
            className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-full text-[var(--nn-destructive)] hover:bg-[var(--nn-shell-bg)]"
            aria-label="删除"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      ) : null}

      <div className="pointer-events-auto flex w-full max-w-md items-center justify-between gap-1 rounded-2xl border border-[var(--nn-shell-border)] bg-[var(--nn-shell-surface)]/95 p-1.5 shadow-lg backdrop-blur-sm">
        <ToolbarButton label="添加节点" onClick={onBeginAddNode} primary>
          <Plus className="h-5 w-5" />
        </ToolbarButton>

        <ToolbarButton
          label={connectHint}
          onClick={onToggleConnect}
          active={connectMode}
        >
          <Link2 className="h-5 w-5" />
        </ToolbarButton>

        <ToolbarButton label="适应画布" onClick={onFitView}>
          <Focus className="h-5 w-5" />
        </ToolbarButton>

        <div className="relative" ref={menuRef}>
          <ToolbarButton label="更多" onClick={() => setMenuOpen((v) => !v)} active={menuOpen}>
            {importing || exportingPng ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <MoreHorizontal className="h-5 w-5" />
            )}
          </ToolbarButton>
          {menuOpen ? (
            <div className="absolute bottom-full right-0 z-30 mb-2 min-w-[160px] rounded-xl border border-[var(--nn-shell-border)] bg-[var(--nn-shell-surface)] py-1 shadow-xl">
              <MenuItem onClick={() => { onImport(); setMenuOpen(false); }} disabled={importing}>
                导入
              </MenuItem>
              <MenuItem onClick={() => { onExportMd(); setMenuOpen(false); }}>导出 MD</MenuItem>
              <MenuItem onClick={() => { onExportPngViewport(); setMenuOpen(false); }} disabled={exportingPng}>
                导出图片（视口）
              </MenuItem>
              <MenuItem onClick={() => { onExportPngFull(); setMenuOpen(false); }} disabled={exportingPng}>
                导出图片（全图）
              </MenuItem>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ToolbarButton({
  children,
  label,
  onClick,
  primary,
  active,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  primary?: boolean;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-11 min-w-11 flex-1 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[10px] font-medium transition-colors duration-200 ${
        primary
          ? 'bg-[var(--nn-primary)] text-white'
          : active
            ? 'bg-[var(--nn-primary)]/20 text-[var(--nn-primary)]'
            : 'text-[var(--nn-shell-muted)] hover:bg-[var(--nn-shell-bg)] hover:text-[var(--nn-shell-text)]'
      }`}
    >
      {children}
      <span className="max-w-[4.5rem] truncate">{label}</span>
    </button>
  );
}

function MenuItem({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="block min-h-11 w-full cursor-pointer px-4 text-left text-sm text-[var(--nn-shell-text)] hover:bg-[var(--nn-shell-bg)] disabled:opacity-50"
    >
      {children}
    </button>
  );
}
