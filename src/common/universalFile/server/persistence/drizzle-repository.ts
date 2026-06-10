// @ts-nocheck
/**
 * Drizzle ORM 文件元数据持久化适配器
 *
 * 提供基于 Drizzle ORM 的数据库持久化实现
 */

import { eq, and, desc, sql, SQL } from 'drizzle-orm';
import type { FileMetadata, FileQueryOptions, PaginatedResult } from '../../types';
import type { IFileMetadataRepository } from '../types';
import { createLogger } from '../../../logger';

const logger = createLogger('DrizzleFileRepository');

/**
 * Drizzle 表定义类型（兼容多种 Drizzle 表结构）
 */
export type DrizzleTable = any;

/**
 * Drizzle 数据库连接类型
 */
export type DrizzleDb = any;

/**
 * 字段映射配置
 *
 * 将 FileMetadata 的字段映射到数据库表的列名
 */
export interface FieldMapping {
  id?: string;
  filename?: string;
  originalName?: string;
  mimeType?: string;
  size?: string;
  hash?: string;
  storageType?: string;
  storagePath?: string;
  url?: string;
  cdnUrl?: string;
  moduleId?: string;
  businessId?: string;
  userId?: string;
  uploadedAt?: string;
  expiresAt?: string;
  metadata?: string;
  status?: string;
  processingStatus?: string;
  versions?: string;
  tags?: string;
}

/**
 * Drizzle 仓储配置
 */
export interface DrizzleRepositoryConfig {
  /** Drizzle 数据库实例 */
  db: DrizzleDb;
  /** 文件元数据表 */
  table: DrizzleTable;
  /** 字段映射（如果数据库列名与 FileMetadata 字段不同） */
  fieldMapping?: FieldMapping;
}

/**
 * 创建 Drizzle ORM 文件仓储
 *
 * @example
 * ```typescript
 * import { createDrizzleRepository } from '@qhr123/sa2kit/universalFile/server';
 * import { db } from './db';
 * import { fileMetadata } from './schema';
 *
 * const repository = createDrizzleRepository({
 *   db,
 *   table: fileMetadata,
 *   fieldMapping: {
 *     // 如果列名与 FileMetadata 字段不同，可以在这里映射
 *     originalName: 'original_filename',
 *   }
 * });
 * ```
 */
