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
  private client: any = null;
  private isInitialized = false;

  /**
   * 初始化存储提供者
   */
  async initialize(config: StorageConfig): Promise<void> {
    return this.reinitialize(config);
  }

  /**
   * 重新初始化存储提供者（支持配置热更新）
   */
  async reinitialize(config: StorageConfig): Promise<void> {
    if (config.type !== 'aliyun-oss') {
      throw new StorageProviderError('配置类型不匹配：期望 aliyun-oss');
    }

    const newConfig = config as AliyunOSSConfig;

    // 检查配置是否发生变化
    const configChanged =
      !this.config ||
      this.config.region !== newConfig.region ||
      this.config.bucket !== newConfig.bucket ||
      this.config.accessKeyId !== newConfig.accessKeyId ||
      this.config.accessKeySecret !== newConfig.accessKeySecret ||
      this.config.customDomain !== newConfig.customDomain ||
      this.config.secure !== newConfig.secure ||
      this.config.internal !== newConfig.internal;

    if (configChanged) {
      logger.info('🔄 [AliyunOSSProvider] 检测到配置变化，重新初始化OSS客户端');
      logger.info(
        `☁️ [AliyunOSSProvider] 新配置: bucket=${newConfig.bucket}, region=${newConfig.region}`
      );
    } else if (this.isInitialized) {
      logger.info('ℹ️ [AliyunOSSProvider] 配置未变化，跳过重新初始化');
      return;
    }

    this.config = newConfig;

    logger.info(`☁️ [AliyunOSSProvider] ${this.isInitialized ? '重新' : ''}初始化阿里云OSS`);

    try {
      // 验证必需的配置项
      this.validateConfig();

      // 创建OSS客户端
      this.client = new OSS({
        region: this.config.region,
        bucket: this.config.bucket,
        accessKeyId: this.config.accessKeyId,
        accessKeySecret: this.config.accessKeySecret,
        secure: this.config.secure !== false, // 默认使用HTTPS
        internal: this.config.internal || false, // 默认使用公网
        timeout: 300000, // 5分钟超时
        cname: !!this.config.customDomain, // 是否使用自定义域名
        endpoint: this.config.customDomain || undefined,
      });

      // 测试连接
      await this.testConnection();

      this.isInitialized = true;
      logger.info(`✅ [AliyunOSSProvider] 阿里云OSS${configChanged ? '重新' : ''}初始化完成`);
    } catch (error) {
      logger.error('❌ [AliyunOSSProvider] 阿里云OSS初始化失败:', error);
      throw new StorageProviderError(
        `阿里云OSS初始化失败: ${error instanceof Error ? error.message : '未知错误'}`
      );
    }
  }

  /**
   * 上传文件
   */
  async upload(fileInfo: UploadFileInfo, filePath: string): Promise<StorageResult> {
    this.ensureInitialized();

    const startTime = Date.now();
    logger.info(`📤 [AliyunOSSProvider] 开始上传文件到OSS: ${filePath}`);

    try {
      // 将File对象转换为Buffer
      const buffer = Buffer.from(await fileInfo.file.arrayBuffer());

      // 构建上传选项
      const options: any = {
        headers: {
          'Content-Type': fileInfo.file.type || 'application/octet-stream',
          'Content-Length': fileInfo.file.size.toString(),
        },
        meta: {
          uid: 0, // 必需字段
          pid: 0, // 必需字段
          originalName: encodeURIComponent(fileInfo.file.name),
          moduleId: fileInfo.moduleId,
          businessId: fileInfo.businessId || '',
          uploadTime: new Date().toISOString(),
          // 对元数据进行编码处理，避免中文字符问题
          ...this.encodeMetadata(fileInfo.metadata || {}),
        },
      };

      // 根据文件大小选择上传方式
      let result: any;

      if (fileInfo.file.size > 100 * 1024 * 1024) {
        // 大于100MB使用分片上传
        logger.info(
          `📦 [AliyunOSSProvider] 使用分片上传大文件: ${filePath}, 大小: ${fileInfo.file.size}`
        );
        result = await this.multipartUpload(filePath, buffer, options);
      } else {
        logger.info(
          `📤 [AliyunOSSProvider] 使用普通上传: ${filePath}, 大小: ${fileInfo.file.size}`
        );
        result = await this.client.put(filePath, buffer, options);
      }

      // 生成访问URL
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
          ossUrl: result.url || result.name,
        },
      };
    } catch (error) {
      logger.error(`❌ [AliyunOSSProvider] 文件上传失败: ${filePath}:`, error);

      return {
        success: false,
        error: this.formatOSSError(error),
      };
    }
  }

  /**
   * 下载文件
   */
  async download(filePath: string): Promise<Buffer> {
    this.ensureInitialized();

    logger.info(`📥 [AliyunOSSProvider] 开始从OSS下载文件: ${filePath}`);

    try {
      const result = await this.client.get(filePath);

      if (!result.content || !Buffer.isBuffer(result.content)) {
        throw new StorageProviderError('下载的文件内容格式错误');
      }

      logger.info(
        `✅ [AliyunOSSProvider] 文件下载完成: ${filePath}, 大小: ${result.content.length}`
      );

      return result.content;
    } catch (error) {
      logger.error(`❌ [AliyunOSSProvider] 文件下载失败: ${filePath}:`, error);

      if (this.isOSSError(error) && error.code === 'NoSuchKey') {
        throw new StorageProviderError(`文件不存在: ${filePath}`);
      }

      throw new StorageProviderError(`文件下载失败: ${this.formatOSSError(error)}`);
    }
  }

  /**
   * 删除文件
   */
  async delete(filePath: string): Promise<StorageResult> {
    this.ensureInitialized();

    logger.info(`🗑️ [AliyunOSSProvider] 开始从OSS删除文件: ${filePath}`);

    try {
      const result = await this.client.delete(filePath);

      logger.info(`✅ [AliyunOSSProvider] 文件删除完成: ${filePath}`);

      return {
        success: true,
        data: {
          requestId: result.res?.rt || 0,
          deletedPath: filePath,
        },
      };
    } catch (error) {
      logger.error(`❌ [AliyunOSSProvider] 文件删除失败: ${filePath}:`, error);

      // OSS中删除不存在的文件不会报错，但我们统一处理
      if (this.isOSSError(error) && error.code === 'NoSuchKey') {
        logger.warn(`⚠️ [AliyunOSSProvider] 文件不存在: ${filePath}`);
        return {
          success: true,
          data: { reason: 'file_not_exists' },
        };
      }

      return {
        success: false,
        error: this.formatOSSError(error),
      };
    }
  }

  /**
   * 获取文件信息
   */
  async getFileInfo(filePath: string): Promise<StorageResult> {
    this.ensureInitialized();

    try {
      const result = await this.client.head(filePath);

      return {
        success: true,
        size: parseInt(String(result.meta['content-length'] || '0')),
        data: {
          etag: result.meta.etag || '',
          lastModified: result.meta['last-modified'] || '',
          contentType: result.meta['content-type'],
          meta: result.meta,
          size: parseInt(String(result.meta['content-length'] || '0')),
        },
      };
    } catch (error) {
      if (this.isOSSError(error) && error.code === 'NoSuchKey') {
        return {
          success: false,
          error: '文件不存在',
        };
      }

      return {
        success: false,
        error: this.formatOSSError(error),
      };
    }
  }

  /**
   * 生成访问URL
   */
  async getAccessUrl(filePath: string, expiresIn?: number): Promise<string> {
    this.ensureInitialized();

    try {
      // 对于图片文件，直接返回公开URL，避免CORS问题
      // 对于其他文件，使用签名URL
      const isImage = /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/i.test(filePath);

      if (isImage) {
        // 图片文件使用公开URL
        return this.generateAccessUrl(filePath);
      } else {
        // 其他文件使用签名URL
        const expires = expiresIn || 3600; // 默认1小时
        const signedUrl = this.client.signatureUrl(filePath, {
          expires,
          method: 'GET',
        });

        return signedUrl;
      }
    } catch (error) {
      logger.error(`❌ [AliyunOSSProvider] 生成访问URL失败: ${filePath}:`, error);
      throw new StorageProviderError(`生成访问URL失败: ${this.formatOSSError(error)}`);
    }
  }

  /**
   * 生成预签名上传URL
   */
  async getUploadUrl(filePath: string, expiresIn?: number): Promise<string> {
    this.ensureInitialized();

    try {
      const expires = expiresIn || 3600; // 默认1小时
      const signedUrl = this.client.signatureUrl(filePath, {
        expires,
        method: 'PUT',
      });

      return signedUrl;
    } catch (error) {
      logger.error(`❌ [AliyunOSSProvider] 生成上传URL失败: ${filePath}:`, error);
      throw new StorageProviderError(`生成上传URL失败: ${this.formatOSSError(error)}`);
    }
  }

  /**
   * 检查文件是否存在
   */
  async exists(filePath: string): Promise<boolean> {
    this.ensureInitialized();

    try {
      await this.client.head(filePath);
      return true;
    } catch (error) {
      if (this.isOSSError(error) && error.code === 'NoSuchKey') {
        return false;
      }
      // 其他错误也视为文件不存在
      logger.warn(`⚠️ [AliyunOSSProvider] 检查文件存在性时出错: ${filePath}:`, error);
      return false;
    }
  }

  /**
   * 列出文件（详细信息）
   */
  async listFiles(prefix: string, delimiter: string = '/', maxKeys: number = 1000): Promise<{
    files: Array<{
      name: string;
      url: string;
      size: number;
      lastModified: string;
      etag: string;
      type: string;
    }>;
    folders: string[];
    nextMarker?: string;
  }> {
    this.ensureInitialized();

    try {
      const options: any = {
        prefix,
        delimiter,
        'max-keys': String(maxKeys),
      };

      const result = await this.client.list(options);

      const files = (result.objects || []).map((obj: any) => ({
        name: obj.name,
        url: this.generateAccessUrl(obj.name),
        size: obj.size,
        lastModified: obj.lastModified,
        etag: obj.etag,
        type: 'file',
      }));

      const folders = result.prefixes || [];

      return {
        files,
        folders,
        nextMarker: result.nextMarker,
      };
    } catch (error) {
      logger.error(`❌ [AliyunOSSProvider] 列出文件失败: ${prefix}:`, error);
      throw new StorageProviderError(`列出文件失败: ${this.formatOSSError(error)}`);
    }
  }

  /**
   * 列出文件
   */
  async list(prefix: string, maxKeys?: number): Promise<string[]> {
    this.ensureInitialized();

    try {
      const options: any = {
        prefix,
        'max-keys': String(maxKeys || 1000),
      };

      const result = await this.client.list(options);

      return result.objects?.map((obj: any) => obj.name) || [];
    } catch (error) {
      logger.error(`❌ [AliyunOSSProvider] 列出文件失败: ${prefix}:`, error);
      return [];
    }
  }

  // ============= 私有方法 =============

  /**
   * 确保已初始化
   */
  private ensureInitialized(): void {
    if (!this.isInitialized || !this.client || !this.config) {
      throw new StorageProviderError('OSS存储提供者未初始化');
    }
  }

  /**
   * 验证配置
   */
  private validateConfig(): void {
    if (!this.config) {
      throw new StorageProviderError('OSS配置为空');
    }

    const required = ['region', 'bucket', 'accessKeyId', 'accessKeySecret'];
    const missing = required.filter((key) => !this.config![key as keyof AliyunOSSConfig]);

    if (missing.length > 0) {
      throw new StorageProviderError(`OSS配置缺少必需项: ${missing.join(', ')}`);
    }
  }

  /**
   * 测试连接
   */
  private async testConnection(): Promise<void> {
    try {
      // 尝试列出少量对象来测试连接
      await this.client.list({
        'max-keys': '1',
      });
      logger.info(`✅ [AliyunOSSProvider] OSS连接测试成功`);
    } catch (error) {
      if (this.isOSSError(error)) {
        if (error.code === 'NoSuchBucket') {
          throw new StorageProviderError(`存储桶不存在: ${this.config!.bucket}`);
        }
        if (error.code === 'InvalidAccessKeyId') {
          throw new StorageProviderError('Access Key ID 无效');
        }
        if (error.code === 'SignatureDoesNotMatch') {
          throw new StorageProviderError('Access Key Secret 无效');
        }
      }
      throw error;
    }
  }

  /**
   * 分片上传大文件
   */
  private async multipartUpload(filePath: string, buffer: Buffer, options: any): Promise<any> {
    logger.info(`📦 [AliyunOSSProvider] 使用多分片上传`);

    // 使用OSS的multipartUpload方法
    const result = await this.client.multipartUpload(filePath, buffer, {
      partSize: 10 * 1024 * 1024, // 10MB per chunk
      parallel: 4, // 并发数
      progress: (p: number) => {
        if (p % 0.1 < 0.01) {
          // 每10%显示一次进度
          logger.info(`📦 [AliyunOSSProvider] 上传进度: ${(p * 100).toFixed(1)}%`);
        }
      },
      meta: options.meta,
      headers: options.headers,
    });

    return {
      name: result.name,
      url: result.name, // OSS返回的是object名称
      data: result.data,
      res: result.res,
    };
  }

  /**
   * 生成公开访问URL
   */
  private generateAccessUrl(filePath: string): string {
    if (!this.config) {
      throw new StorageProviderError('OSS配置为空');
    }

    // 确保文件路径不以斜杠开头
    const normalizedPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;

    if (this.config.customDomain) {
      // 使用自定义域名
      const protocol = this.config.secure !== false ? 'https' : 'http';
      const url = `${protocol}://${this.config.customDomain}/${normalizedPath}`;
      logger.info(`🔗 [AliyunOSSProvider] 使用自定义域名: ${url}`);
      return url;
    } else {
      // 使用默认OSS域名
      const protocol = this.config.secure !== false ? 'https' : 'http';
      const url = `${protocol}://${this.config.bucket}.${this.config.region}.aliyuncs.com/${normalizedPath}`;
      logger.info(`🔗 [AliyunOSSProvider] 使用默认OSS域名: ${url}`);
      return url;
    }
  }

  /**
   * 判断是否为OSS错误
   */
  private isOSSError(
    error: any
  ): error is { code: string; name: string; message: string; requestId?: string } {
    return error && typeof error.code === 'string' && typeof error.name === 'string';
  }

  /**
   * 格式化OSS错误信息
   */
  private formatOSSError(error: any): string {
    if (this.isOSSError(error)) {
      return `${error.code}: ${error.message}${error.requestId ? ` (RequestId: ${error.requestId})` : ''}`;
    }
    return error instanceof Error ? error.message : '未知错误';
  }

  /**
   * 流式上传（可选实现）
   */
  async uploadStream(
    readableStream: NodeJS.ReadableStream,
    filePath: string,
    contentType?: string,
    contentLength?: number
  ): Promise<StorageResult> {
    this.ensureInitialized();

    const startTime = Date.now();
    logger.info(`📤 [AliyunOSSProvider] 开始流式上传文件到OSS: ${filePath}`);

    try {
      const options: any = {
        timeout: 300000,
        mime: contentType || 'application/octet-stream',
        meta: { uid: 0, pid: 0 },
        callback: { url: '', body: '' },
        headers: {} as any,
      };

      if (contentLength) {
        options.headers['Content-Length'] = contentLength.toString();
      }

      const result = await this.client.putStream(filePath, readableStream, options);

      const accessUrl = this.generateAccessUrl(filePath);

      const uploadTime = Date.now() - startTime;
      logger.info(`✅ [AliyunOSSProvider] 流式上传完成: ${filePath}, 耗时: ${uploadTime}ms`);

      return {
        success: true,
        path: filePath,
        url: accessUrl,
        size: contentLength,
        data: {
          name: result.name,
          requestId: result.res?.rt || 0,
          uploadTime,
          ossUrl: result.url || result.name,
        },
      };
    } catch (error) {
      logger.error(`❌ [AliyunOSSProvider] 流式上传失败: ${filePath}:`, error);

      return {
        success: false,
        error: this.formatOSSError(error),
      };
    }
  }

  /**
   * 批量删除文件
   */
  async batchDelete(filePaths: string[]): Promise<StorageResult> {
    this.ensureInitialized();

    logger.info(`🗑️ [AliyunOSSProvider] 开始批量删除文件，数量: ${filePaths.length}`);

    try {
      const result = await this.client.deleteMulti(filePaths, {
        quiet: false, // 返回删除结果
      });

      logger.info(`✅ [AliyunOSSProvider] 批量删除完成，成功: ${result.deleted?.length || 0}`);

      return {
        success: true,
        data: {
          deleted: result.deleted,
          requestId: result.res?.rt || 0,
        },
      };
    } catch (error) {
      logger.error(`❌ [AliyunOSSProvider] 批量删除失败:`, error);

      return {
        success: false,
        error: this.formatOSSError(error),
      };
    }
  }

  /**
   * 复制文件
   */
  async copy(sourcePath: string, targetPath: string): Promise<StorageResult> {
    this.ensureInitialized();

    logger.info(`📋 [AliyunOSSProvider] 开始复制文件: ${sourcePath} -> ${targetPath}`);

    try {
      const result = await this.client.copy(targetPath, sourcePath);

      logger.info(`✅ [AliyunOSSProvider] 文件复制完成: ${sourcePath} -> ${targetPath}`);

      return {
        success: true,
        data: {
          etag: result.data?.etag,
          lastModified: result.data?.lastModified,
          requestId: result.res?.rt || 0,
        },
      };
    } catch (error) {
      logger.error(`❌ [AliyunOSSProvider] 文件复制失败: ${sourcePath} -> ${targetPath}:`, error);

      return {
        success: false,
        error: this.formatOSSError(error),
      };
    }
  }

  /**
   * 编码元数据，避免中文字符在HTTP头部中的问题
   */
  private encodeMetadata(metadata: Record<string, any>): Record<string, string> {
    const encoded: Record<string, string> = {};

    for (const [key, value] of Object.entries(metadata)) {
      if (value !== null && value !== undefined) {
        // 将值转换为字符串并进行URL编码
        const stringValue = String(value);
        encoded[key] = encodeURIComponent(stringValue);
      }
    }

    return encoded;
  }
}

