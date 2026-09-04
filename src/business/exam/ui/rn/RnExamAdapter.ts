import type { ExamPlatformAdapter, ExamRendererProps } from '../contracts';

export const rnExamAdapter: ExamPlatformAdapter = {
  platform: 'rn',
  render: (_props: ExamRendererProps) => {
    return null;
  },
};
