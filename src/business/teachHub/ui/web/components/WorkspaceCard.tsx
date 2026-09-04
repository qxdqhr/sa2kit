'use client';

import Link from 'next/link';
import React, { useState } from 'react';
import { Button, Card, Modal } from 'sa2kit/common/ui';
import { archiveWorkspaceViaApi } from '../services/teachHubClient';
import {
  thWsListItemActions,
  thWsListItemCard,
  thWsListItemContent,
  thWsListItemHead,
  thWsListItemMeta,
  thWsListItemProgress,
  thWsListItemSummary,
  thWsListItemTitle,
} from '../styles/tw';
import type { TeachWorkspaceSummary } from '../types';
import { lessonPath, workspacePath } from '../utils/routes';
import { ProgressBar } from './ProgressBar';

type WorkspaceCardProps = {
  workspace: TeachWorkspaceSummary;
  onDeleted?: () => void;
};

export function WorkspaceCard({ workspace, onDeleted }: WorkspaceCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const completed = workspace.completedLessonCount ?? 0;
  const total = workspace.lessonCount || 0;
  const continueHref = workspace.lastLessonSlug
    ? lessonPath(workspace.id, workspace.lastLessonSlug)
    : workspacePath(workspace.id);

  const handleDelete = async () => {
    setDeleting(true);
    setError('');
    try {
      await archiveWorkspaceViaApi(workspace.id);
      setConfirmOpen(false);
      onDeleted?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Card color="default" className={thWsListItemCard}>
        <div className={thWsListItemContent}>
          <div className={thWsListItemHead}>
            <div className="min-w-0 flex-1">
              <Link href={workspacePath(workspace.id)} className={thWsListItemTitle}>
                {workspace.title}
              </Link>
              <div className={thWsListItemMeta}>
                {workspace.topic ? <span>{workspace.topic}</span> : null}
                {workspace.topic && total > 0 ? <span>·</span> : null}
                {total > 0 ? (
                  <span>
                    {completed}/{total} 课已完成
                  </span>
                ) : (
                  <span>尚无课时</span>
                )}
              </div>
              {workspace.missionSummary ? (
                <p className={thWsListItemSummary}>{workspace.missionSummary}</p>
              ) : null}
            </div>
            {total > 0 ? (
              <div className={thWsListItemProgress}>
                <ProgressBar completed={completed} total={total} />
              </div>
            ) : null}
          </div>

          <div className={thWsListItemActions}>
            <Link href={workspacePath(workspace.id)}>
              <Button type="primary" size="small">
                进入
              </Button>
            </Link>
            {total > 0 ? (
              <Link href={continueHref}>
                <Button type="default" size="small">
                  继续学习
                </Button>
              </Link>
            ) : null}
            <Button type="text" size="small" onClick={() => setConfirmOpen(true)}>
              删除
            </Button>
          </div>
        </div>
      </Card>

      <Modal
        open={confirmOpen}
        onClose={() => !deleting && setConfirmOpen(false)}
        title="删除工作区"
        typewriter={false}
        footer={
          <div className="flex justify-end gap-2">
            <Button type="default" size="small" disabled={deleting} onClick={() => setConfirmOpen(false)}>
              取消
            </Button>
            <Button
              type="danger-primary"
              size="small"
              loading={deleting}
              onClick={() => void handleDelete()}
            >
              确认删除
            </Button>
          </div>
        }
      >
        <p className="text-sm leading-relaxed text-[#4a4035]">
          确定删除「{workspace.title}」？工作区将从列表中移除，OSS 中的文件仍保留。
        </p>
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      </Modal>
    </>
  );
}
