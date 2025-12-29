'use client';

import React from "react";
import { BackButton } from '@/components';

export interface PageHeaderProps {
  counts: { all: number; utility: number; leisure: number; completed: number };
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ counts, className }) => {
  return (
    <div className={className}>
      {/* 顶部导航 */}
      <div className="mb-8">
        <BackButton />
      </div>

      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">实验田</h1>
        <p className="mt-2 text-sm text-gray-600">
          在这里，你可以尝试各种实验性的功能和项目
        </p>
        
        {/* 统计信息 */}
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500">
          <span>总计: {counts.all} 个项目</span>
          <span>实用工具: {counts.utility} 个</span>
          <span>休闲娱乐: {counts.leisure} 个</span>
          <span>已完成: {counts.completed} 个</span>
        </div>
      </div>
    </div>
  );
};

export default PageHeader;
