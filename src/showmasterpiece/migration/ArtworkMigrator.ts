// @ts-nocheck
/**
 * ShowMasterpiece模块 - 作品图片迁移工具
 * 
 * 将现有的Base64图片数据迁移到通用文件服务系统
 * 
 * 主要功能：
 * - Base64图片解析和验证
 * - 上传到通用文件服务
 * - 更新数据库引用
 * - 迁移状态跟踪
 * - 回滚机制
 */

import { comicUniverseArtworks, comicUniverseCollections } from '../server';
import { fileMetadata, fileFolders, fileStorageProviders } from '../../universalFile/server';
import { eq, and, inArray, isNull, or } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join, extname, basename } from 'path';

/**
 * 迁移配置接口
 */
export interface MigrationConfig {
  /** 批处理大小 */
  batchSize: number;
  /** 是否试运行 */
  dryRun: boolean;
  /** 是否验证文件完整性 */
  validateFiles: boolean;
  /** 是否备份原数据 */
  backupOldData: boolean;
  /** 是否强制覆盖已存在的文件 */
  forceOverwrite: boolean;
  /** 是否上传到OSS */
  enableOSSUpload: boolean;
  /** 指定画集ID（空表示全部） */
  collectionIds?: number[];
}

/**
 * 迁移统计信息
 */
export interface MigrationStats {
  totalArtworks: number;
  processedCount: number;
  successCount: number;
  failedCount: number;
  skippedCount: number;
  totalFileSize: number;
  processedFileSize: number;
  errors: Array<{
    artworkId: number;
    error: string;
    timestamp: Date;
  }>;
}

/**
 * 作品迁移器类
 */
export class ArtworkMigrator {
  private readonly db: any;
  private config: MigrationConfig;
  private stats: MigrationStats;
  private folderCache = new Map<string, any>();
  private storageProviderCache = new Map<string, any>();

  constructor(db: any, config: MigrationConfig) {
    this.db = db;
    this.config = config;
    this.stats = {
      totalArtworks: 0,
      processedCount: 0,
      successCount: 0,
      failedCount: 0,
      skippedCount: 0,
      totalFileSize: 0,
      processedFileSize: 0,
      errors: []
    };
  }

  /**
   * 开始迁移
   */
  async migrate(): Promise<MigrationStats> {
    console.log('🚀 [ArtworkMigrator] 开始作品图片迁移...');
    console.log('📋 [ArtworkMigrator] 配置:', this.config);

    try {
      // 1. 分析现有数据
      await this.analyzeData();

      // 2. 准备迁移环境
      await this.prepareMigrationEnvironment();

      // 3. 执行批量迁移
      await this.performBatchMigration();

      // 4. 生成迁移报告
      this.generateReport();

      return this.stats;
    } catch (error) {
      console.error('💥 [ArtworkMigrator] 迁移失败:', error);
      throw error;
    }
  }

