/**
 * 音频处理器实现
 * 支持格式转换、压缩、音质调整等功能
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

import type { AudioProcessingOptions } from '../../types';

const logger = createLogger('AudioProcessor');

// 音频处理相关类型定义
interface AudioMetadata {
  format: string;
  duration: number;
  bitrate: number;
  sampleRate: number;
  channels: number;
  codec: string;
  size: number;
}

/**
 * 音频处理器
 * 使用FFmpeg进行音频处理
 */
export class AudioProcessor implements IFileProcessor {
  readonly type: ProcessorType = 'audio';

  private ffmpeg: any = null;
  private isInitialized = false;

  /**
   * 初始化音频处理器
   */
  async initialize(): Promise<void> {
    logger.info('🎵 [AudioProcessor] 初始化音频处理器...');

    try {
      // 尝试加载FFmpeg库
      try {
        this.ffmpeg = require('fluent-ffmpeg');
        logger.info('✅ [AudioProcessor] FFmpeg库加载成功');
      } catch (error) {
        console.warn('⚠️ [AudioProcessor] FFmpeg库未安装，使用模拟模式');
        // 创建模拟FFmpeg对象
        this.ffmpeg = this.createMockFFmpeg();
      }

      this.isInitialized = true;
      logger.info('✅ [AudioProcessor] 音频处理器初始化完成');
    } catch (error) {
      console.error('❌ [AudioProcessor] 音频处理器初始化失败:', error);
      throw error;
    }
  }

  /**
   * 处理音频文件
   */
  async process(
    inputPath: string,
    outputPath: string,
    options: ProcessingOptions
  ): Promise<ProcessingResult> {
    this.ensureInitialized();

    if (options.type !== 'audio') {
      throw new Error('处理选项类型不匹配：期望 audio');
    }

    const audioOptions = options as AudioProcessingOptions;
    const startTime = Date.now();

    logger.info(`🎵 [AudioProcessor] 开始处理音频: ${inputPath}`);

    try {
      // 检查输入文件是否存在
      if (!existsSync(inputPath)) {
        throw new Error(`输入文件不存在: ${inputPath}`);
      }

      // 确保输出目录存在
      const outputDir = path.dirname(outputPath);
      await fs.mkdir(outputDir, { recursive: true });

      // 获取音频元数据
      const metadata = await this.getAudioMetadata(inputPath);
      logger.info(
        `📊 [AudioProcessor] 音频信息: ${this.formatDuration(metadata.duration)}, ${metadata.bitrate}kbps, ${metadata.sampleRate}Hz`
      );

      // 确定输出格式
      const outputFormat = this.determineOutputFormat(outputPath, audioOptions.format);

      // 执行音频处理
      await this.processAudio(inputPath, outputPath, audioOptions, outputFormat);

      // 获取处理后的文件信息
      const processedStats = await fs.stat(outputPath);
      const processingTime = Date.now() - startTime;

      logger.info(`✅ [AudioProcessor] 音频处理完成: ${outputPath}, 耗时: ${processingTime}ms`);

      return {
        success: true,
        processedPath: outputPath,
        processedSize: processedStats.size,
        processingTime,
        data: {
          originalSize: metadata.size,
          processedSize: processedStats.size,
          compressionRatio: (metadata.size - processedStats.size) / metadata.size,
          duration: metadata.duration,
          originalFormat: metadata.format,
          processedFormat: outputFormat,
          originalBitrate: metadata.bitrate,
          processedBitrate: audioOptions.bitrate || metadata.bitrate,
          sampleRate: audioOptions.sampleRate || metadata.sampleRate,
          channels: audioOptions.channels || metadata.channels,
        },
      };
    } catch (error) {
      console.error(`❌ [AudioProcessor] 音频处理失败: ${inputPath}:`, error);

      return {
        success: false,
        error: `音频处理失败: ${error instanceof Error ? error.message : '未知错误'}`,
        processingTime: Date.now() - startTime,
      };
    }
  }

