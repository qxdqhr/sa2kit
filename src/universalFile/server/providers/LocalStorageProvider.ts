/**
 * 本地存储提供者实现
 */

import { promises as fs } from 'fs';
import { existsSync, createReadStream, createWriteStream } from 'fs';
import * as path from 'path';
import { pipeline } from 'stream/promises';
import { createLogger } from '../../../logger';

import type {
  IStorageProvider,
  StorageConfig,
  LocalStorageConfig,
  StorageResult,
  UploadFileInfo,
  StorageType,
} from '../types';

import { StorageProviderError } from '../types';

const logger = createLogger('LocalStorageProvider');

/**
 * 本地文件系统存储提供者
 */
export class LocalStorageProvider implements IStorageProvider {
  readonly type: StorageType = 'local';

  private config: LocalStorageConfig | null = null;
  private isInitialized = false;

  /**
   * 初始化存储提供者
   */
  async initialize(config: StorageConfig): Promise<void> {
    if (config.type !== 'local') {
      throw new StorageProviderError('配置类型不匹配：期望 local');
    }

    this.config = config as LocalStorageConfig;

    logger.info(`📂 [LocalStorageProvider] 初始化本地存储，根目录: ${this.config.rootPath}`);

    try {
      // 确保根目录存在
      await this.ensureDirectoryExists(this.config.rootPath);

      // 验证目录访问权限
      await this.validateDirectoryAccess(this.config.rootPath);

      this.isInitialized = true;
      logger.info('✅ [LocalStorageProvider] 本地存储初始化完成');
    } catch (error) {
      logger.error('❌ [LocalStorageProvider] 本地存储初始化失败:', error);
      throw new StorageProviderError(`本地存储初始化失败`);
    }
  }

  /**
   * 上传文件
   */
  async upload(fileInfo: UploadFileInfo, filePath: string): Promise<StorageResult> {
    this.ensureInitialized();

    const startTime = Date.now();
    logger.info(`📤 [LocalStorageProvider] 开始上传文件: ${filePath}`);

    try {
      // 生成完整文件路径
      const fullPath = this.getFullPath(filePath);

      // 确保父目录存在
      await this.ensureDirectoryExists(path.dirname(fullPath));

      // 将File对象转换为Buffer
      const buffer = Buffer.from(await fileInfo.file.arrayBuffer());

      // 写入文件
      await fs.writeFile(fullPath, buffer);

      // 验证文件写入
      const stats = await fs.stat(fullPath);

      if (stats.size !== fileInfo.file.size) {
        throw new StorageProviderError(
          `文件大小不匹配: 期望 ${fileInfo.file.size}, 实际 ${stats.size}`
        );
      }

      // 生成访问URL
      const accessUrl = this.generateAccessUrl(filePath);

      const uploadTime = Date.now() - startTime;
      logger.info(`✅ [LocalStorageProvider] 文件上传完成: ${filePath}, 耗时: ${uploadTime}ms`);

      return {
        success: true,
        path: filePath,
        url: accessUrl,
        size: stats.size,
        data: {
          fullPath,
          uploadTime,
        },
      };
    } catch (error) {
      logger.error(`❌ [LocalStorageProvider] 文件上传失败: ${filePath}:`, error);

      return {
        success: false,
        error: error instanceof Error ? error.message : '上传失败',
      };
    }
  }

  /**
   * 下载文件
   */
  async download(path: string): Promise<Buffer> {
    this.ensureInitialized();

    logger.info(`📥 [LocalStorageProvider] 开始下载文件: ${path}`);

    try {
      const fullPath = this.getFullPath(path);

      // 检查文件是否存在
      if (!existsSync(fullPath)) {
        throw new StorageProviderError(`文件不存在: ${path}`);
      }

      // 读取文件
      const buffer = await fs.readFile(fullPath);

      logger.info(`✅ [LocalStorageProvider] 文件下载完成: ${path}, 大小: ${buffer.length}`);

      return buffer;
    } catch (error) {
      logger.error(`❌ [LocalStorageProvider] 文件下载失败: ${path}:`, error);
      throw new StorageProviderError(
        `文件下载失败: ${error instanceof Error ? error.message : '未知错误'}`
      );
    }
  }

  /**
   * 删除文件
   */
  async delete(path: string): Promise<StorageResult> {
    this.ensureInitialized();

    logger.info(`🗑️ [LocalStorageProvider] 开始删除文件: ${path}`);

    try {
      const fullPath = this.getFullPath(path);

      // 检查文件是否存在
      if (!existsSync(fullPath)) {
        logger.warn(`⚠️ [LocalStorageProvider] 文件不存在: ${path}`);
        return {
          success: true, // 文件不存在也视为删除成功
          data: { reason: 'file_not_exists' },
        };
      }

      // 删除文件
      await fs.unlink(fullPath);

      logger.info(`✅ [LocalStorageProvider] 文件删除完成: ${path}`);

      return {
        success: true,
        data: { deletedPath: fullPath },
      };
    } catch (error) {
      logger.error(`❌ [LocalStorageProvider] 文件删除失败: ${path}:`, error);

      return {
        success: false,
        error: error instanceof Error ? error.message : '删除失败',
      };
    }
  }

