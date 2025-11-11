// @ts-nocheck
/**
 * 通用文件服务核心实现
 *
 * 提供统一的文件上传、下载、管理接口
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';
import * as path from 'path';
import { createLogger } from '../../logger';
import { getMimeType } from './utils/mime';

const logger = createLogger('UniversalFileService');

import type {
  StorageType,
  CDNType,
  ProcessorType,
  FileMetadata,
  UploadFileInfo,
  UploadProgress,
  FileQueryOptions,
  PaginatedResult,
  BatchOperationResult,
  FileEvent,
  FileEventListener,
} from '../types';

// Backend specific types
import type {
  UniversalFileServiceConfig,
  IStorageProvider,
  ICDNProvider,
  IFileProcessor,
} from './types';

import {
  FileUploadError,
  FileProcessingError,
  StorageProviderError,
} from '../types';

/**
 * 通用文件服务类
 */
export class UniversalFileService extends EventEmitter {
  private config: UniversalFileServiceConfig;
  private storageProviders = new Map<StorageType, IStorageProvider>();
  private cdnProviders = new Map<CDNType, ICDNProvider>();
  private fileProcessors = new Map<ProcessorType, IFileProcessor>();
  private uploadProgressMap = new Map<string, UploadProgress>();
  private metadataCache = new Map<string, { data: FileMetadata; expires: number }>();
  private urlCache = new Map<string, { url: string; expires: number }>();
  private processingQueue: Array<{
    fileId: string;
    processor: IFileProcessor;
    inputPath: string;
    outputPath: string;
    options: any;
  }> = [];
  private isProcessingQueueRunning = false;

  constructor(config: UniversalFileServiceConfig) {
    super();
    this.config = config;

    // 如果启用了持久化，设置自动监听器
    if (this.config.persistence?.enabled && this.config.persistence.repository) {
      this.setupPersistenceListeners();
    }
  }

  // ============= 持久化设置 =============

  /**
   * 设置数据库持久化监听器
   *
   * 当文件上传完成或删除时，自动触发数据库操作
   */
  private setupPersistenceListeners(): void {
    const { repository, autoPersist = true } = this.config.persistence!;

    if (!autoPersist) {
      logger.info('⚙️ [UniversalFileService] 自动持久化已禁用');
      return;
    }

    logger.info('✅ [UniversalFileService] 已启用数据库持久化，自动监听文件事件');

    // 监听文件上传完成事件
    this.on('upload:complete', async (fileId: string, data: any) => {
      try {
        const metadata = data.metadata || data;
        await repository.save(metadata);
        logger.info(`💾 [Persistence] 文件元数据已自动保存: ${fileId}`);
      } catch (error) {
        logger.error(`❌ [Persistence] 保存失败: ${fileId}`, error);
        // 不抛出错误，避免影响上传流程
      }
    });

    // 监听文件删除事件
    this.on('file:deleted', async (fileId: string) => {
      try {
        await repository.delete(fileId);
        logger.info(`🗑️ [Persistence] 文件元数据已自动删除: ${fileId}`);
      } catch (error) {
        logger.error(`❌ [Persistence] 删除失败: ${fileId}`, error);
      }
    });

    // 监听批量删除事件
    this.on('files:batch-deleted', async (fileIds: string[]) => {
      try {
        await repository.batchDelete(fileIds);
        logger.info(`🗑️ [Persistence] 批量删除元数据: ${fileIds.length} 个文件`);
      } catch (error) {
        logger.error(`❌ [Persistence] 批量删除失败`, error);
      }
    });
  }

  // ============= 初始化方法 =============

  /**
   * 初始化文件服务
   */
  async initialize(): Promise<void> {
    logger.info('🚀 [UniversalFileService] 开始初始化文件服务...');

    try {
      // 初始化存储提供者
      await this.initializeStorageProviders();

      // 初始化CDN提供者
      await this.initializeCDNProviders();

      // 初始化文件处理器
      await this.initializeFileProcessors();

      logger.info('✅ [UniversalFileService] 文件服务初始化完成');
    } catch (error) {
      console.error('❌ [UniversalFileService] 文件服务初始化失败:', error);
      throw error;
    }
  }

