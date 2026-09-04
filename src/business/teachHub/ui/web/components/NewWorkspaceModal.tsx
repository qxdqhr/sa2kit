'use client';

import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { Button, Modal } from 'sa2kit/common/ui';
import { cn } from '../utils/cn';
import {
  createWorkspaceViaApi,
  importWorkspaceZip,
} from '../services/teachHubClient';
import {
  thForm,
  thFormInput,
  thFormLabel,
  thFormModal,
  thFormTextarea,
} from '../styles/tw';
import { workspacePath } from '../utils/routes';

type NewWorkspaceModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
};

export function NewWorkspaceModal({ open, onClose, onCreated }: NewWorkspaceModalProps) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [why, setWhy] = useState('');
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const resetForm = () => {
    setTitle('');
    setTopic('');
    setWhy('');
    setZipFile(null);
    setError('');
  };

  const handleClose = () => {
    if (loading) return;
    resetForm();
    onClose();
  };

  const handleCreate = async () => {
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

      onCreated?.();
      handleClose();
      router.push(workspacePath(workspace.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleCreate();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="新建学习工作区"
      typewriter={false}
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="default" size="small" disabled={loading} onClick={handleClose}>
            取消
          </Button>
          <Button
            type="primary"
            size="small"
            loading={loading}
            onClick={() => void handleCreate()}
          >
            创建工作区
          </Button>
        </div>
      }
    >
      <form
        id="th-new-workspace-form"
        className={cn(thForm, thFormModal)}
        onSubmit={(e) => void handleSubmit(e)}
      >
        <label className={thFormLabel}>
          标题 *
          <input
            className={thFormInput}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例如：音乐乐理"
            required
            disabled={loading}
          />
        </label>

        <label className={thFormLabel}>
          主题标签（可选）
          <input
            className={thFormInput}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="music-theory"
            disabled={loading}
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
            disabled={loading}
          />
        </label>

        <label className={thFormLabel}>
          导入已有工作区 zip（可选）
          <input
            type="file"
            accept=".zip,application/zip"
            disabled={loading}
            onChange={(e) => setZipFile(e.target.files?.[0] ?? null)}
          />
        </label>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </form>
    </Modal>
  );
}
