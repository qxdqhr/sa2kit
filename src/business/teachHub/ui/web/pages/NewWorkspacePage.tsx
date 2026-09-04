'use client';

import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { Button, Title } from 'sa2kit/common/ui';
import {
  createWorkspaceViaApi,
  importWorkspaceZip,
} from '../services/teachHubClient';
import {
  thForm,
  thFormInput,
  thFormLabel,
  thFormTextarea,
} from '../styles/tw';
import { workspacePath } from '../utils/routes';

export function NewWorkspacePage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [why, setWhy] = useState('');
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('请填写工作区标题');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const workspace = await createWorkspaceViaApi({
        title: title.trim(),
        topic: topic.trim() || undefined,
        missionDraft: why.trim() ? { why: why.trim() } : undefined,
      });

      if (zipFile) {
        await importWorkspaceZip(workspace.id, zipFile);
      }

      router.push(workspacePath(workspace.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Title size="middle" color="app-teal" className="mb-6">
        新建学习工作区
      </Title>

      <form className={thForm} onSubmit={(e) => void handleSubmit(e)}>
        <label className={thFormLabel}>
          标题 *
          <input
            className={thFormInput}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例如：音乐乐理"
            required
          />
        </label>

        <label className={thFormLabel}>
          主题标签（可选）
          <input
            className={thFormInput}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="music-theory"
          />
        </label>

        <label className={thFormLabel}>
          Mission — 你为什么想学？（可选）
          <textarea
            className={thFormTextarea}
            value={why}
            onChange={(e) => setWhy(e.target.value)}
            rows={4}
            placeholder="例如：想能看懂谱子并弹吉他…"
          />
        </label>

        <label className={thFormLabel}>
          导入已有工作区 zip（可选）
          <input
            type="file"
            accept=".zip,application/zip"
            onChange={(e) => setZipFile(e.target.files?.[0] ?? null)}
          />
        </label>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <Button type="primary" htmlType="submit" disabled={loading}>
          {loading ? '创建中…' : '创建工作区'}
        </Button>
      </form>
    </div>
  );
}
