export interface MikuVoteRecord {
  id: string;
  contestId: string;
  submissionId: string;
  voterId: string;
  votedAt: string;
  dayKey: string;
  deviceId?: string;
  ip?: string;
}

export interface VoteMikuSubmissionInput {
  contestId: string;
  submissionId: string;
  voterId: string;
  deviceId?: string;
  ip?: string;
}

export interface MikuVoterRestriction {
  voterId: string;
  banned: boolean;
  reason?: string;
  operatorId?: string;
  updatedAt: string;
}

export interface SetMikuVoterRestrictionInput {
  voterId: string;
  banned: boolean;
  reason?: string;
  operatorId?: string;
}

export interface ResetMikuVotesInput {
  submissionId?: string;
  voterId?: string;
  operatorId?: string;
  reason?: string;
}
