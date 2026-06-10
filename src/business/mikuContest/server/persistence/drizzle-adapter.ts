import { MikuContestStateDbService } from './drizzle-state-service';
import type { MikuContestPersistenceAdapter, DrizzleLikeDb } from './types';

export const createMikuContestDrizzlePersistenceAdapter = (
  db: DrizzleLikeDb,
): MikuContestPersistenceAdapter => {
  const service = new MikuContestStateDbService(db);

  return {
    loadState: (contestId: string) => service.loadState(contestId),
    saveState: (state) => service.saveState(state),
  };
};

export type { DrizzleLikeDb } from './types';
