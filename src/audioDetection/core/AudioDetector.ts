/**
 * 音频检测器 - 主控制器
 * Audio Detector - Main Controller
 * 
 * 整合音频输入、音高检测和和弦识别
 * Integrates audio input, pitch detection, and chord recognition
 */

import { AudioInputService } from './AudioInputService';
import { PitchDetector } from './PitchDetector';
import { ChordRecognizer } from './ChordRecognizer';
import type { 
  AudioInputConfig, 
  AudioDetectionResult, 
  AudioDetectorEvents,
  AudioInputState,
  NoteInfo,
  ChordInfo,
} from '../types';

export class AudioDetector {
  private audioInput: AudioInputService;
  private pitchDetector: PitchDetector;
  private chordRecognizer: ChordRecognizer;
  private isDetecting: boolean = false;
  private animationFrameId: number | null = null;
  private events: AudioDetectorEvents;
  private lastResult: AudioDetectionResult | null = null;

  constructor(config: AudioInputConfig = {}, events: AudioDetectorEvents = {}) {
    this.audioInput = new AudioInputService(config);
    const audioConfig = this.audioInput.getConfig();
    
    this.pitchDetector = new PitchDetector(
      audioConfig.sampleRate,
      audioConfig.frequencyRange.min,
      audioConfig.frequencyRange.max
    );
    
    this.chordRecognizer = new ChordRecognizer();
    this.events = events;
  }

  /**
   * 启动音频检测
   * Start audio detection
   */
  async start(): Promise<void> {
    if (this.isDetecting) {
      console.warn('AudioDetector 已经在运行');
      return;
    }

    try {
      // 初始化音频输入
      await this.audioInput.initialize();
      
      // 通知状态变化
      this.events.onStateChange?.('active');
      
      // 开始检测循环
      this.isDetecting = true;
      this.detectLoop();
      
      console.log('AudioDetector 已启动');
    } catch (error) {
      this.events.onStateChange?.('error');
      this.events.onError?.(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * 停止音频检测
   * Stop audio detection
   */
  stop(): void {
    if (!this.isDetecting) {
      return;
    }

    this.isDetecting = false;
    
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    this.audioInput.stop();
    this.events.onStateChange?.('stopped');
    
    console.log('AudioDetector 已停止');
  }

  /**
   * 检测循环
   * Detection loop
   */
  private detectLoop = (): void => {
    if (!this.isDetecting) {
      return;
    }

    try {
      const result = this.detect();
      
      if (result) {
        this.lastResult = result;
        this.events.onDetection?.(result);
      }
    } catch (error) {
      console.error('检测过程中出错:', error);
      this.events.onError?.(error instanceof Error ? error : new Error(String(error)));
    }

    // 继续下一帧
    this.animationFrameId = requestAnimationFrame(this.detectLoop);
  };

  /**
   * 执行一次检测
   * Perform single detection
   */
  private detect(): AudioDetectionResult | null {
    const config = this.audioInput.getConfig();

    // 获取时域数据（用于自相关）
    const timeDomainData = this.audioInput.getTimeDomainData();
    
    // 获取频域数据（用于多音检测）
    const frequencyData = this.audioInput.getFrequencyData();
    
    // 获取当前音量
    const volume = this.audioInput.getCurrentVolume();

    // 调试日志：每2秒输出一次音量信息
    if (Date.now() % 2000 < 100) {
      console.log('[AudioDetector] 当前音量: ' + (volume.toFixed(6)) + ', 阈值: ' + (config.minVolume) + ', 状态: ' + (volume >= config.minVolume ? '✅ 有声音' : '❌ 音量太低'));
    }

    // 检查是否有足够的音量
    if (volume < config.minVolume) {
      return {
        notes: [],
        timestamp: Date.now(),
        isDetecting: false,
      };
    }

    // 方法1: 使用时域自相关检测主音高
    const dominantFrequency = this.pitchDetector.detectPitch(timeDomainData, config.minVolume);
    
    // 方法2: 使用频域检测多个音高
    const detectedNotes = this.pitchDetector.detectMultiplePitches(frequencyData, -60);
    
    // 如果时域检测到了主音高，确保它在结果中
    if (dominantFrequency && dominantFrequency > 0) {
      const dominantNote = this.pitchDetector.frequencyToNote(dominantFrequency, volume);
      if (dominantNote) {
        // 检查是否已经在列表中
        const exists = detectedNotes.some(n => Math.abs(n.midi - dominantNote.midi) < 1);
        if (!exists) {
          detectedNotes.unshift(dominantNote);
        }
      }
    }

    // 过滤掉置信度太低的音符
    const filteredNotes = detectedNotes.filter(note => note.confidence >= config.minConfidence);

    // 识别和弦
    let chord: ChordInfo | undefined;
    if (filteredNotes.length >= 2) {
      chord = this.chordRecognizer.recognizeChord(filteredNotes) ?? undefined;
    }

    return {
      notes: filteredNotes,
      chord,
      timestamp: Date.now(),
      isDetecting: filteredNotes.length > 0,
    };
  }

  /**
   * 获取当前状态
   * Get current state
   */
  getState(): AudioInputState {
    return this.audioInput.getState();
  }

  /**
   * 获取最后的检测结果
   * Get last detection result
   */
  getLastResult(): AudioDetectionResult | null {
    return this.lastResult;
  }

  /**
   * 检查是否正在运行
   * Check if running
   */
  isRunning(): boolean {
    return this.isDetecting && this.audioInput.isRunning();
  }

  /**
   * 获取音频输入服务
   * Get audio input service
   */
  getAudioInput(): AudioInputService {
    return this.audioInput;
  }
}

