'use client';

import React, { useMemo, useState } from 'react';
import { Button } from 'sa2kit/common/ui';
import {
  thForm,
  thFormInput,
  thFormLabel,
  thFormTextarea,
  thPanel,
  thResourcesListScroll,
  thResourcesNode,
  thResourcesNodeBadge,
  thResourcesNodeCollapsed,
  thResourcesNodeExpanded,
  thResourcesNodeMeta,
  thResourcesNodeTitle,
} from '../styles/tw';
import type { LearningRecord } from '../types';
import {
  composeLearningRecordMarkdown,
  recordSummary,
} from '../utils/learningRecordParser';
import { cn } from '../utils/cn';

type LearningRecordsEditorProps = {
  initial: LearningRecord[];
  saving?: boolean;
  onSave: (records: Array<{ relativePath: string; markdown: string }>) => Promise<void>;
};

function formatOrder(order: number): string {
  return order > 0 ? String(order).padStart(4, '0') : '—';
}

function LearningRecordNode({
  record,
  editing,
  onStartEdit,
  onCancelEdit,
  onChange,
}: {
  record: LearningRecord;
  editing: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onChange: (record: LearningRecord) => void;
}) {
  const updateSection = (index: number, content: string) => {
    onChange({
      ...record,
      sections: record.sections.map((section, i) =>
        i === index ? { ...section, content } : section,
      ),
    });
  };

  const updateTitle = (title: string) => {
    onChange({ ...record, title });
  };

  if (editing) {
    return (
      <div className={cn(thResourcesNode, thResourcesNodeExpanded)}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className={thResourcesNodeBadge}>#{formatOrder(record.order)}</span>
            <span className="text-xs text-[#7a6f5c]">{record.relativePath}</span>
          </div>
          <Button type="text" size="small" onClick={onCancelEdit}>
            收起
          </Button>
        </div>

        <label className={thFormLabel}>
          记录标题
          <input
            className={thFormInput}
            value={record.title}
            onChange={(e) => updateTitle(e.target.value)}
          />
        </label>

        {record.sections.length > 0 ? (
          record.sections.map((section, index) => (
            <label key={`${record.relativePath}-${section.heading}-${index}`} className={thFormLabel}>
              {section.heading}
              <textarea
                className={thFormTextarea}
                value={section.content}
                onChange={(e) => updateSection(index, e.target.value)}
                rows={Math.min(8, Math.max(3, section.content.split('\n').length + 1))}
              />
            </label>
          ))
        ) : (
          <label className={thFormLabel}>
            内容
            <textarea
              className={thFormTextarea}
              value=""
              onChange={(e) =>
                onChange({
                  ...record,
                  sections: [{ heading: '内容', content: e.target.value }],
                })
              }
              rows={4}
              placeholder="编辑学习记录内容…"
            />
          </label>
        )}
      </div>
    );
  }

  return (
    <div className={cn(thResourcesNode, thResourcesNodeCollapsed)}>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className={thResourcesNodeBadge}>#{formatOrder(record.order)}</span>
          <span className={thResourcesNodeTitle}>{record.title}</span>
        </div>
        <p className={thResourcesNodeMeta}>{recordSummary(record)}</p>
        {record.sections.length > 1 ? (
          <p className="text-xs text-[#9a8f7c]">
            {record.sections.length} 个章节
          </p>
        ) : null}
      </div>
      <Button type="text" size="small" onClick={onStartEdit}>
        编辑
      </Button>
    </div>
  );
}

export function LearningRecordsEditor({
  initial,
  saving,
  onSave,
}: LearningRecordsEditorProps) {
  const [records, setRecords] = useState<LearningRecord[]>(initial);
  const [editingPath, setEditingPath] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const sortedRecords = useMemo(
    () => [...records].sort((a, b) => a.order - b.order || a.relativePath.localeCompare(b.relativePath)),
    [records],
  );

  const updateRecord = (relativePath: string, next: LearningRecord) => {
    setRecords((prev) =>
      prev.map((record) => (record.relativePath === relativePath ? next : record)),
    );
  };

  const handleSave = async () => {
    setMessage('');
    try {
      const payload = sortedRecords.map((record) => ({
        relativePath: record.relativePath,
        markdown: composeLearningRecordMarkdown(record),
      }));
      await onSave(payload);
      setEditingPath(null);
      setMessage('已保存');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '保存失败');
    }
  };

  return (
    <div className={`${thForm} max-w-3xl gap-4`}>
      <section className={cn(thPanel, 'flex min-h-0 flex-col gap-3 p-0')}>
        <div className="px-[18px] pt-4">
          <p className="m-0 text-sm text-[#7a6f5c]">
            共 {sortedRecords.length} 条学习记录，按课时顺序排列。点击「编辑」可逐项修改各章节内容。
          </p>
        </div>

        <div className={thResourcesListScroll}>
          {sortedRecords.map((record) => (
            <LearningRecordNode
              key={record.relativePath}
              record={record}
              editing={editingPath === record.relativePath}
              onStartEdit={() => setEditingPath(record.relativePath)}
              onCancelEdit={() => setEditingPath(null)}
              onChange={(next) => updateRecord(record.relativePath, next)}
            />
          ))}
        </div>
      </section>

      <div className="flex items-center gap-3">
        <Button type="primary" onClick={() => void handleSave()} disabled={saving}>
          {saving ? '保存中…' : '保存全部记录'}
        </Button>
        {message ? <span className="text-sm text-[#7a6f5c]">{message}</span> : null}
      </div>
    </div>
  );
}
