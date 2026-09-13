'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Copy,
  Download,
  Layers,
  Pencil,
  RefreshCw,
  Search,
  Settings2,
  Sparkles,
  Tags,
  Trash2,
  Upload,
  Wand2,
  Workflow,
} from 'lucide-react';
import { FormField, Modal, PanelToolbar, modalInputClass } from '../components/Modal';
import { useComfyPromptData } from '../hooks/useComfyPromptData';
import { buildPromptString, formatPromptSegment, parseTagsInput, tagsToInput } from '../../../domain/utils/buildPrompt';
import { copyToClipboard } from '../../../domain/utils/clipboard';
import {
  PROMPT_LIBRARY_IMPORT_EXAMPLE,
  TEMPLATE_IMPORT_EXAMPLE,
  parsePromptLibraryImport,
  parseTemplateImport,
} from '../../../domain/utils/splitTemplatePrompts';
import type {
  ComfyPrompt,
  ComfyPromptGroup,
  ComfyPromptSet,
  ComfyWorkflow,
  ComfyRunDraft,
  PromptKind,
} from '../../../domain/types';
import { COMFY_RUN_DRAFT_KEY } from '../../../domain/types';
import { detectWorkflowNodeIds, isApiWorkflow } from '../../../domain/utils/detectWorkflowNodeIds';

type TabId = 'prompts' | 'groups' | 'sets' | 'workflows' | 'builder';

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'prompts', label: '提示词库', icon: <Sparkles size={16} /> },
  { id: 'groups', label: '提示词分组', icon: <Layers size={16} /> },
  { id: 'sets', label: '提示词模板', icon: <Tags size={16} /> },
  { id: 'workflows', label: '工作流', icon: <Workflow size={16} /> },
  { id: 'builder', label: '组装台', icon: <Wand2 size={16} /> },
];

const KIND_LABEL: Record<PromptKind, string> = {
  positive: '正向',
  negative: '负向',
};

function getSetPromptIds(set: ComfyPromptSet | undefined): number[] {
  if (!set?.items) return [];
  return set.items.filter((i) => i.enabled && i.prompt).map((i) => i.promptId);
}

function collectBuilderPrompts(
  kind: PromptKind,
  prompts: ComfyPrompt[],
  sets: ComfyPromptSet[],
  selectedPromptIds: number[],
  selectedSetIds: number[],
): ComfyPrompt[] {
  const fromPrompts = prompts.filter(
    (p) => selectedPromptIds.includes(p.id) && p.kind === kind,
  );
  const fromSets: ComfyPrompt[] = [];
  for (const setId of selectedSetIds) {
    const set = sets.find((s) => s.id === setId && s.kind === kind);
    if (!set?.items) continue;
    for (const item of set.items) {
      if (item.enabled && item.prompt && item.prompt.kind === kind) {
        fromSets.push({
          ...item.prompt,
          content: `${item.customPrefix ?? ''}${item.prompt.content}${item.customSuffix ?? ''}`.trim(),
        });
      }
    }
  }
  const map = new Map<number, ComfyPrompt>();
  [...fromSets, ...fromPrompts].forEach((p) => map.set(p.id, p));
  return [...map.values()];
}

function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative min-w-[200px] flex-1">
      <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-sm"
      />
    </div>
  );
}

const filterSelectClass = 'rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm';