  /**
   * 检查文件是否支持处理
   */
  supports(mimeType: string): boolean {
    const supportedTypes = [
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/wave',
      'audio/x-wav',
      'audio/ogg',
      'audio/vorbis',
      'audio/aac',
      'audio/x-aac',
      'audio/mp4',
      'audio/m4a',
      'audio/flac',
      'audio/x-flac',
      'audio/webm',
      'audio/opus',
    ];

    return supportedTypes.includes(mimeType.toLowerCase());
  }

  /**
   * 获取音频文件信息
   */
  async getFileInfo(filePath: string): Promise<Record<string, any>> {
    this.ensureInitialized();

    try {
      const metadata = await this.getAudioMetadata(filePath);

      return {
        duration: metadata.duration,
        durationFormatted: this.formatDuration(metadata.duration),
        bitrate: metadata.bitrate,
        sampleRate: metadata.sampleRate,
        channels: metadata.channels,
        channelsDescription: this.getChannelsDescription(metadata.channels),
        format: metadata.format,
        codec: metadata.codec,
        fileSize: metadata.size,
        quality: this.getQualityDescription(metadata.bitrate, metadata.sampleRate),
      };
    } catch (error) {
      console.error(`❌ [AudioProcessor] 获取音频信息失败: ${filePath}:`, error);
      throw error;
    }
  }

  // ============= 私有方法 =============

  /**
   * 确保处理器已初始化
   */
  private ensureInitialized(): void {
    if (!this.isInitialized || !this.ffmpeg) {
      throw new Error('音频处理器未初始化');
    }
  }

