import type {
  CreateMikuSubmissionInput,
  MikuContestConfig,
  MikuContestStateSnapshot,
  MikuSubmission,
  MikuSubmissionFilter,
  MikuVoterRestriction,
  ResetMikuVotesInput,
  ReviewMikuSubmissionInput,
  SetMikuVoterRestrictionInput,
  VoteMikuSubmissionInput,
} from '../../types';

export interface MikuContestApiClient {
  getSnapshot(): Promise<MikuContestStateSnapshot>;
  updateContestConfig(patch: Partial<MikuContestConfig>): Promise<MikuContestConfig>;
  createSubmission(input: CreateMikuSubmissionInput, mode?: 'web' | 'miniapp'): Promise<MikuSubmission>;
  listSubmissions(filter?: MikuSubmissionFilter): Promise<MikuSubmission[]>;
  reviewSubmission(input: ReviewMikuSubmissionInput): Promise<MikuSubmission>;
  vote(input: VoteMikuSubmissionInput): Promise<MikuSubmission>;
  setVoterRestriction(input: SetMikuVoterRestrictionInput): Promise<MikuVoterRestriction>;
  resetVotes(input: ResetMikuVotesInput): Promise<{ removedVotes: number; affectedSubmissions: string[] }>;
  exportSubmissions(filter?: MikuSubmissionFilter): Promise<ArrayBuffer>;
}

export type HttpMethod = 'GET' | 'POST' | 'PATCH';

export interface Requester {
  <T>(url: string, options?: { method?: HttpMethod; body?: unknown }): Promise<T>;
}

const toQueryString = (filter?: MikuSubmissionFilter): string => {
  if (!filter) return '';
  const params = new URLSearchParams();
  if (filter.status) params.set('status', filter.status);
  if (filter.type) params.set('type', filter.type);
  if (filter.authorId) params.set('authorId', filter.authorId);
  if (filter.authorKeyword) params.set('authorKeyword', filter.authorKeyword);
  if (filter.titleKeyword) params.set('titleKeyword', filter.titleKeyword);
  const query = params.toString();
  return query ? `?${query}` : '';
};

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const unwrap = <T>(result: ApiEnvelope<T>): T => {
  if (!result.success || result.data === undefined) {
    throw new Error(result.error || '请求失败');
  }
  return result.data;
};

export const createMikuContestApiClient = (
  basePath: string,
  requester: Requester,
): MikuContestApiClient => {
  return {
    async getSnapshot() {
      const result = await requester<ApiEnvelope<MikuContestStateSnapshot>>(`${basePath}/contest`, { method: 'GET' });
      return unwrap(result);
    },
    async updateContestConfig(patch) {
      const result = await requester<ApiEnvelope<MikuContestConfig>>(`${basePath}/contest`, {
        method: 'PATCH',
        body: patch,
      });
      return unwrap(result);
    },
    async createSubmission(input, mode = 'web') {
      const result = await requester<ApiEnvelope<MikuSubmission>>(`${basePath}/submissions`, {
        method: 'POST',
        body: { payload: input, mode },
      });
      return unwrap(result);
    },
    async listSubmissions(filter) {
      const result = await requester<ApiEnvelope<MikuSubmission[]>>(
        `${basePath}/submissions${toQueryString(filter)}`,
        { method: 'GET' },
      );
      return unwrap(result);
    },
    async reviewSubmission(input) {
      const result = await requester<ApiEnvelope<MikuSubmission>>(`${basePath}/submissions/review`, {
        method: 'POST',
        body: input,
      });
      return unwrap(result);
    },
    async vote(input) {
      const result = await requester<ApiEnvelope<MikuSubmission>>(`${basePath}/votes`, {
        method: 'POST',
        body: input,
      });
      return unwrap(result);
    },
    async setVoterRestriction(input) {
      const result = await requester<ApiEnvelope<MikuVoterRestriction>>(`${basePath}/admin/voter-restrictions`, {
        method: 'POST',
        body: input,
      });
      return unwrap(result);
    },
    async resetVotes(input) {
      const result = await requester<ApiEnvelope<{ removedVotes: number; affectedSubmissions: string[] }>>(
        `${basePath}/admin/votes/reset`,
        {
          method: 'POST',
          body: input,
        },
      );
      return unwrap(result);
    },
    async exportSubmissions(filter) {
      const response = await fetch(`${basePath}/admin/submissions/export${toQueryString(filter)}`);
      if (!response.ok) {
        throw new Error(`导出失败: ${response.status}`);
      }
      return response.arrayBuffer();
    },
  };
};
