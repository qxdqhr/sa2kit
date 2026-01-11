/**
 * 阿里云OSS存储提供者实现
 */

import OSS from 'ali-oss';
import { createLogger } from '../../../logger';

import type {
  IStorageProvider,
  StorageConfig,
  AliyunOSSConfig,
  StorageResult,
  UploadFileInfo,
  StorageType,
} from '../types';

import { StorageProviderError } from '../types';

const logger = createLogger('AliyunOSSProvider');

/**
 * 阿里云OSS存储提供者
 */
export class AliyunOSSProvider implements IStorageProvider {
  readonly type: StorageType = 'aliyun-oss';

  private config: AliyunOSSConfig | null = null;
  private client: OSS | null = null;
  private isInitialized = false;

  async initialize(config: StorageConfig): Promise<void> {
    return this.reinitialize(config);
  }

  async reinitialize(config: StorageConfig): Promise<void> {
    if (config.type !== 'aliyun-oss') {
      throw new StorageProviderError('配置类型不匹配：期望 aliyun-oss');
    }

    const newConfig = config as AliyunOSSConfig;

    const configChanged = !this.config || 
      this.config.region !== newConfig.region ||
      this.config.bucket !== newConfig.bucket ||
      this.config.accessKeyId !== newConfig.accessKeyId ||
      this.config.accessKeySecret !== newConfig.accessKeySecret ||
      this.config.customDomain !== newConfig.customDomain ||
      this.config.secure !== newConfig.secure ||
      this.config.internal !== newConfig.internal;

    if (configChanged) {
      logger.info('🔄 [AliyunOSSProvider] 检测到配置变化，重新初始化OSS客户端');
      logger.info(`☁️ [AliyunOSSProvider] 新配置: bucket=${newConfig.bucket}, region=${newConfig.region}`);
    } else if (this.isInitialized) {
      logger.info('ℹ️ [AliyunOSSProvider] 配置未变化，跳过重新初始化');
      return;
    }

    this.config = newConfig;
    
    logger.info(`☁️ [AliyunOSSProvider] ${this.isInitialized ? '重新' : ''}初始化阿里云OSS`);

    try {
      this.validateConfig();

      const hasRealCustomDomain = this.config.customDomain && !this.config.customDomain.includes('.aliyuncs.com');
      
      logger.info(`🔧 [AliyunOSSProvider] OSS配置:`, {
        region: this.config.region,
        bucket: this.config.bucket,
        customDomain: this.config.customDomain,
        hasRealCustomDomain,
        secure: this.config.secure !== false,
      });
      
      const ossConfig = {
        region: this.config.region,
        bucket: this.config.bucket,
        accessKeyId: this.config.accessKeyId,
        accessKeySecret: this.config.accessKeySecret,
        secure: this.config.secure !== false,
        internal: this.config.internal || false,
        timeout: 300000,
        cname: !!hasRealCustomDomain,
        endpoint: hasRealCustomDomain ? this.config.customDomain : undefined
      };
      
      if (!hasRealCustomDomain) {
         logger.info(`🌐 [AliyunOSSProvider] 使用标准OSS域名: ${this.config.region}`);
      } else {
         logger.info(`🌐 [AliyunOSSProvider] 使用自定义域名: ${this.config.customDomain}`);
      }
      
      this.client = new OSS(ossConfig);

      await this.testConnection();
      
      this.isInitialized = true;
      logger.info(`✅ [AliyunOSSProvider] 阿里云OSS${configChanged ? '重新' : ''}初始化完成`);
      
    } catch (error) {
      logger.error('❌ [AliyunOSSProvider] 阿里云OSS初始化失败:', error);
      this.isInitialized = false;
      throw new StorageProviderError(
        `阿里云OSS初始化失败: ${error instanceof Error ? error.message : '未知错误'}`
      );
    }
  }

