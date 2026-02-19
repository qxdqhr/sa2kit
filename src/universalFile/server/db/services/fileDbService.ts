/**
 * 通用文件服务数据库操作类
 * 提供基础的文件数据库CRUD操作
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, and, desc, sql, isNull, asc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { cacheManager } from '../../cache/CacheManager';
import { queryOptimizer } from '../middleware/queryOptimizer';
import {
  fileStorageProviders,
  fileFolders,
  fileMetadata,
  fileVersions,
  fileProcessingRecords,
  fileShares,
  fileAccessLogs,
  fileThumbnails,
  type FileStorageProvider,
  type FileFolder,
  type FileMetadata,
  type NewFileStorageProvider,
  type NewFileFolder,
  type NewFileMetadata,
  type NewFileVersion,
  type NewFileProcessingRecord,
  type NewFileShare,
  type NewFileAccessLog,
  type NewFileThumbnail,
} from '../../drizzle-schemas';

interface FileQueryOptions {
  moduleId?: string;
  businessId?: string;
  folderId?: string;
  offset?: number;
  limit?: number;
  isDeleted?: boolean;
  uploaderId?: string;
}

export class FileDbService {
  constructor(private db: ReturnType<typeof drizzle>) {}

  async getDefaultStorageProvider(): Promise<FileStorageProvider | null> {
    const result = await this.db
      .select()
      .from(fileStorageProviders)
      .where(and(eq(fileStorageProviders.isDefault, true), eq(fileStorageProviders.isActive, true)))
      .limit(1);

    return result[0] || null;
  }

  async createStorageProvider(provider: NewFileStorageProvider): Promise<FileStorageProvider> {
    const result = await this.db.insert(fileStorageProviders).values(provider).returning();
    if (!result[0]) {
      throw new Error('创建存储提供者失败');
    }
    return result[0];
  }

  async getFolderByPath(path: string, moduleId?: string): Promise<FileFolder | null> {
    const conditions = [eq(fileFolders.path, path)];

    if (moduleId) {
      conditions.push(eq(fileFolders.moduleId, moduleId));
    }

    const result = await this.db.select().from(fileFolders).where(and(...conditions)).limit(1);
    return result[0] || null;
  }

  async createFolder(folder: NewFileFolder): Promise<FileFolder> {
    const id = folder.id || uuidv4();
    const result = await this.db.insert(fileFolders).values({ ...folder, id }).returning();
    if (!result[0]) {
      throw new Error('创建文件夹失败');
    }
    return result[0];
  }

  async getFiles(options: FileQueryOptions = {}): Promise<{ files: FileMetadata[]; total: number }> {
    const whereConditions: any[] = [];

    if (options.moduleId) {
      whereConditions.push(eq(fileMetadata.moduleId, options.moduleId));
    }

    if (options.businessId) {
      whereConditions.push(eq(fileMetadata.businessId, options.businessId));
    }

    if (options.folderId) {
      whereConditions.push(eq(fileMetadata.folderId, options.folderId));
    }

    if (options.isDeleted !== undefined) {
      whereConditions.push(eq(fileMetadata.isDeleted, options.isDeleted));
    } else {
      whereConditions.push(eq(fileMetadata.isDeleted, false));
    }

    if (options.uploaderId) {
      whereConditions.push(eq(fileMetadata.uploaderId, options.uploaderId));
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(fileMetadata)
      .where(whereClause);

    const total = countResult[0]?.count ?? 0;

    let query = this.db
      .select()
      .from(fileMetadata)
      .where(whereClause)
      .orderBy(desc(fileMetadata.uploadTime));

    if (options.limit) {
      query = query.limit(options.limit) as any;
    }

    if (options.offset) {
      query = query.offset(options.offset) as any;
    }

    const files = await query;

    return { files, total };
  }

  async getFileById(id: string): Promise<FileMetadata | null> {
    const cacheKey = `file:${id}`;
    const cached = await cacheManager.get<FileMetadata>(cacheKey);
    if (cached) {
      return cached;
    }

    const result = await queryOptimizer.monitorQuery(
      async () => {
        return await this.db.select().from(fileMetadata).where(eq(fileMetadata.id, id)).limit(1);
      },
      `SELECT * FROM file_metadata WHERE id = $1 LIMIT 1`,
      [id],
    );

    const file = result[0] || null;

    if (file) {
      await cacheManager.set(cacheKey, file, 300);
    }

    return file;
  }

  async createFile(file: NewFileMetadata): Promise<FileMetadata> {
    const result = await this.db.insert(fileMetadata).values(file).returning();
    if (!result[0]) {
      throw new Error('创建文件失败');
    }
    await cacheManager.delete(`file:${result[0].id}`);
    return result[0];
  }

  async updateFile(id: string, updates: Partial<FileMetadata>): Promise<FileMetadata> {
    const result = await this.db.update(fileMetadata).set(updates).where(eq(fileMetadata.id, id)).returning();
    await cacheManager.delete(`file:${id}`);
    if (!result[0]) {
      throw new Error('更新文件失败');
    }
    return result[0];
  }

  async deleteFile(id: string): Promise<void> {
    await this.db.update(fileMetadata).set({ isDeleted: true }).where(eq(fileMetadata.id, id));
    await cacheManager.delete(`file:${id}`);
  }

  async getFolderById(folderId: string): Promise<FileFolder | null> {
    const result = await this.db.select().from(fileFolders).where(eq(fileFolders.id, folderId)).limit(1);
    return result[0] || null;
  }

  async getFolders(moduleId?: string, businessId?: string): Promise<FileFolder[]> {
    const conditions: any[] = [];
    if (moduleId) {
      conditions.push(eq(fileFolders.moduleId, moduleId));
    }
    if (businessId) {
      conditions.push(eq(fileFolders.businessId, businessId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    return this.db.select().from(fileFolders).where(whereClause).orderBy(asc(fileFolders.sortOrder));
  }

  async updateFolder(folderId: string, updates: Partial<FileFolder>): Promise<FileFolder> {
    const result = await this.db.update(fileFolders).set(updates).where(eq(fileFolders.id, folderId)).returning();
    if (!result[0]) {
      throw new Error('更新文件夹失败');
    }
    return result[0];
  }

  async deleteFolder(folderId: string): Promise<void> {
    await this.db.delete(fileFolders).where(eq(fileFolders.id, folderId));
  }

  async countFolderContents(folderId: string): Promise<{ files: number; folders: number }> {
    const [filesCount] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(fileMetadata)
      .where(and(eq(fileMetadata.folderId, folderId), eq(fileMetadata.isDeleted, false)));

    const [foldersCount] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(fileFolders)
      .where(eq(fileFolders.parentId, folderId));

    return {
      files: filesCount?.count ?? 0,
      folders: foldersCount?.count ?? 0,
    };
  }

  async createFileVersion(version: NewFileVersion): Promise<void> {
    await this.db.insert(fileVersions).values(version);
  }

  async createProcessingRecord(record: NewFileProcessingRecord): Promise<void> {
    await this.db.insert(fileProcessingRecords).values(record);
  }

  async createShare(share: NewFileShare): Promise<void> {
    await this.db.insert(fileShares).values(share);
  }

  async createAccessLog(log: NewFileAccessLog): Promise<void> {
    await this.db.insert(fileAccessLogs).values(log);
  }

  async createThumbnail(thumbnail: NewFileThumbnail): Promise<void> {
    await this.db.insert(fileThumbnails).values(thumbnail);
  }

  async listDeletedFiles(): Promise<FileMetadata[]> {
    return this.db.select().from(fileMetadata).where(eq(fileMetadata.isDeleted, true));
  }

  async clearDeletedFiles(days: number = 30): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const result = await this.db
      .delete(fileMetadata)
      .where(and(eq(fileMetadata.isDeleted, true), sql`${fileMetadata.updatedAt} < ${cutoff}`));

    return (result as any).rowCount || 0;
  }

  async getStorageStats() {
    const totalFiles = await this.db.select({ count: sql<number>`count(*)` }).from(fileMetadata);
    const totalSize = await this.db
      .select({ total: sql<number>`sum(${fileMetadata.size})` })
      .from(fileMetadata)
      .where(eq(fileMetadata.isDeleted, false));

    const byStorage = await this.db
      .select({
        storageProviderId: fileMetadata.storageProviderId,
        count: sql<number>`count(*)`,
        totalSize: sql<number>`sum(${fileMetadata.size})`,
      })
      .from(fileMetadata)
      .where(eq(fileMetadata.isDeleted, false))
      .groupBy(fileMetadata.storageProviderId);

    return {
      totalFiles: totalFiles[0]?.count || 0,
      totalSize: totalSize[0]?.total || 0,
      byStorage,
    };
  }
}
