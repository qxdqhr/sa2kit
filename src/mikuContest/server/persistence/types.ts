/* eslint-disable @typescript-eslint/no-explicit-any */
import type { MikuContestPersistedState } from '../../types';

export interface MikuContestPersistenceAdapter {
  loadState(contestId: string): Promise<MikuContestPersistedState | null>;
  saveState(state: MikuContestPersistedState): Promise<void>;
}

export type DrizzleLikeDb = {
  select: (...args: any[]) => any;
  insert: (...args: any[]) => any;
  update: (...args: any[]) => any;
  delete: (...args: any[]) => any;
};
