export * from './contest';
export * from './submission';
export * from './vote';
export * from './notice';

export interface MikuLeaderboardItem {
  submissionId: string;
  title: string;
  authorNickname: string;
  voteCount: number;
  rank: number;
}

import type { MikuContestConfig } from './contest';
import type { MikuSubmission } from './submission';
import type { MikuAnnouncement } from './notice';
import type { MikuVoterRestriction, MikuVoteRecord } from './vote';

export interface MikuContestStateSnapshot {
  contest: MikuContestConfig;
  submissions: MikuSubmission[];
  announcements: MikuAnnouncement[];
  leaderboard: MikuLeaderboardItem[];
}

export interface MikuContestPersistedState {
  contest: MikuContestConfig;
  submissions: MikuSubmission[];
  votes: MikuVoteRecord[];
  announcements: MikuAnnouncement[];
  voterRestrictions: MikuVoterRestriction[];
  updatedAt: string;
}