  async upload(fileInfo: UploadFileInfo, filePath: string): Promise<StorageResult> {
    this.ensureInitialized();
    
    const startTime = Date.now();
    logger.info(`📤 [AliyunOSSProvider] 开始上传文件到OSS: ${filePath}`);

    try {
      const buffer = Buffer.from(await fileInfo.file.arrayBuffer());
      
      const options = {
        headers: {
          'Content-Type': fileInfo.file.type || 'application/octet-stream',
          'Content-Length': fileInfo.file.size.toString(),
        },
        meta: {
          uid: 0,
          pid: 0,
          originalName: encodeURIComponent(fileInfo.file.name),
          moduleId: fileInfo.moduleId,
          businessId: fileInfo.businessId || '',
          uploadTime: new Date().toISOString(),
          ...this.encodeMetadata(fileInfo.metadata || {})
        }
      };

      let result;
      
      if (fileInfo.file.size > 100 * 1024 * 1024) {
        logger.info(`📦 [AliyunOSSProvider] 使用分片上传大文件: ${filePath}, 大小: ${fileInfo.file.size}`);
        result = await this.multipartUpload(filePath, buffer, options);
      } else {
        logger.info(`📤 [AliyunOSSProvider] 使用普通上传: ${filePath}, 大小: ${fileInfo.file.size}`);
        result = await this.client.put(filePath, buffer, options);
      }

      const accessUrl = this.generateAccessUrl(filePath);
      
      const uploadTime = Date.now() - startTime;
      logger.info(`✅ [AliyunOSSProvider] 文件上传完成: ${filePath}, 耗时: ${uploadTime}ms`);

      return {
        success: true,
        path: filePath,
        url: accessUrl,
        size: fileInfo.file.size,
        data: {
          etag: result.data ? JSON.stringify(result.data) : '',
          requestId: result.res?.rt || 0,
          uploadTime,
          ossUrl: result.url || result.name || filePath
        }
      };

    } catch (error) {
      logger.error(`❌ [AliyunOSSProvider] 文件上传失败: ${filePath}:`, error);
      
      return {
        success: false,
        error: this.formatOSSError(error)
      };
    }
  }

  async download(filePath: string): Promise<Buffer> {
    this.ensureInitialized();
    logger.info(`📥 [AliyunOSSProvider] 开始从OSS下载文件: ${filePath}`);

    try {
      const result = await this.client.get(filePath);
      
      if (!result?.content || !Buffer.isBuffer(result?.content)) {
        throw new StorageProviderError('下载的文件内容格式错误');
      }

      logger.info(`✅ [AliyunOSSProvider] 文件下载完成: ${filePath}, 大小: ${result.content.length}`);
      
      return result.content;

    } catch (error) {
      logger.error(`❌ [AliyunOSSProvider] 文件下载失败: ${filePath}:`, error);
      
      if (this.isOSSError(error) && error.code === 'NoSuchKey') {
        throw new StorageProviderError(`文件不存在: ${filePath}`);
      }
      
      throw new StorageProviderError(
        `文件下载失败: ${this.formatOSSError(error)}`
      );
    }
  }

  async delete(filePath: string): Promise<StorageResult> {
    this.ensureInitialized();
    logger.info(`🗑️ [AliyunOSSProvider] 开始从OSS删除文件: ${filePath}`);

    try {
      const result = await this.client.delete(filePath);
      logger.info(`✅ [AliyunOSSProvider] 文件删除完成: ${filePath}`);
      
      return {
        success: true,
        data: {
          requestId: result?.res?.rt ?? 0,
          deletedPath: filePath
        }
      };

    } catch (error) {
      logger.error(`❌ [AliyunOSSProvider] 文件删除失败: ${filePath}:`, error);
      
      if (this.isOSSError(error) && error.code === 'NoSuchKey') {
        logger.warn(`⚠️ [AliyunOSSProvider] 文件不存在: ${filePath}`);
        return {
          success: true,
          data: { reason: 'file_not_exists' }
        };
      }
      
      return {
        success: false,
        error: this.formatOSSError(error)
      };
    }
  }

  async getFileInfo(filePath: string): Promise<StorageResult> {
    this.ensureInitialized();
    
    try {
      const result = await this.client.head(filePath);
      
      return {
        success: true,
        size: parseInt(String(result?.meta?.['content-length'] ?? '0')),
        data: {
          etag: result?.meta?.etag ?? '',
          lastModified: result?.meta?.['last-modified'] ?? '',
          contentType: result?.meta?.['content-type'],
          meta: result?.meta,
          size: parseInt(String(result?.meta?.['content-length'] ?? '0'))
        }
      };

    } catch (error) {
      if (this.isOSSError(error) && error.code === 'NoSuchKey') {
        return {
          success: false,
          error: '文件不存在'
        };
      }
      
      return {
        success: false,
        error: this.formatOSSError(error)
      };
    }
  }

