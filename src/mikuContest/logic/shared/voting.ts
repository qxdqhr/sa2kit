import type { MikuVoteRecord, MikuVotingRules } from '../../types';

export const toVoteDayKey = (date: Date = new Date()): string => {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export interface VoteCheckContext {
  existingVotes: MikuVoteRecord[];
  submissionId: string;
  voterId: string;
  dayKey: string;
  rules: MikuVotingRules;
}

export const checkVoteEligibility = (context: VoteCheckContext): { ok: boolean; reason?: string } => {
  const { existingVotes, submissionId, voterId, dayKey, rules } = context;

  const userTodayVotes = existingVotes.filter((vote) => vote.voterId === voterId && vote.dayKey === dayKey);

  if (userTodayVotes.length >= rules.maxVotesPerDay) {
    return { ok: false, reason: '已达到今日投票上限' };
  }

  if (rules.forbidDuplicateVotePerWork) {
    const duplicated = userTodayVotes.some((vote) => vote.submissionId === submissionId);
    if (duplicated) return { ok: false, reason: '不可重复投同一作品' };
  }

  return { ok: true };
};

export const sortByVotesDesc = <T extends { voteCount: number; createdAt?: string }>(items: T[]): T[] => {
  return [...items].sort((a, b) => {
    if (b.voteCount === a.voteCount) {
      return (a.createdAt || '').localeCompare(b.createdAt || '');
    }
    return b.voteCount - a.voteCount;
  });
};
