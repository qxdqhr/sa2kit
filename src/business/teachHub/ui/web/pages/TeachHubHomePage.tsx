'use client';

import Link from 'next/link';
import React, { useState } from 'react';
import { Button } from 'sa2kit/common/ui';
import { NewWorkspaceModal } from '../components/NewWorkspaceModal';
import { WorkspaceCard } from '../components/WorkspaceCard';
import { fetchWorkspaces } from '../services/teachHubClient';
import {
  thEmpty,
  thEmptyPanel,
  thHome,
  thHomeFooter,
  thHomeFooterLink,
  thPageDesc,
  thPageHeader,
  thPageTitle,
  thWsList,
} from '../styles/tw';
import { useTeachHubStore } from '../store/teachHubStore';

export function TeachHubHomePage() {
  const [modalOpen, setModalOpen] = useState(false);
  const workspaces = useTeachHubStore((s) => s.workspaces);
  const listError = useTeachHubStore((s) => s.listError);
  const setWorkspaces = useTeachHubStore((s) => s.setWorkspaces);

  const refreshWorkspaces = async () => {
    const items = await fetchWorkspaces({ status: 'active' });
    setWorkspaces(items);
  };

  return (
    <div className={thHome}>
      <header className={thPageHeader}>
        <div>
          <h1 className={thPageTitle}>我的学习工作区</h1>
          <p className={thPageDesc}>
            每个工作区对应一个 teach skill 主题：填写 Mission、学习课时、由 Mimo 续备下一课。
          </p>
        </div>
        <Button type="primary" onClick={() => setModalOpen(true)}>
          + 新建工作区
        </Button>
      </header>

      {listError ? <p className="mb-4 text-sm text-red-600">{listError}</p> : null}

      {workspaces.length === 0 ? (
        <div className={`${thEmpty} ${thEmptyPanel}`}>
          <p className="text-base font-medium text-[#3d3428]">还没有学习工作区</p>
          <p className="mt-2 text-sm">创建主题（如「音乐乐理」），或导入已有 teach 工作区 zip。</p>
          <Button type="primary" className="mt-5" onClick={() => setModalOpen(true)}>
            开始创建
          </Button>
        </div>
      ) : (
        <div className={thWsList}>
          {workspaces.map((ws) => (
            <WorkspaceCard key={ws.id} workspace={ws} onDeleted={() => void refreshWorkspaces()} />
          ))}
        </div>
      )}

      <p className={thHomeFooter}>
        <Link href="/testField" className={thHomeFooterLink}>
          ← 返回实验田
        </Link>
      </p>

      <NewWorkspaceModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={() => void refreshWorkspaces()}
      />
    </div>
  );
}
