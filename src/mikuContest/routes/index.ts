import { NextResponse } from 'next/server';
import { createMikuContestService } from '../server';
import type { MikuContestService } from '../server';
import {
  createMikuContestDrizzlePersistenceAdapter,
  createMikuContestPersistentService,
  type DrizzleLikeDb,
  type MikuContestPersistenceAdapter,
} from '../server/persistence';
import type { NextRequest } from 'next/server';
import type {
  CreateMikuSubmissionInput,
  MikuContestConfig,
  MikuContestStateSnapshot,
  MikuSubmission,
  MikuSubmissionFilter,
  MikuSubmissionStatus,
  MikuWorkType,
  ResetMikuVotesInput,
  ReviewMikuSubmissionInput,
  SetMikuVoterRestrictionInput,
  VoteMikuSubmissionInput,
  MikuVoterRestriction,
} from '../types';

type MaybePromise<T> = T | Promise<T>;

export interface MikuContestServiceLike {
  getSnapshot(): MaybePromise<MikuContestStateSnapshot>;
  createSubmission(input: CreateMikuSubmissionInput, mode?: 'web' | 'miniapp'): MaybePromise<MikuSubmission>;
  vote(input: VoteMikuSubmissionInput): MaybePromise<MikuSubmission>;
  reviewSubmission(input: ReviewMikuSubmissionInput): MaybePromise<MikuSubmission>;
  listSubmissions(filter?: MikuSubmissionFilter): MaybePromise<MikuSubmission[]>;
  setVoterRestriction(input: SetMikuVoterRestrictionInput): MaybePromise<MikuVoterRestriction>;
  resetVotes(input: ResetMikuVotesInput): MaybePromise<{ removedVotes: number; affectedSubmissions: string[] }>;
  exportSubmissionExcel(filter?: MikuSubmissionFilter): MaybePromise<Uint8Array>;
  updateContestConfig(patch: Partial<MikuContestConfig>): MaybePromise<MikuContestConfig>;
}

export interface MikuContestRouteConfig {
  service?: MikuContestServiceLike;
  persistenceAdapter?: MikuContestPersistenceAdapter;
  db?: unknown;
}

const isDrizzleDb = (value: unknown): value is DrizzleLikeDb => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.select === 'function' &&
    typeof candidate.insert === 'function' &&
    typeof candidate.update === 'function' &&
    typeof candidate.delete === 'function'
  );
};

const resolveService = (config?: MikuContestRouteConfig): MikuContestServiceLike => {
  if (config?.service) return config.service;

  const adapter =
    config?.persistenceAdapter || (isDrizzleDb(config?.db) ? createMikuContestDrizzlePersistenceAdapter(config.db) : null);

  if (adapter) {
    return createMikuContestPersistentService({
      persistenceAdapter: adapter,
    });
  }

  return createMikuContestService();
};

export const createGetContestSnapshotHandler = (config?: MikuContestRouteConfig) => {
  const service = resolveService(config);
  return async (_request: NextRequest) => {
    const data = await service.getSnapshot();
    return NextResponse.json({ success: true, data });
  };
};

export const createUpdateContestConfigHandler = (config?: MikuContestRouteConfig) => {
  const service = resolveService(config);
  return async (request: NextRequest) => {
    try {
      const payload = (await request.json()) as Partial<MikuContestConfig>;
      const data = await service.updateContestConfig(payload);
      return NextResponse.json({ success: true, data });
    } catch (error) {
      return NextResponse.json({ success: false, error: (error as Error).message }, { status: 400 });
    }
  };
};

export const createCreateSubmissionHandler = (config?: MikuContestRouteConfig) => {
  const service = resolveService(config);
  return async (request: NextRequest) => {
    try {
      const body = (await request.json()) as {
        mode?: 'web' | 'miniapp';
        payload?: CreateMikuSubmissionInput;
      };

      const mode = body.mode || 'web';
      const payload = body.payload;
      if (!payload) {
        return NextResponse.json({ success: false, error: 'payload 不能为空' }, { status: 400 });
      }

      const data = await service.createSubmission(payload, mode);
      return NextResponse.json({ success: true, data });
    } catch (error) {
      return NextResponse.json({ success: false, error: (error as Error).message }, { status: 400 });
    }
  };
};

export const createVoteHandler = (config?: MikuContestRouteConfig) => {
  const service = resolveService(config);
  return async (request: NextRequest) => {
    try {
      const payload = (await request.json()) as Parameters<MikuContestService['vote']>[0];
      const data = await service.vote(payload);
      return NextResponse.json({ success: true, data });
    } catch (error) {
      return NextResponse.json({ success: false, error: (error as Error).message }, { status: 400 });
    }
  };
};

export const createReviewSubmissionHandler = (config?: MikuContestRouteConfig) => {
  const service = resolveService(config);
  return async (request: NextRequest) => {
    try {
      const payload = (await request.json()) as Parameters<MikuContestService['reviewSubmission']>[0];
      const data = await service.reviewSubmission(payload);
      return NextResponse.json({ success: true, data });
    } catch (error) {
      return NextResponse.json({ success: false, error: (error as Error).message }, { status: 400 });
    }
  };
};

const buildSubmissionFilterFromQuery = (request: NextRequest): MikuSubmissionFilter => {
  const search = request.nextUrl.searchParams;
  const status = search.get('status');
  const type = search.get('type');

  return {
    status: status ? (status as MikuSubmissionStatus) : undefined,
    type: type ? (type as MikuWorkType) : undefined,
    authorId: search.get('authorId') || undefined,
    authorKeyword: search.get('authorKeyword') || undefined,
    titleKeyword: search.get('titleKeyword') || undefined,
  };
};

export const createListSubmissionsHandler = (config?: MikuContestRouteConfig) => {
  const service = resolveService(config);
  return async (request: NextRequest) => {
    const filter = buildSubmissionFilterFromQuery(request);
    const data = await service.listSubmissions(filter);
    return NextResponse.json({ success: true, data });
  };
};

export const createSetVoterRestrictionHandler = (config?: MikuContestRouteConfig) => {
  const service = resolveService(config);
  return async (request: NextRequest) => {
    try {
      const payload = (await request.json()) as Parameters<MikuContestService['setVoterRestriction']>[0];
      const data = await service.setVoterRestriction(payload);
      return NextResponse.json({ success: true, data });
    } catch (error) {
      return NextResponse.json({ success: false, error: (error as Error).message }, { status: 400 });
    }
  };
};

export const createResetVotesHandler = (config?: MikuContestRouteConfig) => {
  const service = resolveService(config);
  return async (request: NextRequest) => {
    try {
      const payload = (await request.json()) as Parameters<MikuContestService['resetVotes']>[0];
      const data = await service.resetVotes(payload);
      return NextResponse.json({ success: true, data });
    } catch (error) {
      return NextResponse.json({ success: false, error: (error as Error).message }, { status: 400 });
    }
  };
};

export const createExportSubmissionsHandler = (config?: MikuContestRouteConfig) => {
  const service = resolveService(config);
  return async (request: NextRequest) => {
    const filter = buildSubmissionFilterFromQuery(request);
    const data = await service.exportSubmissionExcel(filter);
    const body = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="miku-submissions.xlsx"',
      },
    });
  };
};
