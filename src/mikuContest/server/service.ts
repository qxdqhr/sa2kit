import {
  checkVoteEligibility,
  createDefaultMikuContestConfig,
  sortByVotesDesc,
  toVoteDayKey,
  validateMikuSubmissionInput,
} from '../logic/shared';
import * as XLSX from 'xlsx';
import type {
  CreateMikuAnnouncementInput,
  CreateMikuSubmissionInput,
  MikuAnnouncement,
  MikuContestConfig,
  MikuContestPersistedState,
  MikuContestStateSnapshot,
  MikuLeaderboardItem,
  MikuSubmissionExportRow,
  MikuSubmissionFilter,
  MikuSubmission,
  MikuVoterRestriction,
  MikuVoteRecord,
  ResetMikuVotesInput,
  ReviewMikuSubmissionInput,
  SetMikuVoterRestrictionInput,
  VoteMikuSubmissionInput,
} from '../types';

const randomId = (prefix: string): string => {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
};

const serialNo = (): string => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const seq = Math.floor(Math.random() * 9000 + 1000);
  return `MIKU-${y}${m}${d}-${seq}`;
};

export interface MikuContestServiceOptions {
  contestConfig?: Partial<MikuContestConfig>;
}

export class MikuContestService {
  private contest: MikuContestConfig;

  private readonly submissions = new Map<string, MikuSubmission>();

  private readonly votes: MikuVoteRecord[] = [];

  private readonly announcements = new Map<string, MikuAnnouncement>();

  private readonly voterRestrictions = new Map<string, MikuVoterRestriction>();

  constructor(options: MikuContestServiceOptions = {}) {
    this.contest = createDefaultMikuContestConfig(options.contestConfig);
  }

  getContestConfig(): MikuContestConfig {
    return this.contest;
  }

  updateContestConfig(patch: Partial<MikuContestConfig>): MikuContestConfig {
    this.contest = {
      ...this.contest,
      ...patch,
      votingRules: {
        ...this.contest.votingRules,
        ...(patch.votingRules || {}),
      },
      toggles: {
        ...this.contest.toggles,
        ...(patch.toggles || {}),
      },
      timeline: {
        ...this.contest.timeline,
        ...(patch.timeline || {}),
      },
    };

    return this.contest;
  }