  /**
   * 重新初始化存储提供者（支持配置热更新）
   */
  async reinitializeStorageProviders(): Promise<void> {
    logger.info('🔄 [UniversalFileService] 重新初始化存储提供者...');

    try {
      // 重新初始化OSS提供者
      const ossConfig = this.config.storageProviders['aliyun-oss'];
      if (ossConfig && ossConfig.enabled) {
        const ossProvider = this.storageProviders.get('aliyun-oss');
        if (ossProvider && 'reinitialize' in ossProvider) {
          logger.info('🔄 [UniversalFileService] 重新初始化阿里云OSS提供者...');
          await (ossProvider as any).reinitialize(ossConfig);
        }
      }

      logger.info('✅ [UniversalFileService] 存储提供者重新初始化完成');
    } catch (error) {
      console.error('❌ [UniversalFileService] 存储提供者重新初始化失败:', error);
      throw error;
    }
  }

  /**
   * 注册存储提供者
   */
  registerStorageProvider(provider: IStorageProvider): void {
    this.storageProviders.set(provider.type, provider);
    logger.info(`📦 [UniversalFileService] 注册存储提供者: ${provider.type}`);
  }

  /**
   * 注册CDN提供者
   */
  registerCDNProvider(provider: ICDNProvider): void {
    this.cdnProviders.set(provider.type, provider);
    logger.info(`🌐 [UniversalFileService] 注册CDN提供者: ${provider.type}`);
  }

  /**
   * 注册文件处理器
   */
  registerFileProcessor(processor: IFileProcessor): void {
    this.fileProcessors.set(processor.type, processor);
    logger.info(`⚙️ [UniversalFileService] 注册文件处理器: ${processor.type}`);
  }

  // ============= 核心文件操作方法 =============

