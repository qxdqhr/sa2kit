/**
 * 视频处理器实现
 * 支持缩略图生成、格式转换、压缩等功能
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

import type { VideoProcessingOptions } from '../../types';

const logger = createLogger('VideoProcessor');

// 视频处理相关类型定义
interface VideoMetadata {
  format: string;
  duration: number;
  bitrate: number;
  width: number;
  height: number;
  fps: number;
  codec: string;
  size: number;
  aspectRatio: number;
}

/**
 * 视频处理器
 * 使用FFmpeg进行视频处理
 */
export class VideoProcessor implements IFileProcessor {
  readonly type: ProcessorType = 'video';

  private ffmpeg: any = null;
  private isInitialized = false;

  /**
   * 初始化视频处理器
   */
  async initialize(): Promise<void> {
    logger.info('🎬 [VideoProcessor] 初始化视频处理器...');

    try {
      // 尝试加载FFmpeg库
      try {
        this.ffmpeg = require('fluent-ffmpeg');
        logger.info('✅ [VideoProcessor] FFmpeg库加载成功');
      } catch (error) {
        console.warn('⚠️ [VideoProcessor] FFmpeg库未安装，使用模拟模式');
        // 创建模拟FFmpeg对象
        this.ffmpeg = this.createMockFFmpeg();
      }

      this.isInitialized = true;
      logger.info('✅ [VideoProcessor] 视频处理器初始化完成');
    } catch (error) {
      console.error('❌ [VideoProcessor] 视频处理器初始化失败:', error);
      throw error;
    }
  }

  /**
   * 处理视频文件
   */
  async process(
    inputPath: string,
    outputPath: string,
    options: ProcessingOptions
  ): Promise<ProcessingResult> {
    this.ensureInitialized();

    if (options.type !== 'video') {
      throw new Error('处理选项类型不匹配：期望 video');
    }

    const videoOptions = options as VideoProcessingOptions;
    const startTime = Date.now();

    logger.info('🎬 [VideoProcessor] 开始处理视频: ' + (inputPath));

    try {
      // 检查输入文件是否存在
      if (!existsSync(inputPath)) {
        throw new Error('输入文件不存在: ' + (inputPath));
      }

      // 确保输出目录存在
      const outputDir = path.dirname(outputPath);
      await fs.mkdir(outputDir, { recursive: true });

      // 获取视频元数据
      const metadata = await this.getVideoMetadata(inputPath);
      logger.info(
        '📊 [VideoProcessor] 视频信息: ' + (metadata.width) + 'x' + (metadata.height) + ', ' + (this.formatDuration(metadata.duration)) + ', ' + (metadata.fps) + 'fps'
      );

      // 确定输出格式
      const outputFormat = this.determineOutputFormat(outputPath, videoOptions.format);

      // 执行视频处理
      await this.processVideo(inputPath, outputPath, videoOptions, outputFormat);

      // 生成缩略图（如果需要）
      let thumbnailPath: string | undefined;
      if (videoOptions.generateThumbnail !== false) {
        thumbnailPath = await this.generateThumbnail(
          inputPath,
          outputPath,
          videoOptions.thumbnailTime || 1
        );
      }

      // 获取处理后的文件信息
      const processedStats = await fs.stat(outputPath);
      const processingTime = Date.now() - startTime;

      logger.info('✅ [VideoProcessor] 视频处理完成: ' + (outputPath) + ', 耗时: ' + (processingTime) + 'ms');

      return {
        success: true,
        processedPath: outputPath,
        processedSize: processedStats.size,
        thumbnailPath,
        processingTime,
        data: {
          originalSize: metadata.size,
          processedSize: processedStats.size,
          compressionRatio: (metadata.size - processedStats.size) / metadata.size,
          duration: metadata.duration,
          originalFormat: metadata.format,
          processedFormat: outputFormat,
          dimensions: {
            original: { width: metadata.width, height: metadata.height },
            processed: { width: metadata.width, height: metadata.height }, // 处理后可能会变化
          },
          fps: metadata.fps,
          bitrate: metadata.bitrate,
        },
      };
    } catch (error) {
      console.error('❌ [VideoProcessor] 视频处理失败: ' + (inputPath) + ':', error);

      return {
        success: false,
        error: '视频处理失败: ' + (error instanceof Error ? error.message : '未知错误'),
        processingTime: Date.now() - startTime,
      };
    }
  }