  /**
   * 获取文件信息
   */
  async getFileInfo(path: string): Promise<StorageResult> {
    this.ensureInitialized();

    try {
      const fullPath = this.getFullPath(path);

      if (!existsSync(fullPath)) {
        return {
          success: false,
          error: '文件不存在',
        };
      }

      const stats = await fs.stat(fullPath);

      return {
        success: true,
        size: stats.size,
        data: {
          fullPath,
          size: stats.size,
          mtime: stats.mtime,
          ctime: stats.ctime,
          isFile: stats.isFile(),
          isDirectory: stats.isDirectory(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取文件信息失败',
      };
    }
  }

  /**
   * 生成访问URL
   */
  async getAccessUrl(path: string, _expiresIn?: number): Promise<string> {
    this.ensureInitialized();

    // 本地存储不支持过期时间，忽略expiresIn参数
    return this.generateAccessUrl(path);
  }

  /**
   * 生成预签名上传URL
   */
  async getUploadUrl(path: string, _expiresIn?: number): Promise<string> {
    this.ensureInitialized();

    // 本地存储不支持预签名上传，返回普通访问URL
    logger.warn(`⚠️ [LocalStorageProvider] 本地存储不支持预签名上传URL`);
    return this.generateAccessUrl(path);
  }

  /**
   * 检查文件是否存在
   */
  async exists(path: string): Promise<boolean> {
    this.ensureInitialized();

    try {
      const fullPath = this.getFullPath(path);
      return existsSync(fullPath);
    } catch {
      return false;
    }
  }

  /**
   * 列出文件
   */
  async list(prefix: string, maxKeys?: number): Promise<string[]> {
    this.ensureInitialized();

    try {
      const fullPrefix = this.getFullPath(prefix);
      const baseDir = path.dirname(fullPrefix);
      const filePattern = path.basename(fullPrefix);

      if (!existsSync(baseDir)) {
        return [];
      }

      const entries = await fs.readdir(baseDir, { withFileTypes: true });
      let files = entries
        .filter((entry) => entry.isFile())
        .map((entry) => entry.name)
        .filter((name) => name.startsWith(filePattern))
        .map((name) => path.join(path.dirname(prefix), name));

      // 限制返回数量
      if (maxKeys && maxKeys > 0) {
        files = files.slice(0, maxKeys);
      }

      return files;
    } catch (error) {
      logger.error(`❌ [LocalStorageProvider] 列出文件失败: ${prefix}:`, error);
      return [];
    }
  }

  // ============= 私有方法 =============

  /**
   * 确保已初始化
   */
  private ensureInitialized(): void {
    if (!this.isInitialized || !this.config) {
      throw new StorageProviderError('存储提供者未初始化');
    }
  }

  /**
   * 获取完整文件路径
   */
  private getFullPath(relativePath: string): string {
    if (!this.config) {
      throw new StorageProviderError('存储提供者未初始化');
    }

    // 防止路径遍历攻击
    const normalizedPath = path.normalize(relativePath);
    if (normalizedPath.includes('..')) {
      throw new StorageProviderError('非法路径：不允许使用父目录引用');
    }

    return path.join(this.config.rootPath, normalizedPath);
  }

  /**
   * 生成访问URL
   */
  private generateAccessUrl(relativePath: string): string {
    if (!this.config) {
      throw new StorageProviderError('存储提供者未初始化');
    }

    // 规范化路径分隔符为URL格式
    const urlPath = relativePath.replace(/\\/g, '/');

    // 确保URL路径以/开头
    const normalizedUrlPath = urlPath.startsWith('/') ? urlPath : `/${urlPath}`;

    return `${this.config.baseUrl}${normalizedUrlPath}`;
  }

  /**
   * 确保目录存在
   */
  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      // 如果目录已存在，忽略错误
      if (error instanceof Error && 'code' in error && error.code !== 'EEXIST') {
        throw error;
      }
    }
  }

  /**
   * 验证目录访问权限
   */
  private async validateDirectoryAccess(dirPath: string): Promise<void> {
    try {
      // 检查读写权限
      await fs.access(dirPath, fs.constants.R_OK | fs.constants.W_OK);
    } catch (error) {
      throw new StorageProviderError(
        `目录访问权限不足: ${dirPath}, ${error instanceof Error ? error.message : '未知错误'}`
      );
    }
  }

  /**
   * 流式上传大文件（可选实现）
   */
  async uploadStream(
    readableStream: NodeJS.ReadableStream,
    filePath: string
  ): Promise<StorageResult> {
    this.ensureInitialized();

    const startTime = Date.now();
    logger.info(`📤 [LocalStorageProvider] 开始流式上传文件: ${filePath}`);

    try {
      const fullPath = this.getFullPath(filePath);

      // 确保父目录存在
      await this.ensureDirectoryExists(path.dirname(fullPath));

      // 创建写入流
      const writeStream = createWriteStream(fullPath);

      // 使用pipeline进行流式传输
      await pipeline(readableStream, writeStream);

      // 获取文件信息
      const stats = await fs.stat(fullPath);

      // 生成访问URL
      const accessUrl = this.generateAccessUrl(filePath);

      const uploadTime = Date.now() - startTime;
      logger.info(
        `✅ [LocalStorageProvider] 流式上传完成: ${filePath}, 大小: ${stats.size}, 耗时: ${uploadTime}ms`
      );

      return {
        success: true,
        path: filePath,
        url: accessUrl,
        size: stats.size,
        data: {
          fullPath,
          uploadTime,
        },
      };
    } catch (error) {
      logger.error(`❌ [LocalStorageProvider] 流式上传失败: ${filePath}:`, error);

      return {
        success: false,
        error: error instanceof Error ? error.message : '流式上传失败',
      };
    }
  }

  /**
   * 流式下载大文件（可选实现）
   */
  createDownloadStream(path: string): NodeJS.ReadableStream {
    this.ensureInitialized();

    const fullPath = this.getFullPath(path);

    if (!existsSync(fullPath)) {
      throw new StorageProviderError(`文件不存在: ${path}`);
    }

    return createReadStream(fullPath);
  }
}

