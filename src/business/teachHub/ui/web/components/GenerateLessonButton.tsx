'use client';

import React, { useMemo, useState } from 'react';
import { Button } from 'sa2kit/common/ui';
import {
  generateLessonButtonLabel,
  resolveGenerateLessonTrigger,
  type GenerateLessonTrigger,
} from '../shared';
import { generateLesson } from '../services/teachHubClient';
import type { LessonIndex, TeachLessonProgress } from '../types';

type GenerateLessonButtonProps = {
  workspaceId: string;
  lessons: LessonIndex[];
  progress: TeachLessonProgress[];
  missionReady: boolean;
  onGenerated: () => void;
};

export function GenerateLessonButton({
  workspaceId,
  lessons,
  progress,
  missionReady,
  onGenerated,
}: GenerateLessonButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const trigger = useMemo(
    (): GenerateLessonTrigger | null =>
      resolveGenerateLessonTrigger(lessons, progress, missionReady),
    [lessons, progress, missionReady],
  );

  const label = generateLessonButtonLabel(trigger, lessons.length);

  const handleClick = async () => {
    if (!trigger) return;
    setLoading(true);
    setError('');
    try {
      const job = await generateLesson(workspaceId, trigger);
      if (job.status === 'failed') {
        setError(job.errorMessage || '生成失败');
      } else {
        onGenerated();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        type="primary"
        disabled={!trigger || loading}
        onClick={() => void handleClick()}
      >
        {loading ? 'Mimo 备课中…' : label}
      </Button>
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </div>
  );
}
