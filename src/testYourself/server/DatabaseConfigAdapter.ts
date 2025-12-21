/**
 * TestYourself 数据库配置适配器
 * Database Configuration Adapter
 * 
 * 实现基于数据库的配置存储
 */

import { eq, and, desc, sql, or } from 'drizzle-orm';
import type { IConfigStorage } from './ConfigService';
import type { SavedConfig } from '../types';
import { testYourselfConfigs } from './drizzle-schema';
import type { TestYourselfConfig } from './drizzle-schema';

/**
 * Drizzle 数据库连接类型
 */
export type DrizzleDb = any;

/**
 * 数据库适配器配置
 */
export interface DatabaseConfigAdapterOptions {
  /** Drizzle 数据库实例 */
  db: DrizzleDb;
  /** 当前用户ID（用于创建和更新） */
  userId?: string;
  /** 组织ID（多租户支持） */
  organizationId?: string;
  /** 是否启用软删除（默认 true） */
  softDelete?: boolean;
}

/**
 * 数据库配置适配器
 * 
 * 实现 IConfigStorage 接口，将配置存储在数据库中
 */
export class DatabaseConfigAdapter implements IConfigStorage {
  private db: DrizzleDb;
  private userId: string;
  private organizationId?: string;
  private softDelete: boolean;

  constructor(options: DatabaseConfigAdapterOptions) {
    this.db = options.db;
    this.userId = options.userId || 'system';
    this.organizationId = options.organizationId;
    this.softDelete = options.softDelete !== false;
  }

  /**
   * 设置当前用户ID
   */
  setUserId(userId: string): void {
    this.userId = userId;
  }

  /**
   * 设置组织ID
   */
  setOrganizationId(organizationId: string): void {
    this.organizationId = organizationId;
  }

  /**
   * 将数据库记录转换为 SavedConfig
   */
  private toSavedConfig(dbConfig: TestYourselfConfig): SavedConfig {
    return {
      id: dbConfig.id,
      name: dbConfig.name,
      description: dbConfig.description || undefined,
      config: dbConfig.config,
      createdAt: dbConfig.createdAt.getTime(),
      updatedAt: dbConfig.updatedAt.getTime(),
      isDefault: dbConfig.isDefault,
    };
  }

  /**
   * 保存配置
   */
  async saveConfig(config: SavedConfig): Promise<void> {
    try {
      // 检查是否已存在
      const existing = await this.db
        .select()
        .from(testYourselfConfigs)
        .where(eq(testYourselfConfigs.id, config.id))
        .limit(1);

      const resultCount = config.config.results?.length || 0;

      if (existing && existing.length > 0) {
        // 更新现有配置
        await this.db
          .update(testYourselfConfigs)
          .set({
            name: config.name,
            description: config.description || null,
            config: config.config,
            resultCount,
            isDefault: config.isDefault || false,
            updatedBy: this.userId,
            updatedAt: new Date(),
            version: sql`${testYourselfConfigs.version} + 1`, // 版本号递增
          })
          .where(eq(testYourselfConfigs.id, config.id));

        console.log('✅ [DatabaseAdapter] 配置已更新:', config.id);
      } else {
        // 插入新配置
        await this.db.insert(testYourselfConfigs).values({
          id: config.id,
          name: config.name,
          description: config.description || null,
          config: config.config,
          resultCount,
          isDefault: config.isDefault || false,
          createdBy: this.userId,
          organizationId: this.organizationId,
          createdAt: new Date(config.createdAt),
          updatedAt: new Date(config.updatedAt),
        });

        console.log('✅ [DatabaseAdapter] 配置已创建:', config.id);
      }
    } catch (error) {
      console.error('❌ [DatabaseAdapter] 保存配置失败:', error);
      throw error;
    }
  }

