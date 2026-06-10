import { desc, eq } from 'drizzle-orm';
import { normalizeFestivalCardConfig } from '../../core';
import type { FestivalCardConfig, FestivalCardConfigSummary } from '../../types';
import { festivalCardConfigs } from '../schema/festivalCards';

export type DrizzleLikeDb = {
  select: (...args: any[]) => any;
  insert: (...args: any[]) => any;
  update: (...args: any[]) => any;
  delete: (...args: any[]) => any;
};

const toStoredConfig = (id: string, config: FestivalCardConfig): FestivalCardConfig => ({
  ...config,
  id,
});

export class FestivalCardDbService {
  constructor(private readonly db: DrizzleLikeDb) {}

  async listConfigs(): Promise<FestivalCardConfigSummary[]> {
    const rows = await this.db
      .select({
        id: festivalCardConfigs.id,
        name: festivalCardConfigs.name,
      })
      .from(festivalCardConfigs)
      .orderBy(desc(festivalCardConfigs.updatedAt));
    return rows;
  }

  async getConfig(id: string): Promise<FestivalCardConfig | null> {
    const rows = await this.db
      .select()
      .from(festivalCardConfigs)
      .where(eq(festivalCardConfigs.id, id))
      .limit(1);
    const row = rows[0];
    if (!row) return null;
    const raw = row.config as FestivalCardConfig;
    return normalizeFestivalCardConfig({
      ...raw,
      id: row.id,
      name: row.name || raw.name,
    });
  }

  async saveConfig(id: string, config: FestivalCardConfig): Promise<void> {
    const normalized = normalizeFestivalCardConfig(toStoredConfig(id, config));
    const existing = await this.db
      .select({ id: festivalCardConfigs.id })
      .from(festivalCardConfigs)
      .where(eq(festivalCardConfigs.id, id))
      .limit(1);

    if (existing[0]) {
      await this.db
        .update(festivalCardConfigs)
        .set({
          name: normalized.name || id,
          config: normalized,
          updatedAt: new Date(),
        })
        .where(eq(festivalCardConfigs.id, id));
      return;
    }

    await this.db.insert(festivalCardConfigs).values({
      id,
      name: normalized.name || id,
      config: normalized,
    });
  }

  async deleteConfig(id: string): Promise<void> {
    await this.db.delete(festivalCardConfigs).where(eq(festivalCardConfigs.id, id));
  }
}
