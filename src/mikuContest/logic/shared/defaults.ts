import type { MikuContestConfig, MikuVotingRules } from '../../types';

export const defaultMikuVotingRules: MikuVotingRules = {
  maxVotesPerDay: 3,
  forbidDuplicateVotePerWork: true,
  maxVotesPerDevicePerDay: 20,
  maxVotesPerIpPerDay: 100,
};

export const createDefaultMikuContestConfig = (overrides?: Partial<MikuContestConfig>): MikuContestConfig => ({
  id: overrides?.id || 'miku-contest-default',
  name: overrides?.name || '初音未来社团征稿大赛',
  theme: overrides?.theme || '初音未来主题创作征稿',
  organizer: overrides?.organizer || '初音未来社团',
  awards: overrides?.awards || ['一等奖', '二等奖', '三等奖', '人气奖'],
  rules: overrides?.rules || '请确保作品原创且符合社团规范。',
  copyright: overrides?.copyright || '投稿即视为授权赛事展示与公示。',
  timeline: overrides?.timeline || {
    submissionStartAt: new Date().toISOString(),
    submissionEndAt: new Date().toISOString(),
    votingStartAt: new Date().toISOString(),
    votingEndAt: new Date().toISOString(),
    publicResultAt: new Date().toISOString(),
  },
  votingRules: {
    ...defaultMikuVotingRules,
    ...(overrides?.votingRules || {}),
  },
  toggles: {
    submissionEnabled: overrides?.toggles?.submissionEnabled ?? true,
    votingEnabled: overrides?.toggles?.votingEnabled ?? true,
    resultEnabled: overrides?.toggles?.resultEnabled ?? false,
  },
});
