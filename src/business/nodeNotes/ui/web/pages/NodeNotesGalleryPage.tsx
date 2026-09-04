'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Download,
  FileUp,
  Loader2,
  MoreVertical,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { AuthGuard } from 'sa2kit/common/auth/components';
import { getTestFieldPath, nodeNotesDocumentPath, nodeNotesGalleryPath } from '../../../domain/nodeNotesRoutes';
import { nodeNotesApi } from '../../../domain/nodeNotesApi';
import type { DocumentListItem } from '../../../domain/types';
import '../styles/node-notes-theme.css';

function GalleryInner() {
  const router = useRouter();
  const [documents, setDocuments] = useState<DocumentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await nodeNotesApi.listDocuments();
      setDocuments(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return documents;
    return documents.filter((d) => d.title.toLowerCase().includes(q));
  }, [documents, search]);

  const handleCreate = async () => {
    const title = prompt('文档标题');
    if (!title?.trim()) return;
    setCreating(true);
    try {
      const doc = await nodeNotesApi.createDocument({ title: title.trim() });
      router.push(nodeNotesDocumentPath(doc.id));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '创建失败');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (doc: DocumentListItem) => {
    if (!confirm(`确定删除「${doc.title}」？此操作不可撤销。`)) return;
    try {
      await nodeNotesApi.deleteDocument(doc.id);
      setDocuments((list) => list.filter((d) => d.id !== doc.id));
      toast.success('文档已删除');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '删除失败');
    }
  };

  const handleExport = async (docId: string) => {
    try {
      await nodeNotesApi.exportDocumentZip(docId);
      toast.success('Markdown 包已下载');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '导出失败');
    }
    setMenuOpenId(null);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.zip';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      setImporting(true);
      try {
        const result = await nodeNotesApi.importFiles([file], 'new-document');
        toast.success(`导入完成：${result.nodesCreated} 节点，${result.edgesCreated} 条有向边`);
        router.push(nodeNotesDocumentPath(result.documentId));
      } catch (e) {
        toast.error(e instanceof Error ? e.message : '导入失败');
      } finally {
        setImporting(false);
      }
    };
    input.click();
  };

  return (
    <div className="node-notes-root min-h-dvh bg-[var(--nn-shell-bg)] text-[var(--nn-shell-text)]">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <header className="mb-8 flex flex-wrap items-center gap-3">
          <Link
            href={getTestFieldPath()}
            className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-lg text-[var(--nn-shell-muted)] transition-colors duration-200 hover:bg-[var(--nn-shell-surface)] hover:text-[var(--nn-shell-text)]"
            aria-label="返回实验田"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-semibold tracking-tight">节点笔记</h1>
            <p className="mt-1 text-sm text-[var(--nn-shell-muted)]">
              多文档知识图谱 · 有向连线 · Markdown 导入导出
            </p>
          </div>
          <button
            type="button"
            onClick={handleImport}
            disabled={importing}
            className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-[var(--nn-shell-border)] px-4 text-sm font-medium transition-colors duration-200 hover:bg-[var(--nn-shell-surface)] disabled:opacity-50"
          >
            {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
            导入 ZIP
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={creating}
            className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg bg-[var(--nn-primary)] px-4 text-sm font-medium text-white transition-colors duration-200 hover:bg-[var(--nn-primary-hover)] disabled:opacity-50"
          >
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            新建文档
          </button>
        </header>

        <div className="relative mb-6">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--nn-shell-muted)]"
            aria-hidden
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索文档…"
            className="min-h-11 w-full rounded-xl border border-[var(--nn-shell-border)] bg-[var(--nn-shell-surface)] py-2 pl-10 pr-4 text-sm text-[var(--nn-shell-text)] placeholder:text-[var(--nn-shell-muted)]"
            aria-label="搜索文档"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--nn-primary)]" aria-label="加载中" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--nn-shell-border)] bg-[var(--nn-shell-surface)] px-6 py-16 text-center">
            <p className="text-lg font-medium">还没有文档</p>
            <p className="mt-2 text-sm text-[var(--nn-shell-muted)]">
              创建第一篇笔记，或在画布上用节点与有向边组织知识
            </p>
            <button
              type="button"
              onClick={handleCreate}
              className="mt-6 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg bg-[var(--nn-primary)] px-5 text-sm font-medium text-white hover:bg-[var(--nn-primary-hover)]"
            >
              <Plus className="h-4 w-4" />
              新建文档
            </button>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((doc) => (
              <li
                key={doc.id}
                className="rounded-2xl border border-[var(--nn-shell-border)] bg-[var(--nn-shell-surface)] p-4 shadow-sm transition-transform duration-200 hover:-translate-y-0.5"
              >
                <div className="flex items-start gap-2">
                  <Link
                    href={nodeNotesDocumentPath(doc.id)}
                    className="min-w-0 flex-1 cursor-pointer"
                  >
                    <h2 className="truncate text-base font-semibold">{doc.title}</h2>
                    {doc.description ? (
                      <p className="mt-1 line-clamp-2 text-sm text-[var(--nn-shell-muted)]">
                        {doc.description}
                      </p>
                    ) : null}
                    <p className="mt-3 text-xs text-[var(--nn-shell-muted)]">
                      {doc.nodeCount} 节点 · {doc.edgeCount} 有向边 ·{' '}
                      {new Date(doc.updatedAt).toLocaleDateString('zh-CN')}
                    </p>
                  </Link>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setMenuOpenId(menuOpenId === doc.id ? null : doc.id)}
                      className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-lg text-[var(--nn-shell-muted)] hover:bg-[var(--nn-shell-bg)]"
                      aria-label="更多操作"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    {menuOpenId === doc.id ? (
                      <div className="absolute right-0 top-full z-10 mt-1 w-36 rounded-lg border border-[var(--nn-shell-border)] bg-[var(--nn-shell-surface)] py-1 shadow-lg">
                        <button
                          type="button"
                          onClick={() => handleExport(doc.id)}
                          className="flex min-h-11 w-full cursor-pointer items-center gap-2 px-3 text-sm hover:bg-[var(--nn-shell-bg)]"
                        >
                          <Download className="h-4 w-4" />
                          导出 MD
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setMenuOpenId(null);
                            handleDelete(doc);
                          }}
                          className="flex min-h-11 w-full cursor-pointer items-center gap-2 px-3 text-sm text-[var(--nn-destructive)] hover:bg-[var(--nn-shell-bg)]"
                        >
                          <Trash2 className="h-4 w-4" />
                          删除
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function NodeNotesGalleryPage() {
  return (
    <AuthGuard>
      <GalleryInner />
    </AuthGuard>
  );
}