  createSubmission(input: CreateMikuSubmissionInput, mode: 'web' | 'miniapp' = 'web'): MikuSubmission {
    if (!this.contest.toggles.submissionEnabled) {
      throw new Error('当前未开放投稿');
    }

    const errors = validateMikuSubmissionInput(input, mode);
    if (errors.length > 0) {
      throw new Error(errors.join('；'));
    }

    const now = new Date().toISOString();
    const next: MikuSubmission = {
      id: randomId('submission'),
      serialNo: serialNo(),
      contestId: input.contestId,
      authorId: input.authorId,
      authorNickname: input.authorNickname,
      title: input.title,
      type: input.type,
      description: input.description,
      tags: input.tags || [],
      content: input.content,
      voteCount: 0,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    this.submissions.set(next.id, next);
    return next;
  }

  listSubmissions(filter?: MikuSubmissionFilter): MikuSubmission[] {
    const authorKeyword = filter?.authorKeyword?.trim().toLowerCase();
    const titleKeyword = filter?.titleKeyword?.trim().toLowerCase();

    return [...this.submissions.values()].filter((item) => {
      if (filter?.status && item.status !== filter.status) return false;
      if (filter?.type && item.type !== filter.type) return false;
      if (filter?.authorId && item.authorId !== filter.authorId) return false;
      if (authorKeyword && !item.authorNickname.toLowerCase().includes(authorKeyword)) return false;
      if (titleKeyword && !item.title.toLowerCase().includes(titleKeyword)) return false;
      return true;
    });
  }

  getSubmission(submissionId: string): MikuSubmission | null {
    return this.submissions.get(submissionId) || null;
  }

  reviewSubmission(input: ReviewMikuSubmissionInput): MikuSubmission {
    const current = this.submissions.get(input.submissionId);
    if (!current) throw new Error('投稿不存在');

    if (input.action === 'reject' && !input.rejectReason?.trim()) {
      throw new Error('驳回需填写原因');
    }

    const reviewed: MikuSubmission = {
      ...current,
      status: input.action === 'approve' ? 'approved' : 'rejected',
      rejectReason: input.action === 'reject' ? input.rejectReason?.trim() : undefined,
      reviewedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.submissions.set(reviewed.id, reviewed);
    return reviewed;
  }

  vote(input: VoteMikuSubmissionInput): MikuSubmission {
    if (!this.contest.toggles.votingEnabled) {
      throw new Error('当前未开放投票');
    }

    const restriction = this.voterRestrictions.get(input.voterId);
    if (restriction?.banned) {
      throw new Error('当前账号已被限制投票');
    }

    const target = this.submissions.get(input.submissionId);
    if (!target) throw new Error('作品不存在');
    if (target.status !== 'approved') throw new Error('仅可对已过审作品投票');

    const dayKey = toVoteDayKey();
    const eligible = checkVoteEligibility({
      existingVotes: this.votes,
      submissionId: input.submissionId,
      voterId: input.voterId,
      dayKey,
      rules: this.contest.votingRules,
    });

    if (!eligible.ok) {
      throw new Error(eligible.reason || '投票失败');
    }

    const vote: MikuVoteRecord = {
      id: randomId('vote'),
      contestId: input.contestId,
      submissionId: input.submissionId,
      voterId: input.voterId,
      votedAt: new Date().toISOString(),
      dayKey,
      deviceId: input.deviceId,
      ip: input.ip,
    };

    this.votes.push(vote);

    const updated: MikuSubmission = {
      ...target,
      voteCount: target.voteCount + 1,
      updatedAt: new Date().toISOString(),
    };
    this.submissions.set(updated.id, updated);

    return updated;
  }

  getVoterRestriction(voterId: string): MikuVoterRestriction | null {
    return this.voterRestrictions.get(voterId) || null;
  }

  setVoterRestriction(input: SetMikuVoterRestrictionInput): MikuVoterRestriction {
    const next: MikuVoterRestriction = {
      voterId: input.voterId,
      banned: input.banned,
      reason: input.reason,
      operatorId: input.operatorId,
      updatedAt: new Date().toISOString(),
    };

    this.voterRestrictions.set(input.voterId, next);
    return next;
  }

  resetVotes(input: ResetMikuVotesInput): { removedVotes: number; affectedSubmissions: string[] } {
    if (!input.submissionId && !input.voterId) {
      throw new Error('submissionId 与 voterId 至少提供一个');
    }

    const before = this.votes.length;
    const affected = new Set<string>();
    const remained = this.votes.filter((vote) => {
      const matchSubmission = input.submissionId ? vote.submissionId === input.submissionId : true;
      const matchVoter = input.voterId ? vote.voterId === input.voterId : true;
      const shouldRemove = matchSubmission && matchVoter;
      if (shouldRemove) affected.add(vote.submissionId);
      return !shouldRemove;
    });

    this.votes.length = 0;
    this.votes.push(...remained);
    this.recalculateVoteCounts();

    return {
      removedVotes: before - remained.length,
      affectedSubmissions: [...affected],
    };
  }

  listAnnouncements(contestId?: string): MikuAnnouncement[] {
    const all = [...this.announcements.values()];
    return contestId ? all.filter((item) => item.contestId === contestId) : all;
  }

  publishAnnouncement(input: CreateMikuAnnouncementInput): MikuAnnouncement {
    const now = new Date().toISOString();
    const announcement: MikuAnnouncement = {
      id: randomId('notice'),
      contestId: input.contestId,
      title: input.title,
      content: input.content,
      type: input.type,
      createdBy: input.createdBy,
      createdAt: now,
      updatedAt: now,
    };

    this.announcements.set(announcement.id, announcement);
    return announcement;
  }

  getLeaderboard(limit = 10): MikuLeaderboardItem[] {
    const ranked = sortByVotesDesc(this.listSubmissions({ status: 'approved' })).slice(0, limit);
    return ranked.map((item, index) => ({
      submissionId: item.id,
      title: item.title,
      authorNickname: item.authorNickname,
      voteCount: item.voteCount,
      rank: index + 1,
    }));
  }

  getSnapshot(): MikuContestStateSnapshot {
    return {
      contest: this.contest,
      submissions: this.listSubmissions(),
      announcements: this.listAnnouncements(),
      leaderboard: this.getLeaderboard(),
    };
  }

  getSubmissionExportRows(filter?: MikuSubmissionFilter): MikuSubmissionExportRow[] {
    return this.listSubmissions(filter).map((item) => ({
      投稿编号: item.serialNo,
      投稿ID: item.id,
      赛事ID: item.contestId,
      作者ID: item.authorId,
      作者昵称: item.authorNickname,
      作品名称: item.title,
      作品类型: item.type,
      简介: item.description,
      标签: item.tags.join(','),
      审核状态: item.status,
      驳回原因: item.rejectReason || '',
      票数: item.voteCount,
      提交时间: item.createdAt,
      更新时间: item.updatedAt,
    }));
  }

  exportSubmissionExcel(filter?: MikuSubmissionFilter): Uint8Array {
    const rows = this.getSubmissionExportRows(filter);
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'submissions');
    return XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' }) as Uint8Array;
  }

  private recalculateVoteCounts(): void {
    const counts = new Map<string, number>();
    for (const vote of this.votes) {
      counts.set(vote.submissionId, (counts.get(vote.submissionId) || 0) + 1);
    }

    for (const [id, submission] of this.submissions.entries()) {
      const nextCount = counts.get(id) || 0;
      if (submission.voteCount === nextCount) continue;
      this.submissions.set(id, {
        ...submission,
        voteCount: nextCount,
        updatedAt: new Date().toISOString(),
      });
    }
  }

  exportPersistenceState(): MikuContestPersistedState {
    return {
      contest: this.contest,
      submissions: [...this.submissions.values()],
      votes: [...this.votes],
      announcements: [...this.announcements.values()],
      voterRestrictions: [...this.voterRestrictions.values()],
      updatedAt: new Date().toISOString(),
    };
  }

  importPersistenceState(state: MikuContestPersistedState): void {
    this.contest = state.contest;
    this.submissions.clear();
    this.announcements.clear();
    this.voterRestrictions.clear();
    this.votes.length = 0;

    for (const item of state.submissions) {
      this.submissions.set(item.id, item);
    }
    for (const item of state.announcements) {
      this.announcements.set(item.id, item);
    }
    for (const item of state.voterRestrictions) {
      this.voterRestrictions.set(item.voterId, item);
    }
    this.votes.push(...state.votes);
  }
}

export const createMikuContestService = (options?: MikuContestServiceOptions): MikuContestService => {
  return new MikuContestService(options);
};
