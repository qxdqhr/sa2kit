'use client';

import Link from 'next/link';
import React, { useEffect, useMemo, useState } from 'react';
import { Button } from 'sa2kit/common/ui';
import { LessonViewer } from '../components/LessonViewer';
import {
  fetchWorkspaceDetail,
  getWorkspaceFileUrl,
  updateLessonProgress,
} from '../services/teachHubClient';
import { thLessonShell, thLessonToolbar } from '../styles/tw';
import type { LessonIndex, TeachLessonProgress } from '../types';
import {
  lessonFilenameFromSlug,
  lessonPath,
  lessonTitleFromSlug,
  workspacePath,
} from '../utils/routes';

type LessonPageProps = {
  workspaceId: string;
  slug: string;
};

export function LessonPage({ workspaceId, slug }: LessonPageProps) {
  const [lessons, setLessons] = useState<LessonIndex[]>([]);
  const [progress, setProgress] = useState<TeachLessonProgress[]>([]);
  const [marking, setMarking] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let mounted = true;
    void fetchWorkspaceDetail(workspaceId).then((detail) => {
      if (!mounted) return;
      setLessons(detail.lessons);
      setProgress(detail.progress);
    });
    return () => {
      mounted = false;
    };
  }, [workspaceId]);

  const currentIndex = useMemo(
    () => lessons.findIndex((l) => l.slug === slug),
    [lessons, slug],
  );
  const current = lessons[currentIndex];
  const prev = currentIndex > 0 ? lessons[currentIndex - 1] : null;
  const next = currentIndex >= 0 && currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;
  const currentProgress = progress.find((p) => p.lessonSlug === slug);
  const isCompleted = currentProgress?.status === 'completed';

  const iframeSrc = getWorkspaceFileUrl(
    workspaceId,
    `lessons/${lessonFilenameFromSlug(slug)}`,
  );

  const handleMarkComplete = async () => {
    setMarking(true);
    setMessage('');
    try {
      const updated = await updateLessonProgress(workspaceId, {
        lessonSlug: slug,
        status: 'completed',
      });
      setProgress((items) =>
        items.map((p) => (p.lessonSlug === slug ? updated : p)),
      );
      setMessage('已标记完成');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '更新失败');
    } finally {
      setMarking(false);
    }
  };

  const title = lessonTitleFromSlug(slug);

  return (
    <div className={thLessonShell}>
      <div className={thLessonToolbar}>
        <Link href={workspacePath(workspaceId)}>
          <Button type="text" size="small">
            ← 工作区
          </Button>
        </Link>
        <span className="text-sm font-semibold text-[#3d3428]">
          {current ? String(current.order).padStart(4, '0') : ''} · {title}
        </span>
        <div className="ml-auto flex flex-wrap gap-2">
          {prev ? (
            <Link href={lessonPath(workspaceId, prev.slug)}>
              <Button type="default" size="small">
                上一课
              </Button>
            </Link>
          ) : null}
          {next ? (
            <Link href={lessonPath(workspaceId, next.slug)}>
              <Button type="default" size="small">
                下一课
              </Button>
            </Link>
          ) : null}
          <Button
            type="primary"
            size="small"
            disabled={marking || isCompleted}
            onClick={() => void handleMarkComplete()}
          >
            {isCompleted ? '已完成' : marking ? '保存中…' : '标记本章完成'}
          </Button>
        </div>
        {message ? <span className="w-full text-xs text-[#7a6f5c]">{message}</span> : null}
      </div>
      <LessonViewer src={iframeSrc} title={title} />
    </div>
  );
}
