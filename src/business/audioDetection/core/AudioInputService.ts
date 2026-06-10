/**
 * 音频输入服务
 * Audio Input Service
 * 
 * 负责管理麦克风输入和音频流处理
 * Manages microphone input and audio stream processing
 */

import type { AudioInputConfig, AudioInputState } from '../types';

export class AudioInputService {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private state: AudioInputState = 'idle';
  private config: Required<AudioInputConfig>;

  constructor(config: AudioInputConfig = {}) {
    this.config = {
      sampleRate: config.sampleRate ?? 44100,
      fftSize: config.fftSize ?? 4096,
      minVolume: config.minVolume ?? 0.001, // 降低默认阈值，使其更敏感
      minConfidence: config.minConfidence ?? 0.5, // 降低默认置信度，更容易检测
      smoothing: config.smoothing ?? 0.8,
      frequencyRange: config.frequencyRange ?? { min: 27.5, max: 4186 }, // A0 到 C8
    };
  }

  /**
   * 初始化音频输入
   * Initialize audio input
   */
  async initialize(): Promise<void> {
    if (this.state === 'active') {
      console.warn('AudioInputService 已经处于活动状态');
      return;
    }

    try {
      this.setState('initializing');

      // 请求麦克风权限
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: this.config.sampleRate,
        },
      });

      // 创建音频上下文
      this.audioContext = new AudioContext({
        sampleRate: this.config.sampleRate,
      });

      // 创建音频源节点
      this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);

      // 创建分析器节点
      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = this.config.fftSize;
      this.analyserNode.smoothingTimeConstant = this.config.smoothing;

      // 连接节点
      this.sourceNode.connect(this.analyserNode);

      this.setState('active');
      console.log('AudioInputService 初始化成功');
    } catch (error) {
      this.setState('error');
      console.error('AudioInputService 初始化失败:', error);
      throw new Error('麦克风初始化失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  }

  /**
   * 获取时域数据
   * Get time domain data
   */
  getTimeDomainData(): Float32Array {
    if (!this.analyserNode) {
      throw new Error('AnalyserNode 未初始化');
    }

    const bufferLength = this.analyserNode.fftSize;
    const dataArray = new Float32Array(bufferLength);
    this.analyserNode.getFloatTimeDomainData(dataArray);
    return dataArray;
  }

  /**
   * 获取频域数据
   * Get frequency domain data
   */
  getFrequencyData(): Float32Array {
    if (!this.analyserNode) {
      throw new Error('AnalyserNode 未初始化');
    }

    const bufferLength = this.analyserNode.frequencyBinCount;
    const dataArray = new Float32Array(bufferLength);
    this.analyserNode.getFloatFrequencyData(dataArray);
    return dataArray;
  }

  /**
   * 获取当前音量
   * Get current volume
   */
  getCurrentVolume(): number {
    const timeDomainData = this.getTimeDomainData();
    let sum = 0;
    for (let i = 0; i < timeDomainData.length; i++) {
      const val = timeDomainData[i];
      if (val !== undefined) {
        sum += val * val;
      }
    }
    return Math.sqrt(sum / timeDomainData.length);
  }

  /**
   * 停止音频输入
   * Stop audio input
   */
  stop(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    if (this.analyserNode) {
      this.analyserNode.disconnect();
      this.analyserNode = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.setState('stopped');
    console.log('AudioInputService 已停止');
  }

  /**
   * 获取当前状态
   * Get current state
   */
  getState(): AudioInputState {
    return this.state;
  }

  /**
   * 获取配置
   * Get configuration
   */
  getConfig(): Required<AudioInputConfig> {
    return { ...this.config };
  }

  /**
   * 获取音频上下文
   * Get audio context
   */
  getAudioContext(): AudioContext | null {
    return this.audioContext;
  }

  /**
   * 获取分析器节点
   * Get analyser node
   */
  getAnalyserNode(): AnalyserNode | null {
    return this.analyserNode;
  }

  /**
   * 设置状态
   * Set state
   */
  private setState(state: AudioInputState): void {
    this.state = state;
  }

  /**
   * 检查是否正在运行
   * Check if running
   */
  isRunning(): boolean {
    return this.state === 'active';
  }
}

