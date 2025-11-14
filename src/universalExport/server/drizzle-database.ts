/**
 * 通用导出服务 - Drizzle 数据库操作层
 *
 * 提供导出配置和历史记录的数据库操作接口。
 * 支持任何 Drizzle 数据库实例。
 *
 * @package sa2kit/universalExport/server
 */

import { eq, and, desc } from 'drizzle-orm';
import type {
  ExportConfig,
  NewExportConfig,
  ExportHistory,
  NewExportHistory,
} from './drizzle-schemas/postgres';
import { exportConfigs, exportHistory } from './drizzle-schemas/postgres';

/**
 * Drizzle 数据库实例类型
 */
export type DrizzleDb = any; // 支持任何 Drizzle 数据库实例

/**
 * 导出配置数据库服务工厂选项
 */
export interface ExportDatabaseServiceOptions {
  /**
   * Drizzle 数据库实例
   */
  db: DrizzleDb;
}

/**
 * 导出配置数据库服务
 *
 * 提供导出配置的 CRUD 操作
 */
export class ExportConfigDatabaseService {
  constructor(private readonly db: DrizzleDb) {}

  /**
   * 创建导出配置
   */
  async createConfig(
    config: Omit<NewExportConfig, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ExportConfig> {
    const id = `export_config_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    const [newConfig] = await this.db
      .insert(exportConfigs)
      .values({
        id,
        ...config,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return newConfig;
  }

  /**
   * 根据ID获取配置
   */
  async getConfigById(id: string): Promise<ExportConfig | null> {
    const [config] = await this.db
      .select()
      .from(exportConfigs)
      .where(eq(exportConfigs.id, id))
      .limit(1);

    return config || null;
  }

  /**
   * 根据模块和业务ID获取配置列表
   */
  async getConfigsByModule(moduleId: string, businessId?: string): Promise<ExportConfig[]> {
    const whereConditions = businessId
      ? and(eq(exportConfigs.moduleId, moduleId), eq(exportConfigs.businessId, businessId))
      : eq(exportConfigs.moduleId, moduleId);

    return await this.db
      .select()
      .from(exportConfigs)
      .where(whereConditions)
      .orderBy(desc(exportConfigs.updatedAt));
  }

  /**
   * 更新配置
   */
  async updateConfig(
    id: string,
    updates: Partial<Omit<ExportConfig, 'id' | 'createdAt'>>
  ): Promise<ExportConfig | null> {
    const [updatedConfig] = await this.db
      .update(exportConfigs)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(exportConfigs.id, id))
      .returning();

    return updatedConfig || null;
  }

  /**
   * 删除配置
   */
  async deleteConfig(id: string): Promise<boolean> {
    await this.db.delete(exportConfigs).where(eq(exportConfigs.id, id));
    return true;
  }

  /**
   * 根据用户ID获取配置列表
   */
  async getConfigsByUser(userId: string): Promise<ExportConfig[]> {
    return await this.db
      .select()
      .from(exportConfigs)
      .where(eq(exportConfigs.createdBy, userId))
      .orderBy(desc(exportConfigs.updatedAt));
  }
}

/**
 * 导出历史记录数据库服务
 *
 * 提供导出历史记录的 CRUD 操作
 */
export class ExportHistoryDatabaseService {
  constructor(private readonly db: DrizzleDb) {}

  /**
   * 创建导出历史记录
   */
  async createHistory(history: Omit<NewExportHistory, 'id' | 'createdAt'>): Promise<ExportHistory> {
    const id = `export_history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const [newHistory] = await this.db
      .insert(exportHistory)
      .values({
        id,
        ...history,
        createdAt: new Date(),
      })
      .returning();

    return newHistory;
  }

  /**
   * 根据配置ID获取历史记录
   */
  async getHistoryByConfigId(configId: string): Promise<ExportHistory[]> {
    return await this.db
      .select()
      .from(exportHistory)
      .where(eq(exportHistory.configId, configId))
      .orderBy(desc(exportHistory.createdAt));
  }

  /**
   * 根据用户ID获取历史记录
   */
  async getHistoryByUser(userId: string): Promise<ExportHistory[]> {
    return await this.db
      .select()
      .from(exportHistory)
      .where(eq(exportHistory.createdBy, userId))
      .orderBy(desc(exportHistory.createdAt));
  }

  /**
   * 获取最近的导出历史记录
   */
  async getRecentHistory(limit: number = 10): Promise<ExportHistory[]> {
    return await this.db
      .select()
      .from(exportHistory)
      .orderBy(desc(exportHistory.createdAt))
      .limit(limit);
  }
}

/**
 * 创建导出数据库服务实例
 *
 * @param options - 数据库服务选项
 * @returns 导出配置和历史记录服务实例
 *
 * @example
 * ```typescript
 * import { createExportDatabaseServices } from 'sa2kit/universalExport/server';
 * import { db } from './db';
 *
 * const { configDB, historyDB } = createExportDatabaseServices({ db });
 *
 * // 使用服务
 * const config = await configDB.createConfig({ ... });
 * const history = await historyDB.createHistory({ ... });
 * ```
 */
export function createExportDatabaseServices(options: ExportDatabaseServiceOptions) {
  const { db } = options;

  return {
    configDB: new ExportConfigDatabaseService(db),
    historyDB: new ExportHistoryDatabaseService(db),
  };
}

