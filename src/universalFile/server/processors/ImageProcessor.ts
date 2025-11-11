/**
 * 图片处理器实现
 * 支持压缩、裁剪、水印、格式转换等功能
 */

import * as path from 'path';
import { promises as fs } from 'fs';
import { existsSync } from 'fs';
import { createLogger } from '../../../logger';

import type {
  IFileProcessor,
  ProcessorType,
  ProcessingOptions,
  ProcessingResult,
} from '../types';

import type { ImageProcessingOptions } from '../../types';

const logger = createLogger('ImageProcessor');

// 图片处理相关类型定义
interface ImageMetadata {
  format: string;
  width: number;
  height: number;
  channels: number;
  density: number;
  hasAlpha: boolean;
  orientation?: number;
}

/**
 * 图片处理器
 * 使用Sharp库进行高性能图片处理
 */
export class ImageProcessor implements IFileProcessor {
  readonly type: ProcessorType = 'image';

  private sharp: any = null;
  private isInitialized = false;

  /**
   * 初始化图片处理器
   */
  async initialize(): Promise<void> {
    logger.info('🖼️ [ImageProcessor] 初始化图片处理器...');

    try {
      // 尝试加载Sharp库
      try {
        this.sharp = require('sharp');
        logger.info('✅ [ImageProcessor] Sharp库加载成功');
      } catch (error) {
        console.warn('⚠️ [ImageProcessor] Sharp库未安装，使用模拟模式');
        // 创建模拟Sharp对象
        this.sharp = this.createMockSharp();
      }

      this.isInitialized = true;
      logger.info('✅ [ImageProcessor] 图片处理器初始化完成');
    } catch (error) {
      console.error('❌ [ImageProcessor] 图片处理器初始化失败:', error);
      throw error;
    }
  }

  /**
   * 处理图片文件
   */
  async process(
    inputPath: string,
    outputPath: string,
    options: ProcessingOptions
  ): Promise<ProcessingResult> {
    this.ensureInitialized();

    if (options.type !== 'image') {
      throw new Error('处理选项类型不匹配：期望 image');
    }

    const imageOptions = options as ImageProcessingOptions;
    const startTime = Date.now();

    logger.info(`🖼️ [ImageProcessor] 开始处理图片: ${inputPath}`);

    try {
      // 检查输入文件是否存在
      if (!existsSync(inputPath)) {
        throw new Error(`输入文件不存在: ${inputPath}`);
      }

      // 确保输出目录存在
      const outputDir = path.dirname(outputPath);
      await fs.mkdir(outputDir, { recursive: true });

      // 获取图片元数据
      const metadata = await this.getImageMetadata(inputPath);
      logger.info(
        `📊 [ImageProcessor] 图片信息: ${metadata.width}x${metadata.height}, 格式: ${metadata.format}`
      );

      // 创建Sharp处理实例
      let sharpInstance = this.sharp(inputPath);

      // 应用图片处理操作
      sharpInstance = await this.applyImageOperations(sharpInstance, imageOptions);

      // 确定输出格式
      const outputFormat = this.determineOutputFormat(outputPath, imageOptions.format);

      // 应用输出格式和质量设置
      sharpInstance = this.applyOutputSettings(sharpInstance, outputFormat, imageOptions.quality);

      // 执行处理并保存
      const info = await sharpInstance.toFile(outputPath);

      // 生成缩略图（如果需要）
      let thumbnailPath: string | undefined;
      if (this.shouldGenerateThumbnail(imageOptions)) {
        thumbnailPath = await this.generateThumbnail(inputPath, outputPath, imageOptions);
      }

      const processingTime = Date.now() - startTime;
      logger.info(`✅ [ImageProcessor] 图片处理完成: ${outputPath}, 耗时: ${processingTime}ms`);

      return {
        success: true,
        processedPath: outputPath,
        processedSize: info.size,
        thumbnailPath,
        processingTime,
        data: {
          originalSize: (await fs.stat(inputPath)).size,
          processedSize: info.size,
          compressionRatio:
            ((await fs.stat(inputPath)).size - info.size) / (await fs.stat(inputPath)).size,
          dimensions: {
            original: { width: metadata.width, height: metadata.height },
            processed: { width: info.width, height: info.height },
          },
          format: {
            original: metadata.format,
            processed: outputFormat,
          },
        },
      };
    } catch (error) {
      console.error(`❌ [ImageProcessor] 图片处理失败: ${inputPath}:`, error);

      return {
        success: false,
        error: `图片处理失败: ${error instanceof Error ? error.message : '未知错误'}`,
        processingTime: Date.now() - startTime,
      };
    }
  }

