/**
 * Drizzle ORM 适配器
 *
 * 实现 IFileMetadataRepository 接口
 */

import type { IFileMetadataRepository, FileQueryOptions, PaginatedResult, StorageType } from '../types';
import { eq, and, like, desc, asc } from 'drizzle-orm';

type FileMetadataInput = {
  id: string;
  originalName: string;
  storageName: string;
  size: number;
  mimeType: string;
  extension: string;
  hash?: string;
  uploadTime: Date;
  permission: 'public' | 'private' | 'authenticated' | 'owner-only';
  uploaderId: string;
  moduleId: string;
  businessId?: string;
  storageProvider: StorageType;
  storagePath: string;
  cdnUrl?: string;
  accessCount: number;
  lastAccessTime?: Date;
  expiresAt?: Date;
  metadata?: Record<string, any>;
};

interface DrizzleAdapterOptions {
  db: any;
  fileMetadata: any;
  fileStorageProviders: any;
}

export function createDrizzleFileRepository(options: DrizzleAdapterOptions): IFileMetadataRepository {
  const { db, fileMetadata: fileMetadataTable, fileStorageProviders } = options;

  return {
    async save(meta: any): Promise<void> {
      const [storageProvider] = await db
        .select()
        .from(fileStorageProviders)
        .where(eq(fileStorageProviders.type, meta.storageProvider as string))
        .limit(1);

      let providerId: number;

      if (!storageProvider) {
        const [defaultProvider] = await db
          .select()
          .from(fileStorageProviders)
          .where(eq(fileStorageProviders.isDefault, true))
          .limit(1);

        if (!defaultProvider) {
          throw new Error('未找到可用的存储提供者');
        }

        providerId = defaultProvider.id;
      } else {
        providerId = storageProvider.id;
      }

      await db.insert(fileMetadataTable).values({
        id: meta.id,
        originalName: meta.originalName,
        storedName: meta.storageName,
        extension: meta.extension,
        mimeType: meta.mimeType,
        size: meta.size,
        md5Hash: meta.hash?.substring(0, 32) || '',
        sha256Hash: meta.hash || '',
        storageProviderId: providerId,
        storagePath: meta.storagePath,
        cdnUrl: meta.cdnUrl,
        moduleId: meta.moduleId,
        businessId: meta.businessId,
        tags: [],
        metadata: meta.metadata,
        isTemporary: false,
        isDeleted: false,
        accessCount: meta.accessCount || 0,
        downloadCount: 0,
        uploaderId: meta.uploaderId || 'system',
        uploadTime: meta.uploadTime,
        lastAccessTime: meta.lastAccessTime,
        expiresAt: meta.expiresAt,
      });
    },

    async get(fileId: string): Promise<any | null> {
      const [record] = await db
        .select()
        .from(fileMetadataTable)
        .where(eq(fileMetadataTable.id, fileId))
        .limit(1);

      if (!record) {
        return null;
      }

      const [provider] = await db
        .select()
        .from(fileStorageProviders)
        .where(eq(fileStorageProviders.id, record.storageProviderId))
        .limit(1);

      if (!provider) {
        return null;
      }

      const result: FileMetadataInput = {
        id: record.id,
        originalName: record.originalName,
        storageName: record.storedName,
        size: record.size,
        mimeType: record.mimeType,
        extension: record.extension || '',
        hash: record.md5Hash,
        uploadTime: record.uploadTime,
        permission: 'public' as const,
        uploaderId: record.uploaderId,
        moduleId: record.moduleId || '',
        businessId: record.businessId || undefined,
        storageProvider: provider.type as StorageType,
        storagePath: record.storagePath,
        cdnUrl: record.cdnUrl || undefined,
        accessCount: record.accessCount,
        lastAccessTime: record.lastAccessTime || undefined,
        expiresAt: record.expiresAt || undefined,
        metadata: (record.metadata as Record<string, any>) || {},
      };

      return result;
    },

    async query(options: FileQueryOptions): Promise<PaginatedResult<any>> {
      const page = options.page || 1;
      const pageSize = options.pageSize || 20;
      const offset = (page - 1) * pageSize;

      const conditions: any[] = [];

      if (options.moduleId) {
        conditions.push(eq(fileMetadataTable.moduleId, options.moduleId));
      }

      if (options.businessId) {
        conditions.push(eq(fileMetadataTable.businessId, options.businessId));
      }

      if (options.uploaderId) {
        conditions.push(eq(fileMetadataTable.uploaderId, options.uploaderId));
      }

      if (options.mimeType) {
        conditions.push(like(fileMetadataTable.mimeType, `%${options.mimeType}%`));
      }

      const query = db.select().from(fileMetadataTable);

      if (conditions.length > 0) {
        query.where(and(...conditions));
      }

      const sortBy = options.orderBy || 'uploadTime';
      const sortOrder = options.orderDirection || 'desc';
      const orderFn = sortOrder === 'asc' ? asc : desc;
      query.orderBy(orderFn(fileMetadataTable[sortBy as keyof typeof fileMetadataTable] as any));

      query.limit(pageSize).offset(offset);

      const records = await query;

      const [countResult] = await db
        .select({ count: fileMetadataTable.id })
        .from(fileMetadataTable)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      const total = typeof countResult?.count === 'number' ? countResult.count : 0;
      const totalPages = Math.ceil(total / pageSize);

      const items: FileMetadataInput[] = [];
      for (const record of records) {
        const [provider] = await db
          .select()
          .from(fileStorageProviders)
          .where(eq(fileStorageProviders.id, record.storageProviderId))
          .limit(1);

        if (provider) {
          items.push({
            id: record.id,
            originalName: record.originalName,
            storageName: record.storedName,
            size: record.size,
            mimeType: record.mimeType,
            extension: record.extension || '',
            hash: record.md5Hash,
            uploadTime: record.uploadTime,
            permission: 'public' as const,
            uploaderId: record.uploaderId,
            moduleId: record.moduleId || '',
            businessId: record.businessId || undefined,
            storageProvider: provider.type as StorageType,
            storagePath: record.storagePath,
            cdnUrl: record.cdnUrl || undefined,
            accessCount: record.accessCount,
            lastAccessTime: record.lastAccessTime || undefined,
            expiresAt: record.expiresAt || undefined,
            metadata: (record.metadata as Record<string, any>) || {},
          });
        }
      }

      return {
        items,
        total,
        page,
        pageSize,
        totalPages,
      };
    },

    async delete(fileId: string): Promise<void> {
      await db
        .update(fileMetadataTable)
        .set({
          isDeleted: true,
          deletedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(fileMetadataTable.id, fileId));
    },

    async batchDelete(fileIds: string[]): Promise<void> {
      for (const fileId of fileIds) {
        await this.delete(fileId);
      }
    },
  };
}