export function createDrizzleRepository(config: DrizzleRepositoryConfig): IFileMetadataRepository {
  const { db, table, fieldMapping = {} } = config;

  /**
   * 获取字段名（考虑映射）
   */
  const getField = (field: keyof FieldMapping): string => {
    return (fieldMapping[field] || field) as string;
  };

  /**
   * 将 FileMetadata 转换为数据库记录
   */
  const toDbRecord = (metadata: FileMetadata): any => {
    const record: any = {
      [getField('id')]: metadata.id,
      [getField('filename')]: metadata.filename,
      [getField('originalName')]: metadata.originalName,
      [getField('mimeType')]: metadata.mimeType,
      [getField('size')]: metadata.size,
      [getField('storageType')]: metadata.storageType,
      [getField('storagePath')]: metadata.storagePath,
      [getField('url')]: metadata.url,
      [getField('moduleId')]: metadata.moduleId,
      [getField('businessId')]: metadata.businessId,
      [getField('uploadedAt')]: metadata.uploadedAt,
    };

    // 可选字段
    if (metadata.hash !== undefined) record[getField('hash')] = metadata.hash;
    if (metadata.cdnUrl !== undefined) record[getField('cdnUrl')] = metadata.cdnUrl;
    if (metadata.userId !== undefined) record[getField('userId')] = metadata.userId;
    if (metadata.expiresAt !== undefined) record[getField('expiresAt')] = metadata.expiresAt;
    if (metadata.metadata !== undefined) record[getField('metadata')] = metadata.metadata;
    if (metadata.status !== undefined) record[getField('status')] = metadata.status;
    if (metadata.processingStatus !== undefined) record[getField('processingStatus')] = metadata.processingStatus;
    if (metadata.versions !== undefined) record[getField('versions')] = metadata.versions;
    if (metadata.tags !== undefined) record[getField('tags')] = metadata.tags;

    return record;
  };

  /**
   * 将数据库记录转换为 FileMetadata
   */
  const toFileMetadata = (record: any): FileMetadata => {
    const metadata: FileMetadata = {
      id: record[getField('id')],
      filename: record[getField('filename')],
      originalName: record[getField('originalName')],
      mimeType: record[getField('mimeType')],
      size: record[getField('size')],
      storageType: record[getField('storageType')],
      storagePath: record[getField('storagePath')],
      url: record[getField('url')],
      moduleId: record[getField('moduleId')],
      businessId: record[getField('businessId')],
      uploadedAt: record[getField('uploadedAt')],
    };

    // 可选字段
    if (record[getField('hash')]) metadata.hash = record[getField('hash')];
    if (record[getField('cdnUrl')]) metadata.cdnUrl = record[getField('cdnUrl')];
    if (record[getField('userId')]) metadata.userId = record[getField('userId')];
    if (record[getField('expiresAt')]) metadata.expiresAt = record[getField('expiresAt')];
    if (record[getField('metadata')]) metadata.metadata = record[getField('metadata')];
    if (record[getField('status')]) metadata.status = record[getField('status')];
    if (record[getField('processingStatus')]) metadata.processingStatus = record[getField('processingStatus')];
    if (record[getField('versions')]) metadata.versions = record[getField('versions')];
    if (record[getField('tags')]) metadata.tags = record[getField('tags')];

    return metadata;
  };

  return {
    async save(metadata: FileMetadata): Promise<void> {
      try {
        const record = toDbRecord(metadata);

        // 检查是否存在
        const existing = await db
          .select()
          .from(table)
          .where(eq(table[getField('id')], metadata.id))
          .limit(1);

        if (existing && existing.length > 0) {
          // 更新
          await db
            .update(table)
            .set(record)
            .where(eq(table[getField('id')], metadata.id));

          logger.info('✅ [DrizzleRepository] 文件元数据已更新: ' + (metadata.id));
        } else {
          // 插入
          await db.insert(table).values(record);
          logger.info('✅ [DrizzleRepository] 文件元数据已插入: ' + (metadata.id));
        }
      } catch (error) {
        logger.error('❌ [DrizzleRepository] 保存失败: ' + (metadata.id), error);
        throw error;
      }
    },

    async get(fileId: string): Promise<FileMetadata | null> {
      try {
        const result = await db
          .select()
          .from(table)
          .where(eq(table[getField('id')], fileId))
          .limit(1);

        if (!result || result.length === 0) {
          return null;
        }

        return toFileMetadata(result[0]);
      } catch (error) {
        logger.error('❌ [DrizzleRepository] 查询失败: ' + (fileId), error);
        throw error;
      }
    },

    async query(options: FileQueryOptions): Promise<PaginatedResult<FileMetadata>> {
      try {
        const {
          page = 1,
          pageSize = 20,
          moduleId,
          businessId,
          userId,
          mimeType,
          status,
          startDate,
          endDate,
          tags,
        } = options;

        // 构建查询条件
        const conditions: SQL[] = [];

        if (moduleId) {
          conditions.push(eq(table[getField('moduleId')], moduleId));
        }
        if (businessId) {
          conditions.push(eq(table[getField('businessId')], businessId));
        }
        if (userId) {
          conditions.push(eq(table[getField('userId')], userId));
        }
        if (mimeType) {
          conditions.push(eq(table[getField('mimeType')], mimeType));
        }
        if (status) {
          conditions.push(eq(table[getField('status')], status));
        }
        if (startDate) {
          conditions.push(sql(table[getField('uploadedAt')]) + ' >= ' + (startDate));
        }
        if (endDate) {
          conditions.push(sql(table[getField('uploadedAt')]) + ' <= ' + (endDate));
        }
        if (tags && tags.length > 0) {
          // 假设 tags 是 JSON 数组字段
          for (const tag of tags) {
            conditions.push(sql(table[getField('tags')]) + ' @> ' + (JSON.stringify([tag])));
          }
        }

        // 查询总数
        const countResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(table)
          .where(conditions.length > 0 ? and(...conditions) : undefined);

        const total = Number(countResult[0]?.count || 0);

        // 查询数据
        const offset = (page - 1) * pageSize;
        const result = await db
          .select()
          .from(table)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(table[getField('uploadedAt')]))
          .limit(pageSize)
          .offset(offset);

        const items = result.map(toFileMetadata);

        return {
          items,
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
        };
      } catch (error) {
        logger.error(`❌ [DrizzleRepository] 查询列表失败`, error);
        throw error;
      }
    },

    async delete(fileId: string): Promise<void> {
      try {
        await db
          .delete(table)
          .where(eq(table[getField('id')], fileId));

        logger.info('🗑️ [DrizzleRepository] 文件元数据已删除: ' + (fileId));
      } catch (error) {
        logger.error('❌ [DrizzleRepository] 删除失败: ' + (fileId), error);
        throw error;
      }
    },

    async batchDelete(fileIds: string[]): Promise<void> {
      try {
        if (fileIds.length === 0) return;

        // 批量删除
        await db
          .delete(table)
          .where(sql(table[getField('id')]) + ' = ANY(' + (fileIds) + ')');

        logger.info('🗑️ [DrizzleRepository] 批量删除成功: ' + (fileIds.length) + ' 个文件');
      } catch (error) {
        logger.error(`❌ [DrizzleRepository] 批量删除失败`, error);
        throw error;
      }
    },
  };
}

