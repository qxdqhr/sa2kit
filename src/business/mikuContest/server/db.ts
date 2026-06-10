import type { DrizzleLikeDb } from './persistence';

class MikuContestDbService {
  private _db: DrizzleLikeDb | null = null;

  setDb(db: DrizzleLikeDb): void {
    this._db = db;
  }

  isConfigured(): boolean {
    return Boolean(this._db);
  }

  get db(): DrizzleLikeDb {
    if (!this._db) {
      throw new Error('MikuContestDbService: Database instance not set. Call setDb(db) first.');
    }
    return this._db;
  }
}

export const mikuContestDbService = new MikuContestDbService();