function ComfyPromptPageContent() {
  const router = useRouter();
  const store = useComfyPromptData();
  const [tab, setTab] = useState<TabId>('builder');
  const [kindFilter, setKindFilter] = useState<PromptKind | 'all'>('all');
  const [groupFilter, setGroupFilter] = useState<number | 'all'>('all');
  const [tagFilter, setTagFilter] = useState('');
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const [selectedPositivePromptIds, setSelectedPositivePromptIds] = useState<number[]>([]);
  const [selectedNegativePromptIds, setSelectedNegativePromptIds] = useState<number[]>([]);
  const [selectedPositiveSetIds, setSelectedPositiveSetIds] = useState<number[]>([]);
  const [selectedNegativeSetIds, setSelectedNegativeSetIds] = useState<number[]>([]);
  const [separator, setSeparator] = useState(', ');
  const [wrapWeight, setWrapWeight] = useState(true);

  useEffect(() => {
    void store.refreshAll();
  }, [store.refreshAll]);

  const filteredPrompts = useMemo(
    () =>
      store.filterPrompts(
        kindFilter === 'all' ? undefined : kindFilter,
        groupFilter === 'all' ? undefined : groupFilter,
        tagFilter || undefined,
        search || undefined,
      ),
    [store, kindFilter, groupFilter, tagFilter, search],
  );

  const positiveBuilderPrompts = useMemo(
    () =>
      collectBuilderPrompts(
        'positive',
        store.prompts,
        store.sets,
        selectedPositivePromptIds,
        selectedPositiveSetIds,
      ),
    [store.prompts, store.sets, selectedPositivePromptIds, selectedPositiveSetIds],
  );

  const negativeBuilderPrompts = useMemo(
    () =>
      collectBuilderPrompts(
        'negative',
        store.prompts,
        store.sets,
        selectedNegativePromptIds,
        selectedNegativeSetIds,
      ),
    [store.prompts, store.sets, selectedNegativePromptIds, selectedNegativeSetIds],
  );

  const builtPositivePrompt = useMemo(
    () => buildPromptString(positiveBuilderPrompts, { separator, wrapWeight }),
    [positiveBuilderPrompts, separator, wrapWeight],
  );

  const builtNegativePrompt = useMemo(
    () => buildPromptString(negativeBuilderPrompts, { separator, wrapWeight }),
    [negativeBuilderPrompts, separator, wrapWeight],
  );

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  const handleCopy = async (text: string, okMsg = '已复制到剪贴板') => {
    const ok = await copyToClipboard(text);
    showToast(ok ? okMsg : '复制失败，请检查浏览器权限');
  };

  const syncSetsAfterPromptChange = (
    kind: PromptKind,
    nextPromptIds: number[],
    setSelectedSetIds: React.Dispatch<React.SetStateAction<number[]>>,
  ) => {
    const kindSets = store.sets.filter((s) => s.kind === kind);
    setSelectedSetIds((prev) =>
      prev.filter((setId) => {
        const set = kindSets.find((s) => s.id === setId);
        const ids = getSetPromptIds(set);
        return ids.length > 0 && ids.every((pid) => nextPromptIds.includes(pid));
      }),
    );
  };

  const togglePositivePrompt = (id: number) => {
    setSelectedPositivePromptIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      syncSetsAfterPromptChange('positive', next, setSelectedPositiveSetIds);
      return next;
    });
  };

  const toggleNegativePrompt = (id: number) => {
    setSelectedNegativePromptIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      syncSetsAfterPromptChange('negative', next, setSelectedNegativeSetIds);
      return next;
    });
  };

  const togglePositiveSet = (id: number) => {
    const set = store.sets.find((s) => s.id === id);
    const promptIds = getSetPromptIds(set);
    if (selectedPositiveSetIds.includes(id)) {
      setSelectedPositiveSetIds((prev) => prev.filter((x) => x !== id));
      setSelectedPositivePromptIds((prev) => prev.filter((pid) => !promptIds.includes(pid)));
    } else {
      setSelectedPositiveSetIds((prev) => [...prev, id]);
      setSelectedPositivePromptIds((prev) => [...new Set([...prev, ...promptIds])]);
    }
  };

  const toggleNegativeSet = (id: number) => {
    const set = store.sets.find((s) => s.id === id);
    const promptIds = getSetPromptIds(set);
    if (selectedNegativeSetIds.includes(id)) {
      setSelectedNegativeSetIds((prev) => prev.filter((x) => x !== id));
      setSelectedNegativePromptIds((prev) => prev.filter((pid) => !promptIds.includes(pid)));
    } else {
      setSelectedNegativeSetIds((prev) => [...prev, id]);
      setSelectedNegativePromptIds((prev) => [...new Set([...prev, ...promptIds])]);
    }
  };

  const sendToRemoteRun = () => {
    const draft: ComfyRunDraft = {};
    try {
      const existing = sessionStorage.getItem(COMFY_RUN_DRAFT_KEY);
      if (existing) Object.assign(draft, JSON.parse(existing) as ComfyRunDraft);
    } catch {
      // ignore
    }
    if (builtPositivePrompt) draft.positivePrompt = builtPositivePrompt;
    if (builtNegativePrompt) draft.negativePrompt = builtNegativePrompt;
    sessionStorage.setItem(COMFY_RUN_DRAFT_KEY, JSON.stringify(draft));
    router.push('/run');
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <nav className="flex gap-2 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${
                tab === t.id
                  ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/30'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </nav>
        <button
          type="button"
          onClick={() => void store.refreshAll()}
          className="shrink-0 rounded-lg border border-white/10 p-2 hover:bg-white/5"
          title="刷新"
        >
          <RefreshCw size={16} className={store.loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {store.error && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-200">
          {store.error}
        </div>
      )}

      {tab === 'builder' && (
        <BuilderPanel
          separator={separator}
          setSeparator={setSeparator}
          wrapWeight={wrapWeight}
          setWrapWeight={setWrapWeight}
          builtPositivePrompt={builtPositivePrompt}
          builtNegativePrompt={builtNegativePrompt}
          positivePrompts={store.prompts.filter((p) => p.kind === 'positive')}
          negativePrompts={store.prompts.filter((p) => p.kind === 'negative')}
          positiveSets={store.sets.filter((s) => s.kind === 'positive')}
          negativeSets={store.sets.filter((s) => s.kind === 'negative')}
          selectedPositivePromptIds={selectedPositivePromptIds}
          selectedNegativePromptIds={selectedNegativePromptIds}
          selectedPositiveSetIds={selectedPositiveSetIds}
          selectedNegativeSetIds={selectedNegativeSetIds}
          onTogglePositivePrompt={togglePositivePrompt}
          onToggleNegativePrompt={toggleNegativePrompt}
          onTogglePositiveSet={togglePositiveSet}
          onToggleNegativeSet={toggleNegativeSet}
          onCopyPositive={() => void handleCopy(builtPositivePrompt, '正向 Prompt 已复制')}
          onCopyNegative={() => void handleCopy(builtNegativePrompt, '负向 Prompt 已复制')}
          onSendToRun={sendToRemoteRun}
        />
      )}

      {tab === 'prompts' && (
        <PromptsPanel
          groups={store.groups}
          prompts={filteredPrompts}
          allTags={store.allTags()}
          kindFilter={kindFilter}
          setKindFilter={setKindFilter}
          groupFilter={groupFilter}
          setGroupFilter={setGroupFilter}
          tagFilter={tagFilter}
          setTagFilter={setTagFilter}
          search={search}
          setSearch={setSearch}
          onCreate={async (data) => {
            await store.createPrompt(data);
            showToast('提示词已创建');
          }}
          onUpdate={async (id, data) => {
            await store.updatePrompt(id, data);
            showToast('提示词已更新');
          }}
          onDelete={async (id) => {
            await store.deletePrompt(id);
            showToast('提示词已删除');
          }}
          onCopy={handleCopy}
          onBulkCreate={store.bulkCreatePrompts}
          onBulkAddTags={store.bulkAddTagsToPrompts}
          onBulkUpdateGroup={store.bulkUpdatePrompts}
          onCreateSet={store.createSet}
        />
      )}

      {tab === 'groups' && (
        <GroupsPanel
          groups={store.groups}
          onCreate={async (data) => {
            await store.createGroup(data);
            showToast('提示词分组已创建');
          }}
          onUpdate={async (id, data) => {
            await store.updateGroup(id, data);
            showToast('提示词分组已更新');
          }}
          onDelete={async (id) => {
            await store.deleteGroup(id);
            showToast('提示词分组已删除');
          }}
        />
      )}

      {tab === 'sets' && (
        <TemplatesPanel
          sets={store.sets}
          prompts={store.prompts}
          groups={store.groups}
          onCreate={async (data) => {
            await store.createSet(data);
            showToast('提示词模板已创建');
          }}
          onUpdate={async (id, data) => {
            await store.updateSet(id, data);
            showToast('提示词模板已更新');
          }}
          onDelete={async (id) => {
            await store.deleteSet(id);
            showToast('提示词模板已删除');
          }}
          onPreview={(set) => {
            const items = (set.items ?? [])
              .filter((i) => i.enabled && i.prompt)
              .map((i) => ({
                ...i.prompt!,
                content: `${i.customPrefix ?? ''}${i.prompt!.content}${i.customSuffix ?? ''}`.trim(),
              }));
            void handleCopy(
              buildPromptString(items, { separator: set.separator, wrapWeight: true }),
              '模板预览已复制',
            );
          }}
          onBulkCreatePrompts={store.bulkCreatePrompts}
        />
      )}

      {tab === 'workflows' && (
        <WorkflowsPanel
          workflows={store.workflows}
          onCreate={async (data) => {
            await store.createWorkflow(data);
            showToast('工作流已保存');
          }}
          onUpdate={async (id, data) => {
            await store.updateWorkflow(id, data);
            showToast('工作流已更新');
          }}
          onDelete={async (id) => {
            await store.deleteWorkflow(id);
            showToast('工作流已删除');
          }}
          onCopy={handleCopy}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[110] -translate-x-1/2 rounded-full bg-violet-600 px-4 py-2 text-sm shadow-xl">
          {toast}
        </div>
      )}
    </div>
  );
}