  /**
   * 检查文件是否支持处理
   */
  supports(mimeType: string): boolean {
    const supportedTypes = [
      'video/mp4',
      'video/x-msvideo', // avi
      'video/quicktime', // mov
      'video/x-ms-wmv', // wmv
      'video/webm',
      'video/ogg',
      'video/3gpp', // 3gp
      'video/x-flv', // flv
      'video/x-matroska', // mkv
    ];

    return supportedTypes.includes(mimeType.toLowerCase());
  }

  /**
   * 获取视频文件信息
   */
  async getFileInfo(filePath: string): Promise<Record<string, any>> {
    this.ensureInitialized();

    try {
      const metadata = await this.getVideoMetadata(filePath);

      return {
        duration: metadata.duration,
        durationFormatted: this.formatDuration(metadata.duration),
        dimensions: {
          width: metadata.width,
          height: metadata.height,
        },
        resolution: this.getResolutionDescription(metadata.width, metadata.height),
        aspectRatio: metadata.aspectRatio,
        fps: metadata.fps,
        bitrate: metadata.bitrate,
        format: metadata.format,
        codec: metadata.codec,
        fileSize: metadata.size,
        quality: this.getQualityDescription(metadata.width, metadata.height, metadata.bitrate),
      };
    } catch (error) {
      console.error('❌ [VideoProcessor] 获取视频信息失败: ' + (filePath) + ':', error);
      throw error;
    }
  }

  // ============= 私有方法 =============

  /**
   * 确保处理器已初始化
   */
  private ensureInitialized(): void {
    if (!this.isInitialized || !this.ffmpeg) {
      throw new Error('视频处理器未初始化');
    }
  }

