'use client';

import React, { useMemo, useState } from 'react';
import { Button, Modal } from 'sa2kit/common/ui';
import {
  thForm,
  thFormInput,
  thFormLabel,
  thFormModal,
  thPanel,
  thResourcesFilter,
  thResourcesFilterActive,
  thResourcesListScroll,
  thResourcesNode,
  thResourcesNodeBadge,
  thResourcesNodeCollapsed,
  thResourcesNodeExpanded,
  thResourcesNodeMeta,
  thResourcesNodeTitle,
  thResourcesToolbar,
} from '../styles/tw';
import type { ResourceCategory, ResourceItem, ResourcesFormData } from '../types';
import {
  composeResourcesMarkdown,
  RESOURCE_CATEGORY_DESCRIPTIONS,
  RESOURCE_CATEGORY_LABELS,
} from '../utils/resourcesParser';
import { cn } from '../utils/cn';

type ResourcesEditorProps = {
  initial: ResourcesFormData;
  saving?: boolean;
  onSave: (markdown: string) => Promise<void>;
};

type ResourceListEntry = ResourceItem & { id: string };

type ResourceFilter = 'all' | ResourceCategory;

const CATEGORY_OPTIONS: ResourceCategory[] = ['knowledge', 'wisdom'];

function createEntry(item: ResourceItem): ResourceListEntry {
  return { ...item, id: crypto.randomUUID() };
}

function entriesFromForm(data: ResourcesFormData): ResourceListEntry[] {
  return data.items.map((item) => createEntry(item));
}

function normalizeItems(items: ResourceItem[]): ResourceItem[] {
  return items
    .map((item) => ({
      title: item.title.trim(),
      url: item.url?.trim() || undefined,
      note: item.note?.trim() || undefined,
      category: item.category,
    }))
    .filter((item) => item.title);
}

function ResourceNode({
  entry,
  index,
  editing,
  onStartEdit,
  onCancelEdit,
  onChange,
  onRemove,
}: {
  entry: ResourceListEntry;
  index: number;
  editing: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onChange: (item: ResourceItem) => void;
  onRemove: () => void;
}) {
  if (editing) {
    return (
      <div className={cn(thResourcesNode, thResourcesNodeExpanded)}>
        <div className="flex items-start justify-between gap-2">
          <span className="text-xs font-medium text-[#7a6f5c]">#{index + 1}</span>
          <div className="flex gap-1">
            <Button type="text" size="small" onClick={onCancelEdit}>
              收起
            </Button>
            <Button type="text" size="small" onClick={onRemove}>
              删除
            </Button>
          </div>
        </div>
        <label className={thFormLabel}>
          分类
          <select
            className={thFormInput}
            value={entry.category}
            onChange={(e) =>
              onChange({ ...entry, category: e.target.value as ResourceCategory })
            }
          >
            {CATEGORY_OPTIONS.map((category) => (
              <option key={category} value={category}>
                {RESOURCE_CATEGORY_LABELS[category]}
              </option>
            ))}
          </select>
        </label>
        <label className={thFormLabel}>
          标题
          <input
            className={thFormInput}
            value={entry.title}
            onChange={(e) => onChange({ ...entry, title: e.target.value })}
            placeholder="资源名称，如 MDN Web Docs"
          />
        </label>
        <label className={thFormLabel}>
          链接（可选）
          <input
            className={thFormInput}
            value={entry.url ?? ''}
            onChange={(e) => onChange({ ...entry, url: e.target.value })}
            placeholder="https://..."
          />
        </label>
        <label className={thFormLabel}>
          备注（可选）
          <input
            className={thFormInput}
            value={entry.note ?? ''}
            onChange={(e) => onChange({ ...entry, note: e.target.value })}
            placeholder="简短说明，帮助回忆为何推荐"
          />
        </label>
      </div>
    );
  }

  return (
    <div className={cn(thResourcesNode, thResourcesNodeCollapsed)}>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className={thResourcesNodeBadge}>{RESOURCE_CATEGORY_LABELS[entry.category]}</span>
          <span className={thResourcesNodeTitle}>{entry.title}</span>
        </div>
        {entry.url || entry.note ? (
          <p className={thResourcesNodeMeta}>
            {entry.url ? entry.url : null}
            {entry.url && entry.note ? ' · ' : null}
            {entry.note ? entry.note : null}
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 gap-1">
        <Button type="text" size="small" onClick={onStartEdit}>
          编辑
        </Button>
        <Button type="text" size="small" onClick={onRemove}>
          删除
        </Button>
      </div>
    </div>
  );
}

function AddResourceModal({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (item: ResourceItem) => void;
}) {
  const [category, setCategory] = useState<ResourceCategory>('knowledge');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const reset = () => {
    setCategory('knowledge');
    setTitle('');
    setUrl('');
    setNote('');
    setError('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleAdd = () => {
    if (!title.trim()) {
      setError('请填写标题');
      return;
    }
    onAdd({
      title: title.trim(),
      url: url.trim() || undefined,
      note: note.trim() || undefined,
      category,
    });
    handleClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="添加资源"
      typewriter={false}
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="default" size="small" onClick={handleClose}>
            取消
          </Button>
          <Button type="primary" size="small" onClick={handleAdd}>
            添加
          </Button>
        </div>
      }
    >
      <div className={cn(thForm, thFormModal)}>
        <label className={thFormLabel}>
          分类
          <select
            className={thFormInput}
            value={category}
            onChange={(e) => setCategory(e.target.value as ResourceCategory)}
          >
            {CATEGORY_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {RESOURCE_CATEGORY_LABELS[value]}
              </option>
            ))}
          </select>
        </label>
        <p className="text-sm text-[#7a6f5c]">{RESOURCE_CATEGORY_DESCRIPTIONS[category]}</p>
        <label className={thFormLabel}>
          标题 *
          <input
            className={thFormInput}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="资源名称，如 MDN Web Docs"
          />
        </label>
        <label className={thFormLabel}>
          链接（可选）
          <input
            className={thFormInput}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
          />
        </label>
        <label className={thFormLabel}>
          备注（可选）
          <input
            className={thFormInput}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="简短说明，帮助回忆为何推荐"
          />
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </div>
    </Modal>
  );
}

