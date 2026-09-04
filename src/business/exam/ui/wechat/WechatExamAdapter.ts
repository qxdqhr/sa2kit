import type { ExamPlatformAdapter, ExamRendererProps } from '../contracts';

export const wechatExamAdapter: ExamPlatformAdapter = {
  platform: 'wechat',
  render: (_props: ExamRendererProps) => {
    return null;
  },
};
