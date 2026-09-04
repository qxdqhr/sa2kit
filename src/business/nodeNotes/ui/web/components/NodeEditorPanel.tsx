'use client';

import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { ArrowLeft, ArrowRight, Loader2, Trash2 } from 'lucide-react';
import type { NodeLinkItem, NodeNoteNode } from '../../../domain/types';
import { nodeNotesApi } from '../../../domain/nodeNotesApi';

import { ColorStyleField } from './ColorStyleField';
import { DEFAULT_NODE_BG, DEFAULT_NODE_TEXT } from '../../../domain/nodeStyle';

interface NodeEditorPanelProps {
  node: NodeNoteNode;
  onChange: (patch: Partial<Pick<NodeNoteNode, 'title' | 'contentMd' | 'bgColor' | 'textColor'>>) => void;
  onFocusNode: (nodeId: string) => void;
  embedded?: boolean;
  onDelete?: () => void;
}

export function NodeEditorPanel({ node, onChange, onFocusNode, embedded, onDelete }: NodeEditorPanelProps) {
  const [tab, setTab] = useState<'edit' | 'preview'>('edit');
  const [incoming, setIncoming] = useState<NodeLinkItem[]>([]);
  const [outgoing, setOutgoing] = useState<NodeLinkItem[]>([]);
  const [linksLoading, setLinksLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLinksLoading(true);
    nodeNotesApi
      .getNodeLinks(node.id)
      .then((links) => {
        if (!cancelled) {
          setIncoming(links.incoming);
          setOutgoing(links.outgoing);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIncoming([]);
          setOutgoing([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLinksLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [node.id]);

  return (
    <PanelShell embedded={embedded} title="节点编辑">
      <PanelBody>
        <div>
          <label htmlFor="node-title" className="mb-1 block text-sm font-medium">
            标题
          </label>
          <input
            id="node-title"
            value={node.title}
            onChange={(e) => onChange({ title: e.target.value })}
            className="min-h-11 w-full rounded-lg border border-[var(--nn-shell-border)] bg-[var(--nn-shell-bg)] px-3 text-sm text-[var(--nn-shell-text)]"
          />
        </div>

        <div>
          <div className="mb-2 flex gap-2">
            <button
              type="button"
              onClick={() => setTab('edit')}
              className={`min-h-11 flex-1 rounded-lg px-3 text-sm font-medium transition-colors duration-200 ${
                tab === 'edit'
                  ? 'bg-[var(--nn-primary)] text-white'
                  : 'bg-[var(--nn-shell-bg)] text-[var(--nn-shell-muted)] hover:text-[var(--nn-shell-text)]'
              }`}
            >
              编辑
            </button>
            <button
              type="button"
              onClick={() => setTab('preview')}
              className={`min-h-11 flex-1 rounded-lg px-3 text-sm font-medium transition-colors duration-200 ${
                tab === 'preview'
                  ? 'bg-[var(--nn-primary)] text-white'
                  : 'bg-[var(--nn-shell-bg)] text-[var(--nn-shell-muted)] hover:text-[var(--nn-shell-text)]'
              }`}
            >
              预览
            </button>
          </div>

          {tab === 'edit' ? (
            <textarea
              value={node.contentMd}
              onChange={(e) => onChange({ contentMd: e.target.value })}
              rows={12}
              className="w-full resize-y rounded-lg border border-[var(--nn-shell-border)] bg-[var(--nn-shell-bg)] px-3 py-2 font-mono text-sm text-[var(--nn-shell-text)]"
              placeholder="Markdown 正文…"
            />
          ) : (
            <div className="prose prose-sm max-w-none rounded-lg border border-[var(--nn-shell-border)] bg-white p-3 text-slate-800">
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
                {node.contentMd || '*暂无内容*'}
              </ReactMarkdown>
            </div>
          )}
        </div>

        <div className="space-y-3 border-t border-[var(--nn-shell-border)] pt-3">
          <p className="text-sm font-medium">样式</p>
          <ColorStyleField
            id="node-bg-color"
            label="节点背景色"
            value={node.bgColor ?? DEFAULT_NODE_BG}
            fallback={DEFAULT_NODE_BG}
            onChange={(bgColor) => onChange({ bgColor })}
          />
          <ColorStyleField
            id="node-text-color"
            label="字体颜色"
            value={node.textColor ?? DEFAULT_NODE_TEXT}
            fallback={DEFAULT_NODE_TEXT}
            onChange={(textColor) => onChange({ textColor })}
          />
        </div>

        <div className="space-y-3 border-t border-[var(--nn-shell-border)] pt-3">
          <p className="text-sm font-medium">有向链接</p>
          {linksLoading ? (
            <div className="flex items-center gap-2 text-sm text-[var(--nn-shell-muted)]">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              加载中…
            </div>
          ) : (
            <>
              <LinkGroup
                title="入边（反向链接）"
                icon={<ArrowLeft className="h-3.5 w-3.5" aria-hidden />}
                items={incoming}
                onFocus={onFocusNode}
                emptyText="暂无入边"
              />
              <LinkGroup
                title="出边（正向链接）"
                icon={<ArrowRight className="h-3.5 w-3.5" aria-hidden />}
                items={outgoing}
                onFocus={onFocusNode}
                emptyText="暂无出边"
              />
            </>
          )}
        </div>
      </PanelBody>

      {onDelete ? (
        <div className="shrink-0 border-t border-[var(--nn-shell-border)] p-4">
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-[var(--nn-destructive)] px-3 text-sm text-[var(--nn-destructive)] transition-colors duration-200 hover:bg-[var(--nn-shell-bg)]"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            删除节点
          </button>
        </div>
      ) : null}
    </PanelShell>
  );
}

function PanelShell({
  embedded,
  title,
  children,
}: {
  embedded?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  const className = embedded
    ? 'flex w-full flex-col text-[var(--nn-shell-text)]'
    : 'flex h-full w-full flex-col border-l border-[var(--nn-shell-border)] bg-[var(--nn-shell-surface)] text-[var(--nn-shell-text)] lg:w-80';

  return (
    <aside className={className} aria-label={title}>
      {!embedded ? (
        <div className="border-b border-[var(--nn-shell-border)] px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--nn-shell-muted)]">
            {title}
          </p>
        </div>
      ) : null}
      {children}
    </aside>
  );
}

function PanelBody({ children }: { children: React.ReactNode }) {
  return <div className="flex-1 space-y-4 overflow-y-auto p-4">{children}</div>;
}

function LinkGroup({
  title,
  icon,
  items,
  onFocus,
  emptyText,
}: {
  title: string;
  icon: React.ReactNode;
  items: NodeLinkItem[];
  onFocus: (id: string) => void;
  emptyText: string;
}) {
  return (
    <div>
      <p className="mb-1 flex items-center gap-1 text-xs text-[var(--nn-shell-muted)]">
        {icon}
        {title}
      </p>
      {items.length === 0 ? (
        <p className="text-xs text-[var(--nn-shell-muted)]">{emptyText}</p>
      ) : (
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item.edgeId}>
              <button
                type="button"
                onClick={() => onFocus(item.nodeId)}
                className="min-h-11 w-full cursor-pointer rounded-lg px-2 py-2 text-left text-sm transition-colors duration-200 hover:bg-[var(--nn-shell-bg)]"
              >
                <span className="font-medium">{item.title}</span>
                {item.label ? (
                  <span className="ml-1 text-xs text-[var(--nn-accent)]">[{item.label}]</span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