function BuilderOutputPanel(props: {
  title: string;
  value: string;
  placeholder: string;
  onCopy: () => void;
  onOpenAdvanced: () => void;
}) {
  return (
    <div className="flex h-full min-h-[320px] flex-col rounded-2xl border border-violet-400/30 bg-violet-500/10 p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="font-semibold">{props.title}</h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={props.onOpenAdvanced}
            className="flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs hover:bg-white/5"
            title="高级设置"
          >
            <Settings2 size={14} /> 高级设置
          </button>
          <button
            type="button"
            onClick={props.onCopy}
            disabled={!props.value}
            className="flex items-center gap-1 rounded-lg bg-violet-500 px-3 py-1.5 text-sm disabled:opacity-40"
          >
            <Copy size={14} /> 复制
          </button>
        </div>
      </div>
      <textarea
        readOnly
        value={props.value}
        className="min-h-0 flex-1 w-full resize-none rounded-xl border border-white/10 bg-slate-950/80 p-3 text-sm leading-relaxed text-slate-200"
        placeholder={props.placeholder}
      />
    </div>
  );
}

function BuilderPanel(props: {
  separator: string;
  setSeparator: (s: string) => void;
  wrapWeight: boolean;
  setWrapWeight: (v: boolean) => void;
  builtPositivePrompt: string;
  builtNegativePrompt: string;
  positivePrompts: ComfyPrompt[];
  negativePrompts: ComfyPrompt[];
  positiveSets: ComfyPromptSet[];
  negativeSets: ComfyPromptSet[];
  selectedPositivePromptIds: number[];
  selectedNegativePromptIds: number[];
  selectedPositiveSetIds: number[];
  selectedNegativeSetIds: number[];
  onTogglePositivePrompt: (id: number) => void;
  onToggleNegativePrompt: (id: number) => void;
  onTogglePositiveSet: (id: number) => void;
  onToggleNegativeSet: (id: number) => void;
  onCopyPositive: () => void;
  onCopyNegative: () => void;
  onSendToRun: () => void;
}) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const canSendToRun = Boolean(props.builtPositivePrompt || props.builtNegativePrompt);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-2 lg:items-stretch">
        <BuilderKindSection
          kind="positive"
          sets={props.positiveSets}
          prompts={props.positivePrompts}
          selectedSetIds={props.selectedPositiveSetIds}
          selectedPromptIds={props.selectedPositivePromptIds}
          onToggleSet={props.onTogglePositiveSet}
          onTogglePrompt={props.onTogglePositivePrompt}
        />
        <BuilderOutputPanel
          title="正向 ComfyUI 输出"
          value={props.builtPositivePrompt}
          placeholder="选择正向提示词或模板后在此生成..."
          onCopy={props.onCopyPositive}
          onOpenAdvanced={() => setAdvancedOpen(true)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2 lg:items-stretch">
        <BuilderKindSection
          kind="negative"
          sets={props.negativeSets}
          prompts={props.negativePrompts}
          selectedSetIds={props.selectedNegativeSetIds}
          selectedPromptIds={props.selectedNegativePromptIds}
          onToggleSet={props.onToggleNegativeSet}
          onTogglePrompt={props.onToggleNegativePrompt}
        />
        <BuilderOutputPanel
          title="负向 ComfyUI 输出"
          value={props.builtNegativePrompt}
          placeholder="选择负向提示词或模板后在此生成..."
          onCopy={props.onCopyNegative}
          onOpenAdvanced={() => setAdvancedOpen(true)}
        />
      </div>

      <button
        type="button"
        onClick={props.onSendToRun}
        disabled={!canSendToRun}
        className="w-full rounded-xl bg-emerald-500 py-2.5 font-medium text-white hover:bg-emerald-400 disabled:opacity-40"
      >
        前往远程运行
      </button>

      {advancedOpen && (
        <Modal title="组装高级设置" onClose={() => setAdvancedOpen(false)}>
          <FormField label="分隔符">
            <input
              value={props.separator}
              onChange={(e) => props.setSeparator(e.target.value)}
              className={modalInputClass}
            />
          </FormField>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={props.wrapWeight}
              onChange={(e) => props.setWrapWeight(e.target.checked)}
            />
            启用权重语法 (content:1.2)
          </label>
          <button
            type="button"
            onClick={() => setAdvancedOpen(false)}
            className="mt-4 w-full rounded-xl bg-violet-500 py-2.5"
          >
            确定
          </button>
        </Modal>
      )}
    </div>
  );
}

function BuilderKindSection(props: {
  kind: PromptKind;
  sets: ComfyPromptSet[];
  prompts: ComfyPrompt[];
  selectedSetIds: number[];
  selectedPromptIds: number[];
  onToggleSet: (id: number) => void;
  onTogglePrompt: (id: number) => void;
}) {
  return (
    <section className="flex h-full min-h-[320px] flex-col space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4">
      <h3 className="font-medium">{KIND_LABEL[props.kind]} Prompt 组装</h3>

      <div>
        <h4 className="mb-2 text-sm text-slate-400">选择提示词模板</h4>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {props.sets.map((set) => (
            <button
              key={set.id}
              type="button"
              onClick={() => props.onToggleSet(set.id)}
              className={`rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                props.selectedSetIds.includes(set.id)
                  ? 'border-violet-400 bg-violet-500 text-white'
                  : 'border-white/10 bg-slate-800/80 hover:bg-slate-700'
              }`}
            >
              <div className="truncate font-medium">{set.name}</div>
              <div className="mt-0.5 truncate text-xs opacity-70">
                {(set.items ?? []).length} 条
              </div>
            </button>
          ))}
          {!props.sets.length && (
            <span className="col-span-full text-sm text-slate-500">
              暂无{KIND_LABEL[props.kind]}模板
            </span>
          )}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <h4 className="mb-2 text-sm text-slate-400">选择单条提示词</h4>
        <div className="grid min-h-0 flex-1 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
          {props.prompts.map((p) => (
            <label
              key={p.id}
              className={`flex cursor-pointer flex-col rounded-xl border p-2.5 text-sm transition ${
                props.selectedPromptIds.includes(p.id)
                  ? 'border-violet-400 bg-violet-500/10'
                  : 'border-white/5 bg-slate-900/40 hover:bg-slate-900/60'
              }`}
            >
              <div className="mb-1 flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={props.selectedPromptIds.includes(p.id)}
                  onChange={() => props.onTogglePrompt(p.id)}
                  className="mt-0.5 shrink-0"
                />
                <span className="line-clamp-2 font-medium leading-snug">{p.title}</span>
              </div>
              <span className="line-clamp-3 text-xs text-slate-400">{p.content}</span>
            </label>
          ))}
          {!props.prompts.length && (
            <span className="col-span-full text-sm text-slate-500">
              暂无{KIND_LABEL[props.kind]}提示词
            </span>
          )}
        </div>
      </div>
    </section>
  );
}

