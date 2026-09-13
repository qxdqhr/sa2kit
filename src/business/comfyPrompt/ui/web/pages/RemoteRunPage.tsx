'use client';

import { comfyPromptApiPath } from '../../../domain/comfyPromptApiPath';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Copy,
  Download,
  FileText,
  Loader2,
  Play,
  Plus,
  RefreshCw,
  Server,
  Settings2,
  Trash2,
  Upload,
  XCircle,
} from 'lucide-react';
import { FormField, Modal, modalInputClass } from '../components/Modal';
import { useComfyPromptData } from '../hooks/useComfyPromptData';
import { useComfyRemote } from '../hooks/useComfyRemote';
import { copyToClipboard } from '../../../domain/utils/clipboard';
import { PROMPT_LIBRARY_IMPORT_EXAMPLE } from '../../../domain/utils/splitTemplatePrompts';
import type { ComfyJob, ComfyJobStatus, JobOutputKey, PromptKind } from '../../../domain/types';
import { COMFY_RUN_DRAFT_KEY, type ComfyRunDraft } from '../../../domain/types';

const POLL_INTERVAL_MS = 3000;
const JOB_ERROR_DISMISS_MS = 8000;

type JobErrorToast = { id: string; message: string };

const STATUS_LABEL: Record<ComfyJobStatus, string> = {
  pending: '等待中',
  queued: '排队中',
  running: '执行中',
  success: '已完成',
  failed: '失败',
  cancelled: '已取消',
};

function isActiveJob(status: ComfyJobStatus) {
  return status === 'pending' || status === 'queued' || status === 'running';
}

function outputKey(jobId: number, index: number): JobOutputKey {
  return `${jobId}:${index}`;
}

type OutputTile = {
  key: JobOutputKey;
  jobId: number;
  index: number;
  job: ComfyJob;
};