export function ResourcesEditor({ initial, saving, onSave }: ResourcesEditorProps) {
  const [entries, setEntries] = useState<ResourceListEntry[]>(() => entriesFromForm(initial));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<ResourceFilter>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [message, setMessage] = useState('');

  const categoriesWithData = useMemo(() => {
    const set = new Set(entries.map((entry) => entry.category));
    return CATEGORY_OPTIONS.filter((category) => set.has(category));
  }, [entries]);

  const filteredEntries = useMemo(() => {
    if (activeFilter === 'all') return entries;
    return entries.filter((entry) => entry.category === activeFilter);
  }, [entries, activeFilter]);

  const updateEntry = (id: string, item: ResourceItem) => {
    setEntries((prev) => prev.map((entry) => (entry.id === id ? { ...item, id } : entry)));
  };

  const removeEntry = (id: string) => {
    setEntries((prev) => prev.filter((entry) => entry.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const handleAdd = (item: ResourceItem) => {
    setEntries((prev) => [...prev, createEntry(item)]);
  };

  const handleSave = async () => {
    setMessage('');
    try {
      const normalized = normalizeItems(entries);
      const markdown = composeResourcesMarkdown({ items: normalized });
      await onSave(markdown);
      setEntries(normalized.map((item) => createEntry(item)));
      setEditingId(null);
      setMessage('已保存');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '保存失败');
    }
  };

  const hasEntries = entries.length > 0;

  return (
    <div className={`${thForm} max-w-3xl gap-4`}>
      {!hasEntries ? (
        <div className="flex justify-center py-10">
          <Button type="primary" onClick={() => setModalOpen(true)}>
            + 添加资源
          </Button>
        </div>
      ) : (
        <section className={cn(thPanel, 'flex min-h-0 flex-col gap-3 p-0')}>
          <div className="flex flex-col gap-3 px-[18px] pt-4">
            <div className={thResourcesToolbar}>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  className={cn(
                    thResourcesFilter,
                    activeFilter === 'all' && thResourcesFilterActive,
                  )}
                  onClick={() => setActiveFilter('all')}
                >
                  全部 ({entries.length})
                </button>
                {categoriesWithData.map((category) => {
                  const count = entries.filter((entry) => entry.category === category).length;
                  return (
                    <button
                      key={category}
                      type="button"
                      className={cn(
                        thResourcesFilter,
                        activeFilter === category && thResourcesFilterActive,
                      )}
                      onClick={() => setActiveFilter(category)}
                    >
                      {RESOURCE_CATEGORY_LABELS[category]} ({count})
                    </button>
                  );
                })}
              </div>
              <Button type="default" size="small" onClick={() => setModalOpen(true)}>
                + 添加资源
              </Button>
            </div>
          </div>

          <div className={thResourcesListScroll}>
            {filteredEntries.length > 0 ? (
              filteredEntries.map((entry, index) => (
                <ResourceNode
                  key={entry.id}
                  entry={entry}
                  index={index}
                  editing={editingId === entry.id}
                  onStartEdit={() => setEditingId(entry.id)}
                  onCancelEdit={() => setEditingId(null)}
                  onChange={(item) => updateEntry(entry.id, item)}
                  onRemove={() => removeEntry(entry.id)}
                />
              ))
            ) : (
              <p className="px-4 py-8 text-center text-sm text-[#7a6f5c]">该分类暂无资源</p>
            )}
          </div>
        </section>
      )}

      <div className="flex items-center gap-3">
        {hasEntries ? (
          <Button type="primary" onClick={() => void handleSave()} disabled={saving}>
            {saving ? '保存中…' : '保存资源'}
          </Button>
        ) : null}
        {message ? <span className="text-sm text-[#7a6f5c]">{message}</span> : null}
      </div>

      <AddResourceModal open={modalOpen} onClose={() => setModalOpen(false)} onAdd={handleAdd} />
    </div>
  );
}