  /**
   * 分析现有数据
   */
  private async analyzeData(): Promise<void> {
    console.log('🔍 [ArtworkMigrator] 分析现有数据...');

    const whereConditions = [];
    
    // 添加画集ID筛选
    if (this.config.collectionIds && this.config.collectionIds.length > 0) {
      whereConditions.push(inArray(comicUniverseArtworks.collectionId, this.config.collectionIds));
    }

    // 只处理有图片数据且尚未迁移的记录
    whereConditions.push(
      and(
        or(
          isNull(comicUniverseArtworks.fileId),
          eq(comicUniverseArtworks.migrationStatus, 'pending'),
          eq(comicUniverseArtworks.migrationStatus, 'failed')
        ),
        // 必须有image数据（兼容可能的null值）
        eq(comicUniverseArtworks.isActive, true)
      )
    );

    const query = this.db
      .select({
        id: comicUniverseArtworks.id,
        title: comicUniverseArtworks.title,
        image: comicUniverseArtworks.image,
        collectionId: comicUniverseArtworks.collectionId,
        migrationStatus: comicUniverseArtworks.migrationStatus
      })
      .from(comicUniverseArtworks);

    if (whereConditions.length > 0) {
      query.where(and(...whereConditions));
    }

    const artworks = await query;

    // 计算统计信息
    this.stats.totalArtworks = artworks.length;
    
    for (const artwork of artworks) {
      if (artwork.image && artwork.image.startsWith('data:')) {
        const base64Data = artwork.image.split(',')[1];
        if (base64Data) {
          this.stats.totalFileSize += Math.round(base64Data.length * 0.75); // Base64 to bytes
        }
      }
    }

    console.log('📊 [ArtworkMigrator] 数据分析结果:', {
      totalArtworks: this.stats.totalArtworks,
      totalFileSize: `${(this.stats.totalFileSize / 1024 / 1024).toFixed(2)} MB`,
      collectionFilter: this.config.collectionIds?.length || 'all'
    });

    if (this.stats.totalArtworks === 0) {
      console.log('ℹ️ [ArtworkMigrator] 没有需要迁移的作品');
      return;
    }
  }

  /**
   * 准备迁移环境
   */
  private async prepareMigrationEnvironment(): Promise<void> {
    console.log('🛠️ [ArtworkMigrator] 准备迁移环境...');

    // 1. 确保存储提供者存在
    await this.ensureStorageProvider();

    // 2. 创建模块文件夹
    await this.ensureModuleFolders();

    // 3. 备份原数据（如果启用）
    if (this.config.backupOldData && !this.config.dryRun) {
      await this.backupOriginalData();
    }
  }

     /**
    * 确保存储提供者存在
    */
   private async ensureStorageProvider(): Promise<void> {
     let provider = this.storageProviderCache.get('local-default');
     if (!provider) {
       const [existingProvider] = await this.db
         .select()
         .from(fileStorageProviders)
         .where(eq(fileStorageProviders.name, 'local-default'))
         .limit(1);

       if (existingProvider) {
         provider = existingProvider;
       } else if (!this.config.dryRun) {
         // 创建默认本地存储提供者
         [provider] = await this.db
           .insert(fileStorageProviders)
           .values({
             name: 'local-default',
             type: 'local',
             config: {
               basePath: './uploads',
               publicUrl: '/uploads'
             },
             isDefault: true,
             isActive: true
           })
           .returning();
       } else {
         // 试运行模式下创建模拟存储提供者
         provider = {
           id: 1,
           name: 'local-default',
           type: 'local',
           config: {
             basePath: './uploads',
             publicUrl: '/uploads'
           },
           isDefault: true,
           isActive: true,
           priority: 100,
           maxFileSize: null,
           supportedMimeTypes: null,
           createdAt: new Date(),
           updatedAt: new Date()
         };
       }

       if (provider) {
         this.storageProviderCache.set('local-default', provider);
       }
     }
   }

