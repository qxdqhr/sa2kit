import { DEFAULT_FESTIVAL_CARD_CONFIG, normalizeFestivalCardConfig } from '../core';
import { getFestivalCardDb } from '../server/db';
import type { FestivalCardConfig, FestivalCardDbAdapter, FestivalCardServiceOptions } from '../types';

export class FestivalCardService {
  private db: FestivalCardDbAdapter | null;

  constructor(options?: FestivalCardServiceOptions) {
    this.db = options?.db || getFestivalCardDb();
  }

  async getConfig(cardId = 'default-festival-card'): Promise<FestivalCardConfig> {
    if (!this.db) return DEFAULT_FESTIVAL_CARD_CONFIG;
    const config = await this.db.getConfig(cardId);
    return normalizeFestivalCardConfig(config);
  }

  async saveConfig(cardId: string, config: FestivalCardConfig): Promise<FestivalCardConfig> {
    const normalized = normalizeFestivalCardConfig(config);
    if (!this.db) return normalized;
    await this.db.saveConfig(cardId, normalized);
    return normalized;
  }
}

const memoryStore = new Map<string, FestivalCardConfig>();

export const createInMemoryFestivalCardDb = (): FestivalCardDbAdapter => ({
  getConfig(id: string) {
    return Promise.resolve(memoryStore.get(id) || null);
  },
  saveConfig(id: string, config: FestivalCardConfig) {
    memoryStore.set(id, config);
    return Promise.resolve();
  },
});
