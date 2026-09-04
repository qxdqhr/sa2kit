import type { ExamPlatformAdapter, ExamRendererProps } from '../contracts';

export const desktopExamAdapter: ExamPlatformAdapter = {
  platform: 'desktop',
  render: (_props: ExamRendererProps) => {
    return null;
  },
};