     /**
    * 确保模块文件夹存在
    */
   private async ensureModuleFolders(): Promise<void> {
     // 创建ShowMasterpiece根文件夹
     const rootFolderId = uuidv4();
     const rootFolderName = 'ShowMasterpiece';
     
     let rootFolder = this.folderCache.get(rootFolderName);
     if (!rootFolder) {
       const [existingFolder] = await this.db
         .select()
         .from(fileFolders)
         .where(eq(fileFolders.name, rootFolderName))
         .limit(1);

       if (existingFolder) {
         rootFolder = existingFolder;
       } else if (!this.config.dryRun) {
         [rootFolder] = await this.db
           .insert(fileFolders)
           .values({
             id: rootFolderId,
             name: rootFolderName,
             path: '/showmasterpiece',
             moduleId: 'showmasterpiece',
             depth: 1,
             sortOrder: 1,
             isSystem: true,
             createdBy: 'system'
           })
           .returning();
       } else {
         // 试运行模式下创建模拟文件夹对象
         rootFolder = {
           id: rootFolderId,
           name: rootFolderName,
           path: '/showmasterpiece',
           moduleId: 'showmasterpiece',
           depth: 1,
           sortOrder: 1,
           isSystem: true,
           createdBy: 'system'
         };
       }

       if (rootFolder) {
         this.folderCache.set(rootFolderName, rootFolder);
       }
     }

     // 获取需要处理的画集ID（从现有数据中获取）
     let collectionIds = this.config.collectionIds;
     if (!collectionIds) {
       const artworks = await this.db
         .select({ collectionId: comicUniverseArtworks.collectionId })
         .from(comicUniverseArtworks)
         .where(eq(comicUniverseArtworks.isActive, true));
       
       const uniqueCollectionIds = [...new Set(artworks.map(a => a.collectionId))];
       collectionIds = uniqueCollectionIds;
     }

     if (collectionIds && collectionIds.length > 0) {
       const collections = await this.db
         .select({
           id: comicUniverseCollections.id,
           title: comicUniverseCollections.title
         })
         .from(comicUniverseCollections)
         .where(inArray(comicUniverseCollections.id, collectionIds));

       for (const collection of collections) {
         const folderName = `Collection-${collection.id}`;
         let collectionFolder = this.folderCache.get(folderName);
         
         if (!collectionFolder) {
           if (!this.config.dryRun) {
             const folderId = uuidv4();
             [collectionFolder] = await this.db
               .insert(fileFolders)
               .values({
                 id: folderId,
                 name: collection.title,
                 path: `/showmasterpiece/collection-${collection.id}`,
                 moduleId: 'showmasterpiece',
                 parentId: rootFolder?.id,
                 depth: 2,
                 sortOrder: collection.id,
                 isSystem: false,
                 createdBy: 'system'
               })
               .returning();
           } else {
             // 试运行模式下创建模拟文件夹对象
             collectionFolder = {
               id: uuidv4(),
               name: collection.title,
               path: `/showmasterpiece/collection-${collection.id}`,
               moduleId: 'showmasterpiece',
               parentId: rootFolder?.id,
               depth: 2,
               sortOrder: collection.id,
               isSystem: false,
               createdBy: 'system'
             };
           }

           this.folderCache.set(folderName, collectionFolder);
         }
       }
     }
   }

  /**
   * 备份原始数据
   */
  private async backupOriginalData(): Promise<void> {
    console.log('💾 [ArtworkMigrator] 备份原始数据...');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = `./backups/showmasterpiece/${timestamp}`;
    
    if (!existsSync(backupDir)) {
      mkdirSync(backupDir, { recursive: true });
    }

    // 备份作品数据
    const artworks = await this.db
      .select()
      .from(comicUniverseArtworks)
      .where(eq(comicUniverseArtworks.isActive, true));

    writeFileSync(
      join(backupDir, 'artworks_backup.json'),
      JSON.stringify(artworks, null, 2)
    );

    console.log(`✅ [ArtworkMigrator] 备份完成: ${backupDir}`);
  }

