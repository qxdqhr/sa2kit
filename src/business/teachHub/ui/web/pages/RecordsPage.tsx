'use client';

import React, { useEffect, useState } from 'react';
import { LearningRecordsEditor } from '../components/LearningRecordsEditor';
import {
  fetchWorkspaceFileText,
  fetchWorkspaceFiles,
  putWorkspaceFileText,
} from '../services/teachHubClient';
import { thTabPage, thTabPageDesc } from '../styles/tw';
import type { LearningRecord } from '../types';
import { parseLearningRecordMarkdown } from '../utils/learningRecordParser';

type RecordsPageProps = {
  workspaceId: string;
};

export function RecordsPage({ workspaceId }: RecordsPageProps) {
  const [records, setRecords] = useState<LearningRecord[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const files = await fetchWorkspaceFiles(workspaceId);
        const paths = files
          .filter(
            (f) =>
              f.relativePath.startsWith('learning-records/') && f.relativePath.endsWith('.md'),
          )
          .map((f) => f.relativePath)
          .sort();
        const parsed = await Promise.all(
          paths.map(async (path) => {
            const content = await fetchWorkspaceFileText(workspaceId, path);
            return parseLearningRecordMarkdown(content, path);
          }),
        );
        if (mounted) setRecords(parsed);
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : '加载失败');
          setRecords([]);
        }
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, [workspaceId]);

  const handleSave = async (
    items: Array<{ relativePath: string; markdown: string }>,
  ) => {
    setSaving(true);
    setError('');
    try {
      await Promise.all(
        items.map((item) =>
          putWorkspaceFileText(workspaceId, item.relativePath, item.markdown),
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
      throw err;
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={thTabPage}>
      <p className={thTabPageDesc}>
        Mimo 在每课结束后写入学习记录，帮助你追踪掌握情况。可按章节查看与编辑，无需直接修改 Markdown 原文。
      </p>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {records === null ? (
        <p className="text-sm text-[#7a6f5c]">加载中…</p>
      ) : records.length === 0 ? (
        <p className="text-sm text-[#7a6f5c]">
          尚无学习记录。完成课时或生成新课后会出现在这里。
        </p>
      ) : (
        <LearningRecordsEditor initial={records} saving={saving} onSave={handleSave} />
      )}
    </div>
  );
}
