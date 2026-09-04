'use client';

import React, { useState } from 'react';
import { Button, Modal } from 'sa2kit/common/ui';
import {
  thForm,
  thFormInput,
  thFormLabel,
  thFormModal,
  thFormTextarea,
  thPanel,
  thPanelTitle,
  thResourcesListScroll,
  thResourcesNode,
  thResourcesNodeBadge,
  thResourcesNodeCollapsed,
  thResourcesNodeExpanded,
  thResourcesNodeTitle,
  thResourcesToolbar,
  thTabPageDesc,
} from '../styles/tw';
import type { MissionFormData } from '../types';
import { composeMissionMarkdown } from '../utils/workspaceTemplates';
import { cn } from '../utils/cn';

type MissionEditorProps = {
  initial: MissionFormData;
  saving?: boolean;
  onSave: (markdown: string) => Promise<void>;
};

type MissionListKey = 'successLooksLike' | 'constraints' | 'outOfScope';

type MissionListConfig = {
  key: MissionListKey;
  title: string;
  description: string;
  placeholder: string;
  addLabel: string;
};

const MISSION_LIST_CONFIGS: MissionListConfig[] = [
  {
    key: 'successLooksLike',
    title: '成功标准',
    description: 'Success looks like — 学完后你希望自己能做到什么？',
    placeholder: '例如：能独立分析一段旋律的和声进行',
    addLabel: '添加成功标准',
  },
  {
    key: 'constraints',
    title: '学习约束',
    description: 'Constraints — 学习过程中需要遵守的限制或偏好',
    placeholder: '例如：每课不超过 10 分钟',
    addLabel: '添加约束',
  },
  {
    key: 'outOfScope',
    title: '范围外',
    description: 'Out of scope — 明确本次学习不包含的内容',
    placeholder: '例如：不涉及高级爵士和声',
    addLabel: '添加范围外条目',
  },
];

type ListEntry = { id: string; value: string };

function createListEntry(value = ''): ListEntry {
  return { id: crypto.randomUUID(), value };
}

function entriesFromList(items: string[]): ListEntry[] {
  const valid = items.map((item) => item.trim()).filter(Boolean);
  return valid.length ? valid.map((value) => createListEntry(value)) : [];
}

function listFromEntries(entries: ListEntry[]): string[] {
  return entries.map((entry) => entry.value.trim()).filter(Boolean);
}

function AddListItemModal({
  open,
  title,
  placeholder,
  onClose,
  onAdd,
}: {
  open: boolean;
  title: string;
  placeholder: string;
  onClose: () => void;
  onAdd: (value: string) => void;
}) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  const handleClose = () => {
    setValue('');
    setError('');
    onClose();
  };

  const handleAdd = () => {
    if (!value.trim()) {
      setError('请填写内容');
      return;
    }
    onAdd(value.trim());
    handleClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={title}
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
          内容
          <input
            className={thFormInput}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
          />
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </div>
    </Modal>
  );
}