  /**
   * 执行批量迁移
   */
  private async performBatchMigration(): Promise<void> {
    console.log('🔄 [ArtworkMigrator] 开始批量迁移...');

    // 获取需要迁移的作品
    const whereConditions = [];
    
    if (this.config.collectionIds && this.config.collectionIds.length > 0) {
      whereConditions.push(inArray(comicUniverseArtworks.collectionId, this.config.collectionIds));
    }

    whereConditions.push(
      and(
        or(
          isNull(comicUniverseArtworks.fileId),
          eq(comicUniverseArtworks.migrationStatus, 'pending'),
          eq(comicUniverseArtworks.migrationStatus, 'failed')
        ),
        eq(comicUniverseArtworks.isActive, true)
      )
    );

    const query = this.db
      .select()
      .from(comicUniverseArtworks);

    if (whereConditions.length > 0) {
      query.where(and(...whereConditions));
    }

    const artworks = await query;

    // 分批处理
    const totalBatches = Math.ceil(artworks.length / this.config.batchSize);
    
    for (let i = 0; i < totalBatches; i++) {
      const start = i * this.config.batchSize;
      const end = Math.min(start + this.config.batchSize, artworks.length);
      const batch = artworks.slice(start, end);
      
      console.log(`📦 [ArtworkMigrator] 处理批次 ${i + 1}/${totalBatches}`);
      
      for (const artwork of batch) {
        try {
          await this.migrateArtwork(artwork);
        } catch (error) {
          console.error(`❌ [ArtworkMigrator] 迁移作品失败 ${artwork.id}:`, error);
          this.stats.errors.push({
            artworkId: artwork.id,
            error: error instanceof Error ? error.message : String(error),
            timestamp: new Date()
          });
          this.stats.failedCount++;
        }
        this.stats.processedCount++;
      }
    }
  }

  /**
   * 迁移单个作品
   */
  private async migrateArtwork(artwork: any): Promise<void> {
    console.log(`📄 [ArtworkMigrator] 迁移作品: ${artwork.id} - ${artwork.title}`);

    // 1. 检查是否已经迁移
    if (artwork.fileId && artwork.migrationStatus === 'completed' && !this.config.forceOverwrite) {
      console.log(`⏭️ [ArtworkMigrator] 作品 ${artwork.id} 已迁移，跳过`);
      this.stats.skippedCount++;
      return;
    }

    // 2. 验证图片数据
    if (!artwork.image || !artwork.image.startsWith('data:')) {
      console.log(`⚠️ [ArtworkMigrator] 作品 ${artwork.id} 没有有效的图片数据`);
      this.stats.skippedCount++;
      return;
    }

    // 3. 解析Base64图片
    const { mimeType, buffer, extension } = this.parseBase64Image(artwork.image);
    const fileSize = buffer.length;

    // 4. 生成文件哈希
    const md5Hash = createHash('md5').update(buffer).digest('hex');
    const sha256Hash = createHash('sha256').update(buffer).digest('hex');

    // 5. 获取存储提供者和文件夹
    const provider = this.storageProviderCache.get('local-default');
    if (!provider) {
      throw new Error('存储提供者未找到');
    }

    const folderName = `Collection-${artwork.collectionId}`;
    const folder = this.folderCache.get(folderName) || this.folderCache.get('ShowMasterpiece');
    if (!folder) {
      throw new Error('目标文件夹未找到');
    }

    // 6. 生成文件名和路径
    const storedName = `artwork-${artwork.id}-${Date.now()}${extension}`;
    const storagePath = `showmasterpiece/collection-${artwork.collectionId}/${storedName}`;
    const fullPath = join('./uploads', storagePath);

    // 7. 保存文件
    if (!this.config.dryRun) {
      const dir = fullPath.substring(0, fullPath.lastIndexOf('/'));
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      writeFileSync(fullPath, buffer);
    }

    // 8. 验证文件
    if (this.config.validateFiles && !this.config.dryRun) {
      const savedBuffer = readFileSync(fullPath);
      const savedHash = createHash('md5').update(savedBuffer).digest('hex');
      if (savedHash !== md5Hash) {
        throw new Error('文件验证失败：哈希不匹配');
      }
    }

    // 9. 创建文件元数据记录
    let fileRecord = null;
    if (!this.config.dryRun) {
             [fileRecord] = await this.db.insert(fileMetadata).values({
         originalName: `${artwork.title}${extension}`,
         storedName,
         extension: extension.substring(1),
         mimeType,
         size: fileSize,
         md5Hash,
         sha256Hash,
         storagePath,
         storageProviderId: provider.id,
         folderId: folder.id,
         moduleId: 'showmasterpiece',
         businessId: artwork.collectionId.toString(),
         tags: ['artwork', 'masterpiece'],
         uploaderId: 'system'
       }).returning();
    }

    // 10. 更新作品记录
    if (!this.config.dryRun && fileRecord) {
      await this.db
        .update(comicUniverseArtworks)
        .set({
          fileId: fileRecord.id,
          migrationStatus: 'completed',
          updatedAt: new Date()
        })
        .where(eq(comicUniverseArtworks.id, artwork.id));
    }

    this.stats.successCount++;
    this.stats.processedFileSize += fileSize;

    console.log(`✅ [ArtworkMigrator] 作品 ${artwork.id} 迁移成功`);
  }