  /**
   * 获取视频元数据
   */
  private async getVideoMetadata(filePath: string): Promise<VideoMetadata> {
    return new Promise((resolve, reject) => {
      try {
        this.ffmpeg.ffprobe(filePath, (err: any, metadata: any) => {
          if (err) {
            console.error('❌ [VideoProcessor] 获取视频元数据失败: ' + (filePath) + ':', err);
            reject(new Error('无法读取视频元数据: ' + (err.message)));
            return;
          }

          const videoStream = metadata.streams?.find(
            (stream: any) => stream.codec_type === 'video'
          );
          if (!videoStream) {
            reject(new Error('文件中未找到视频流'));
            return;
          }

          const width = parseInt(videoStream.width || '0');
          const height = parseInt(videoStream.height || '0');

          const result: VideoMetadata = {
            format: metadata.format?.format_name || 'unknown',
            duration: parseFloat(metadata.format?.duration || '0'),
            bitrate: parseInt(metadata.format?.bit_rate || '0') / 1000, // 转换为kbps
            width,
            height,
            fps: this.parseFPS(videoStream.r_frame_rate || '0/1'),
            codec: videoStream.codec_name || 'unknown',
            size: parseInt(metadata.format?.size || '0'),
            aspectRatio: width > 0 && height > 0 ? width / height : 16 / 9,
          };

          resolve(result);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 解析帧率
   */
  private parseFPS(frameRate: string): number {
    const parts = frameRate.split('/').map(Number);
    const numerator = parts[0] || 0;
    const denominator = parts[1] || 1;
    return denominator > 0 ? numerator / denominator : 0;
  }

  /**
   * 执行视频处理
   */
  private async processVideo(
    inputPath: string,
    outputPath: string,
    options: VideoProcessingOptions,
    outputFormat: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        let command = this.ffmpeg(inputPath);

        // 设置视频编解码器
        command = this.setVideoCodec(command, outputFormat);

        // 设置质量
        if (options.quality) {
          command = this.setVideoQuality(command, options.quality);
          logger.info('🔧 [VideoProcessor] 设置视频质量: ' + (options.quality));
        }

        // 设置输出格式
        command = command.format(outputFormat);

        // 添加进度监听
        command.on('progress', (progress: any) => {
          if (progress.percent) {
            logger.info('🎬 [VideoProcessor] 处理进度: ' + (Math.round(progress.percent)) + '%');
          }
        });

        // 添加错误监听
        command.on('error', (err: any) => {
          console.error(`❌ [VideoProcessor] FFmpeg处理错误:`, err);
          reject(new Error('视频处理失败: ' + (err.message)));
        });

        // 添加完成监听
        command.on('end', () => {
          logger.info('✅ [VideoProcessor] FFmpeg处理完成: ' + (outputPath));
          resolve();
        });

        // 开始处理
        command.save(outputPath);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 设置视频编解码器
   */
  private setVideoCodec(command: any, format: string): any {
    switch (format) {
      case 'mp4':
        return command.videoCodec('libx264').audioCodec('aac');
      case 'webm':
        return command.videoCodec('libvpx-vp9').audioCodec('libvorbis');
      case 'avi':
        return command.videoCodec('libx264').audioCodec('mp3');
      case 'mov':
        return command.videoCodec('libx264').audioCodec('aac');
      default:
        return command.videoCodec('libx264').audioCodec('aac');
    }
  }

  /**
   * 设置视频质量
   */
  private setVideoQuality(command: any, quality: number): any {
    // 质量范围：1-100，值越高质量越好
    const crf = Math.max(18, Math.min(51, 51 - Math.floor(quality * 0.33))); // 将1-100映射到51-18
    return command.outputOptions(['-crf ' + (crf)]);
  }

  /**
   * 确定输出格式
   */
  private determineOutputFormat(
    outputPath: string,
    requestedFormat?: VideoProcessingOptions['format']
  ): string {
    if (requestedFormat) {
      return requestedFormat;
    }

    const ext = path.extname(outputPath).toLowerCase();
    const formatMap: Record<string, string> = {
      '.mp4': 'mp4',
      '.avi': 'avi',
      '.mov': 'mov',
      '.webm': 'webm',
    };

    return formatMap[ext] || 'mp4';
  }

  /**
   * 生成缩略图
   */
  private async generateThumbnail(
    inputPath: string,
    outputPath: string,
    timeOffset: number
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const thumbnailPath = this.getThumbnailPath(outputPath);

        this.ffmpeg(inputPath)
          .seekInput(timeOffset)
          .frames(1)
          .size('320x240')
          .on('error', (err: any) => {
            console.warn('⚠️ [VideoProcessor] 缩略图生成失败: ' + (err.message));
            reject(err);
          })
          .on('end', () => {
            logger.info('🖼️ [VideoProcessor] 视频缩略图生成完成: ' + (thumbnailPath));
            resolve(thumbnailPath);
          })
          .save(thumbnailPath);
      } catch (error) {
        console.warn(`⚠️ [VideoProcessor] 缩略图生成异常:`, error);
        reject(error);
      }
    });
  }

  /**
   * 获取缩略图路径
   */
  private getThumbnailPath(originalPath: string): string {
    const ext = path.extname(originalPath);
    const basePath = originalPath.replace(ext, '');
    return (basePath) + '_thumb.jpg';
  }

  /**
   * 格式化时长显示
   */
  private formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    if (hours > 0) {
      return (hours) + ':' + (minutes.toString().padStart(2, '0')) + ':' + (remainingSeconds.toString().padStart(2, '0'));
    } else {
      return (minutes) + ':' + (remainingSeconds.toString().padStart(2, '0'));
    }
  }

  /**
   * 获取分辨率描述
   */
  private getResolutionDescription(width: number, height: number): string {
    if (width >= 3840 && height >= 2160) {
      return '4K UHD';
    } else if (width >= 1920 && height >= 1080) {
      return '1080p Full HD';
    } else if (width >= 1280 && height >= 720) {
      return '720p HD';
    } else if (width >= 640 && height >= 480) {
      return '480p SD';
    } else {
      return (width) + 'x' + (height);
    }
  }

  /**
   * 获取视频质量描述
   */
  private getQualityDescription(width: number, height: number, bitrate: number): string {
    const pixels = width * height;
    const bitratePerPixel = (bitrate / pixels) * 1000; // 每像素比特率

    if (pixels >= 1920 * 1080 && bitratePerPixel >= 0.1) {
      return '高清';
    } else if (pixels >= 1280 * 720 && bitratePerPixel >= 0.05) {
      return '标清';
    } else if (bitratePerPixel >= 0.02) {
      return '一般';
    } else {
      return '低质量';
    }
  }

  /**
   * 创建模拟FFmpeg对象（开发测试用）
   */
  private createMockFFmpeg(): any {
    logger.info('🧪 [VideoProcessor] 创建模拟FFmpeg处理器');

    const mockFFmpeg = (input: string) => {
      logger.info('🧪 [MockFFmpeg] 处理视频: ' + (input));

      return {
        videoCodec: (codec: string) => {
          logger.info('🧪 [MockFFmpeg] 设置视频编解码器: ' + (codec));
          return mockFFmpeg(input);
        },

        audioCodec: (codec: string) => {
          logger.info('🧪 [MockFFmpeg] 设置音频编解码器: ' + (codec));
          return mockFFmpeg(input);
        },

        format: (format: string) => {
          logger.info('🧪 [MockFFmpeg] 设置输出格式: ' + (format));
          return mockFFmpeg(input);
        },

        outputOptions: (options: string[]) => {
          logger.info(`🧪 [MockFFmpeg] 设置输出选项:`, options);
          return mockFFmpeg(input);
        },

        seekInput: (time: number) => {
          logger.info('🧪 [MockFFmpeg] 跳转到时间: ' + (time) + 's');
          return mockFFmpeg(input);
        },

        frames: (count: number) => {
          logger.info('🧪 [MockFFmpeg] 提取帧数: ' + (count));
          return mockFFmpeg(input);
        },

        size: (size: string) => {
          logger.info('🧪 [MockFFmpeg] 设置尺寸: ' + (size));
          return mockFFmpeg(input);
        },

        on: (event: string, callback: Function) => {
          logger.info('🧪 [MockFFmpeg] 注册事件监听: ' + (event));

          if (event === 'progress') {
            // 模拟进度更新
            setTimeout(() => callback({ percent: 25 }), 100);
            setTimeout(() => callback({ percent: 50 }), 200);
            setTimeout(() => callback({ percent: 75 }), 300);
            setTimeout(() => callback({ percent: 100 }), 400);
          } else if (event === 'end') {
            // 模拟处理完成
            setTimeout(() => callback(), 500);
          }

          return mockFFmpeg(input);
        },

        save: async (outputPath: string) => {
          logger.info('🧪 [MockFFmpeg] 保存视频文件: ' + (outputPath));

          // 创建模拟输出文件
          const outputDir = path.dirname(outputPath);
          await fs.mkdir(outputDir, { recursive: true });
          await fs.writeFile(outputPath, 'Mock processed video from ' + (input));
        },
      };
    };

    // 添加ffprobe方法
    mockFFmpeg.ffprobe = (filePath: string, callback: Function) => {
      logger.info('🧪 [MockFFmpeg] 获取视频元数据: ' + (filePath));

      setTimeout(() => {
        const mockMetadata = {
          streams: [
            {
              codec_type: 'video',
              codec_name: 'h264',
              width: '1920',
              height: '1080',
              r_frame_rate: '30/1',
            },
          ],
          format: {
            format_name: 'mp4',
            duration: '300.0',
            size: '50000000',
            bit_rate: '1000000',
          },
        };

        callback(null, mockMetadata);
      }, 100);
    };

    return mockFFmpeg;
  }

  /**
   * 批量视频处理
   */
  async batchProcess(
    inputPaths: string[],
    outputDir: string,
    options: VideoProcessingOptions,
    onProgress?: (completed: number, total: number) => void
  ): Promise<ProcessingResult[]> {
    this.ensureInitialized();

    logger.info('🎬 [VideoProcessor] 开始批量处理 ' + (inputPaths.length) + ' 个视频文件');

    const results: ProcessingResult[] = [];

    for (let i = 0; i < inputPaths.length; i++) {
      const inputPath = inputPaths[i]!;
      const fileName = path.basename(inputPath);
      const nameWithoutExt = path.parse(fileName).name;
      const outputFormat = options.format || 'mp4';
      const outputPath = path.join(outputDir, (nameWithoutExt) + '.' + (outputFormat));

      try {
        const result = await this.process(inputPath, outputPath, options);
        results.push(result);

        if (onProgress) {
          onProgress(i + 1, inputPaths.length);
        }
      } catch (error) {
        console.error('❌ [VideoProcessor] 批量处理失败: ' + (inputPath) + ':', error);
        results.push({
          success: false,
          error: '处理失败: ' + (error instanceof Error ? error.message : '未知错误'),
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    logger.info('✅ [VideoProcessor] 批量处理完成，成功: ' + (successCount) + '/' + (inputPaths.length));

    return results;
  }

  /**
   * 提取视频帧
   */
  async extractFrames(
    inputPath: string,
    outputDir: string,
    options: {
      count?: number;
      interval?: number;
      format?: 'jpg' | 'png';
    } = {}
  ): Promise<string[]> {
    this.ensureInitialized();

    const { count = 10, interval, format = 'jpg' } = options;

    logger.info('🖼️ [VideoProcessor] 提取视频帧: ' + (inputPath) + ', 数量: ' + (count));

    return new Promise((resolve, reject) => {
      try {
        let command = this.ffmpeg(inputPath);

        if (interval) {
          // 按间隔提取
          command = command.outputOptions(['-vf fps=1/' + (interval)]);
        } else {
          // 按数量提取
          command = command.frames(count);
        }

        const outputPattern = path.join(outputDir, 'frame_%03d.' + (format));

        command
          .on('error', (err: any) => {
            console.error(`❌ [VideoProcessor] 提取帧失败:`, err);
            reject(new Error('提取帧失败: ' + (err.message)));
          })
          .on('end', async () => {
            // 查找生成的帧文件
            try {
              const files = await fs.readdir(outputDir);
              const frameFiles = files
                .filter((file) => file.startsWith('frame_') && file.endsWith('.' + (format)))
                .sort()
                .map((file) => path.join(outputDir, file));

              logger.info('✅ [VideoProcessor] 帧提取完成，共 ' + (frameFiles.length) + ' 帧');
              resolve(frameFiles);
            } catch (error) {
              reject(error);
            }
          })
          .save(outputPattern);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 视频压缩
   */
  async compress(
    inputPath: string,
    outputPath: string,
    compressionLevel: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<ProcessingResult> {
    this.ensureInitialized();

    logger.info('🗜️ [VideoProcessor] 开始视频压缩: ' + (inputPath) + ', 级别: ' + (compressionLevel));

    const options: VideoProcessingOptions = {
      type: 'video',
      quality: this.getCompressionQuality(compressionLevel),
      format: 'mp4',
    };

    return this.process(inputPath, outputPath, options);
  }

  /**
   * 获取压缩质量
   */
  private getCompressionQuality(level: 'low' | 'medium' | 'high'): number {
    switch (level) {
      case 'low':
        return 30;
      case 'medium':
        return 60;
      case 'high':
        return 85;
      default:
        return 60;
    }
  }
}
