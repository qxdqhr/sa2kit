import type { CreateHuarongdaoConfigInput, HuarongdaoConfig, HuarongdaoStateSnapshot } from '../types';

const id = () => `puzzle_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

export class HuarongdaoService {
  private readonly configs = new Map<string, HuarongdaoConfig>();

  listConfigs(): HuarongdaoConfig[] {
    return [...this.configs.values()];
  }

  getBySlug(slug: string): HuarongdaoConfig | null {
    return [...this.configs.values()].find((c) => c.slug === slug) || null;
  }

  createConfig(input: CreateHuarongdaoConfigInput): HuarongdaoConfig {
    const now = new Date().toISOString();
    const next: HuarongdaoConfig = {
      id: id(),
      slug: input.slug,
      name: input.name,
      description: input.description,
      status: 'draft',
      rows: input.rows,
      cols: input.cols,
      sourceImageUrl: input.sourceImageUrl,
      showReference: input.showReference ?? true,
      shuffleSteps: input.shuffleSteps ?? 80,
      timeLimitSec: input.timeLimitSec,
      startMode: input.startMode ?? 'random-solvable',
      initialTiles: input.initialTiles,
      createdAt: now,
      updatedAt: now,
    };
    this.configs.set(next.id, next);
    return next;
  }

  updateConfig(id: string, patch: Partial<HuarongdaoConfig>): HuarongdaoConfig {
    const cur = this.configs.get(id);
    if (!cur) throw new Error('配置不存在');
    const next: HuarongdaoConfig = { ...cur, ...patch, id: cur.id, updatedAt: new Date().toISOString() };
    this.configs.set(id, next);
    return next;
  }

  deleteConfig(id: string): void {
    this.configs.delete(id);
  }

  getSnapshot(): HuarongdaoStateSnapshot {
    const configs = this.listConfigs();
    return {
      configs,
      activeConfig: configs.find((c) => c.status === 'active'),
    };
  }
}

export const createHuarongdaoService = () => new HuarongdaoService();
