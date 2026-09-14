"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AuthGuard } from 'sa2kit/common/auth/components';
import { useAuthContext } from 'sa2kit/common/auth/react';
import {
  createSyncTask,
  downloadBatchSkills,
  fetchSkillDetail,
  fetchSkillFileContent,
  fetchSkillList,
  fetchSyncTask,
  getSkillDownloadUrl,
  importSkillDirectory,
  saveSkillContent,
  uploadSkillMarkdown,
  preflightBatchDownload,
  retrySyncTask,
  resolveSyncTaskConflicts
} from '../services/skillManagerClient';
import type { SkillDetail, SkillSource, SkillStatus, SkillSummary, SkillSyncTask } from '../../../domain/types';
import { parseSkillFrontmatter, validateSkillFrontmatter } from '../../../domain/skillMarkdown';

const PAGE_SIZE = 10;
const QUERY_DEBOUNCE_MS = 300;

type EditMode = 'structured' | 'raw';

type FrontmatterData = {
  name: string;
  description: string;
  tags: string;
};

type RelativeFile = File & { webkitRelativePath?: string };

function parseFrontmatter(content: string): { data: FrontmatterData; body: string } {
  const parsed = parseSkillFrontmatter(content);
  return {
    data: parsed.data,
    body: parsed.body
  };
}

function validateFrontmatter(data: FrontmatterData): string | null {
  const result = validateSkillFrontmatter(data);
  if (!result) return null;
  return result.replace('frontmatter.', '');
}

function composeFrontmatter(data: FrontmatterData, body: string): string {
  const lines = ['---', `name: ${data.name}`, `description: ${data.description}`];
  if (data.tags.trim()) {
    lines.push(`tags: ${data.tags.trim()}`);
  }
  lines.push('---', '', body.trimStart());
  return lines.join('\n');
}

function getAllowedAdminSources(): SkillSource[] {
  const raw = process.env.NEXT_PUBLIC_SKILL_MANAGER_ADMIN_SOURCE_OPTIONS?.trim();
  if (!raw) {
    return ['local_cursor', 'manual_upload', 'remote'];
  }

  const tokens = raw
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);

  const allowed = new Set<SkillSource>();
  for (const token of tokens) {
    if (token === 'local_cursor' || token === 'manual_upload' || token === 'remote') {
      allowed.add(token);
    }
  }

  return allowed.size ? Array.from(allowed) : ['local_cursor', 'manual_upload', 'remote'];
}

