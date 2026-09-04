'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { Loading } from 'sa2kit/common/ui';
import { cn } from '../utils/cn';
import { fetchWorkspaceDetail } from '../services/teachHubClient';
import {
  thWsBody,
  thWsBreadcrumb,
  thWsBreadcrumbCurrent,
  thWsBreadcrumbLink,
  thWsShell,
  thWsTab,
  thWsTabActive,
  thWsTabs,
} from '../styles/tw';
import type { TeachWorkspace } from '../types';
import {
  TEACH_HUB_HOME,
  WORKSPACE_TABS,
  resolveWorkspaceTab,
} from '../utils/routes';

type WorkspaceShellProps = {
  workspaceId: string;
  children: React.ReactNode;
};

export function WorkspaceShell({ workspaceId, children }: WorkspaceShellProps) {
  const pathname = usePathname();
  const isImmersive =
    pathname.includes('/lesson/') || pathname.includes('/reference/');
  const [workspace, setWorkspace] = useState<TeachWorkspace | null>(null);
  const [loading, setLoading] = useState(!isImmersive);
  const activeTab = resolveWorkspaceTab(pathname, workspaceId);

  useEffect(() => {
    if (isImmersive) return;
    let mounted = true;
    setLoading(true);
    void fetchWorkspaceDetail(workspaceId)
      .then((detail) => {
        if (mounted) setWorkspace(detail.workspace);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [workspaceId, isImmersive]);

  if (isImmersive) {
    return <>{children}</>;
  }

  if (loading && !workspace) {
    return (
      <div className="flex justify-center py-16">
        <Loading active />
      </div>
    );
  }

  const title = workspace?.title || '工作区';

  return (
    <div className={thWsShell}>
      <nav className={thWsBreadcrumb} aria-label="面包屑">
        <Link href={TEACH_HUB_HOME} className={thWsBreadcrumbLink}>
          我的工作区
        </Link>
        <span aria-hidden>/</span>
        <span className={thWsBreadcrumbCurrent}>{title}</span>
      </nav>

      <div className={thWsTabs} role="tablist" aria-label="工作区导航">
        {WORKSPACE_TABS.map((tab) => {
          const href = tab.path(workspaceId);
          const active = tab.id === activeTab;
          return (
            <Link
              key={tab.id}
              href={href}
              role="tab"
              aria-selected={active}
              className={cn(thWsTab, active && thWsTabActive)}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      <div className={thWsBody}>{children}</div>
    </div>
  );
}
