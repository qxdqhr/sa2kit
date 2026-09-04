'use client';

import React from 'react';

import Link from 'next/link';
import { Button } from 'sa2kit/common/ui';
import { LessonViewer } from '../components/LessonViewer';
import { getWorkspaceFileUrl } from '../services/teachHubClient';
import { thLessonShell, thLessonToolbar } from '../styles/tw';
import { workspacePath } from '../utils/routes';

type ReferencePageProps = {
  workspaceId: string;
  slug: string;
};

export function ReferencePage({ workspaceId, slug }: ReferencePageProps) {
  const src = getWorkspaceFileUrl(workspaceId, `reference/${slug}.html`);
  return (
    <div className={thLessonShell}>
      <div className={thLessonToolbar}>
        <Link href={workspacePath(workspaceId)}>
          <Button type="text" size="small">
            ← 工作区
          </Button>
        </Link>
        <span className="text-sm font-semibold">参考：{slug}</span>
      </div>
      <LessonViewer src={src} title={`参考 ${slug}`} />
    </div>
  );
}
