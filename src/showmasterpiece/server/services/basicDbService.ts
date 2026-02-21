import { eq, asc, and } from 'drizzle-orm';
import {
  comicUniverseConfigs,
  comicUniverseCategories,
  comicUniverseTags,
} from '../schema/masterpieces';
import { buildDefaultHomeTabConfig, normalizeHomeTabConfig } from '../../types';

interface MasterpiecesConfig {
  siteName: string;
  siteDescription?: string;
  heroTitle: string;
  heroSubtitle?: string;
  maxCollectionsPerPage: number;
  enableSearch: boolean;
  enableCategories: boolean;
  homeTabConfig: any[];
  defaultCategory: string;
  theme: 'light' | 'dark' | 'auto';
  language: 'zh' | 'en';
}

export class MasterpiecesConfigDbService {
  constructor(private readonly db: any) {}

  async getConfig(): Promise<MasterpiecesConfig> {
    const configs = await this.db.select().from(comicUniverseConfigs).limit(1);

    if (configs.length === 0) {
      const defaultConfig = await this.createDefaultConfig();
      return this.mapDbConfigToType(defaultConfig);
    }

    return this.mapDbConfigToType(configs[0]);
  }

  async updateConfig(configData: Partial<MasterpiecesConfig>): Promise<MasterpiecesConfig> {
    const configs = await this.db.select().from(comicUniverseConfigs).limit(1);

    if (configs.length === 0) {
      const newConfig = await this.db.insert(comicUniverseConfigs).values({
        siteName: configData.siteName || '画集展览',
        siteDescription: configData.siteDescription || '精美的艺术作品展览',
        heroTitle: configData.heroTitle || '艺术画集展览',
        heroSubtitle: configData.heroSubtitle || '探索精美的艺术作品，感受创作的魅力',
        maxCollectionsPerPage: configData.maxCollectionsPerPage || 9,
        enableSearch: configData.enableSearch ?? true,
        enableCategories: configData.enableCategories ?? true,
        homeTabConfig: normalizeHomeTabConfig(configData.homeTabConfig),
        defaultCategory: configData.defaultCategory || 'all',
        theme: configData.theme || 'light',
        language: configData.language || 'zh',
        updatedAt: new Date(),
      }).returning();

      return this.mapDbConfigToType(newConfig[0]);
    }

    const updateData: any = { updatedAt: new Date() };
    if (configData.siteName !== undefined) updateData.siteName = configData.siteName;
    if (configData.siteDescription !== undefined) updateData.siteDescription = configData.siteDescription;
    if (configData.heroTitle !== undefined) updateData.heroTitle = configData.heroTitle;
    if (configData.heroSubtitle !== undefined) updateData.heroSubtitle = configData.heroSubtitle;
    if (configData.maxCollectionsPerPage !== undefined) updateData.maxCollectionsPerPage = configData.maxCollectionsPerPage;
    if (configData.enableSearch !== undefined) updateData.enableSearch = configData.enableSearch;
    if (configData.enableCategories !== undefined) updateData.enableCategories = configData.enableCategories;
    if (configData.homeTabConfig !== undefined) updateData.homeTabConfig = normalizeHomeTabConfig(configData.homeTabConfig);
    if (configData.defaultCategory !== undefined) updateData.defaultCategory = configData.defaultCategory;
    if (configData.theme !== undefined) updateData.theme = configData.theme;
    if (configData.language !== undefined) updateData.language = configData.language;

    const updatedConfig = await this.db.update(comicUniverseConfigs)
      .set(updateData)
      .where(eq(comicUniverseConfigs.id, configs[0].id))
      .returning();

    return this.mapDbConfigToType(updatedConfig[0]);
  }

  async resetConfig(): Promise<MasterpiecesConfig> {
    await this.db.delete(comicUniverseConfigs);
    const defaultConfig = await this.createDefaultConfig();
    return this.mapDbConfigToType(defaultConfig);
  }

  private async createDefaultConfig() {
    const newConfig = await this.db.insert(comicUniverseConfigs).values({
      siteName: '画集展览',
      siteDescription: '精美的艺术作品展览',
      heroTitle: '艺术画集展览',
      heroSubtitle: '探索精美的艺术作品，感受创作的魅力',
      maxCollectionsPerPage: 9,
      enableSearch: true,
      enableCategories: true,
      homeTabConfig: buildDefaultHomeTabConfig(),
      defaultCategory: 'all',
      theme: 'light',
      language: 'zh',
    }).returning();

    return newConfig[0];
  }

  private mapDbConfigToType(dbConfig: any): MasterpiecesConfig {
    return {
      siteName: dbConfig.siteName,
      siteDescription: dbConfig.siteDescription,
      heroTitle: dbConfig.heroTitle,
      heroSubtitle: dbConfig.heroSubtitle,
      maxCollectionsPerPage: dbConfig.maxCollectionsPerPage,
      enableSearch: dbConfig.enableSearch,
      enableCategories: dbConfig.enableCategories,
      homeTabConfig: normalizeHomeTabConfig(dbConfig.homeTabConfig),
      defaultCategory: dbConfig.defaultCategory,
      theme: dbConfig.theme,
      language: dbConfig.language,
    };
  }
}

export class CategoriesDbService {
  constructor(private readonly db: any) {}

  async getCategories(): Promise<Array<{ name: string; description?: string | null }>> {
    const conditions = [eq(comicUniverseCategories.isActive, true)];

    const categories = await this.db.select()
      .from(comicUniverseCategories)
      .where(and(...conditions))
      .orderBy(asc(comicUniverseCategories.displayOrder), asc(comicUniverseCategories.name));

    return categories.map((cat: any) => ({
      name: cat.name,
      description: cat.description ?? null,
    }));
  }

  async createCategory(name: string, description?: string): Promise<void> {
    await this.db.insert(comicUniverseCategories).values({ name, description });
  }
}

export class TagsDbService {
  constructor(private readonly db: any) {}

  async getTags(): Promise<string[]> {
    const conditions = [eq(comicUniverseTags.isActive, true)];

    const tags = await this.db.select()
      .from(comicUniverseTags)
      .where(and(...conditions))
      .orderBy(asc(comicUniverseTags.name));

    return tags.map((tag: any) => tag.name);
  }

  async createTag(name: string, color?: string): Promise<void> {
    await this.db.insert(comicUniverseTags).values({
      name,
      color: color || '#3b82f6',
    });
  }
}

export function createMasterpiecesConfigDbService(db: any): MasterpiecesConfigDbService {
  return new MasterpiecesConfigDbService(db);
}

export function createCategoriesDbService(db: any): CategoriesDbService {
  return new CategoriesDbService(db);
}

export function createTagsDbService(db: any): TagsDbService {
  return new TagsDbService(db);
}