  /**
   * 解析Base64图片
   */
  private parseBase64Image(dataUrl: string): { mimeType: string; buffer: Buffer; extension: string } {
    const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) {
      throw new Error('无效的Base64图片格式');
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    // 根据MIME类型确定文件扩展名
    const extensionMap: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'image/bmp': '.bmp'
    };

    const extension = extensionMap[mimeType] || '.jpg';

    return { mimeType, buffer, extension };
  }

  /**
   * 生成迁移报告
   */
  private generateReport(): void {
    console.log('\n📊 [ArtworkMigrator] 迁移完成报告:');
    console.log('='.repeat(50));
    console.log(`总作品数: ${this.stats.totalArtworks}`);
    console.log(`处理数量: ${this.stats.processedCount}`);
    console.log(`成功数量: ${this.stats.successCount}`);
    console.log(`失败数量: ${this.stats.failedCount}`);
    console.log(`跳过数量: ${this.stats.skippedCount}`);
    console.log(`总文件大小: ${(this.stats.totalFileSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`已处理大小: ${(this.stats.processedFileSize / 1024 / 1024).toFixed(2)} MB`);
    
    if (this.stats.errors.length > 0) {
      console.log('\n❌ 错误详情:');
      this.stats.errors.forEach((error, index) => {
        console.log(`${index + 1}. 作品 ${error.artworkId}: ${error.error}`);
      });
    }
    
    const successRate = this.stats.totalArtworks > 0 
      ? ((this.stats.successCount / this.stats.totalArtworks) * 100).toFixed(2)
      : '0';
    console.log(`\n✅ 成功率: ${successRate}%`);
  }

  /**
   * 回滚单个作品
   */
  async rollbackArtwork(artworkId: number): Promise<void> {
    console.log(`🔄 [ArtworkMigrator] 回滚作品: ${artworkId}`);

    const [artwork] = await this.db
      .select()
      .from(comicUniverseArtworks)
      .where(eq(comicUniverseArtworks.id, artworkId))
      .limit(1);

    if (!artwork) {
      throw new Error(`作品 ${artworkId} 不存在`);
    }

    if (!artwork.fileId) {
      console.log(`⚠️ [ArtworkMigrator] 作品 ${artworkId} 没有文件引用，无需回滚`);
      return;
    }

    // 删除文件记录和物理文件
    const [fileRecord] = await this.db
      .select()
      .from(fileMetadata)
      .where(eq(fileMetadata.id, artwork.fileId))
      .limit(1);

    if (fileRecord) {
      const fullPath = join('./uploads', fileRecord.storagePath);
      if (existsSync(fullPath)) {
        // 这里可以添加文件删除逻辑，但为了安全起见，暂时保留文件
        console.log(`📁 [ArtworkMigrator] 保留文件: ${fullPath}`);
      }

      // 删除文件元数据记录
      await this.db
        .delete(fileMetadata)
        .where(eq(fileMetadata.id, artwork.fileId));
    }

    // 重置作品的迁移状态
    await this.db
      .update(comicUniverseArtworks)
      .set({
        fileId: null,
        migrationStatus: 'pending',
        updatedAt: new Date()
      })
      .where(eq(comicUniverseArtworks.id, artworkId));

    console.log(`✅ [ArtworkMigrator] 作品 ${artworkId} 回滚完成`);
  }
} 