  /**
   * 获取配置
   */
  async getConfig(id: string): Promise<SavedConfig | null> {
    try {
      const conditions = [eq(testYourselfConfigs.id, id)];

      // 如果启用软删除，过滤已删除的记录
      if (this.softDelete) {
        conditions.push(eq(testYourselfConfigs.isDeleted, false));
      }

      const result = await this.db
        .select()
        .from(testYourselfConfigs)
        .where(and(...conditions))
        .limit(1);

      if (!result || result.length === 0) {
        return null;
      }

      return this.toSavedConfig(result[0]);
    } catch (error) {
      console.error('❌ [DatabaseAdapter] 获取配置失败:', error);
      throw error;
    }
  }

  /**
   * 获取所有配置列表
   */
  async getAllConfigs(): Promise<SavedConfig[]> {
    try {
      const conditions = [];

      // 如果启用软删除，过滤已删除的记录
      if (this.softDelete) {
        conditions.push(eq(testYourselfConfigs.isDeleted, false));
      }

      // 如果设置了组织ID，只查询该组织的配置
      if (this.organizationId) {
        conditions.push(
          or(
            eq(testYourselfConfigs.organizationId, this.organizationId),
            sql`${testYourselfConfigs.organizationId} IS NULL` // 包含全局配置
          )
        );
      }

      const result = await this.db
        .select()
        .from(testYourselfConfigs)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(testYourselfConfigs.createdAt));

      return result.map((config: TestYourselfConfig) => this.toSavedConfig(config));
    } catch (error) {
      console.error('❌ [DatabaseAdapter] 获取配置列表失败:', error);
      throw error;
    }
  }

  /**
   * 删除配置
   */
  async deleteConfig(id: string): Promise<void> {
    try {
      if (this.softDelete) {
        // 软删除
        await this.db
          .update(testYourselfConfigs)
          .set({
            isDeleted: true,
            deletedAt: new Date(),
            updatedBy: this.userId,
            updatedAt: new Date(),
          })
          .where(eq(testYourselfConfigs.id, id));

        console.log('🗑️ [DatabaseAdapter] 配置已软删除:', id);
      } else {
        // 硬删除
        await this.db
          .delete(testYourselfConfigs)
          .where(eq(testYourselfConfigs.id, id));

        console.log('🗑️ [DatabaseAdapter] 配置已硬删除:', id);
      }
    } catch (error) {
      console.error('❌ [DatabaseAdapter] 删除配置失败:', error);
      throw error;
    }
  }

  /**
   * 更新配置
   */
  async updateConfig(id: string, config: SavedConfig): Promise<void> {
    try {
      const resultCount = config.config.results?.length || 0;

      await this.db
        .update(testYourselfConfigs)
        .set({
          name: config.name,
          description: config.description || null,
          config: config.config,
          resultCount,
          isDefault: config.isDefault || false,
          updatedBy: this.userId,
          updatedAt: new Date(config.updatedAt),
          version: sql`${testYourselfConfigs.version} + 1`,
        })
        .where(eq(testYourselfConfigs.id, id));

      console.log('✅ [DatabaseAdapter] 配置已更新:', id);
    } catch (error) {
      console.error('❌ [DatabaseAdapter] 更新配置失败:', error);
      throw error;
    }
  }

  /**
   * 设置默认配置
   */
  async setDefaultConfig(id: string): Promise<void> {
    try {
      // 使用事务确保原子性
      await this.db.transaction(async (tx: any) => {
        // 1. 清除所有默认配置标记
        const conditions = [eq(testYourselfConfigs.isDefault, true)];
        
        if (this.organizationId) {
          conditions.push(
            eq(testYourselfConfigs.organizationId, this.organizationId)
          );
        }

        await tx
          .update(testYourselfConfigs)
          .set({
            isDefault: false,
            updatedBy: this.userId,
            updatedAt: new Date(),
          })
          .where(and(...conditions));

        // 2. 设置新的默认配置
        await tx
          .update(testYourselfConfigs)
          .set({
            isDefault: true,
            updatedBy: this.userId,
            updatedAt: new Date(),
          })
          .where(eq(testYourselfConfigs.id, id));
      });

      console.log('✅ [DatabaseAdapter] 默认配置已设置:', id);
    } catch (error) {
      console.error('❌ [DatabaseAdapter] 设置默认配置失败:', error);
      throw error;
    }
  }

  /**
   * 获取默认配置
   */
  async getDefaultConfig(): Promise<SavedConfig | null> {
    try {
      const conditions = [eq(testYourselfConfigs.isDefault, true)];

      // 如果启用软删除，过滤已删除的记录
      if (this.softDelete) {
        conditions.push(eq(testYourselfConfigs.isDeleted, false));
      }

      // 如果设置了组织ID，只查询该组织的配置
      if (this.organizationId) {
        conditions.push(
          eq(testYourselfConfigs.organizationId, this.organizationId)
        );
      }

      const result = await this.db
        .select()
        .from(testYourselfConfigs)
        .where(and(...conditions))
        .limit(1);

      if (!result || result.length === 0) {
        return null;
      }

      return this.toSavedConfig(result[0]);
    } catch (error) {
      console.error('❌ [DatabaseAdapter] 获取默认配置失败:', error);
      throw error;
    }
  }

  /**
   * 恢复已删除的配置（软删除时可用）
   */
  async restoreConfig(id: string): Promise<void> {
    if (!this.softDelete) {
      throw new Error('恢复功能仅在启用软删除时可用');
    }

    try {
      await this.db
        .update(testYourselfConfigs)
        .set({
          isDeleted: false,
          deletedAt: null,
          updatedBy: this.userId,
          updatedAt: new Date(),
        })
        .where(eq(testYourselfConfigs.id, id));

      console.log('♻️ [DatabaseAdapter] 配置已恢复:', id);
    } catch (error) {
      console.error('❌ [DatabaseAdapter] 恢复配置失败:', error);
      throw error;
    }
  }

  /**
   * 归档配置
   */
  async archiveConfig(id: string): Promise<void> {
    try {
      await this.db
        .update(testYourselfConfigs)
        .set({
          isArchived: true,
          archivedAt: new Date(),
          updatedBy: this.userId,
          updatedAt: new Date(),
        })
        .where(eq(testYourselfConfigs.id, id));

      console.log('📦 [DatabaseAdapter] 配置已归档:', id);
    } catch (error) {
      console.error('❌ [DatabaseAdapter] 归档配置失败:', error);
      throw error;
    }
  }

  /**
   * 取消归档
   */
  async unarchiveConfig(id: string): Promise<void> {
    try {
      await this.db
        .update(testYourselfConfigs)
        .set({
          isArchived: false,
          archivedAt: null,
          updatedBy: this.userId,
          updatedAt: new Date(),
        })
        .where(eq(testYourselfConfigs.id, id));

      console.log('📂 [DatabaseAdapter] 配置已取消归档:', id);
    } catch (error) {
      console.error('❌ [DatabaseAdapter] 取消归档失败:', error);
      throw error;
    }
  }

  /**
   * 记录使用次数
   */
  async incrementUsageCount(id: string): Promise<void> {
    try {
      await this.db
        .update(testYourselfConfigs)
        .set({
          usageCount: sql`${testYourselfConfigs.usageCount} + 1`,
          lastUsedAt: new Date(),
        })
        .where(eq(testYourselfConfigs.id, id));
    } catch (error) {
      console.error('❌ [DatabaseAdapter] 更新使用次数失败:', error);
      // 不抛出错误，避免影响主流程
    }
  }
}

/**
 * 创建数据库配置适配器
 * 
 * @example
 * ```typescript
 * import { drizzle } from 'drizzle-orm/postgres-js';
 * import { createDatabaseConfigAdapter } from './DatabaseConfigAdapter';
 * 
 * const db = drizzle(connection);
 * const adapter = createDatabaseConfigAdapter({
 *   db,
 *   userId: 'user-123',
 *   organizationId: 'org-456',
 * });
 * 
 * // 在 ConfigService 中使用
 * const configService = new ConfigService({
 *   storageType: 'custom',
 *   customStorage: adapter,
 * });
 * ```
 */
export function createDatabaseConfigAdapter(
  options: DatabaseConfigAdapterOptions
): DatabaseConfigAdapter {
  return new DatabaseConfigAdapter(options);
}
