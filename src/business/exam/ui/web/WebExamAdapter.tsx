import React from 'react';
import type { ExamPlatformAdapter, ExamRendererProps } from '../contracts';

const WebExamRenderer: React.FC<ExamRendererProps> = () => {
  return null;
};

export const webExamAdapter: ExamPlatformAdapter = {
  platform: 'web',
  render: (props) => <WebExamRenderer {...props} />,
};