  async getAccessUrl(filePath: string, expiresIn?: number): Promise<string> {
    this.ensureInitialized();
    
    try {
      const isImage = /.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/i.test(filePath);
      
      if (isImage) {
        return this.generateAccessUrl(filePath);
      } else {
        const expires = expiresIn || 3600;
        const signedUrl = this.client.signatureUrl(filePath, {
          expires,
          method: 'GET'
        });
        
        return signedUrl ?? '';
      }

    } catch (error) {
      logger.error(`❌ [AliyunOSSProvider] 生成访问URL失败: ${filePath}:`, error);
      throw new StorageProviderError(
        `生成访问URL失败: ${this.formatOSSError(error)}`
      );
    }
  }

  async getUploadUrl(filePath: string, expiresIn?: number): Promise<string> {
    this.ensureInitialized();
    
    try {
      const expires = expiresIn || 3600; 
      const signedUrl = this.client.signatureUrl(filePath, {
        expires,
        method: 'PUT'
      });
      
      return signedUrl ?? '' ;

    } catch (error) {
      logger.error(`❌ [AliyunOSSProvider] 生成上传URL失败: ${filePath}:`, error);
      throw new StorageProviderError(
        `生成上传URL失败: ${this.formatOSSError(error)}`
      );
    }
  }

  async exists(filePath: string): Promise<boolean> {
    this.ensureInitialized();
    
    try {
      await this.client.head(filePath);
      return true;
    } catch (error) {
      if (this.isOSSError(error) && error.code === 'NoSuchKey') {
        return false;
      }
      logger.warn(`⚠️ [AliyunOSSProvider] 检查文件存在性时出错: ${filePath}:`, error);
      return false;
    }
  }
  
  async list(prefix: string, maxKeys?: number): Promise<string[]> {
    this.ensureInitialized();
    
    try {
      const options = {
        prefix,
        'max-keys': String(maxKeys || 1000)
      };

      const result = await this.client.list(options, {});
      
      return result?.objects?.map((obj) => obj.name) ?? [];

    } catch (error) {
      logger.error(`❌ [AliyunOSSProvider] 列出文件失败: ${prefix}:`, error);
      return [];
    }
  }

  private ensureInitialized(): void {
    if (!this.isInitialized || !this.client || !this.config) {
      logger.error('❌ [AliyunOSSProvider] OSS存储提供者未初始化');
      throw new StorageProviderError('OSS存储提供者未初始化');
    }
  }

  private validateConfig(): void {
    if (!this.config) {
      throw new StorageProviderError('OSS配置为空');
    }

    const required = ['region', 'bucket', 'accessKeyId', 'accessKeySecret'];
    const missing = required.filter(key => !this.config[key]);
    
    if (missing.length > 0) {
      throw new StorageProviderError('OSS配置缺少必需项');
    }
  }

  private async testConnection(): Promise<void> {
    try {
      // 尝试列出少量对象来测试连接
      logger.info(`🔍 [AliyunOSSProvider] 测试OSS连接...`);
      const result = await this.client.list({
        'max-keys': '1'
      }, {});
      logger.info(`✅ [AliyunOSSProvider] OSS连接测试成功，找到 ${result?.objects?.length ?? 0} 个对象`);
    } catch (error) {
      logger.warn(`⚠️ [AliyunOSSProvider] OSS连接测试失败: ${this.formatOSSError(error)}`);
      
      // 记录详细信息但不崩溃，使用安全的属性访问
      try {
          const err = error as any;
          // Avoid accessing 'name' if risky, mainly access code and message
          logger.warn('OSS连接错误详情', {
              code: err?.code,
              message: err?.message,
          });
          
          if (err && typeof err.code === 'string') {
            if (err.code === 'NoSuchBucket') throw new StorageProviderError(`存储桶不存在`);
            if (err.code === 'InvalidAccessKeyId') throw new StorageProviderError('Access Key ID 无效');
            if (err.code === 'SignatureDoesNotMatch') throw new StorageProviderError('Access Key Secret 无效');
          }
      } catch (e) {
          logger.warn('无法解析错误详情', e);
      }
    }
  }

  private async multipartUpload(filePath: string, buffer: Buffer, options: any): Promise<any> {
    logger.info(`📦 [AliyunOSSProvider] 使用多分片上传`);

    const result = await this.client.multipartUpload(filePath, buffer, {
      partSize: 10 * 1024 * 1024,
      parallel: 4,
      progress: (p) => {
        if (p % 0.1 < 0.01) {
          logger.info(`📦 [AliyunOSSProvider] 上传进度: ${(p * 100).toFixed(1)}%`);
        }
      },
      meta: options.meta,
      headers: options.headers
    });

    return {
      name: result?.name ?? filePath,
      url: result?.name ?? filePath,
      data: result?.data,
      res: result?.res
    };
  }

