'use client';

import React, { useEffect, useState } from 'react';
import { MissionEditor } from '../components/MissionEditor';
import {
  fetchWorkspaceFileText,
  putWorkspaceFileText,
} from '../services/teachHubClient';
import { thTabPage, thTabPageDesc } from '../styles/tw';
import { parseMissionMarkdown } from '../utils/missionParser';
import type { MissionFormData } from '../types';
import { DEFAULT_MISSION_TEMPLATE } from '../utils/workspaceTemplates';

type MissionPageProps = {
  workspaceId: string;
};

export function MissionPage({ workspaceId }: MissionPageProps) {
  const [initial, setInitial] = useState<MissionFormData | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    void fetchWorkspaceFileText(workspaceId, 'MISSION.md')
      .then((md) => {
        if (mounted) setInitial(parseMissionMarkdown(md));
      })
      .catch((err) => {
        if (mounted) {
          setError(err instanceof Error ? err.message : '加载失败');
          setInitial(DEFAULT_MISSION_TEMPLATE);
        }
      });
    return () => {
      mounted = false;
    };
  }, [workspaceId]);

  const handleSave = async (markdown: string) => {
    setSaving(true);
    setError('');
    try {
      await putWorkspaceFileText(workspaceId, 'MISSION.md', markdown);
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={thTabPage}>
      <p className={thTabPageDesc}>定义学习动机、成功标准与约束，Mimo 生成课时会参考此内容。</p>
      {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}
      {initial ? (
        <MissionEditor initial={initial} saving={saving} onSave={handleSave} />
      ) : (
        <p className="text-sm text-[#7a6f5c]">加载中…</p>
      )}
    </div>
  );
}