  /**
   * 检查文件是否支持处理
   */
  supports(mimeType: string): boolean {
    const supportedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/avif',
      'image/gif',
      'image/tiff',
      'image/bmp',
    ];

    return supportedTypes.includes(mimeType.toLowerCase());
  }

  /**
   * 获取图片文件信息
   */
  async getFileInfo(filePath: string): Promise<Record<string, any>> {
    this.ensureInitialized();

    try {
      const metadata = await this.getImageMetadata(filePath);
      const stats = await fs.stat(filePath);

      return {
        dimensions: {
          width: metadata.width,
          height: metadata.height,
        },
        format: metadata.format,
        channels: metadata.channels,
        hasAlpha: metadata.hasAlpha,
        density: metadata.density,
        orientation: metadata.orientation,
        fileSize: stats.size,
        aspectRatio: metadata.width / metadata.height,
        megapixels: (metadata.width * metadata.height) / 1000000,
      };
    } catch (error) {
      console.error(`❌ [ImageProcessor] 获取图片信息失败: ${filePath}:`, error);
      throw error;
    }
  }

  // ============= 私有方法 =============

  /**
   * 确保处理器已初始化
   */
  private ensureInitialized(): void {
    if (!this.isInitialized || !this.sharp) {
      throw new Error('图片处理器未初始化');
    }
  }

  /**
   * 获取图片元数据
   */
  private async getImageMetadata(filePath: string): Promise<ImageMetadata> {
    try {
      const metadata = await this.sharp(filePath).metadata();

      return {
        format: metadata.format || 'unknown',
        width: metadata.width || 0,
        height: metadata.height || 0,
        channels: metadata.channels || 3,
        density: metadata.density || 72,
        hasAlpha: metadata.hasAlpha || false,
        orientation: metadata.orientation,
      };
    } catch (error) {
      console.error(`❌ [ImageProcessor] 获取图片元数据失败: ${filePath}:`, error);
      throw new Error(`无法读取图片元数据: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 应用图片处理操作
   */
  private async applyImageOperations(
    sharpInstance: any,
    options: ImageProcessingOptions
  ): Promise<any> {
    // 调整尺寸
    if (options.width || options.height) {
      const resizeOptions: any = {
        width: options.width,
        height: options.height,
        fit: 'inside', // 保持纵横比
        withoutEnlargement: true, // 不放大小图片
      };

      sharpInstance = sharpInstance.resize(resizeOptions);
      logger.info(
        `🔧 [ImageProcessor] 应用尺寸调整: ${options.width || 'auto'}x${options.height || 'auto'}`
      );
    }

    // 旋转和翻转（基于EXIF方向信息）
    sharpInstance = sharpInstance.rotate();

    // 添加水印
    if (options.watermark && options.watermarkOptions) {
      sharpInstance = await this.applyWatermark(sharpInstance, options.watermarkOptions);
    }

    return sharpInstance;
  }

  /**
   * 应用水印
   */
  private async applyWatermark(
    sharpInstance: any,
    watermarkOptions: NonNullable<ImageProcessingOptions['watermarkOptions']>
  ): Promise<any> {
    try {
      if (watermarkOptions.text) {
        // 文字水印
        logger.info(`💧 [ImageProcessor] 应用文字水印: ${watermarkOptions.text}`);

        // 创建文字水印SVG
        const textSvg = this.createTextWatermarkSvg(
          watermarkOptions.text,
          watermarkOptions.opacity || 0.5
        );

        const textBuffer = Buffer.from(textSvg);

        sharpInstance = sharpInstance.composite([
          {
            input: textBuffer,
            gravity: this.getWatermarkGravity(watermarkOptions.position || 'bottom-right'),
          },
        ]);
      } else if (watermarkOptions.image && existsSync(watermarkOptions.image)) {
        // 图片水印
        logger.info(`💧 [ImageProcessor] 应用图片水印: ${watermarkOptions.image}`);

        let watermarkBuffer = await fs.readFile(watermarkOptions.image);

        // 调整水印透明度
        if (watermarkOptions.opacity && watermarkOptions.opacity < 1) {
          const watermarkSharp = this.sharp(watermarkBuffer)
            .png()
            .modulate({ brightness: 1, saturation: 1, alpha: watermarkOptions.opacity });
          watermarkBuffer = await watermarkSharp.toBuffer();
        }

        sharpInstance = sharpInstance.composite([
          {
            input: watermarkBuffer,
            gravity: this.getWatermarkGravity(watermarkOptions.position || 'bottom-right'),
          },
        ]);
      }

      return sharpInstance;
    } catch (error) {
      console.warn(`⚠️ [ImageProcessor] 水印应用失败，跳过水印:`, error);
      return sharpInstance;
    }
  }

  /**
   * 创建文字水印SVG
   */
  private createTextWatermarkSvg(text: string, opacity: number): string {
    const fontSize = 24;
    const padding = 10;

    return `
      <svg width="200" height="50" xmlns="http://www.w3.org/2000/svg">
        <text
          x="${padding}"
          y="${fontSize + padding}"
          font-family="Arial, sans-serif"
          font-size="${fontSize}"
          fill="white"
          fill-opacity="${opacity}"
          stroke="black"
          stroke-width="1"
          stroke-opacity="${opacity * 0.8}"
        >
          ${text}
        </text>
      </svg>
    `.trim();
  }

  /**
   * 获取水印位置对应的gravity值
   */
  private getWatermarkGravity(position: string): string {
    const gravityMap: Record<string, string> = {
      'top-left': 'northwest',
      'top-right': 'northeast',
      'bottom-left': 'southwest',
      'bottom-right': 'southeast',
      center: 'center',
    };

    return gravityMap[position] || 'southeast';
  }

  /**
   * 确定输出格式
   */
  private determineOutputFormat(
    outputPath: string,
    requestedFormat?: ImageProcessingOptions['format']
  ): string {
    if (requestedFormat) {
      return requestedFormat;
    }

    const ext = path.extname(outputPath).toLowerCase();
    const formatMap: Record<string, string> = {
      '.jpg': 'jpeg',
      '.jpeg': 'jpeg',
      '.png': 'png',
      '.webp': 'webp',
      '.avif': 'avif',
    };

    return formatMap[ext] || 'jpeg';
  }

  /**
   * 应用输出设置
   */
  private applyOutputSettings(sharpInstance: any, format: string, quality?: number): any {
    const defaultQuality = 80;
    const finalQuality = quality || defaultQuality;

    switch (format) {
      case 'jpeg':
        return sharpInstance.jpeg({
          quality: finalQuality,
          progressive: true,
          mozjpeg: true,
        });

      case 'png':
        return sharpInstance.png({
          quality: finalQuality,
          progressive: true,
          compressionLevel: 6,
        });

      case 'webp':
        return sharpInstance.webp({
          quality: finalQuality,
          effort: 4,
        });

      case 'avif':
        return sharpInstance.avif({
          quality: finalQuality,
          effort: 4,
        });

      default:
        return sharpInstance.jpeg({ quality: finalQuality });
    }
  }

  /**
   * 是否需要生成缩略图
   */
  private shouldGenerateThumbnail(options: ImageProcessingOptions): boolean {
    // 如果明确设置了尺寸且尺寸较小，可能不需要缩略图
    const isSmallImage =
      (options.width && options.width <= 300) || (options.height && options.height <= 300);

    return !isSmallImage;
  }

  /**
   * 生成缩略图
   */
  private async generateThumbnail(
    inputPath: string,
    outputPath: string,
    _options: ImageProcessingOptions
  ): Promise<string> {
    try {
      const thumbnailPath = this.getThumbnailPath(outputPath);
      const thumbnailSize = 200; // 缩略图固定尺寸

      await this.sharp(inputPath)
        .resize({
          width: thumbnailSize,
          height: thumbnailSize,
          fit: 'cover',
          position: 'center',
        })
        .jpeg({ quality: 70 })
        .toFile(thumbnailPath);

      logger.info(`🖼️ [ImageProcessor] 缩略图生成完成: ${thumbnailPath}`);

      return thumbnailPath;
    } catch (error) {
      console.warn(`⚠️ [ImageProcessor] 缩略图生成失败:`, error);
      throw error;
    }
  }

  /**
   * 获取缩略图路径
   */
  private getThumbnailPath(originalPath: string): string {
    const ext = path.extname(originalPath);
    const basePath = originalPath.replace(ext, '');
    return `${basePath}_thumb${ext}`;
  }

  /**
   * 创建模拟Sharp对象（开发测试用）
   */
  private createMockSharp(): any {
    logger.info('🧪 [ImageProcessor] 创建模拟Sharp处理器');

    const mockSharp = (input: string) => {
      logger.info(`🧪 [MockSharp] 处理图片: ${input}`);

      return {
        metadata: async () => ({
          format: 'jpeg',
          width: 1920,
          height: 1080,
          channels: 3,
          density: 72,
          hasAlpha: false,
        }),

        resize: (options: any) => {
          logger.info(`🧪 [MockSharp] 调整尺寸:`, options);
          return mockSharp(input);
        },

        rotate: () => {
          logger.info(`🧪 [MockSharp] 自动旋转`);
          return mockSharp(input);
        },

        composite: (operations: any[]) => {
          logger.info(`🧪 [MockSharp] 合成操作:`, operations.length);
          return mockSharp(input);
        },

        jpeg: (options: any) => {
          logger.info(`🧪 [MockSharp] JPEG输出:`, options);
          return mockSharp(input);
        },

        png: (options: any) => {
          logger.info(`🧪 [MockSharp] PNG输出:`, options);
          return mockSharp(input);
        },

        webp: (options: any) => {
          logger.info(`🧪 [MockSharp] WebP输出:`, options);
          return mockSharp(input);
        },

        avif: (options: any) => {
          logger.info(`🧪 [MockSharp] AVIF输出:`, options);
          return mockSharp(input);
        },

        toFile: async (outputPath: string) => {
          logger.info(`🧪 [MockSharp] 保存到文件: ${outputPath}`);

          // 创建一个模拟的输出文件
          const outputDir = path.dirname(outputPath);
          await fs.mkdir(outputDir, { recursive: true });
          await fs.writeFile(outputPath, `Mock processed image from ${input}`);

          return {
            format: 'jpeg',
            width: 800,
            height: 600,
            channels: 3,
            premultiplied: false,
            size: 1024 * 50, // 50KB
          };
        },

        toBuffer: async () => {
          logger.info(`🧪 [MockSharp] 转换为Buffer`);
          return Buffer.from('Mock image buffer');
        },
      };
    };

    return mockSharp;
  }

  /**
   * 批量图片处理
   */
  async batchProcess(
    inputPaths: string[],
    outputDir: string,
    options: ImageProcessingOptions,
    onProgress?: (completed: number, total: number) => void
  ): Promise<ProcessingResult[]> {
    this.ensureInitialized();

    logger.info(`🖼️ [ImageProcessor] 开始批量处理 ${inputPaths.length} 张图片`);

    const results: ProcessingResult[] = [];

    for (let i = 0; i < inputPaths.length; i++) {
      const inputPath = inputPaths[i]!;
      const fileName = path.basename(inputPath);
      const outputPath = path.join(outputDir, fileName);

      try {
        const result = await this.process(inputPath, outputPath, options);
        results.push(result);

        if (onProgress) {
          onProgress(i + 1, inputPaths.length);
        }
      } catch (error) {
        console.error(`❌ [ImageProcessor] 批量处理失败: ${inputPath}:`, error);
        results.push({
          success: false,
          error: `处理失败: ${error instanceof Error ? error.message : '未知错误'}`,
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    logger.info(`✅ [ImageProcessor] 批量处理完成，成功: ${successCount}/${inputPaths.length}`);

    return results;
  }
}