function MissionListSection({
  config,
  entries,
  onChange,
}: {
  config: MissionListConfig;
  entries: ListEntry[];
  onChange: (entries: ListEntry[]) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const updateEntry = (id: string, value: string) => {
    onChange(entries.map((entry) => (entry.id === id ? { ...entry, value } : entry)));
  };

  const removeEntry = (id: string) => {
    onChange(entries.filter((entry) => entry.id !== id));
    if (editingId === id) setEditingId(null);
  };

  return (
    <section className={cn(thPanel, 'flex flex-col gap-3')}>
      <div>
        <h3 className={thPanelTitle}>{config.title}</h3>
        <p className={thTabPageDesc}>{config.description}</p>
      </div>

      {entries.length === 0 ? (
        <div className="flex justify-center py-6">
          <Button type="default" size="small" onClick={() => setModalOpen(true)}>
            + {config.addLabel}
          </Button>
        </div>
      ) : (
        <>
          <div className={thResourcesToolbar}>
            <span className="text-sm text-[#7a6f5c]">共 {entries.length} 条</span>
            <Button type="default" size="small" onClick={() => setModalOpen(true)}>
              + {config.addLabel}
            </Button>
          </div>
          <div className={cn(thResourcesListScroll, 'max-h-none px-0')}>
            {entries.map((entry, index) =>
              editingId === entry.id ? (
                <div key={entry.id} className={cn(thResourcesNode, thResourcesNodeExpanded)}>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-medium text-[#7a6f5c]">#{index + 1}</span>
                    <div className="flex gap-1">
                      <Button type="text" size="small" onClick={() => setEditingId(null)}>
                        收起
                      </Button>
                      <Button type="text" size="small" onClick={() => removeEntry(entry.id)}>
                        删除
                      </Button>
                    </div>
                  </div>
                  <label className={thFormLabel}>
                    内容
                    <input
                      className={thFormInput}
                      value={entry.value}
                      onChange={(e) => updateEntry(entry.id, e.target.value)}
                      placeholder={config.placeholder}
                    />
                  </label>
                </div>
              ) : (
                <div
                  key={entry.id}
                  className={cn(thResourcesNode, thResourcesNodeCollapsed)}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <span className={thResourcesNodeBadge}>#{index + 1}</span>
                    <span className={thResourcesNodeTitle}>{entry.value}</span>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button type="text" size="small" onClick={() => setEditingId(entry.id)}>
                      编辑
                    </Button>
                    <Button type="text" size="small" onClick={() => removeEntry(entry.id)}>
                      删除
                    </Button>
                  </div>
                </div>
              ),
            )}
          </div>
        </>
      )}

      <AddListItemModal
        open={modalOpen}
        title={config.addLabel}
        placeholder={config.placeholder}
        onClose={() => setModalOpen(false)}
        onAdd={(value) => onChange([...entries, createListEntry(value)])}
      />
    </section>
  );
}

export function MissionEditor({ initial, saving, onSave }: MissionEditorProps) {
  const [why, setWhy] = useState(initial.why);
  const [lists, setLists] = useState<Record<MissionListKey, ListEntry[]>>(() => ({
    successLooksLike: entriesFromList(initial.successLooksLike),
    constraints: entriesFromList(initial.constraints),
    outOfScope: entriesFromList(initial.outOfScope),
  }));
  const [message, setMessage] = useState('');

  const handleSave = async () => {
    setMessage('');
    try {
      const form: MissionFormData = {
        why: why.trim(),
        successLooksLike: listFromEntries(lists.successLooksLike),
        constraints: listFromEntries(lists.constraints),
        outOfScope: listFromEntries(lists.outOfScope),
      };
      const markdown = composeMissionMarkdown(form);
      await onSave(markdown);
      setMessage('已保存');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '保存失败');
    }
  };

  return (
    <div className={`${thForm} max-w-3xl gap-4`}>
      <section className={cn(thPanel, 'flex flex-col gap-3')}>
        <div>
          <h3 className={thPanelTitle}>学习动机</h3>
          <p className={thTabPageDesc}>Why — 你为什么想学这个主题？Mimo 生成课时会优先参考此内容。</p>
        </div>
        <label className={thFormLabel}>
          动机描述
          <textarea
            className={thFormTextarea}
            value={why}
            onChange={(e) => setWhy(e.target.value)}
            rows={5}
            placeholder="例如：我想在三个月内掌握基础乐理，能读懂简单谱面并即兴伴奏。"
          />
        </label>
      </section>

      {MISSION_LIST_CONFIGS.map((config) => (
        <MissionListSection
          key={config.key}
          config={config}
          entries={lists[config.key]}
          onChange={(entries) =>
            setLists((prev) => ({
              ...prev,
              [config.key]: entries,
            }))
          }
        />
      ))}

      <div className="flex items-center gap-3">
        <Button type="primary" onClick={() => void handleSave()} disabled={saving}>
          {saving ? '保存中…' : '保存 Mission'}
        </Button>
        {message ? <span className="text-sm text-[#7a6f5c]">{message}</span> : null}
      </div>
    </div>
  );
}
