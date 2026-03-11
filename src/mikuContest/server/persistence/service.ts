import { createMikuContestService, type MikuContestService, type MikuContestServiceOptions } from '../service';
import type {
  CreateMikuAnnouncementInput,
  CreateMikuSubmissionInput,
  MikuAnnouncement,
  MikuContestConfig,
  MikuContestStateSnapshot,
  MikuLeaderboardItem,
  MikuSubmission,
  MikuSubmissionExportRow,
  MikuSubmissionFilter,
  MikuVoterRestriction,
  ResetMikuVotesInput,
  ReviewMikuSubmissionInput,
  SetMikuVoterRestrictionInput,
  VoteMikuSubmissionInput,
} from '../../types';
import type { MikuContestPersistenceAdapter } from './types';

export interface MikuContestPersistentServiceOptions extends MikuContestServiceOptions {
  persistenceAdapter: MikuContestPersistenceAdapter;
}

export class MikuContestPersistentService {
  private readonly engine: MikuContestService;

  private hydrated = false;

  private hydrationPromise: Promise<void> | null = null;

  constructor(private readonly options: MikuContestPersistentServiceOptions) {
    this.engine = createMikuContestService(options);
  }

  private async ensureHydrated(): Promise<void> {
    if (this.hydrated) return;
    if (this.hydrationPromise) return this.hydrationPromise;

    this.hydrationPromise = (async () => {
      const contestId = this.engine.getContestConfig().id;
      const loaded = await this.options.persistenceAdapter.loadState(contestId);
      if (loaded) {
        this.engine.importPersistenceState(loaded);
      } else {
        await this.options.persistenceAdapter.saveState(this.engine.exportPersistenceState());
      }
      this.hydrated = true;
    })();

    await this.hydrationPromise;
  }

  private async persist(): Promise<void> {
    await this.options.persistenceAdapter.saveState(this.engine.exportPersistenceState());
  }

  async getContestConfig(): Promise<MikuContestConfig> {
    await this.ensureHydrated();
    return this.engine.getContestConfig();
  }

  async updateContestConfig(patch: Partial<MikuContestConfig>): Promise<MikuContestConfig> {
    await this.ensureHydrated();
    const data = this.engine.updateContestConfig(patch);
    await this.persist();
    return data;
  }

  async createSubmission(
    input: CreateMikuSubmissionInput,
    mode: 'web' | 'miniapp' = 'web',
  ): Promise<MikuSubmission> {
    await this.ensureHydrated();
    const data = this.engine.createSubmission(input, mode);
    await this.persist();
    return data;
  }

  async listSubmissions(filter?: MikuSubmissionFilter): Promise<MikuSubmission[]> {
    await this.ensureHydrated();
    return this.engine.listSubmissions(filter);
  }

  async getSubmission(submissionId: string): Promise<MikuSubmission | null> {
    await this.ensureHydrated();
    return this.engine.getSubmission(submissionId);
  }

  async reviewSubmission(input: ReviewMikuSubmissionInput): Promise<MikuSubmission> {
    await this.ensureHydrated();
    const data = this.engine.reviewSubmission(input);
    await this.persist();
    return data;
  }

  async vote(input: VoteMikuSubmissionInput): Promise<MikuSubmission> {
    await this.ensureHydrated();
    const data = this.engine.vote(input);
    await this.persist();
    return data;
  }

  async getVoterRestriction(voterId: string): Promise<MikuVoterRestriction | null> {
    await this.ensureHydrated();
    return this.engine.getVoterRestriction(voterId);
  }

  async setVoterRestriction(input: SetMikuVoterRestrictionInput): Promise<MikuVoterRestriction> {
    await this.ensureHydrated();
    const data = this.engine.setVoterRestriction(input);
    await this.persist();
    return data;
  }

  async resetVotes(input: ResetMikuVotesInput): Promise<{ removedVotes: number; affectedSubmissions: string[] }> {
    await this.ensureHydrated();
    const data = this.engine.resetVotes(input);
    await this.persist();
    return data;
  }

  async listAnnouncements(contestId?: string): Promise<MikuAnnouncement[]> {
    await this.ensureHydrated();
    return this.engine.listAnnouncements(contestId);
  }

  async publishAnnouncement(input: CreateMikuAnnouncementInput): Promise<MikuAnnouncement> {
    await this.ensureHydrated();
    const data = this.engine.publishAnnouncement(input);
    await this.persist();
    return data;
  }

  async getLeaderboard(limit = 10): Promise<MikuLeaderboardItem[]> {
    await this.ensureHydrated();
    return this.engine.getLeaderboard(limit);
  }

  async getSnapshot(): Promise<MikuContestStateSnapshot> {
    await this.ensureHydrated();
    return this.engine.getSnapshot();
  }

  async getSubmissionExportRows(filter?: MikuSubmissionFilter): Promise<MikuSubmissionExportRow[]> {
    await this.ensureHydrated();
    return this.engine.getSubmissionExportRows(filter);
  }

  async exportSubmissionExcel(filter?: MikuSubmissionFilter): Promise<Uint8Array> {
    await this.ensureHydrated();
    return this.engine.exportSubmissionExcel(filter);
  }
}

export const createMikuContestPersistentService = (
  options: MikuContestPersistentServiceOptions,
): MikuContestPersistentService => {
  return new MikuContestPersistentService(options);
};