function SkillManagerPageContent() {
  const { user } = useAuthContext();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<SkillSource | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<SkillStatus | 'all'>('all');
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<SkillSummary[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedId, setSelectedId] = useState('');
  const [detail, setDetail] = useState<SkillDetail | null>(null);

  const [previewMode, setPreviewMode] = useState<'markdown' | 'source'>('markdown');
  const [editMode, setEditMode] = useState<EditMode>('structured');
  const [frontmatter, setFrontmatter] = useState<FrontmatterData>({ name: '', description: '', tags: '' });
  const [bodyText, setBodyText] = useState('');
  const [rawText, setRawText] = useState('');
  const [editingStatus, setEditingStatus] = useState<SkillStatus>('draft');
  const [editingSource, setEditingSource] = useState<SkillSource>('local_cursor');

  const [listLoading, setListLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [conflictPolicy, setConflictPolicy] = useState<'skip' | 'overwrite'>('skip');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [importDetails, setImportDetails] = useState<
    Array<{ path: string; status: 'imported' | 'skipped'; reason?: string; fileId?: string; accessUrl?: string }>
  >([]);
  const [preflightInfo, setPreflightInfo] = useState<{ exists: string[]; missing: string[]; invalid: string[] } | null>(null);
  const [activeFilePath, setActiveFilePath] = useState<string>('SKILL.md');
  const [activeFileContent, setActiveFileContent] = useState<string>('');
  const [syncTask, setSyncTask] = useState<SkillSyncTask | null>(null);
  const [syncLoading, setSyncLoading] = useState(false);
  const [conflictResolutions, setConflictResolutions] = useState<Record<string, 'local' | 'remote' | 'merge_edit'>>({});
  const [mergeDrafts, setMergeDrafts] = useState<Record<string, string>>({});
  const adminSourceOptions = useMemo(() => getAllowedAdminSources(), []);

  const singleUploadRef = useRef<HTMLInputElement | null>(null);
  const dirUploadRef = useRef<HTMLInputElement | null>(null);

  const refreshList = async () => {
    const listRes = await fetchSkillList({
      query: debouncedQuery,
      source: sourceFilter,
      status: statusFilter,
      page,
      limit: PAGE_SIZE
    });
    setItems(listRes.items || []);
    setTotalItems(listRes.total || 0);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const onBatchDownload = async () => {
    if (!selectedIds.length) {
      setSaveMessage('请先选择要下载的 Skill');
      return;
    }

    try {
      const preflight = await preflightBatchDownload(selectedIds);
      setPreflightInfo(preflight);

      if (!preflight.exists.length) {
        setSaveMessage('预检未通过：没有可下载的有效 Skill');
        return;
      }

      const blob = await downloadBatchSkills(preflight.exists);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'skills-batch.zip';
      a.click();
      window.URL.revokeObjectURL(url);
      setSaveMessage(`批量下载已开始（有效 ${preflight.exists.length} 项）`);
    } catch (err: unknown) {
      setSaveMessage(err instanceof Error ? err.message : '批量下载失败');
    }
  };

  const loadDetail = async (id: string) => {
    setDetailLoading(true);
    setError('');
    try {
      const res = await fetchSkillDetail(id);
      setDetail(res);
      const parsed = parseFrontmatter(res.content);
      setFrontmatter(parsed.data);
      setBodyText(parsed.body);
      setRawText(res.content);
      setEditingStatus(res.status);
      setEditingSource(adminSourceOptions.includes(res.source) ? res.source : adminSourceOptions[0] || 'local_cursor');
      setActiveFilePath('SKILL.md');
      setActiveFileContent(res.content);
    } catch (err: unknown) {
      setDetail(null);
      setError(err instanceof Error ? err.message : '读取 Skill 详情失败');
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query);
    }, QUERY_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    let active = true;
    setListLoading(true);
    setError('');

    fetchSkillList({
      query: debouncedQuery,
      source: sourceFilter,
      status: statusFilter,
      page,
      limit: PAGE_SIZE
    })
      .then((res) => {
        if (!active) return;
        setItems(res.items || []);
        setTotalItems(res.total || 0);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setItems([]);
        setTotalItems(0);
        setError(err instanceof Error ? err.message : '读取 Skill 列表失败');
      })
      .finally(() => {
        if (active) setListLoading(false);
      });

    return () => {
      active = false;
    };
  }, [debouncedQuery, sourceFilter, statusFilter, page]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }

    loadDetail(selectedId);
  }, [selectedId]);

  useEffect(() => {
    if (!selectedId && items.length > 0) {
      setSelectedId(items[0].id);
      return;
    }

    if (selectedId && !items.some((item) => item.id === selectedId)) {
      setSelectedId(items[0]?.id || '');
    }
  }, [items, selectedId]);

  const pageCount = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);

  const pageItems = useMemo(() => items, [items]);

  useEffect(() => {
    if (currentPage !== page) {
      setPage(currentPage);
    }
  }, [currentPage, page]);

  const validateBeforeSave = (content: string): string | null => {
    if (!detail) return '请选择要保存的 Skill';
    if (!content.trim()) return 'SKILL.md 内容不能为空';
    const parsed = parseFrontmatter(content);
    if (content.startsWith('---\n')) {
      const fmError = validateFrontmatter(parsed.data);
      if (fmError) return fmError;
    } else {
      return 'SKILL.md 必须包含 frontmatter（--- 包裹）';
    }

    return null;
  };

  const onSave = async () => {
    if (!detail) return;

    const nextContent = editMode === 'structured' ? composeFrontmatter(frontmatter, bodyText) : rawText;
    const validationError = validateBeforeSave(nextContent);
    if (validationError) {
      setSaveMessage(validationError);
      return;
    }

    setSaveLoading(true);
    setSaveMessage('');
    setError('');

    try {
      const normalizedEditingSource = adminSourceOptions.includes(editingSource)
        ? editingSource
        : adminSourceOptions[0] || 'local_cursor';
      await saveSkillContent(detail.id, nextContent, {
        status: editingStatus,
        ...(isAdmin ? { source: normalizedEditingSource } : {})
      });
      setSaveMessage('保存成功');
      await loadDetail(detail.id);
      await refreshList();
    } catch (err: unknown) {
      setSaveMessage(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaveLoading(false);
    }
  };

  const onUploadSingle = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const skillId = window.prompt('请输入目标 skillId（仅英文数字-_）', detail?.id || '');
    if (!skillId) return;

    try {
      setSaveMessage('');
      const result = await uploadSkillMarkdown(skillId, file, conflictPolicy);
      const uploadedContent = await file.text();
      await saveSkillContent(skillId, uploadedContent);
      setSaveMessage(
        result.skipped
          ? '目标已存在，按策略跳过'
          : `上传成功（OSS文件ID: ${result.fileId}${result.accessUrl ? `，链接: ${result.accessUrl}` : ''}）`
      );
      await refreshList();
      setSelectedId(skillId);
    } catch (err: unknown) {
      setSaveMessage(err instanceof Error ? err.message : '上传失败');
    } finally {
      event.target.value = '';
    }
  };

  const onImportDirectory = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []) as RelativeFile[];
    if (!files.length) return;

    try {
      setSaveMessage('');
      const result = await importSkillDirectory(files, conflictPolicy);

      const skillMdFiles = files.filter((file) => {
        const rel = (file as RelativeFile).webkitRelativePath || file.name;
        return rel.replaceAll('\\', '/').endsWith('/SKILL.md');
      });
      for (const file of skillMdFiles) {
        const rel = (file as RelativeFile).webkitRelativePath || file.name;
        const normalized = rel.replaceAll('\\', '/');
        const skillId = normalized.split('/').filter(Boolean)[0];
        if (!skillId) continue;
        const content = await file.text();
        await saveSkillContent(skillId, content);
      }

      setImportDetails(result.details || []);
      setSaveMessage(
        `目录导入完成：上传到OSS ${result.importedFiles}，跳过 ${result.skippedFiles}（并发4，失败自动重试3次）；本地同步 SKILL.md ${skillMdFiles.length}`
      );
      await refreshList();
    } catch (err: unknown) {
      setSaveMessage(err instanceof Error ? err.message : '目录导入失败');
    } finally {
      event.target.value = '';
    }
  };

  const onPreviewFile = async (filePath: string) => {
    if (!detail) return;
    setActiveFilePath(filePath);
    if (filePath === 'SKILL.md') {
      setActiveFileContent(detail.content);
      return;
    }
    try {
      const content = await fetchSkillFileContent(detail.id, filePath);
      setActiveFileContent(content);
    } catch (err: unknown) {
      setActiveFileContent(err instanceof Error ? err.message : '读取文件内容失败');
    }
  };

  const onCreateSyncTask = async () => {
    if (!selectedIds.length) {
      setSaveMessage('请先选择要同步的 Skill');
      return;
    }
    setSyncLoading(true);
    try {
      const task = await createSyncTask({
        skillIds: selectedIds,
        mode: 'local-to-web',
        strategy: 'ff-only'
      });
      setSyncTask(task);
      setSaveMessage(`同步任务已创建：成功 ${task.successCount}，失败 ${task.failedCount}`);
    } catch (err: unknown) {
      setSaveMessage(err instanceof Error ? err.message : '创建同步任务失败');
    } finally {
      setSyncLoading(false);
    }
  };

  const onRefreshSyncTask = async () => {
    if (!syncTask) return;
    setSyncLoading(true);
    try {
      const latest = await fetchSyncTask(syncTask.taskId);
      setSyncTask(latest);
    } catch (err: unknown) {
      setSaveMessage(err instanceof Error ? err.message : '刷新同步任务失败');
    } finally {
      setSyncLoading(false);
    }
  };

  const onRetrySyncTask = async () => {
    if (!syncTask) return;
    setSyncLoading(true);
    try {
      const next = await retrySyncTask(syncTask.taskId);
      setSyncTask(next);
      setSaveMessage(`重试完成：成功 ${next.successCount}，失败 ${next.failedCount}`);
    } catch (err: unknown) {
      setSaveMessage(err instanceof Error ? err.message : '重试同步任务失败');
    } finally {
      setSyncLoading(false);
    }
  };

  const onResolveConflicts = async () => {
    if (!syncTask) return;
    const failed = syncTask.items.filter((x) => x.status === 'failed');
    if (!failed.length) return;
    const resolutions = failed.map((item) => ({
      skillId: item.skillId,
      decision: conflictResolutions[item.skillId] || 'local',
      mergedContent: conflictResolutions[item.skillId] === 'merge_edit' ? mergeDrafts[item.skillId] || '' : undefined
    }));
    setSyncLoading(true);
    try {
      const next = await resolveSyncTaskConflicts(syncTask.taskId, resolutions);
      setSyncTask(next);
      setSaveMessage(`冲突处理完成：成功 ${next.successCount}，失败 ${next.failedCount}`);
    } catch (err: unknown) {
      setSaveMessage(err instanceof Error ? err.message : '冲突处理失败');
    } finally {
      setSyncLoading(false);
    }
  };

  return (
    <main className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-4 px-4 py-6 lg:grid-cols-[1fr_460px]">
      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-2xl font-semibold text-gray-900">Skill 管理平台</h1>
          <span className="text-sm text-gray-500">总计 {totalItems} 项</span>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <label className="text-sm text-gray-600">冲突策略</label>
          <select
            value={conflictPolicy}
            onChange={(e) => setConflictPolicy(e.target.value as 'skip' | 'overwrite')}
            className="rounded border border-gray-300 px-2 py-1 text-sm"
          >
            <option value="skip">跳过已存在</option>
            <option value="overwrite">覆盖已存在</option>
          </select>
          <button
            type="button"
            onClick={() => singleUploadRef.current?.click()}
            className="rounded border border-gray-300 px-3 py-1 text-sm"
          >
            上传 SKILL.md
          </button>
          <button
            type="button"
            onClick={() => dirUploadRef.current?.click()}
            className="rounded border border-gray-300 px-3 py-1 text-sm"
          >
            导入目录
          </button>
          <button
            type="button"
            onClick={onBatchDownload}
            className="rounded border border-gray-300 px-3 py-1 text-sm"
          >
            批量下载({selectedIds.length})
          </button>
          <button
            type="button"
            onClick={onCreateSyncTask}
            disabled={syncLoading}
            className="rounded border border-gray-300 px-3 py-1 text-sm disabled:opacity-50"
          >
            {syncLoading ? '处理中...' : `创建同步任务(${selectedIds.length})`}
          </button>
          <label className="ml-2 text-sm text-gray-600">来源</label>
          <select
            value={sourceFilter}
            onChange={(e) => {
              setSourceFilter(e.target.value as SkillSource | 'all');
              setPage(1);
            }}
            className="rounded border border-gray-300 px-2 py-1 text-sm"
          >
            <option value="all">全部</option>
            <option value="local_cursor">本地</option>
            <option value="manual_upload">手动上传</option>
            <option value="remote">远端</option>
          </select>
          <label className="text-sm text-gray-600">状态</label>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as SkillStatus | 'all');
              setPage(1);
            }}
            className="rounded border border-gray-300 px-2 py-1 text-sm"
          >
            <option value="all">全部</option>
            <option value="draft">草稿</option>
            <option value="published">已发布</option>
            <option value="archived">已归档</option>
          </select>
          {detail && (
            <a
              href={getSkillDownloadUrl(detail.id)}
              className="rounded border border-gray-300 px-3 py-1 text-sm"
            >
              下载当前 Skill(zip)
            </a>
          )}
        </div>

        <input ref={singleUploadRef} type="file" accept=".md,text/markdown" className="hidden" onChange={onUploadSingle} />
        <input
          ref={dirUploadRef}
          type="file"
          multiple
          className="hidden"
          onChange={onImportDirectory}
          {...({ webkitdirectory: 'true', directory: '' } as Record<string, string>)}
        />

        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          className="mt-4 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          placeholder="搜索名称或描述"
        />

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        {preflightInfo && (
          <div className="mt-3 rounded border border-gray-200 bg-gray-50 p-2 text-xs text-gray-700">
            <p>预检结果：可下载 {preflightInfo.exists.length}，缺失 {preflightInfo.missing.length}，非法 {preflightInfo.invalid.length}</p>
            {preflightInfo.missing.length > 0 && <p>缺失：{preflightInfo.missing.join(', ')}</p>}
            {preflightInfo.invalid.length > 0 && <p>非法：{preflightInfo.invalid.join(', ')}</p>}
          </div>
        )}

        {importDetails.length > 0 && (
          <div className="mt-3 rounded border border-gray-200 bg-white p-2 text-xs">
            <p className="mb-1 font-medium text-gray-700">最近一次导入明细</p>
            <ul className="max-h-24 space-y-1 overflow-auto text-gray-600">
              {importDetails.slice(0, 50).map((item, idx) => (
                <li key={`${item.path}-${idx}`}>
                  [{item.status === 'imported' ? '写入' : '跳过'}] {item.path}
                  {item.reason ? ` (${item.reason})` : ''}
                  {item.fileId ? ` [fileId=${item.fileId}]` : ''}
                </li>
              ))}
            </ul>
          </div>
        )}

        {syncTask && (
          <div className="mt-3 rounded border border-gray-200 bg-white p-2 text-xs">
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium text-gray-700">
                同步任务：{syncTask.taskId.slice(0, 8)}... 状态 {syncTask.status}（成功 {syncTask.successCount} / 失败 {syncTask.failedCount}）
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onRefreshSyncTask}
                  className="rounded border border-gray-300 px-2 py-0.5"
                >
                  刷新
                </button>
                <button
                  type="button"
                  onClick={onRetrySyncTask}
                  disabled={syncTask.failedCount === 0}
                  className="rounded border border-gray-300 px-2 py-0.5 disabled:opacity-50"
                >
                  重试失败项
                </button>
              </div>
            </div>
            {syncTask.metrics && (
              <p className="mt-1 text-gray-600">
                指标：耗时 {syncTask.metrics.durationMs}ms，成功率 {(syncTask.metrics.successRate * 100).toFixed(1)}%，冲突率{' '}
                {(syncTask.metrics.conflictRate * 100).toFixed(1)}%
              </p>
            )}
            {syncTask.strategy === 'manual' && syncTask.failedCount > 0 && (
              <div className="mt-2 rounded border border-amber-200 bg-amber-50 p-2">
                <p className="mb-1 font-medium text-amber-800">冲突处理面板（manual）</p>
                <ul className="space-y-1">
                  {syncTask.items
                    .filter((item) => item.status === 'failed')
                    .map((item) => (
                      <li key={item.id} className="rounded border border-amber-200 bg-white p-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-amber-900">
                            {item.skillId}：{item.reason || '冲突'}
                          </span>
                          <select
                            value={conflictResolutions[item.skillId] || 'local'}
                            onChange={(e) =>
                              setConflictResolutions((prev) => ({
                                ...prev,
                                [item.skillId]: e.target.value as 'local' | 'remote' | 'merge_edit'
                              }))
                            }
                            className="rounded border border-amber-300 px-2 py-0.5"
                          >
                            <option value="local">选择本地版本</option>
                            <option value="remote">选择远端版本</option>
                            <option value="merge_edit">合并编辑</option>
                          </select>
                        </div>
                        {(conflictResolutions[item.skillId] || 'local') === 'merge_edit' && (
                          <textarea
                            value={mergeDrafts[item.skillId] || ''}
                            onChange={(e) =>
                              setMergeDrafts((prev) => ({
                                ...prev,
                                [item.skillId]: e.target.value
                              }))
                            }
                            className="mt-2 h-24 w-full rounded border border-amber-300 px-2 py-1 font-mono text-xs"
                            placeholder="填写合并后的完整 SKILL.md 内容（包含 frontmatter）"
                          />
                        )}
                      </li>
                    ))}
                </ul>
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={onResolveConflicts}
                    disabled={syncLoading}
                    className="rounded border border-amber-300 px-2 py-0.5 text-amber-900 disabled:opacity-50"
                  >
                    应用冲突决策
                  </button>
                </div>
              </div>
            )}
            {syncTask.logs && syncTask.logs.length > 0 && (
              <div className="mt-2 rounded border border-gray-200 bg-gray-50 p-2">
                <p className="mb-1 font-medium text-gray-700">任务日志</p>
                <ul className="max-h-24 space-y-1 overflow-auto text-gray-600">
                  {syncTask.logs.slice(-8).map((log, idx) => (
                    <li key={`${log.at}-${idx}`}>
                      [{log.level}] {log.at} {log.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="mt-4 space-y-2">
          {listLoading ? (
            <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
              正在加载 Skill 列表...
            </div>
          ) : (
            pageItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedId(item.id)}
                className={`w-full rounded-lg border px-4 py-3 text-left transition ${
                  selectedId === item.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(item.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleSelect(item.id);
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700">{item.source}</span>
                    <span className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700">{item.status}</span>
                  </div>
                  <p className="text-xs text-gray-500">{item.updatedAt}</p>
                </div>
                <p className="mt-1 text-sm text-gray-600">{item.description}</p>
              </button>
            ))
          )}

          {!listLoading && pageItems.length === 0 && (
            <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
              没有匹配结果
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-end gap-2 text-sm">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded border border-gray-300 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50"
          >
            上一页
          </button>
          <span className="text-gray-500">
            {currentPage} / {pageCount}
          </span>
          <button
            type="button"
            disabled={currentPage >= pageCount}
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            className="rounded border border-gray-300 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50"
          >
            下一页
          </button>
        </div>
      </section>

      <aside className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        {detailLoading ? (
          <p className="text-sm text-gray-500">正在加载详情...</p>
        ) : detail ? (
          <>
            <div className="border-b border-gray-200 pb-3">
              <h2 className="text-lg font-semibold text-gray-900">{detail.name}</h2>
              <p className="mt-1 text-sm text-gray-600">{detail.description}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700">{detail.source}</span>
                <span className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700">{detail.status}</span>
              </div>
            </div>

            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-900">文件树</h3>
              <ul className="mt-2 max-h-32 space-y-1 overflow-auto text-sm text-gray-600">
                {detail.files.map((file) => (
                  <li key={file}>
                    <button
                      type="button"
                      onClick={() => onPreviewFile(file)}
                      className={`rounded px-1 py-0.5 text-left ${
                        activeFilePath === file ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                      }`}
                    >
                      - {file}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-4">
              <div className="mb-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewMode('markdown')}
                  className={`rounded px-3 py-1 text-sm ${
                    previewMode === 'markdown' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  Markdown
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode('source')}
                  className={`rounded px-3 py-1 text-sm ${
                    previewMode === 'source' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  源码
                </button>
              </div>

              {previewMode === 'markdown' ? (
                <article className="max-h-40 overflow-auto whitespace-pre-wrap rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-800">
                  {activeFileContent}
                </article>
              ) : (
                <pre className="max-h-40 overflow-auto rounded-lg border border-gray-200 bg-black p-3 text-xs text-green-300">
{activeFileContent}
                </pre>
              )}
            </div>

            <div className="mt-4 border-t border-gray-200 pt-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="text-sm font-medium text-gray-900">编辑器</h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditMode('structured')}
                    className={`rounded px-3 py-1 text-xs ${
                      editMode === 'structured' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    结构化
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditMode('raw')}
                    className={`rounded px-3 py-1 text-xs ${
                      editMode === 'raw' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    原文
                  </button>
                </div>
              </div>

              {editMode === 'structured' ? (
                <div className="space-y-2">
                  <input
                    value={frontmatter.name}
                    onChange={(e) => setFrontmatter((old) => ({ ...old, name: e.target.value }))}
                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                    placeholder="name"
                  />
                  <input
                    value={frontmatter.description}
                    onChange={(e) => setFrontmatter((old) => ({ ...old, description: e.target.value }))}
                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                    placeholder="description"
                  />
                  <input
                    value={frontmatter.tags}
                    onChange={(e) => setFrontmatter((old) => ({ ...old, tags: e.target.value }))}
                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                    placeholder="tags, 逗号分隔"
                  />
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-600">状态</label>
                    <select
                      value={editingStatus}
                      onChange={(e) => setEditingStatus(e.target.value as SkillStatus)}
                      className="rounded border border-gray-300 px-2 py-1 text-xs"
                    >
                      <option value="draft">草稿</option>
                      <option value="published">已发布</option>
                      <option value="archived">已归档</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-600">来源</label>
                    {isAdmin ? (
                      <select
                        value={editingSource}
                        onChange={(e) => setEditingSource(e.target.value as SkillSource)}
                        className="rounded border border-gray-300 px-2 py-1 text-xs"
                      >
                        {adminSourceOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700">{detail.source}</span>
                    )}
                  </div>
                  <textarea
                    value={bodyText}
                    onChange={(e) => setBodyText(e.target.value)}
                    className="h-40 w-full rounded border border-gray-300 px-3 py-2 font-mono text-xs"
                    placeholder="正文内容"
                  />
                </div>
              ) : (
                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  className="h-56 w-full rounded border border-gray-300 px-3 py-2 font-mono text-xs"
                  placeholder="直接编辑 SKILL.md 原文"
                />
              )}

              <div className="mt-3 flex items-center justify-between gap-2">
                <p className={`text-sm ${saveMessage.includes('成功') ? 'text-green-600' : 'text-red-600'}`}>
                  {saveMessage}
                </p>
                <button
                  type="button"
                  onClick={onSave}
                  disabled={saveLoading}
                  className="rounded bg-blue-600 px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saveLoading ? '保存中...' : '保存'}
                </button>
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-500">请选择一个 Skill 查看详情</p>
        )}
      </aside>
    </main>
  );
}

/** 宿主须用 AuthProvider 包裹（见 SkillManagerAuthShell） */
export default function SkillManagerPage() {
  return (
    <AuthGuard requireAuth>
      <SkillManagerPageContent />
    </AuthGuard>
  );
}
