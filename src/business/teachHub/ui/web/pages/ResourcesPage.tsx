'use client';

import React, { useEffect, useState } from 'react';
import { ResourcesEditor } from '../components/ResourcesEditor';
import { fetchWorkspaceFileText, putWorkspaceFileText } from '../services/teachHubClient';
import { thTabPage, thTabPageDesc } from '../styles/tw';
import type { ResourcesFormData } from '../types';
import { parseResourcesMarkdown } from '../utils/resourcesParser';
import { DEFAULT_RESOURCES_MD } from '../utils/workspaceTemplates';

type ResourcesPageProps = {
  workspaceId: string;
};

const EMPTY_RESOURCES: ResourcesFormData = {
  items: [],
};

export function ResourcesPage({ workspaceId }: ResourcesPageProps) {
  const [initial, setInitial] = useState<ResourcesFormData | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    void fetchWorkspaceFileText(workspaceId, 'RESOURCES.md')
      .then((md) => {
        if (mounted) setInitial(parseResourcesMarkdown(md));
      })
      .catch(() => {
        if (mounted) setInitial(parseResourcesMarkdown(DEFAULT_RESOURCES_MD));
      });
    return () => {
      mounted = false;
    };
  }, [workspaceId]);

  const handleSave = async (markdown: string) => {
    setSaving(true);
    setError('');
    try {
      await putWorkspaceFileText(workspaceId, 'RESOURCES.md', markdown);
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
        管理推荐的学习资源与社区。Agent 写入的内容会逐项展示，你也可以随时添加或编辑。
      </p>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {initial ? (
        <ResourcesEditor
          initial={initial.items.length ? initial : EMPTY_RESOURCES}
          saving={saving}
          onSave={handleSave}
        />
      ) : (
        <p className="text-sm text-[#7a6f5c]">加载中…</p>
      )}
    </div>
  );
}
