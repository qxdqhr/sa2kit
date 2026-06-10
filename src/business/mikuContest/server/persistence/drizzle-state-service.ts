/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
import { eq } from 'drizzle-orm';
import type { MikuAnnouncement, MikuContestPersistedState, MikuSubmission, MikuVoterRestriction, MikuVoteRecord } from '../../types';
import {
  mikuContestConfigs,
  mikuContestNotices,
  mikuContestSubmissions,
  mikuContestVotes,
  mikuContestVoterRestrictions,
} from './drizzle-schema';
import type { DrizzleLikeDb } from './types';

export class MikuContestStateDbService {
  constructor(private readonly db: DrizzleLikeDb) {}

  async loadState(contestId: string): Promise<MikuContestPersistedState | null> {
    const configRows = await this.db
      .select({ config: mikuContestConfigs.config })
      .from(mikuContestConfigs)
      .where(eq(mikuContestConfigs.contestId, contestId))
      .limit(1);

    const config = configRows[0]?.config;
    if (!config) return null;

    const [submissions, votes, announcements, restrictions] = await Promise.all([
      this.db
        .select()
        .from(mikuContestSubmissions)
        .where(eq(mikuContestSubmissions.contestId, contestId)),
      this.db
        .select()
        .from(mikuContestVotes)
        .where(eq(mikuContestVotes.contestId, contestId)),
      this.db
        .select()
        .from(mikuContestNotices)
        .where(eq(mikuContestNotices.contestId, contestId)),
      this.db
        .select({ data: mikuContestVoterRestrictions.data })
        .from(mikuContestVoterRestrictions)
        .where(eq(mikuContestVoterRestrictions.contestId, contestId)),
    ]);

    return {
      contest: config,
      submissions: submissions as MikuSubmission[],
      votes: votes as MikuVoteRecord[],
      announcements: announcements as MikuAnnouncement[],
      voterRestrictions: restrictions.map((item: { data: MikuVoterRestriction }) => item.data),
      updatedAt: new Date().toISOString(),
    };
  }

  async saveState(state: MikuContestPersistedState): Promise<void> {
    const contestId = state.contest.id;

    const exists = await this.db
      .select({ contestId: mikuContestConfigs.contestId })
      .from(mikuContestConfigs)
      .where(eq(mikuContestConfigs.contestId, contestId))
      .limit(1);

    if (exists[0]) {
      await this.db
        .update(mikuContestConfigs)
        .set({
          config: state.contest,
          updatedAt: new Date(),
        })
        .where(eq(mikuContestConfigs.contestId, contestId));
    } else {
      await this.db.insert(mikuContestConfigs).values({
        contestId,
        config: state.contest,
      });
    }

    await this.db.delete(mikuContestSubmissions).where(eq(mikuContestSubmissions.contestId, contestId));
    await this.db.delete(mikuContestVotes).where(eq(mikuContestVotes.contestId, contestId));
    await this.db.delete(mikuContestNotices).where(eq(mikuContestNotices.contestId, contestId));
    await this.db
      .delete(mikuContestVoterRestrictions)
      .where(eq(mikuContestVoterRestrictions.contestId, contestId));

    if (state.submissions.length > 0) {
      await this.db.insert(mikuContestSubmissions).values(
        state.submissions.map((item) => ({
          ...item,
          contestId,
          createdAt: new Date(item.createdAt),
          reviewedAt: item.reviewedAt ? new Date(item.reviewedAt) : null,
          updatedAt: new Date(item.updatedAt),
        })),
      );
    }

    if (state.votes.length > 0) {
      await this.db.insert(mikuContestVotes).values(state.votes);
    }

    if (state.announcements.length > 0) {
      await this.db.insert(mikuContestNotices).values(state.announcements);
    }

    if (state.voterRestrictions.length > 0) {
      await this.db.insert(mikuContestVoterRestrictions).values(
        state.voterRestrictions.map((item) => ({
          id: `${contestId}:${item.voterId}`,
          contestId,
          data: item,
        })),
      );
    }
  }
}
