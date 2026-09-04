import type { ExamConfig, ExamScoreSummary, ExamUserAnswer } from '../domain';

export interface ExamRendererProps {
  config: ExamConfig;
  userAnswers: ExamUserAnswer[];
  onAnswersChange: (answers: ExamUserAnswer[]) => void;
  onSubmit: (summary: ExamScoreSummary) => void;
}

export interface ExamPlatformAdapter {
  platform: 'web' | 'wechat' | 'rn' | 'desktop';
  render: (props: ExamRendererProps) => unknown;
}
