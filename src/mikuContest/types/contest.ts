export type MikuContestRole = 'user' | 'admin' | 'judge';

export interface MikuContestTimeline {
  submissionStartAt: string;
  submissionEndAt: string;
  votingStartAt: string;
  votingEndAt: string;
  publicResultAt: string;
}

export interface MikuFeatureToggles {
  submissionEnabled: boolean;
  votingEnabled: boolean;
  resultEnabled: boolean;
}

export interface MikuVotingRules {
  maxVotesPerDay: number;
  forbidDuplicateVotePerWork: boolean;
  maxVotesPerDevicePerDay?: number;
  maxVotesPerIpPerDay?: number;
}

export interface MikuContestConfig {
  id: string;
  name: string;
  theme: string;
  organizer: string;
  awards: string[];
  rules: string;
  copyright: string;
  timeline: MikuContestTimeline;
  votingRules: MikuVotingRules;
  toggles: MikuFeatureToggles;
}