function GridCard({
  title,
  subtitle,
  badges,
  onEdit,
  onDelete,
  onCopy,
  onDownload,
  extra,
  selectable,
  selected,
  onSelectToggle,
}: {
  title: string;
  subtitle?: string;
  badges?: React.ReactNode;
  onEdit?: () => void;
  onDelete?: () => void;
  onCopy?: () => void;
  onDownload?: () => void;
  extra?: React.ReactNode;
  selectable?: boolean;
  selected?: boolean;
  onSelectToggle?: () => void;
}) {
  return (
    <article
      className={`flex h-full flex-col rounded-2xl border p-4 transition ${
        selected ? 'border-violet-400 bg-violet-500/10' : 'border-white/10 bg-white/5'
      }`}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-start gap-2">
          {selectable && (
            <input
              type="checkbox"
              checked={selected}
              onChange={onSelectToggle}
              className="mt-1 shrink-0"
              onClick={(e) => e.stopPropagation()}
            />
          )}
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-medium">{title}</h3>
            {badges && <div className="mt-1 flex flex-wrap gap-1">{badges}</div>}
          </div>
        </div>
        <div className="flex shrink-0 gap-1">
          {onCopy && (
            <button type="button" onClick={onCopy} className="rounded-lg bg-white/10 p-1.5" title="复制">
              <Copy size={14} />
            </button>
          )}
          {onDownload && (
            <button type="button" onClick={onDownload} className="rounded-lg bg-white/10 p-1.5" title="下载">
              <Download size={14} />
            </button>
          )}
          {onEdit && (
            <button type="button" onClick={onEdit} className="rounded-lg bg-white/10 p-1.5" title="编辑">
              <Pencil size={14} />
            </button>
          )}
          {onDelete && (
            <button type="button" onClick={onDelete} className="rounded-lg bg-red-500/20 p-1.5 text-red-200" title="删除">
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
      {subtitle && <p className="flex-1 text-sm text-slate-300 whitespace-pre-wrap line-clamp-4">{subtitle}</p>}
      {extra}
    </article>
  );
}

function PromptsPanel(props: {
  groups: ComfyPromptGroup[];
  prompts: ComfyPrompt[];
  allTags: string[];
  kindFilter: PromptKind | 'all';
  setKindFilter: (v: PromptKind | 'all') => void;
  groupFilter: number | 'all';
  setGroupFilter: (v: number | 'all') => void;
  tagFilter: string;
  setTagFilter: (v: string) => void;
  search: string;
  setSearch: (v: string) => void;
  onCreate: (data: import('../types').PromptFormData) => Promise<void>;
  onUpdate: (id: number, data: Partial<import('../types').PromptFormData>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onCopy: (text: string, msg?: string) => Promise<void>;
  onBulkCreate: (items: import('../types').PromptFormData[]) => Promise<ComfyPrompt[]>;
  onBulkAddTags: (ids: number[], tags: string[]) => Promise<void>;
  onBulkUpdateGroup: (ids: number[], data: Partial<import('../types').PromptFormData>) => Promise<void>;
  onCreateSet: (data: import('../types').PromptSetFormData) => Promise<ComfyPromptSet>;
}) {
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [bulkTagOpen, setBulkTagOpen] = useState(false);
  const [bulkGroupOpen, setBulkGroupOpen] = useState(false);
  const [bulkSetOpen, setBulkSetOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [importText, setImportText] = useState('');
  const [importKind, setImportKind] = useState<PromptKind>('positive');
  const [importGroupId, setImportGroupId] = useState<number | ''>('');
  const [bulkTagsInput, setBulkTagsInput] = useState('');
  const [bulkGroupId, setBulkGroupId] = useState<number | ''>('');
  const [bulkSetName, setBulkSetName] = useState('');
  const [bulkSetKind, setBulkSetKind] = useState<PromptKind>('positive');
  const [editing, setEditing] = useState<ComfyPrompt | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [kind, setKind] = useState<PromptKind>('positive');
  const [groupId, setGroupId] = useState<number | ''>('');
  const [tagsInput, setTagsInput] = useState('');
  const [weight, setWeight] = useState('');
  const [notes, setNotes] = useState('');

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const selectAllVisible = () => {
    if (selectedIds.length === props.prompts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(props.prompts.map((p) => p.id));
    }
  };

  const resetForm = () => {
    setEditing(null);
    setTitle('');
    setContent('');
    setKind('positive');
    setGroupId('');
    setTagsInput('');
    setWeight('');
    setNotes('');
  };

  const openCreate = () => {
    resetForm();
    setFormOpen(true);
  };

  const openEdit = (p: ComfyPrompt) => {
    setEditing(p);
    setTitle(p.title);
    setContent(p.content);
    setKind(p.kind);
    setGroupId(p.groupId ?? '');
    setTagsInput(tagsToInput(p.tags));
    setWeight(p.weight ?? '');
    setNotes(p.notes ?? '');
    setFormOpen(true);
  };

  const submit = async () => {
    const payload = {
      title,
      content,
      kind,
      groupId: groupId === '' ? null : Number(groupId),
      tags: parseTagsInput(tagsInput),
      weight: weight ? Number(weight) : null,
      notes,
    };
    if (editing) await props.onUpdate(editing.id, payload);
    else await props.onCreate(payload);
    setFormOpen(false);
    resetForm();
  };

  const handleImport = async () => {
    const entries = parsePromptLibraryImport(importText);
    await props.onBulkCreate(
      entries.map((entry) => ({
        title: entry.name,
        content: entry.content,
        kind: importKind,
        groupId: importGroupId === '' ? null : Number(importGroupId),
        tags: ['imported'],
      })),
    );
    setImportOpen(false);
    setImportText('');
  };

  const handleBulkTag = async () => {
    const tags = parseTagsInput(bulkTagsInput);
    if (!tags.length) return;
    await props.onBulkAddTags(selectedIds, tags);
    setBulkTagOpen(false);
    setBulkTagsInput('');
    setSelectedIds([]);
  };

  const handleBulkGroup = async () => {
    await props.onBulkUpdateGroup(selectedIds, {
      groupId: bulkGroupId === '' ? null : Number(bulkGroupId),
    });
    setBulkGroupOpen(false);
    setBulkGroupId('');
    setSelectedIds([]);
  };

  const handleBulkSet = async () => {
    if (!bulkSetName.trim()) return;
    await props.onCreateSet({
      name: bulkSetName.trim(),
      kind: bulkSetKind,
      separator: ', ',
      promptIds: selectedIds,
    });
    setBulkSetOpen(false);
    setBulkSetName('');
    setSelectedIds([]);
  };

  return (
    <div>
      <PanelToolbar
        title="提示词库"
        onAdd={openCreate}
        addLabel="新建提示词"
        extra={
          <>
            <button
              type="button"
              onClick={() => setImportOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 px-4 py-2 text-sm hover:bg-white/5"
            >
              <Upload size={16} /> 批量导入
            </button>
            {props.prompts.length > 0 && (
              <button
                type="button"
                onClick={selectAllVisible}
                className="rounded-xl border border-white/10 px-4 py-2 text-sm hover:bg-white/5"
              >
                {selectedIds.length === props.prompts.length ? '取消全选' : '全选'}
              </button>
            )}
          </>
        }
      />

      {selectedIds.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-violet-400/30 bg-violet-500/10 px-4 py-3">
          <span className="text-sm text-violet-200">已选 {selectedIds.length} 项</span>
          <button
            type="button"
            onClick={() => setBulkTagOpen(true)}
            className="rounded-lg bg-violet-500 px-3 py-1.5 text-sm"
          >
            设置 Tag
          </button>
          <button
            type="button"
            onClick={() => setBulkGroupOpen(true)}
            className="rounded-lg bg-violet-500 px-3 py-1.5 text-sm"
          >
            设置分组
          </button>
          <button
            type="button"
            onClick={() => setBulkSetOpen(true)}
            className="rounded-lg bg-violet-500 px-3 py-1.5 text-sm"
          >
            创建模板
          </button>
          <button
            type="button"
            onClick={() => setSelectedIds([])}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-sm hover:bg-white/5"
          >
            取消选择
          </button>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchInput
          value={props.search}
          onChange={props.setSearch}
          placeholder="搜索标题或内容..."
        />
        <select
          value={props.kindFilter}
          onChange={(e) => props.setKindFilter(e.target.value as PromptKind | 'all')}
          className={filterSelectClass}
        >
          <option value="all">全部类型</option>
          <option value="positive">正向</option>
          <option value="negative">负向</option>
        </select>
        <select
          value={props.groupFilter}
          onChange={(e) =>
            props.setGroupFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))
          }
          className={filterSelectClass}
        >
          <option value="all">全部分组</option>
          {props.groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
        <select
          value={props.tagFilter}
          onChange={(e) => props.setTagFilter(e.target.value)}
          className={filterSelectClass}
        >
          <option value="">全部 Tag</option>
          {props.allTags.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {props.prompts.map((p) => (
          <GridCard
            key={p.id}
            title={p.title}
            subtitle={p.content}
            selectable
            selected={selectedIds.includes(p.id)}
            onSelectToggle={() => toggleSelect(p.id)}
            badges={
              <>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">{KIND_LABEL[p.kind]}</span>
                {(p.tags ?? []).map((t) => (
                  <span key={t} className="rounded-full bg-violet-500/20 px-2 py-0.5 text-xs text-violet-200">
                    #{t}
                  </span>
                ))}
              </>
            }
            onEdit={() => openEdit(p)}
            onCopy={() => void props.onCopy(formatPromptSegment(p, true), '提示词已复制')}
            onDelete={() => void props.onDelete(p.id)}
          />
        ))}
        {!props.prompts.length && (
          <p className="col-span-full text-sm text-slate-500">暂无提示词，点击「新建提示词」开始添加。</p>
        )}
      </div>

      {formOpen && (
        <Modal title={editing ? '编辑提示词' : '新建提示词'} onClose={() => setFormOpen(false)}>
          <FormField label="标题">
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={modalInputClass} />
          </FormField>
          <FormField label="内容">
            <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={4} className={modalInputClass} />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="类型">
              <select value={kind} onChange={(e) => setKind(e.target.value as PromptKind)} className={modalInputClass}>
                <option value="positive">正向</option>
                <option value="negative">负向</option>
              </select>
            </FormField>
            <FormField label="提示词分组">
              <select
                value={groupId}
                onChange={(e) => setGroupId(e.target.value ? Number(e.target.value) : '')}
                className={modalInputClass}
              >
                <option value="">无</option>
                {props.groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </FormField>
          </div>
          <FormField label="Tags（逗号分隔）">
            <input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} className={modalInputClass} />
          </FormField>
          <FormField label="权重（可选，如 1.2）">
            <input value={weight} onChange={(e) => setWeight(e.target.value)} className={modalInputClass} />
          </FormField>
          <FormField label="备注">
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={modalInputClass} />
          </FormField>
          <button type="button" onClick={() => void submit()} className="mt-2 w-full rounded-xl bg-violet-500 py-2.5">
            保存
          </button>
        </Modal>
      )}

      {importOpen && (
        <Modal title="批量导入提示词" onClose={() => setImportOpen(false)} wide>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-slate-400">JSON 数组，每项须包含 name 与 prompts 字段</p>
            <button
              type="button"
              onClick={() => void props.onCopy(PROMPT_LIBRARY_IMPORT_EXAMPLE, '模板规则已复制')}
              className="flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-xs hover:bg-white/5"
            >
              <Copy size={14} /> 复制模板规则
            </button>
          </div>
          <label className="mb-3 flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-white/20 px-4 py-2 text-sm hover:bg-white/5">
            <Upload size={16} /> 选择 JSON 文件
            <input
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void f.text().then(setImportText);
              }}
            />
          </label>
          <FormField label="导入内容">
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              rows={10}
              placeholder={PROMPT_LIBRARY_IMPORT_EXAMPLE}
              className={modalInputClass}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="默认类型">
              <select
                value={importKind}
                onChange={(e) => setImportKind(e.target.value as PromptKind)}
                className={modalInputClass}
              >
                <option value="positive">正向</option>
                <option value="negative">负向</option>
              </select>
            </FormField>
            <FormField label="导入到分组（可选）">
              <select
                value={importGroupId}
                onChange={(e) => setImportGroupId(e.target.value ? Number(e.target.value) : '')}
                className={modalInputClass}
              >
                <option value="">无</option>
                {props.groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </FormField>
          </div>
          <button type="button" onClick={() => void handleImport()} className="mt-2 w-full rounded-xl bg-violet-500 py-2.5">
            导入
          </button>
        </Modal>
      )}

      {bulkTagOpen && (
        <Modal title="批量设置 Tag" onClose={() => setBulkTagOpen(false)}>
          <p className="mb-3 text-xs text-slate-400">将为选中的 {selectedIds.length} 条提示词追加 Tag</p>
          <FormField label="Tags（逗号分隔）">
            <input value={bulkTagsInput} onChange={(e) => setBulkTagsInput(e.target.value)} className={modalInputClass} />
          </FormField>
          <button type="button" onClick={() => void handleBulkTag()} className="mt-2 w-full rounded-xl bg-violet-500 py-2.5">
            应用
          </button>
        </Modal>
      )}

      {bulkGroupOpen && (
        <Modal title="批量设置分组" onClose={() => setBulkGroupOpen(false)}>
          <p className="mb-3 text-xs text-slate-400">将为选中的 {selectedIds.length} 条提示词设置分组</p>
          <FormField label="提示词分组">
            <select
              value={bulkGroupId}
              onChange={(e) => setBulkGroupId(e.target.value ? Number(e.target.value) : '')}
              className={modalInputClass}
            >
              <option value="">无</option>
              {props.groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </FormField>
          <button type="button" onClick={() => void handleBulkGroup()} className="mt-2 w-full rounded-xl bg-violet-500 py-2.5">
            应用
          </button>
        </Modal>
      )}

      {bulkSetOpen && (
        <Modal title="从选中项创建模板" onClose={() => setBulkSetOpen(false)}>
          <p className="mb-3 text-xs text-slate-400">将选中的 {selectedIds.length} 条提示词创建为模板</p>
          <FormField label="模板名称">
            <input value={bulkSetName} onChange={(e) => setBulkSetName(e.target.value)} className={modalInputClass} />
          </FormField>
          <FormField label="类型">
            <select
              value={bulkSetKind}
              onChange={(e) => setBulkSetKind(e.target.value as PromptKind)}
              className={modalInputClass}
            >
              <option value="positive">正向</option>
              <option value="negative">负向</option>
            </select>
          </FormField>
          <button type="button" onClick={() => void handleBulkSet()} className="mt-2 w-full rounded-xl bg-violet-500 py-2.5">
            创建模板
          </button>
        </Modal>
      )}
    </div>
  );
}

function GroupsPanel(props: {
  groups: ComfyPromptGroup[];
  onCreate: (data: import('../types').PromptGroupFormData) => Promise<void>;
  onUpdate: (id: number, data: Partial<import('../types').PromptGroupFormData>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ComfyPromptGroup | null>(null);
  const [name, setName] = useState('');
  const [kind, setKind] = useState<PromptKind>('positive');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('violet');
  const [search, setSearch] = useState('');
  const [kindFilter, setKindFilter] = useState<PromptKind | 'all'>('all');

  const filteredGroups = useMemo(() => {
    return props.groups.filter((g) => {
      if (kindFilter !== 'all' && g.kind !== kindFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!g.name.toLowerCase().includes(q) && !(g.description ?? '').toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [props.groups, search, kindFilter]);

  const resetForm = () => {
    setEditing(null);
    setName('');
    setKind('positive');
    setDescription('');
    setColor('violet');
  };

  const openCreate = () => {
    resetForm();
    setFormOpen(true);
  };

  const openEdit = (g: ComfyPromptGroup) => {
    setEditing(g);
    setName(g.name);
    setKind(g.kind);
    setDescription(g.description ?? '');
    setColor(g.color ?? 'violet');
    setFormOpen(true);
  };

  const submit = async () => {
    const payload = { name, kind, description, color };
    if (editing) await props.onUpdate(editing.id, payload);
    else await props.onCreate(payload);
    setFormOpen(false);
    resetForm();
  };

  return (
    <div>
      <PanelToolbar title="提示词分组" onAdd={openCreate} addLabel="新建分组" />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="搜索名称或描述..." />
        <select
          value={kindFilter}
          onChange={(e) => setKindFilter(e.target.value as PromptKind | 'all')}
          className={filterSelectClass}
        >
          <option value="all">全部类型</option>
          <option value="positive">正向</option>
          <option value="negative">负向</option>
        </select>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filteredGroups.map((g) => (
          <GridCard
            key={g.id}
            title={g.name}
            subtitle={g.description || '无描述'}
            badges={
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">{KIND_LABEL[g.kind]}</span>
            }
            onEdit={() => openEdit(g)}
            onDelete={() => void props.onDelete(g.id)}
          />
        ))}
        {!filteredGroups.length && (
          <p className="col-span-full text-sm text-slate-500">
            {props.groups.length ? '没有匹配的分组。' : '暂无分组，点击「新建分组」开始添加。'}
          </p>
        )}
      </div>

      {formOpen && (
        <Modal
          title={editing ? '编辑提示词分组' : '新建提示词分组'}
          onClose={() => setFormOpen(false)}
        >
          <FormField label="分组名称">
            <input value={name} onChange={(e) => setName(e.target.value)} className={modalInputClass} />
          </FormField>
          <FormField label="类型">
            <select value={kind} onChange={(e) => setKind(e.target.value as PromptKind)} className={modalInputClass}>
              <option value="positive">正向</option>
              <option value="negative">负向</option>
            </select>
          </FormField>
          <FormField label="描述">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={modalInputClass}
            />
          </FormField>
          <FormField label="颜色标识">
            <select value={color} onChange={(e) => setColor(e.target.value)} className={modalInputClass}>
              <option value="violet">紫色</option>
              <option value="emerald">绿色</option>
              <option value="amber">琥珀</option>
              <option value="rose">玫红</option>
              <option value="sky">天蓝</option>
            </select>
          </FormField>
          <button type="button" onClick={() => void submit()} className="mt-2 w-full rounded-xl bg-violet-500 py-2.5">
            保存
          </button>
        </Modal>
      )}
    </div>
  );
}

function TemplatesPanel(props: {
  sets: ComfyPromptSet[];
  prompts: ComfyPrompt[];
  groups: ComfyPromptGroup[];
  onCreate: (data: import('../types').PromptSetFormData) => Promise<void>;
  onUpdate: (id: number, data: Partial<import('../types').PromptSetFormData>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onPreview: (set: ComfyPromptSet) => void;
  onBulkCreatePrompts: (items: import('../types').PromptFormData[]) => Promise<ComfyPrompt[]>;
}) {
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editing, setEditing] = useState<ComfyPromptSet | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [kind, setKind] = useState<PromptKind>('positive');
  const [separator, setSeparator] = useState(', ');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const [importText, setImportText] = useState('');
  const [importSplitToLibrary, setImportSplitToLibrary] = useState(true);
  const [importGroupId, setImportGroupId] = useState<number | ''>('');
  const [search, setSearch] = useState('');
  const [kindFilter, setKindFilter] = useState<PromptKind | 'all'>('all');
  const [tagFilter, setTagFilter] = useState('');

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    for (const set of props.sets) (set.tags ?? []).forEach((t) => tagSet.add(t));
    return [...tagSet].sort();
  }, [props.sets]);

  const filteredSets = useMemo(() => {
    return props.sets.filter((set) => {
      if (kindFilter !== 'all' && set.kind !== kindFilter) return false;
      if (tagFilter && !(set.tags ?? []).includes(tagFilter)) return false;
      if (search) {
        const q = search.toLowerCase();
        const itemTitles = (set.items ?? [])
          .map((i) => i.prompt?.title ?? '')
          .join(' ')
          .toLowerCase();
        if (
          !set.name.toLowerCase().includes(q) &&
          !(set.description ?? '').toLowerCase().includes(q) &&
          !itemTitles.includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [props.sets, search, kindFilter, tagFilter]);

  const resetForm = () => {
    setEditing(null);
    setName('');
    setDescription('');
    setKind('positive');
    setSeparator(', ');
    setSelectedIds([]);
  };

  const openCreate = () => {
    resetForm();
    setFormOpen(true);
  };

  const openEdit = (set: ComfyPromptSet) => {
    setEditing(set);
    setName(set.name);
    setDescription(set.description ?? '');
    setKind(set.kind);
    setSeparator(set.separator);
    setSelectedIds((set.items ?? []).map((i) => i.promptId));
    setFormOpen(true);
  };

  const toggleId = (id: number) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const submit = async () => {
    const payload = { name, description, kind, separator, promptIds: selectedIds };
    if (editing) await props.onUpdate(editing.id, payload);
    else await props.onCreate(payload);
    setFormOpen(false);
    resetForm();
  };

  const handleImport = async () => {
    const parsed = parseTemplateImport(importText);
    const contentToId = new Map(
      props.prompts.filter((p) => p.kind === parsed.kind).map((p) => [p.content, p.id]),
    );

    if (importSplitToLibrary) {
      const toCreate = parsed.namedPrompts
        .filter((entry) => !contentToId.has(entry.content))
        .map((entry) => ({
          title: entry.name,
          content: entry.content,
          kind: parsed.kind,
          groupId: importGroupId === '' ? null : Number(importGroupId),
          tags: ['imported'],
        }));
      if (toCreate.length) {
        const created = await props.onBulkCreatePrompts(toCreate);
        for (const p of created) contentToId.set(p.content, p.id);
      }
    }

    const promptIds = parsed.namedPrompts
      .map((entry) => contentToId.get(entry.content))
      .filter((id): id is number => id !== undefined);

    await props.onCreate({
      name: parsed.name,
      description: parsed.description,
      kind: parsed.kind,
      separator: parsed.separator,
      promptIds: [...new Set(promptIds)],
    });
    setImportOpen(false);
    setImportText('');
  };

  return (
    <div>
      <PanelToolbar
        title="提示词模板"
        onAdd={openCreate}
        addLabel="新建模板"
        extra={
          <button
            type="button"
            onClick={() => setImportOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 px-4 py-2 text-sm hover:bg-white/5"
          >
            <Upload size={16} /> 导入模板
          </button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="搜索模板名称、描述或条目..." />
        <select
          value={kindFilter}
          onChange={(e) => setKindFilter(e.target.value as PromptKind | 'all')}
          className={filterSelectClass}
        >
          <option value="all">全部类型</option>
          <option value="positive">正向</option>
          <option value="negative">负向</option>
        </select>
        <select value={tagFilter} onChange={(e) => setTagFilter(e.target.value)} className={filterSelectClass}>
          <option value="">全部 Tag</option>
          {allTags.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filteredSets.map((set) => (
          <GridCard
            key={set.id}
            title={set.name}
            subtitle={
              (set.items ?? []).map((i) => i.prompt?.title).filter(Boolean).join(' · ') || '空模板'
            }
            badges={
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">{KIND_LABEL[set.kind]}</span>
            }
            onEdit={() => openEdit(set)}
            onCopy={() => props.onPreview(set)}
            onDelete={() => void props.onDelete(set.id)}
          />
        ))}
        {!filteredSets.length && (
          <p className="col-span-full text-sm text-slate-500">
            {props.sets.length ? '没有匹配的模板。' : '暂无模板，可新建或导入模板。'}
          </p>
        )}
      </div>

      {formOpen && (
        <Modal title={editing ? '编辑提示词模板' : '新建提示词模板'} onClose={() => setFormOpen(false)} wide>
          <FormField label="模板名称">
            <input value={name} onChange={(e) => setName(e.target.value)} className={modalInputClass} />
          </FormField>
          <FormField label="描述">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className={modalInputClass}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="类型">
              <select value={kind} onChange={(e) => setKind(e.target.value as PromptKind)} className={modalInputClass}>
                <option value="positive">正向</option>
                <option value="negative">负向</option>
              </select>
            </FormField>
            <FormField label="分隔符">
              <input value={separator} onChange={(e) => setSeparator(e.target.value)} className={modalInputClass} />
            </FormField>
          </div>
          <FormField label="关联提示词">
            <div className="max-h-48 overflow-y-auto rounded-xl border border-white/10 bg-slate-900/50 p-3">
              <div className="flex flex-wrap gap-2">
                {props.prompts
                  .filter((p) => p.kind === kind)
                  .map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => toggleId(p.id)}
                      className={`rounded-lg px-3 py-1 text-sm ${
                        selectedIds.includes(p.id) ? 'bg-violet-500' : 'bg-slate-800'
                      }`}
                    >
                      {p.title}
                    </button>
                  ))}
              </div>
            </div>
          </FormField>
          <button type="button" onClick={() => void submit()} className="mt-2 w-full rounded-xl bg-violet-500 py-2.5">
            保存
          </button>
        </Modal>
      )}

      {importOpen && (
        <Modal title="导入提示词模板" onClose={() => setImportOpen(false)} wide>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-slate-400">
              JSON 格式，prompts 数组每项须包含 name 与 prompts 字段
            </p>
            <button
              type="button"
              onClick={() => void copyToClipboard(TEMPLATE_IMPORT_EXAMPLE)}
              className="flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-xs hover:bg-white/5"
            >
              <Copy size={14} /> 复制模板规则
            </button>
          </div>
          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-white/20 px-4 py-2 text-sm hover:bg-white/5">
            <Upload size={16} /> 选择 JSON 文件
            <input
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                void f.text().then(setImportText);
              }}
            />
          </label>
          <FormField label="模板内容">
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              rows={10}
              placeholder={TEMPLATE_IMPORT_EXAMPLE}
              className={modalInputClass}
            />
          </FormField>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={importSplitToLibrary}
              onChange={(e) => setImportSplitToLibrary(e.target.checked)}
            />
            拆解并批量导入到提示词库
          </label>
          {importSplitToLibrary && (
            <FormField label="导入到提示词分组（可选）">
              <select
                value={importGroupId}
                onChange={(e) => setImportGroupId(e.target.value ? Number(e.target.value) : '')}
                className={modalInputClass}
              >
                <option value="">无</option>
                {props.groups
                  .filter((g) => g.kind === 'positive' || g.kind === 'negative')
                  .map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
              </select>
            </FormField>
          )}
          <button type="button" onClick={() => void handleImport()} className="mt-2 w-full rounded-xl bg-violet-500 py-2.5">
            导入
          </button>
        </Modal>
      )}
    </div>
  );
}

function WorkflowsPanel(props: {
  workflows: ComfyWorkflow[];
  onCreate: (data: import('../types').WorkflowFormData) => Promise<void>;
  onUpdate: (id: number, data: Partial<import('../types').WorkflowFormData>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onCopy: (text: string, msg?: string) => Promise<void>;
}) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ComfyWorkflow | null>(null);
  const [name, setName] = useState('');
  const [jsonText, setJsonText] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [positiveNodeId, setPositiveNodeId] = useState('');
  const [negativeNodeId, setNegativeNodeId] = useState('');
  const [seedNodeId, setSeedNodeId] = useState('');
  const [latentNodeId, setLatentNodeId] = useState('');
  const [notes, setNotes] = useState('');
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState('');

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    for (const workflow of props.workflows) (workflow.tags ?? []).forEach((t) => tagSet.add(t));
    return [...tagSet].sort();
  }, [props.workflows]);

  const filteredWorkflows = useMemo(() => {
    return props.workflows.filter((workflow) => {
      if (tagFilter && !(workflow.tags ?? []).includes(tagFilter)) return false;
      if (search) {
        const q = search.toLowerCase();
        const tagText = (workflow.tags ?? []).join(' ').toLowerCase();
        if (
          !workflow.name.toLowerCase().includes(q) &&
          !(workflow.notes ?? '').toLowerCase().includes(q) &&
          !tagText.includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [props.workflows, search, tagFilter]);

  const resetForm = () => {
    setEditing(null);
    setName('');
    setJsonText('');
    setTagsInput('');
    setPositiveNodeId('');
    setNegativeNodeId('');
    setSeedNodeId('');
    setLatentNodeId('');
    setNotes('');
  };

  const openCreate = () => {
    resetForm();
    setFormOpen(true);
  };

  const openEdit = (workflow: ComfyWorkflow) => {
    setEditing(workflow);
    setName(workflow.name);
    setJsonText(JSON.stringify(workflow.workflowJson, null, 2));
    setTagsInput(tagsToInput(workflow.tags));
    setPositiveNodeId(workflow.positiveNodeId ?? '');
    setNegativeNodeId(workflow.negativeNodeId ?? '');
    setSeedNodeId(workflow.seedNodeId ?? '');
    setLatentNodeId(workflow.latentNodeId ?? '');
    setNotes(workflow.notes ?? '');
    setFormOpen(true);
  };

  const applyDetectedNodeIds = (workflowJson: Record<string, unknown>) => {
    if (!isApiWorkflow(workflowJson)) return;
    const detected = detectWorkflowNodeIds(workflowJson);
    if (!positiveNodeId && detected.positiveNodeId) setPositiveNodeId(detected.positiveNodeId);
    if (!negativeNodeId && detected.negativeNodeId) setNegativeNodeId(detected.negativeNodeId);
    if (!seedNodeId && detected.seedNodeId) setSeedNodeId(detected.seedNodeId);
    if (!latentNodeId && detected.latentNodeId) setLatentNodeId(detected.latentNodeId);
  };

  const importFile = async (file: File) => {
    const text = await file.text();
    setJsonText(text);
    if (!name) setName(file.name.replace(/\.json$/i, ''));
    try {
      applyDetectedNodeIds(JSON.parse(text) as Record<string, unknown>);
    } catch {
      // ignore invalid json until save
    }
  };

  const save = async () => {
    const workflowJson = JSON.parse(jsonText) as Record<string, unknown>;
    const payload = {
      name,
      workflowJson,
      tags: parseTagsInput(tagsInput),
      positiveNodeId: positiveNodeId.trim() || null,
      negativeNodeId: negativeNodeId.trim() || null,
      seedNodeId: seedNodeId.trim() || null,
      latentNodeId: latentNodeId.trim() || null,
      notes: notes.trim() || undefined,
    };
    if (editing) await props.onUpdate(editing.id, payload);
    else await props.onCreate(payload);
    setFormOpen(false);
    resetForm();
  };

  return (
    <div>
      <PanelToolbar title="工作流" onAdd={openCreate} addLabel="新建工作流" />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="搜索名称、备注或 Tag..." />
        <select value={tagFilter} onChange={(e) => setTagFilter(e.target.value)} className={filterSelectClass}>
          <option value="">全部 Tag</option>
          {allTags.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filteredWorkflows.map((w) => (
          <GridCard
            key={w.id}
            title={w.name}
            subtitle={`正向 ${w.positiveNodeId ?? '-'} · 负向 ${w.negativeNodeId ?? '-'} · Seed ${w.seedNodeId ?? '-'} · 尺寸 ${w.latentNodeId ?? '-'}`}
            badges={
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">
                {new Date(w.updatedAt).toLocaleDateString()}
              </span>
            }
            onEdit={() => openEdit(w)}
            onCopy={() =>
              void props.onCopy(JSON.stringify(w.workflowJson, null, 2), '工作流 JSON 已复制')
            }
            onDownload={() => {
              const blob = new Blob([JSON.stringify(w.workflowJson, null, 2)], {
                type: 'application/json',
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${w.name}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            onDelete={() => void props.onDelete(w.id)}
          />
        ))}
        {!filteredWorkflows.length && (
          <p className="col-span-full text-sm text-slate-500">
            {props.workflows.length
              ? '没有匹配的工作流。'
              : '暂无工作流，点击「新建工作流」导入 ComfyUI JSON。'}
          </p>
        )}
      </div>

      {formOpen && (
        <Modal title={editing ? '编辑工作流' : '新建工作流'} onClose={() => setFormOpen(false)} wide>
          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-white/20 px-4 py-2 text-sm hover:bg-white/5">
            <Upload size={16} /> 导入 ComfyUI JSON 文件
            <input
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void importFile(f);
              }}
            />
          </label>
          <FormField label="工作流名称">
            <input value={name} onChange={(e) => setName(e.target.value)} className={modalInputClass} />
          </FormField>
          <FormField label="工作流 JSON">
            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              rows={12}
              placeholder="粘贴 ComfyUI API 格式工作流 JSON..."
              className={`${modalInputClass} font-mono text-xs`}
            />
          </FormField>
          <FormField label="Tags（逗号分隔）">
            <input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} className={modalInputClass} />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="正向 CLIP 节点 ID">
              <input value={positiveNodeId} onChange={(e) => setPositiveNodeId(e.target.value)} className={modalInputClass} />
            </FormField>
            <FormField label="负向 CLIP 节点 ID">
              <input value={negativeNodeId} onChange={(e) => setNegativeNodeId(e.target.value)} className={modalInputClass} />
            </FormField>
            <FormField label="Seed 节点 ID">
              <input value={seedNodeId} onChange={(e) => setSeedNodeId(e.target.value)} className={modalInputClass} />
            </FormField>
            <FormField label="尺寸节点 ID（EmptyLatentImage）">
              <input value={latentNodeId} onChange={(e) => setLatentNodeId(e.target.value)} className={modalInputClass} />
            </FormField>
          </div>
          <FormField label="备注">
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={modalInputClass} />
          </FormField>
          <button type="button" onClick={() => void save()} className="mt-2 w-full rounded-xl bg-violet-500 py-2.5">
            保存
          </button>
        </Modal>
      )}
    </div>
  );
}

export default function ComfyPromptPage() {
  return <ComfyPromptPageContent />;
}

export { ComfyPromptPageContent as PromptManagePage };
