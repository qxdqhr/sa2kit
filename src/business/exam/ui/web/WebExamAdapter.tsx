'use client';

import React from 'react';
import type { ExamPlatformAdapter, ExamRendererProps } from '../contracts';
import ExamPage from './pages/ExamPage';

/**
 * Web 答卷 Adapter：当前宿主答卷页自管加载与状态。
 * `ExamRendererProps` 预留给外部注入配置的宿主；本刀先挂载完整 ExamPage。
 */
const WebExamRenderer: React.FC<ExamRendererProps> = () => {
  return <ExamPage />;
};

export const webExamAdapter: ExamPlatformAdapter = {
  platform: 'web',
  render: (props) => <WebExamRenderer {...props} />,
};
