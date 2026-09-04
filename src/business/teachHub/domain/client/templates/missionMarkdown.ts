import type { MissionFormData } from '../../types';

export const DEFAULT_MISSION_TEMPLATE: MissionFormData = {
  why: '',
  successLooksLike: [],
  constraints: ['零基础入门', '每课短小、可快速完成'],
  outOfScope: [],
};

export function composeMissionMarkdown(data: Partial<MissionFormData>): string {
  const merged: MissionFormData = {
    ...DEFAULT_MISSION_TEMPLATE,
    ...data,
    successLooksLike: data.successLooksLike ?? DEFAULT_MISSION_TEMPLATE.successLooksLike,
    constraints: data.constraints ?? DEFAULT_MISSION_TEMPLATE.constraints,
    outOfScope: data.outOfScope ?? DEFAULT_MISSION_TEMPLATE.outOfScope,
  };

  const lines = [
    '# Mission: 学习工作区',
    '',
    '## Why',
    merged.why.trim() || '（请填写你学习这个主题的原因）',
    '',
    '## Success looks like',
    ...(merged.successLooksLike.length
      ? merged.successLooksLike.map((item) => `- ${item}`)
      : ['- （完成本工作区第一课）']),
    '',
    '## Constraints',
    ...merged.constraints.map((item) => `- ${item}`),
    '',
    '## Out of scope',
    ...(merged.outOfScope.length
      ? merged.outOfScope.map((item) => `- ${item}`)
      : ['- （暂未定义）']),
    '',
  ];
  return lines.join('\n');
}