  private generateAccessUrl(filePath: string): string {
    if (!this.config) {
      throw new StorageProviderError('OSS配置为空');
    }

    const normalizedPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
    if (this.config.customDomain) {
      const protocol = this.config.secure !== false ? 'https' : 'http';
      const url = `${protocol}://${this.config.customDomain}/${normalizedPath}`;
      logger.info(`🔗 [AliyunOSSProvider] 使用自定义域名: ${url}`);
      return url;
    } else {
      const protocol = this.config.secure !== false ? 'https' : 'http';
      const url = `${protocol}://${this.config.bucket}.${this.config.region}.aliyuncs.com/${normalizedPath}`;
      logger.info(`🔗 [AliyunOSSProvider] 使用默认OSS域名: ${url}`);
      return url;
    }
  }

  private isOSSError(error: any): error is { code: string; name: string; message: string; requestId?: string } {
    return error && typeof error.code === 'string' && typeof error.name === 'string';
  }

  private formatOSSError(error: any): string {
    if (this.isOSSError(error)) {
      return `${error.code}: ${error.message}${error.requestId ? ` (RequestId: ${error.requestId})` : ''}`;
    }
    return error instanceof Error ? error.message : '未知错误';
  }
    
  private encodeMetadata(metadata: Record<string, any>): Record<string, string> {
    const encoded: Record<string, string> = {};
    for (const [key, value] of Object.entries(metadata)) {
      if (value !== null && value !== undefined) {
        encoded[key] = encodeURIComponent(String(value));
      }
    }
    return encoded;
  }
  
  async uploadStream(readableStream: NodeJS.ReadableStream, filePath: string, contentType?: string, contentLength?: number): Promise<StorageResult> {
     this.ensureInitialized();
     const startTime = Date.now();
     logger.info(`📤 [AliyunOSSProvider] 开始流式上传: ${filePath}`);
     try {
       const options = {
         timeout: 300000,
         mime: contentType || 'application/octet-stream',
         meta: { uid: 0, pid: 0 },
         callback: { url: '', body: '' },
         headers: contentLength ? { 'Content-Length': contentLength.toString() } : {}
       };
       const result = await this.client.putStream(filePath, readableStream, options);
       const accessUrl = this.generateAccessUrl(filePath);
       const uploadTime = Date.now() - startTime;
       logger.info(`✅ [AliyunOSSProvider] 流式上传完成: ${filePath}`);
       return {
         success: true,
         path: filePath,
         url: accessUrl,
         size: contentLength,
         data: {
           name: result?.name,
           requestId: result?.res?.rt,
           uploadTime,
           ossUrl: result?.name
         }
       };
     } catch (error) {
       logger.error(`❌ [AliyunOSSProvider] 流式上传失败: ${filePath}:`, error);
       return { success: false, error: this.formatOSSError(error) };
     }
  }
  
  async batchDelete(filePaths: string[]): Promise<StorageResult> {
    this.ensureInitialized();
    logger.info(`🗑️ [AliyunOSSProvider] 批量删除: ${filePaths.length}`);
    try {
      const result = await this.client.deleteMulti(filePaths, { quiet: false });
      logger.info(`✅ [AliyunOSSProvider] 批量删除完成: ${result?.deleted?.length}`);
      return { success: true, data: { deleted: result?.deleted, requestId: result?.res?.rt } };
    } catch (error) {
       logger.error(`❌ [AliyunOSSProvider] 批量删除失败:`, error);
       return { success: false, error: this.formatOSSError(error) };
    }
  }

  async copy(sourcePath: string, targetPath: string): Promise<StorageResult> {
    this.ensureInitialized();
    logger.info(`📋 [AliyunOSSProvider] 复制: ${sourcePath} -> ${targetPath}`);
    try {
      const result = await this.client.copy(targetPath, sourcePath, {});
      logger.info(`✅ [AliyunOSSProvider] 复制完成`);
      return { success: true, data: { etag: result?.data?.etag, lastModified: result?.data?.lastModified, requestId: result?.res?.rt } };
    } catch (error) {
       logger.error(`❌ [AliyunOSSProvider] 复制失败:`, error);
       return { success: false, error: this.formatOSSError(error) };
    }
  }
}
