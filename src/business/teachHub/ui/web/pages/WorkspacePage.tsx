'use client';

import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { Button, Loading } from 'sa2kit/common/ui';
import { cn } from '../utils/cn';
import { ProgressBar } from '../components/ProgressBar';
import { GenerateLessonButton } from '../components/GenerateLessonButton';
import { fetchWorkspaceDetail, fetchWorkspaceFiles } from '../services/teachHubClient';
import {
  thChip,
  thChipList,
  thEmpty,
  thEmptyInline,
  thLessonItem,
  thLessonItemDone,
  thLessonItemMeta,
  thLessonItemTitle,
  thLessonList,
  thOverview,
  thOverviewHero,
  thOverviewHeroActions,
  thOverviewHeroMain,
  thOverviewHeroTopic,
  thPanel,
  thPanelBody,
  thPanelHead,
  thPanelLink,
  thPanelTitle,
} from '../styles/tw';
import type { LessonIndex, TeachLessonProgress, TeachWorkspace } from '../types';
import { mergeLessonsWithProgress } from '../utils/lessonProgress';
import { lessonPath, lessonTitleFromSlug, referencePath, workspacePath } from '../utils/routes';

type WorkspacePageProps = {
  workspaceId: string;
};

export function WorkspacePage({ workspaceId }: WorkspacePageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [workspace, setWorkspace] = useState<TeachWorkspace | null>(null);
  const [lessons, setLessons] = useState<LessonIndex[]>([]);
  const [progress, setProgress] = useState<TeachLessonProgress[]>([]);
  const [references, setReferences] = useState<string[]>([]);

  const reload = async () => {
    setLoading(true);
    setError('');
    try {
      const [detail, files] = await Promise.all([
        fetchWorkspaceDetail(workspaceId),
        fetchWorkspaceFiles(workspaceId),
      ]);
      setWorkspace(detail.workspace);
      setLessons(detail.lessons);
      setProgress(detail.progress);
      setReferences(
        files
          .filter((f) => f.relativePath.startsWith('reference/') && f.relativePath.endsWith('.html'))
          .map((f) => f.relativePath.replace(/^reference\//, '').replace(/\.html$/i, '')),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, [workspaceId]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loading active />
      </div>
    );
  }

  if (error || !workspace) {
    return <p className="text-red-600">{error || '工作区不存在'}</p>;
  }

  const merged = mergeLessonsWithProgress(lessons, progress);
  const completed = progress.filter((p) => p.status === 'completed').length;
  const firstIncomplete = merged.find((m) => m.progress?.status !== 'completed');
  const missionReady = Boolean(workspace.missionSummary?.trim());

  return (
    <div className={thOverview}>
      <section className={cn(thPanel, thOverviewHero)}>
        <div className={thOverviewHeroMain}>
          {workspace.topic ? <p className={thOverviewHeroTopic}>{workspace.topic}</p> : null}
          {lessons.length > 0 ? (
            <ProgressBar completed={completed} total={lessons.length} />
          ) : (
            <p className="text-sm text-[#7a6f5c]">填写 Mission 后可生成第一课</p>
          )}
        </div>
        <div className={thOverviewHeroActions}>
          {firstIncomplete ? (
            <Link href={lessonPath(workspaceId, firstIncomplete.lesson.slug)}>
              <Button type="primary">继续学习</Button>
            </Link>
          ) : lessons.length > 0 ? (
            <Button type="default" disabled>
              全部完成
            </Button>
          ) : null}
          <GenerateLessonButton
            workspaceId={workspaceId}
            lessons={lessons}
            progress={progress}
            missionReady={missionReady}
            onGenerated={() => void reload()}
          />
        </div>
      </section>

      <section className={thPanel}>
        <div className={thPanelHead}>
          <h2 className={thPanelTitle}>Mission</h2>
          <Link href={`${workspacePath(workspaceId)}/mission`} className={thPanelLink}>
            编辑 →
          </Link>
        </div>
        <p className={thPanelBody}>
          {workspace.missionSummary?.trim() || '尚未填写学习动机，请先编辑 Mission。'}
        </p>
      </section>

      <section className={thPanel}>
        <div className={thPanelHead}>
          <h2 className={thPanelTitle}>课时列表</h2>
          <span className="text-sm text-[#7a6f5c]">{lessons.length} 课</span>
        </div>

        {lessons.length === 0 ? (
          <div className={cn(thEmpty, thEmptyInline)}>
            <p>尚无课时</p>
            <p className="mt-1 text-sm">填写 Mission 后点击「开始第一课」，或在设置页导入 zip。</p>
          </div>
        ) : (
          <div className={thLessonList}>
            {merged.map(({ lesson, progress: p }) => {
              const done = p?.status === 'completed';
              return (
                <Link
                  key={lesson.slug}
                  href={lessonPath(workspaceId, lesson.slug)}
                  className={cn(thLessonItem, done && thLessonItemDone)}
                >
                  <div>
                    <div className={thLessonItemTitle}>
                      {String(lesson.order).padStart(4, '0')} · {lessonTitleFromSlug(lesson.slug)}
                    </div>
                    <div className={thLessonItemMeta}>{lesson.slug}</div>
                  </div>
                  <span className="text-sm">{done ? '✓ 已完成' : '去学习 →'}</span>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {references.length > 0 ? (
        <section className={thPanel}>
          <div className={thPanelHead}>
            <h2 className={thPanelTitle}>速查参考</h2>
          </div>
          <div className={thChipList}>
            {references.map((slug) => (
              <Link key={slug} href={referencePath(workspaceId, slug)} className={thChip}>
                {slug}
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