  /**
   * 上传文件
   */
  async uploadFile(
    fileInfo: UploadFileInfo,
    storageType?: StorageType,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<FileMetadata> {
    const fileId = uuidv4();
    const startTime = Date.now();

    logger.info(`📤 [UniversalFileService] 开始上传文件: ${fileInfo.file.name}, ID: ${fileId}`);

    try {
      // 验证文件
      await this.validateFile(fileInfo.file);

      // 初始化上传进度
      const progress: UploadProgress = {
        fileId,
        status: 'pending',
        progress: 0,
        uploadedBytes: 0,
        totalBytes: fileInfo.file.size,
        speed: 0,
        remainingTime: 0,
      };

      this.uploadProgressMap.set(fileId, progress);
      this.emitFileEvent('upload:start', fileId, { fileName: fileInfo.file.name });

      // 生成文件元数据
      const metadata = await this.generateFileMetadata(fileId, fileInfo);

      // 选择存储提供者
      const selectedStorageType = storageType || this.config.defaultStorage;
      let storageProvider = this.storageProviders.get(selectedStorageType);

      // 如果指定的存储提供者不可用，优先尝试OSS
      if (!storageProvider) {
        logger.info(
          `⚠️ [UniversalFileService] 存储提供者 ${selectedStorageType} 不可用，尝试使用OSS`
        );
        storageProvider = this.storageProviders.get('aliyun-oss');

        // 如果OSS也不可用，回退到本地存储
        if (!storageProvider) {
          logger.info(`⚠️ [UniversalFileService] OSS不可用，回退到本地存储`);
          storageProvider = this.storageProviders.get('local');
        }
      }

      if (!storageProvider) {
        throw new StorageProviderError(`没有可用的存储提供者`);
      }

      // 生成存储路径
      const storagePath = this.generateStoragePath(metadata);

      // 更新上传状态
      progress.status = 'uploading';
      progress.progress = 10;
      this.uploadProgressMap.set(fileId, progress);
      onProgress?.(progress);
      this.emitFileEvent('upload:progress', fileId, { progress: progress.progress });

      // 执行上传
      const uploadResult = await storageProvider.upload(fileInfo, storagePath);

      if (!uploadResult.success) {
        throw new FileUploadError(`上传失败: ${uploadResult.error}`);
      }

      // 更新元数据
      metadata.storagePath = uploadResult.path || storagePath;
      metadata.storageProvider = selectedStorageType;

      // 生成CDN URL（如果启用）
      if (this.config.defaultCDN !== 'none') {
        const cdnProvider = this.cdnProviders.get(this.config.defaultCDN);
        if (cdnProvider && uploadResult.url) {
          metadata.cdnUrl = await cdnProvider.generateUrl(uploadResult.url);
        }
      }

      // 更新上传进度
      progress.status = fileInfo.needsProcessing ? 'processing' : 'completed';
      progress.progress = fileInfo.needsProcessing ? 70 : 100;
      this.uploadProgressMap.set(fileId, progress);
      onProgress?.(progress);

      // 如果需要处理，添加到处理队列
      if (fileInfo.needsProcessing && fileInfo.processingOptions) {
        await this.queueFileProcessing(metadata, fileInfo.processingOptions);
      }

      // 缓存元数据
      this.cacheMetadata(metadata);

      // 保存到数据库通过事件触发（如果启用了持久化）
      // persistence.repository 会监听 'upload:complete' 事件自动保存

      // 完成上传
      progress.status = 'completed';
      progress.progress = 100;
      this.uploadProgressMap.set(fileId, progress);
      onProgress?.(progress);

      const uploadTime = Date.now() - startTime;
      logger.info(`✅ [UniversalFileService] 文件上传完成: ${fileId}, 耗时: ${uploadTime}ms`);

      this.emitFileEvent('upload:complete', fileId, {
        fileName: fileInfo.file.name,
        size: fileInfo.file.size,
        uploadTime,
      });

      return metadata;
    } catch (error) {
      console.error(`❌ [UniversalFileService] 文件上传失败: ${fileId}:`, error);

      // 更新上传状态为失败
      const progress = this.uploadProgressMap.get(fileId);
      if (progress) {
        progress.status = 'failed';
        progress.error = error instanceof Error ? error.message : '上传失败';
        this.uploadProgressMap.set(fileId, progress);
        onProgress?.(progress);
      }

      this.emitFileEvent(
        'upload:error',
        fileId,
        undefined,
        error instanceof Error ? error.message : '上传失败'
      );
      throw error;
    } finally {
      // 清理上传进度（可选，或设置过期时间）
      setTimeout(
        () => {
          this.uploadProgressMap.delete(fileId);
        },
        5 * 60 * 1000
      ); // 5分钟后清理
    }
  }


  /**
   * 获取上传进度
   */
  getUploadProgress(fileId: string): UploadProgress | undefined {
    return this.uploadProgressMap.get(fileId);
  }

  // ============= 事件处理方法 =============

  /**
   * 监听文件事件
   */
  onFileEvent(eventType: string, listener: FileEventListener): void {
    this.on(eventType, listener);
  }

  /**
   * 移除文件事件监听器
   */
  offFileEvent(eventType: string, listener: FileEventListener): void {
    this.off(eventType, listener);
  }

  // ============= 私有方法 =============

  private async initializeStorageProviders(): Promise<void> {
    logger.info('📦 [UniversalFileService] 开始初始化存储提供者...');

    // 如果还没有注册任何存储提供者，先注册默认的
    if (this.storageProviders.size === 0) {
      await this.registerDefaultStorageProviders();
    }

    for (const [type, config] of Object.entries(this.config.storageProviders)) {
      if (config.enabled) {
        const provider = this.storageProviders.get(type as StorageType);
        if (provider) {
          try {
            await provider.initialize(config);
            logger.info(`✅ [UniversalFileService] 存储提供者初始化完成: ${type}`);
          } catch (error) {
            console.warn(`⚠️ [UniversalFileService] 存储提供者初始化失败: ${type}:`, error);
            // 如果默认存储提供者初始化失败，切换到本地存储
            // if (type === this.config.defaultStorage) {
            //   console.warn(`⚠️ [UniversalFileService] 默认存储提供者 ${type} 初始化失败，切换到本地存储`);
            //   this.config.defaultStorage = 'local';
            // }
          }
        } else {
          console.warn(`⚠️ [UniversalFileService] 存储提供者未注册: ${type}`);
        }
      }
    }
  }

  private async registerDefaultStorageProviders(): Promise<void> {
    logger.info('📦 [UniversalFileService] 注册默认存储提供者...');

    // 优先注册OSS提供者
    const ossConfig = this.config.storageProviders['aliyun-oss'];
    if (ossConfig && ossConfig.enabled) {
      try {
        const { AliyunOSSProvider } = await import('./providers/AliyunOSSProvider');
        const ossProvider = new AliyunOSSProvider();
        this.registerStorageProvider(ossProvider);
        logger.info('✅ [UniversalFileService] 阿里云OSS提供者注册成功');
      } catch (error) {
        console.warn('⚠️ [UniversalFileService] 阿里云OSS提供者注册失败:', error);
      }
    }

    // 注册本地存储提供者作为备用
    const localConfig = this.config.storageProviders['local'];
    if (localConfig && localConfig.enabled) {
      try {
        const { LocalStorageProvider } = await import('./providers/LocalStorageProvider');
        const localProvider = new LocalStorageProvider();
        this.registerStorageProvider(localProvider);
        logger.info('✅ [UniversalFileService] 本地存储提供者注册成功');
      } catch (error) {
        console.warn('⚠️ [UniversalFileService] 本地存储提供者注册失败:', error);
      }
    }

    // 确保至少有一个可用的存储提供者
    if (this.storageProviders.size === 0) {
      console.warn('⚠️ [UniversalFileService] 没有可用的存储提供者，尝试注册本地存储作为备用');
      try {
        const { LocalStorageProvider } = await import('./providers/LocalStorageProvider');
        const localProvider = new LocalStorageProvider();
        this.registerStorageProvider(localProvider);
        logger.info('✅ [UniversalFileService] 本地存储提供者注册成功（备用）');
      } catch (error) {
        console.error('❌ [UniversalFileService] 无法注册任何存储提供者:', error);
        throw new Error('无法初始化存储提供者');
      }
    }
  }

  private async initializeCDNProviders(): Promise<void> {
    for (const [type, config] of Object.entries(this.config.cdnProviders)) {
      if (config.enabled) {
        const provider = this.cdnProviders.get(type as CDNType);
        if (provider) {
          await provider.initialize(config);
          logger.info(`✅ [UniversalFileService] CDN提供者初始化完成: ${type}`);
        }
      }
    }
  }

  private async initializeFileProcessors(): Promise<void> {
    for (const processor of Array.from(this.fileProcessors.values())) {
      await processor.initialize();
      logger.info(`✅ [UniversalFileService] 文件处理器初始化完成: ${processor.type}`);
    }
  }

  private async validateFile(file: File): Promise<void> {
    // 检查文件大小
    if (file.size > this.config.maxFileSize) {
      throw new FileUploadError(`文件大小超过限制: ${file.size} > ${this.config.maxFileSize}`);
    }

    // 检查文件类型
    const mimeType = file.type || getMimeType(file.name);

    if (
      this.config.allowedMimeTypes.length > 0 &&
      !this.config.allowedMimeTypes.includes(mimeType)
    ) {
      throw new FileUploadError(`不支持的文件类型: ${mimeType}`);
    }
  }

  private async generateFileMetadata(
    fileId: string,
    fileInfo: UploadFileInfo
  ): Promise<FileMetadata> {
    const now = new Date();
    const mimeType = fileInfo.file.type || getMimeType(fileInfo.file.name);
    const extension = path.extname(fileInfo.file.name).toLowerCase();

    // 生成文件哈希（用于去重检测）
    const hash = await this.generateFileHash(fileInfo.file);

    return {
      id: fileId,
      originalName: fileInfo.file.name,
      storageName: `${fileId}${extension}`,
      size: fileInfo.file.size,
      mimeType,
      extension,
      hash,
      uploadTime: now,
      permission: fileInfo.permission || 'public',
      uploaderId: fileInfo.metadata?.uploadedBy || 'system',
      moduleId: fileInfo.moduleId,
      businessId: fileInfo.businessId,
      storageProvider: this.config.defaultStorage,
      storagePath: '',
      accessCount: 0,
      metadata: fileInfo.metadata || {},
    };
  }

  private generateStoragePath(metadata: FileMetadata): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${metadata.moduleId}/${year}/${month}/${day}/${metadata.storageName}`;
  }

  private async generateFileHash(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const hash = createHash('sha256');
    hash.update(Buffer.from(buffer));
    return hash.digest('hex');
  }

  private async queueFileProcessing(metadata: FileMetadata, options: any): Promise<void> {
    if (!this.config.processors?.length || 0 > 0) {
      return;
    }

    const processor = this.fileProcessors.get(options.type);
    if (!processor) {
      console.warn(`⚠️ [UniversalFileService] 文件处理器不存在: ${options.type}`);
      return;
    }

    if (this.processingQueue.length >= 1000) {
      throw new FileProcessingError('处理队列已满');
    }

    this.processingQueue.push({
      fileId: metadata.id,
      processor,
      inputPath: metadata.storagePath,
      outputPath: this.generateProcessedPath(metadata, options),
      options,
    });

    // 启动处理队列
    if (!this.isProcessingQueueRunning) {
      this.processFileQueue();
    }
  }

  private generateProcessedPath(metadata: FileMetadata, options: any): string {
    const basePath = metadata.storagePath;
    const extension = path.extname(basePath);
    const basename = basePath.replace(extension, '');

    return `${basename}_processed${extension}`;
  }

  private async processFileQueue(): Promise<void> {
    if (this.isProcessingQueueRunning || this.processingQueue.length === 0) {
      return;
    }

    this.isProcessingQueueRunning = true;

    while (this.processingQueue.length > 0) {
      const task = this.processingQueue.shift();
      if (!task) break;

      try {
        this.emitFileEvent('processing:start', task.fileId);

        const result = await task.processor.process(task.inputPath, task.outputPath, task.options);

        if (result.success) {
          this.emitFileEvent('processing:complete', task.fileId, result);
        } else {
          this.emitFileEvent('processing:error', task.fileId, undefined, result.error);
        }
      } catch (error) {
        console.error(`❌ [UniversalFileService] 文件处理失败: ${task.fileId}:`, error);
        this.emitFileEvent(
          'processing:error',
          task.fileId,
          undefined,
          error instanceof Error ? error.message : '处理失败'
        );
      }
    }

    this.isProcessingQueueRunning = false;
  }

  private cacheMetadata(metadata: FileMetadata): void {
    const expires = Date.now() + (this.config.cache?.metadataTTL || 3600) * 1000;
    this.metadataCache.set(metadata.id, { data: metadata, expires });
  }

  private _clearMetadataCache2(fileId: string): void {
    this.metadataCache.delete(fileId);
  }

  private emitFileEvent(type: string, fileId: string, data?: any, error?: string): void {
    const event: FileEvent = {
      type: type as any,
      fileId,
      timestamp: new Date(),
      data,
      error,
    };

    this.emit(type, event);
    this.emit('*', event); // 通用事件监听
  }
}
