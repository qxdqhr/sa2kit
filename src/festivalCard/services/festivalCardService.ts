import { DEFAULT_FESTIVAL_CARD_CONFIG, normalizeFestivalCardConfig } from '../core';
import { getFestivalCardDb } from '../server/db';
import type {
  FestivalCardConfig,
  FestivalCardConfigSummary,
  FestivalCardDbAdapter,
  FestivalCardServiceOptions,
} from '../types';

export class FestivalCardService {
  private db: FestivalCardDbAdapter | null;

  constructor(options?: FestivalCardServiceOptions) {
    this.db = options?.db || getFestivalCardDb();
  }

  async listConfigs(): Promise<FestivalCardConfigSummary[]> {
    if (!this.db) {
      return [{ id: DEFAULT_FESTIVAL_CARD_CONFIG.id || 'default-festival-card', name: DEFAULT_FESTIVAL_CARD_CONFIG.name }];
    }

    if (this.db.listConfigs) {
      const list = await this.db.listConfigs();
      return list.length > 0
        ? list
        : [{ id: DEFAULT_FESTIVAL_CARD_CONFIG.id || 'default-festival-card', name: DEFAULT_FESTIVAL_CARD_CONFIG.name }];
    }

    return [{ id: DEFAULT_FESTIVAL_CARD_CONFIG.id || 'default-festival-card', name: DEFAULT_FESTIVAL_CARD_CONFIG.name }];
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

  async deleteConfig(cardId: string): Promise<void> {
    if (!this.db?.deleteConfig) return;
    await this.db.deleteConfig(cardId);
  }
}

const memoryStore = new Map<string, FestivalCardConfig>();
const defaultId = DEFAULT_FESTIVAL_CARD_CONFIG.id || 'default-festival-card';
if (!memoryStore.has(defaultId)) {
  memoryStore.set(defaultId, DEFAULT_FESTIVAL_CARD_CONFIG);
}

export const createInMemoryFestivalCardDb = (): FestivalCardDbAdapter => ({
  listConfigs() {
    return Promise.resolve(
      Array.from(memoryStore.entries()).map(([id, config]) => ({
        id,
        name: config.name || id,
      }))
    );
  },
  getConfig(id: string) {
    return Promise.resolve(memoryStore.get(id) || null);
  },
  saveConfig(id: string, config: FestivalCardConfig) {
    memoryStore.set(id, config);
    return Promise.resolve();
  },
  deleteConfig(id: string) {
    memoryStore.delete(id);
    return Promise.resolve();
  },
});