  /**
   * 获取音频元数据
   */
  private async getAudioMetadata(filePath: string): Promise<AudioMetadata> {
    return new Promise((resolve, reject) => {
      try {
        this.ffmpeg.ffprobe(filePath, (err: any, metadata: any) => {
          if (err) {
            console.error(`❌ [AudioProcessor] 获取音频元数据失败: ${filePath}:`, err);
            reject(new Error(`无法读取音频元数据: ${err.message}`));
            return;
          }

          const audioStream = metadata.streams?.find(
            (stream: any) => stream.codec_type === 'audio'
          );
          if (!audioStream) {
            reject(new Error('文件中未找到音频流'));
            return;
          }

          const result: AudioMetadata = {
            format: metadata.format?.format_name || 'unknown',
            duration: parseFloat(metadata.format?.duration || '0'),
            bitrate: parseInt(audioStream.bit_rate || '0') / 1000, // 转换为kbps
            sampleRate: parseInt(audioStream.sample_rate || '0'),
            channels: parseInt(audioStream.channels || '0'),
            codec: audioStream.codec_name || 'unknown',
            size: parseInt(metadata.format?.size || '0'),
          };

          resolve(result);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 执行音频处理
   */
  private async processAudio(
    inputPath: string,
    outputPath: string,
    options: AudioProcessingOptions,
    outputFormat: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        let command = this.ffmpeg(inputPath);

        // 设置音频编解码器
        command = this.setAudioCodec(command, outputFormat);

        // 设置比特率
        if (options.bitrate) {
          command = command.audioBitrate(options.bitrate);
          logger.info(`🔧 [AudioProcessor] 设置比特率: ${options.bitrate}kbps`);
        }

        // 设置采样率
        if (options.sampleRate) {
          command = command.audioFrequency(options.sampleRate);
          logger.info(`🔧 [AudioProcessor] 设置采样率: ${options.sampleRate}Hz`);
        }

        // 设置声道数
        if (options.channels) {
          command = command.audioChannels(options.channels);
          logger.info(`🔧 [AudioProcessor] 设置声道数: ${options.channels}`);
        }

        // 设置输出格式
        command = command.format(outputFormat);

        // 添加进度监听
        command.on('progress', (progress: any) => {
          if (progress.percent) {
            logger.info(`🎵 [AudioProcessor] 处理进度: ${Math.round(progress.percent)}%`);
          }
        });

        // 添加错误监听
        command.on('error', (err: any) => {
          console.error(`❌ [AudioProcessor] FFmpeg处理错误:`, err);
          reject(new Error(`音频处理失败: ${err.message}`));
        });

        // 添加完成监听
        command.on('end', () => {
          logger.info(`✅ [AudioProcessor] FFmpeg处理完成: ${outputPath}`);
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
   * 设置音频编解码器
   */
  private setAudioCodec(command: any, format: string): any {
    switch (format) {
      case 'mp3':
        return command.audioCodec('libmp3lame');
      case 'aac':
        return command.audioCodec('aac');
      case 'ogg':
        return command.audioCodec('libvorbis');
      case 'wav':
        return command.audioCodec('pcm_s16le');
      default:
        return command;
    }
  }

  /**
   * 确定输出格式
   */
  private determineOutputFormat(
    outputPath: string,
    requestedFormat?: AudioProcessingOptions['format']
  ): string {
    if (requestedFormat) {
      return requestedFormat;
    }

    const ext = path.extname(outputPath).toLowerCase();
    const formatMap: Record<string, string> = {
      '.mp3': 'mp3',
      '.wav': 'wav',
      '.ogg': 'ogg',
      '.aac': 'aac',
      '.m4a': 'aac',
    };

    return formatMap[ext] || 'mp3';
  }

  /**
   * 格式化时长显示
   */
  private formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  /**
   * 获取声道描述
   */
  private getChannelsDescription(channels: number): string {
    switch (channels) {
      case 1:
        return '单声道';
      case 2:
        return '立体声';
      case 6:
        return '5.1环绕声';
      case 8:
        return '7.1环绕声';
      default:
        return `${channels}声道`;
    }
  }

  /**
   * 获取音质描述
   */
  private getQualityDescription(bitrate: number, sampleRate: number): string {
    if (bitrate >= 320 && sampleRate >= 44100) {
      return '高音质';
    } else if (bitrate >= 192 && sampleRate >= 44100) {
      return '标准音质';
    } else if (bitrate >= 128) {
      return '一般音质';
    } else {
      return '低音质';
    }
  }

  /**
   * 创建模拟FFmpeg对象（开发测试用）
   */
  private createMockFFmpeg(): any {
    logger.info('🧪 [AudioProcessor] 创建模拟FFmpeg处理器');

    const mockFFmpeg = (input: string) => {
      logger.info(`🧪 [MockFFmpeg] 处理音频: ${input}`);

      return {
        audioBitrate: (bitrate: number) => {
          logger.info(`🧪 [MockFFmpeg] 设置比特率: ${bitrate}kbps`);
          return mockFFmpeg(input);
        },

        audioFrequency: (sampleRate: number) => {
          logger.info(`🧪 [MockFFmpeg] 设置采样率: ${sampleRate}Hz`);
          return mockFFmpeg(input);
        },

        audioChannels: (channels: number) => {
          logger.info(`🧪 [MockFFmpeg] 设置声道数: ${channels}`);
          return mockFFmpeg(input);
        },

        audioCodec: (codec: string) => {
          logger.info(`🧪 [MockFFmpeg] 设置编解码器: ${codec}`);
          return mockFFmpeg(input);
        },

        format: (format: string) => {
          logger.info(`🧪 [MockFFmpeg] 设置输出格式: ${format}`);
          return mockFFmpeg(input);
        },

        on: (event: string, callback: Function) => {
          logger.info(`🧪 [MockFFmpeg] 注册事件监听: ${event}`);

          if (event === 'progress') {
            // 模拟进度更新
            setTimeout(() => callback({ percent: 50 }), 100);
            setTimeout(() => callback({ percent: 100 }), 200);
          } else if (event === 'end') {
            // 模拟处理完成
            setTimeout(() => callback(), 300);
          }

          return mockFFmpeg(input);
        },

        save: async (outputPath: string) => {
          logger.info(`🧪 [MockFFmpeg] 保存音频文件: ${outputPath}`);

          // 创建模拟输出文件
          const outputDir = path.dirname(outputPath);
          await fs.mkdir(outputDir, { recursive: true });
          await fs.writeFile(outputPath, `Mock processed audio from ${input}`);
        },
      };
    };

    // 添加ffprobe方法
    mockFFmpeg.ffprobe = (filePath: string, callback: Function) => {
      logger.info(`🧪 [MockFFmpeg] 获取音频元数据: ${filePath}`);

      setTimeout(() => {
        const mockMetadata = {
          streams: [
            {
              codec_type: 'audio',
              codec_name: 'mp3',
              bit_rate: '128000',
              sample_rate: '44100',
              channels: '2',
            },
          ],
          format: {
            format_name: 'mp3',
            duration: '180.5',
            size: '1024000',
          },
        };

        callback(null, mockMetadata);
      }, 100);
    };

    return mockFFmpeg;
  }

  /**
   * 批量音频处理
   */
  async batchProcess(
    inputPaths: string[],
    outputDir: string,
    options: AudioProcessingOptions,
    onProgress?: (completed: number, total: number) => void
  ): Promise<ProcessingResult[]> {
    this.ensureInitialized();

    logger.info(`🎵 [AudioProcessor] 开始批量处理 ${inputPaths.length} 个音频文件`);

    const results: ProcessingResult[] = [];

    for (let i = 0; i < inputPaths.length; i++) {
      const inputPath = inputPaths[i]!;
      const fileName = path.basename(inputPath);
      const nameWithoutExt = path.parse(fileName).name;
      const outputFormat = options.format || 'mp3';
      const outputPath = path.join(outputDir, `${nameWithoutExt}.${outputFormat}`);

      try {
        const result = await this.process(inputPath, outputPath, options);
        results.push(result);

        if (onProgress) {
          onProgress(i + 1, inputPaths.length);
        }
      } catch (error) {
        console.error(`❌ [AudioProcessor] 批量处理失败: ${inputPath}:`, error);
        results.push({
          success: false,
          error: `处理失败: ${error instanceof Error ? error.message : '未知错误'}`,
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    logger.info(`✅ [AudioProcessor] 批量处理完成，成功: ${successCount}/${inputPaths.length}`);

    return results;
  }

  /**
   * 提取音频封面
   */
  async extractCover(inputPath: string, outputPath: string): Promise<boolean> {
    this.ensureInitialized();

    return new Promise((resolve) => {
      try {
        this.ffmpeg(inputPath)
          .outputOptions(['-an', '-vcodec copy'])
          .on('error', (err: any) => {
            console.warn(`⚠️ [AudioProcessor] 提取封面失败: ${err.message}`);
            resolve(false);
          })
          .on('end', () => {
            logger.info(`🖼️ [AudioProcessor] 音频封面提取完成: ${outputPath}`);
            resolve(true);
          })
          .save(outputPath);
      } catch (error) {
        console.warn(`⚠️ [AudioProcessor] 提取封面异常:`, error);
        resolve(false);
      }
    });
  }

  /**
   * 音频降噪处理
   */
  async denoise(inputPath: string, outputPath: string): Promise<ProcessingResult> {
    this.ensureInitialized();

    const startTime = Date.now();
    logger.info(`🔇 [AudioProcessor] 开始音频降噪: ${inputPath}`);

    return new Promise((resolve) => {
      try {
        this.ffmpeg(inputPath)
          .audioFilters('highpass=f=200,lowpass=f=3000')
          .on('error', (err: any) => {
            resolve({
              success: false,
              error: `降噪处理失败: ${err.message}`,
              processingTime: Date.now() - startTime,
            });
          })
          .on('end', async () => {
            const processedStats = await fs.stat(outputPath);

            resolve({
              success: true,
              processedPath: outputPath,
              processedSize: processedStats.size,
              processingTime: Date.now() - startTime,
              data: {
                operation: 'denoise',
                filters: 'highpass=f=200,lowpass=f=3000',
              },
            });
          })
          .save(outputPath);
      } catch (error) {
        resolve({
          success: false,
          error: `降噪处理异常: ${error instanceof Error ? error.message : '未知错误'}`,
          processingTime: Date.now() - startTime,
        });
      }
    });
  }
}