export default function RemoteRunPage() {
  const promptStore = useComfyPromptData();
  const remote = useComfyRemote();

  const [selectedServerId, setSelectedServerId] = useState<number | ''>('');
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<number | ''>('');
  const [positivePrompt, setPositivePrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [seed, setSeed] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [jobErrorToasts, setJobErrorToasts] = useState<JobErrorToast[]>([]);
  const prevJobStatusRef = useRef<Map<number, ComfyJobStatus>>(new Map());

  const [serverModalOpen, setServerModalOpen] = useState(false);
  const [serverName, setServerName] = useState('');
  const [serverUrl, setServerUrl] = useState('http://127.0.0.1:8188');

  const [advancedOpen, setAdvancedOpen] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  useEffect(() => {
    void promptStore.refreshAll();
    void remote.refreshServers();
    void remote.refreshJobs();
  }, [promptStore.refreshAll, remote.refreshServers, remote.refreshJobs]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(COMFY_RUN_DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw) as ComfyRunDraft;
      if (draft.positivePrompt) setPositivePrompt(draft.positivePrompt);
      if (draft.negativePrompt) setNegativePrompt(draft.negativePrompt);
      if (draft.workflowId) setSelectedWorkflowId(draft.workflowId);
      sessionStorage.removeItem(COMFY_RUN_DRAFT_KEY);
    } catch {
      // ignore invalid draft
    }
  }, []);

  useEffect(() => {
    if (selectedServerId) return;
    const defaultServer = remote.servers.find((s) => s.isDefault && s.enabled);
    const first = remote.servers.find((s) => s.enabled);
    const pick = defaultServer ?? first;
    if (pick) setSelectedServerId(pick.id);
  }, [remote.servers, selectedServerId]);

  const activeJobIds = useMemo(
    () => remote.jobs.filter((j) => isActiveJob(j.status)).map((j) => j.id),
    [remote.jobs],
  );

  const pollActiveJobs = useCallback(async () => {
    if (!activeJobIds.length) return;
    await Promise.all(activeJobIds.map((id) => remote.refreshJob(id)));
  }, [activeJobIds, remote.refreshJob]);

  useEffect(() => {
    if (!activeJobIds.length) return;
    const timer = setInterval(() => {
      void pollActiveJobs();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [activeJobIds.length, pollActiveJobs]);

  useEffect(() => {
    const currentIds = new Set(remote.jobs.map((j) => j.id));
    for (const id of prevJobStatusRef.current.keys()) {
      if (!currentIds.has(id)) prevJobStatusRef.current.delete(id);
    }

    for (const job of remote.jobs) {
      const prev = prevJobStatusRef.current.get(job.id);
      prevJobStatusRef.current.set(job.id, job.status);

      if (job.status !== 'failed' || !job.errorMessage) continue;
      if (!prev || !isActiveJob(prev)) continue;

      const toastId = `job-error-${job.id}-${Date.now()}`;
      setJobErrorToasts((prevToasts) => [
        ...prevToasts,
        { id: toastId, message: `#${job.id}: ${job.errorMessage}` },
      ]);
      setTimeout(() => {
        setJobErrorToasts((prevToasts) => prevToasts.filter((t) => t.id !== toastId));
      }, JOB_ERROR_DISMISS_MS);
    }
  }, [remote.jobs]);

  const handleCreateServer = async () => {
    if (!serverName.trim() || !serverUrl.trim()) {
      showToast('请填写服务器名称与地址');
      return;
    }
    try {
      const created = await remote.createServer({
        name: serverName.trim(),
        baseUrl: serverUrl.trim(),
        isDefault: remote.servers.length === 0,
      });
      setSelectedServerId(created.id);
      setServerName('');
      setServerUrl('http://127.0.0.1:8188');
      setServerModalOpen(false);
      showToast('服务器已添加');
    } catch (err) {
      showToast(err instanceof Error ? err.message : '添加失败');
    }
  };

  const handleSubmit = async () => {
    if (!selectedServerId || !selectedWorkflowId) {
      showToast('请选择服务器与工作流');
      return;
    }
    setSubmitting(true);
    try {
      await remote.submitJob({
        serverId: Number(selectedServerId),
        workflowId: Number(selectedWorkflowId),
        positivePrompt: positivePrompt.trim() || undefined,
        negativePrompt: negativePrompt.trim() || undefined,
        seed: seed.trim() ? Number(seed) : undefined,
        width: width.trim() ? Number(width) : undefined,
        height: height.trim() ? Number(height) : undefined,
      });
      setAdvancedOpen(false);
      showToast('任务已提交');
    } catch (err) {
      showToast(err instanceof Error ? err.message : '提交失败');
      await remote.refreshJobs();
    } finally {
      setSubmitting(false);
    }
  };

  const selectedWorkflow = promptStore.workflows.find((w) => w.id === selectedWorkflowId);

  return (
    <div className="space-y-6">
      {jobErrorToasts.length > 0 && (
        <div className="fixed top-20 right-4 z-[110] flex max-w-md flex-col gap-2">
          {jobErrorToasts.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-950/95 px-4 py-3 text-sm text-red-200 shadow-lg backdrop-blur-sm"
            >
              <XCircle size={16} className="mt-0.5 shrink-0" />
              <span>{item.message}</span>
            </div>
          ))}
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-[110] rounded-xl bg-violet-600 px-4 py-2 text-sm shadow-lg">
          {toast}
        </div>
      )}

      {(remote.error || promptStore.error) && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-200">
          {remote.error ?? promptStore.error}
        </div>
      )}

      <div className="flex min-h-[calc(100vh-8rem)] flex-col gap-6">
        <div className="grid shrink-0 gap-4 lg:grid-cols-2">
          <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 font-semibold">
                <Server size={18} /> ComfyUI 服务器
              </h2>
              <button
                type="button"
                onClick={() => setServerModalOpen(true)}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500 text-white hover:bg-violet-400"
                title="添加服务器"
              >
                <Plus size={18} />
              </button>
            </div>
            <div className="max-h-48 space-y-2 overflow-y-auto">
              {remote.servers.map((server) => (
                <label
                  key={server.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${
                    selectedServerId === server.id
                      ? 'border-violet-400 bg-violet-500/10'
                      : 'border-white/10 bg-slate-900/40'
                  }`}
                >
                  <input
                    type="radio"
                    name="server"
                    checked={selectedServerId === server.id}
                    onChange={() => setSelectedServerId(server.id)}
                    className="mt-1"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{server.name}</div>
                    <div className="truncate text-xs text-slate-400">{server.baseUrl}</div>
                    <div className="mt-1 flex items-center gap-2 text-xs">
                      {server.lastCheckOk === true && (
                        <span className="text-emerald-400">连通正常</span>
                      )}
                      {server.lastCheckOk === false && (
                        <span className="text-red-400">{server.lastError ?? '不可用'}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => void remote.checkServerHealth(server.id)}
                      className="rounded bg-white/10 p-1"
                      title="检测连通性"
                    >
                      <RefreshCw size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => void remote.deleteServer(server.id)}
                      className="rounded bg-red-500/20 p-1"
                      title="删除"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </label>
              ))}
              {!remote.servers.length && (
                <p className="text-sm text-slate-500">点击右上角 + 添加 ComfyUI 服务器</p>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-4">
            <h2 className="font-semibold">提交任务</h2>
            <label className="block text-sm">
              <span className="mb-1 block text-slate-400">工作流</span>
              <select
                value={selectedWorkflowId}
                onChange={(e) =>
                  setSelectedWorkflowId(e.target.value ? Number(e.target.value) : '')
                }
                className={inputClass}
              >
                <option value="">选择已保存的工作流</option>
                {promptStore.workflows.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </label>

            {selectedWorkflow && (
              <p className="text-xs text-slate-500">
                正向: {selectedWorkflow.positiveNodeId ?? '未配置'} · 负向:{' '}
                {selectedWorkflow.negativeNodeId ?? '未配置'} · Seed:{' '}
                {selectedWorkflow.seedNodeId ?? '未配置'} · 尺寸:{' '}
                {selectedWorkflow.latentNodeId ?? '未配置'}
              </p>
            )}

            <label className="block text-sm">
              <span className="mb-1 block text-slate-400">正向 Prompt</span>
              <textarea
                value={positivePrompt}
                onChange={(e) => setPositivePrompt(e.target.value)}
                rows={3}
                className={inputClass}
                placeholder="1girl, masterpiece..."
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-slate-400">负向 Prompt</span>
              <textarea
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                rows={2}
                className={inputClass}
                placeholder="low quality, blurry..."
              />
            </label>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setAdvancedOpen(true)}
                className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm hover:bg-white/5"
              >
                <Settings2 size={16} /> 高级设置
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => void handleSubmit()}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-violet-500 py-2.5 font-medium disabled:opacity-50 min-w-[160px]"
              >
                {submitting ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} />}
                提交到 ComfyUI
              </button>
            </div>
          </section>
        </div>

        <JobHistoryGrid
          className="min-h-0 flex-1"
          jobs={remote.jobs}
          onRefresh={() => void remote.refreshJobs()}
          loading={remote.loading}
          onDeleteOutputs={remote.deleteJobOutputs}
          onToast={showToast}
          onBulkCreatePrompts={promptStore.bulkCreatePrompts}
        />
      </div>

      {serverModalOpen && (
        <Modal title="添加 ComfyUI 服务器" onClose={() => setServerModalOpen(false)}>
          <FormField label="名称">
            <input
              value={serverName}
              onChange={(e) => setServerName(e.target.value)}
              placeholder="名称，如 本机 Comfy"
              className={modalInputClass}
            />
          </FormField>
          <FormField label="地址">
            <input
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              placeholder="http://127.0.0.1:8188"
              className={modalInputClass}
            />
          </FormField>
          <button
            type="button"
            onClick={() => void handleCreateServer()}
            className="mt-2 w-full rounded-xl bg-violet-500 py-2.5 font-medium"
          >
            添加服务器
          </button>
        </Modal>
      )}

      {advancedOpen && (
        <Modal title="高级设置" onClose={() => setAdvancedOpen(false)}>
          <FormField label="Seed（可选）">
            <input
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              type="number"
              placeholder="留空则自动随机（需工作流已配置 seed 节点）"
              className={modalInputClass}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="宽度（可选）">
              <input
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                type="number"
                placeholder="如 512"
                className={modalInputClass}
              />
            </FormField>
            <FormField label="高度（可选）">
              <input
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                type="number"
                placeholder="如 768"
                className={modalInputClass}
              />
            </FormField>
          </div>
          <p className="text-xs text-slate-500">
            宽高注入需在工作流中配置 EmptyLatentImage 节点 ID（latent 节点）。
          </p>
          <button
            type="button"
            disabled={submitting}
            onClick={() => void handleSubmit()}
            className="mt-2 w-full rounded-xl bg-violet-500 py-2.5 font-medium disabled:opacity-50"
          >
            {submitting ? '提交中...' : '保存并提交'}
          </button>
        </Modal>
      )}
    </div>
  );
}

function splitPromptToEntries(text: string, prefix: string): { name: string; content: string }[] {
  const parts = text
    .split(/[,，;\n]+/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (!parts.length) return [];
  return parts.map((content, i) => ({
    name: `${prefix}-${i + 1}`,
    content,
  }));
}

function JobHistoryGrid({
  jobs,
  onRefresh,
  loading,
  onDeleteOutputs,
  onToast,
  onBulkCreatePrompts,
  className,
}: {
  jobs: ComfyJob[];
  onRefresh: () => void;
  loading: boolean;
  onDeleteOutputs: (jobId: number, indices: number[]) => Promise<ComfyJob>;
  onToast: (msg: string) => void;
  onBulkCreatePrompts: (
    items: import('../types').PromptFormData[],
  ) => Promise<import('../types').ComfyPrompt[]>;
  className?: string;
}) {
  const [selected, setSelected] = useState<Set<JobOutputKey>>(new Set());
  const [busy, setBusy] = useState(false);
  const [promptJob, setPromptJob] = useState<ComfyJob | null>(null);
  const [importKind, setImportKind] = useState<PromptKind>('positive');

  const tiles = useMemo<OutputTile[]>(() => {
    const list: OutputTile[] = [];
    for (const job of jobs) {
      job.outputImages.forEach((_, index) => {
        list.push({ key: outputKey(job.id, index), jobId: job.id, index, job });
      });
    }
    return list;
  }, [jobs]);

  const toggleSelect = (key: JobOutputKey) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === tiles.length) setSelected(new Set());
    else setSelected(new Set(tiles.map((t) => t.key)));
  };

  const downloadImage = (jobId: number, index: number) => {
    const a = document.createElement('a');
    a.href = comfyPromptApiPath(`jobs/${jobId}/output/${index}?download=1`);
    a.download = '';
    a.click();
  };

  const batchDownload = () => {
    if (!selected.size) {
      onToast('请先选择图片');
      return;
    }
    for (const key of selected) {
      const [jobId, index] = key.split(':').map(Number);
      downloadImage(jobId, index);
    }
    onToast(`已开始下载 ${selected.size} 张图片`);
  };

  const batchDelete = async () => {
    if (!selected.size) {
      onToast('请先选择图片');
      return;
    }
    if (!confirm(`确定删除选中的 ${selected.size} 张图片记录？`)) return;

    setBusy(true);
    try {
      const byJob = new Map<number, number[]>();
      for (const key of selected) {
        const [jobId, index] = key.split(':').map(Number);
        const arr = byJob.get(jobId) ?? [];
        arr.push(index);
        byJob.set(jobId, arr);
      }
      await Promise.all(
        [...byJob.entries()].map(([jobId, indices]) => onDeleteOutputs(jobId, indices)),
      );
      setSelected(new Set());
      onToast('已删除选中图片');
    } catch (err) {
      onToast(err instanceof Error ? err.message : '删除失败');
    } finally {
      setBusy(false);
    }
  };

  const deleteSingle = async (jobId: number, index: number) => {
    if (!confirm('确定删除这张图片记录？')) return;
    setBusy(true);
    try {
      await onDeleteOutputs(jobId, [index]);
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(outputKey(jobId, index));
        return next;
      });
      onToast('图片已删除');
    } catch (err) {
      onToast(err instanceof Error ? err.message : '删除失败');
    } finally {
      setBusy(false);
    }
  };

  const activeJobs = jobs.filter((j) => isActiveJob(j.status));

  const importJobPrompts = async (job: ComfyJob, kind: PromptKind) => {
    const text = kind === 'positive' ? job.positivePrompt : job.negativePrompt;
    if (!text?.trim()) {
      onToast(`该任务无${kind === 'positive' ? '正向' : '负向'}提示词`);
      return;
    }
    const entries = splitPromptToEntries(text, `任务${job.id}-${kind === 'positive' ? '正向' : '负向'}`);
    if (!entries.length) {
      onToast('未能解析提示词');
      return;
    }
    await onBulkCreatePrompts(
      entries.map((entry) => ({
        title: entry.name,
        content: entry.content,
        kind,
        tags: ['from-job'],
      })),
    );
    onToast(`已导入 ${entries.length} 条${kind === 'positive' ? '正向' : '负向'}提示词`);
    setPromptJob(null);
  };

  return (
    <div className={`flex flex-col rounded-2xl border border-white/10 bg-white/5 p-4 ${className ?? ''}`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold">任务历史</h2>
        <div className="flex flex-wrap items-center gap-2">
          {tiles.length > 0 && (
            <>
              <button
                type="button"
                onClick={selectAll}
                className="rounded-lg border border-white/10 px-3 py-1.5 text-xs hover:bg-white/5"
              >
                {selected.size === tiles.length ? '取消全选' : '全选'}
              </button>
              <button
                type="button"
                disabled={busy || !selected.size}
                onClick={batchDownload}
                className="flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-xs hover:bg-white/5 disabled:opacity-40"
              >
                <Download size={14} /> 批量下载
              </button>
              <button
                type="button"
                disabled={busy || !selected.size}
                onClick={() => void batchDelete()}
                className="flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs text-red-200 hover:bg-red-500/20 disabled:opacity-40"
              >
                <Trash2 size={14} /> 批量删除
              </button>
            </>
          )}
          <button
            type="button"
            onClick={onRefresh}
            className="flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-sm hover:bg-white/5"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            刷新
          </button>
        </div>
      </div>

      {activeJobs.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {activeJobs.map((job) => (
            <span
              key={job.id}
              className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/20 px-3 py-1 text-xs text-violet-200"
            >
              <Loader2 size={12} className="animate-spin" />
              #{job.id} {STATUS_LABEL[job.status]}
            </span>
          ))}
        </div>
      )}

      {tiles.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {tiles.map((tile) => {
            const isSelected = selected.has(tile.key);
            return (
              <div
                key={tile.key}
                className={`group relative overflow-hidden rounded-xl border bg-black/30 ${
                  isSelected ? 'border-violet-400 ring-2 ring-violet-400/50' : 'border-white/10'
                }`}
              >
                <label className="absolute left-2 top-2 z-10">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(tile.key)}
                    className="h-4 w-4 rounded border-white/30"
                  />
                </label>
                <a
                  href={comfyPromptApiPath(`jobs/${tile.jobId}/output/${tile.index}`)}
                  target="_blank"
                  rel="noreferrer"
                  className="block"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={comfyPromptApiPath(`jobs/${tile.jobId}/output/${tile.index}`)}
                    alt={`任务 #${tile.jobId} 输出 ${tile.index + 1}`}
                    className="aspect-square w-full object-cover"
                  />
                </a>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent px-2 pb-2 pt-6">
                  <div className="flex items-center justify-between gap-1 text-[10px] text-slate-300">
                    <span>
                      #{tile.jobId} · {STATUS_LABEL[tile.job.status]}
                    </span>
                    <span>{new Date(tile.job.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => setPromptJob(tile.job)}
                    className="rounded bg-black/60 p-1.5 hover:bg-black/80"
                    title="查看提示词"
                  >
                    <FileText size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadImage(tile.jobId, tile.index)}
                    className="rounded bg-black/60 p-1.5 hover:bg-black/80"
                    title="下载"
                  >
                    <Download size={14} />
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void deleteSingle(tile.jobId, tile.index)}
                    className="rounded bg-red-500/80 p-1.5 hover:bg-red-500"
                    title="删除"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-slate-500">
          {jobs.length
            ? '暂无输出图片，进行中的任务完成后将显示在此。'
            : '暂无任务记录，提交后将在此显示结果。'}
        </p>
      )}

      {promptJob && (
        <Modal title={`任务 #${promptJob.id} 提示词`} onClose={() => setPromptJob(null)} wide>
          <FormField label="正向 Prompt">
            <textarea
              readOnly
              value={promptJob.positivePrompt ?? ''}
              rows={5}
              className={modalInputClass}
              placeholder="无"
            />
          </FormField>
          <FormField label="负向 Prompt">
            <textarea
              readOnly
              value={promptJob.negativePrompt ?? ''}
              rows={4}
              className={modalInputClass}
              placeholder="无"
            />
          </FormField>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setImportKind('positive')}
              className={`rounded-lg px-3 py-1.5 text-sm ${
                importKind === 'positive' ? 'bg-violet-500' : 'bg-slate-800'
              }`}
            >
              导入正向
            </button>
            <button
              type="button"
              onClick={() => setImportKind('negative')}
              className={`rounded-lg px-3 py-1.5 text-sm ${
                importKind === 'negative' ? 'bg-violet-500' : 'bg-slate-800'
              }`}
            >
              导入负向
            </button>
            <button
              type="button"
              onClick={() =>
                void copyToClipboard(PROMPT_LIBRARY_IMPORT_EXAMPLE).then((ok) =>
                  onToast(ok ? '模板规则已复制' : '复制失败'),
                )
              }
              className="flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-sm hover:bg-white/5"
            >
              <Copy size={14} /> 复制模板规则
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            导入时将按逗号/换行拆分为多条命名提示词写入提示词库
          </p>
          <button
            type="button"
            onClick={() => void importJobPrompts(promptJob, importKind)}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-500 py-2.5 font-medium"
          >
            <Upload size={16} />
            批量导入到提示词库（{importKind === 'positive' ? '正向' : '负向'}）
          </button>
        </Modal>
      )}
    </div>
  );
}

const inputClass =
  'w-full rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm outline-none focus:border-violet-400';
