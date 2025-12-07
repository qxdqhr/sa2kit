/**
 * 音频检测调试工具
 * Audio Detection Debug Tool
 */

import { AudioDetector } from './AudioDetector';
import type { AudioInputConfig } from '../types';

export class AudioDetectorDebugger {
  private detector: AudioDetector;
  private debugInterval: number | null = null;

  constructor(config: AudioInputConfig = {}) {
    this.detector = new AudioDetector(config, {
      onDetection: (result) => {
        if (result.isDetecting) {
          console.log('🎵 检测到音符:', result.notes.map(n => `${n.name}(${n.frequency.toFixed(1)}Hz)`).join(', '));
          if (result.chord) {
            console.log('🎹 检测到和弦:', result.chord.name);
          }
        }
      },
      onStateChange: (state) => {
        console.log('📊 状态变化:', state);
      },
      onError: (error) => {
        console.error('❌ 错误:', error);
      },
    });
  }

  async start(): Promise<void> {
    await this.detector.start();
    
    // 启动调试信息输出
    this.debugInterval = window.setInterval(() => {
      const audioInput = this.detector.getAudioInput();
      const volume = audioInput.getCurrentVolume();
      const config = audioInput.getConfig();
      const analyser = audioInput.getAnalyserNode();
      
      if (analyser) {
        // 获取频域数据
        const freqData = new Float32Array(analyser.frequencyBinCount);
        analyser.getFloatFrequencyData(freqData);
        
        // 找到最大值
        let maxFreqValue = -Infinity;
        for (let i = 0; i < freqData.length; i++) {
          const val = freqData[i];
          if (val !== undefined && val > maxFreqValue) {
            maxFreqValue = val;
          }
        }
        
        console.log(`
🎤 音频调试信息:
  - 音量 (RMS): ${volume.toFixed(6)}
  - 音量阈值: ${config.minVolume}
  - 音量状态: ${volume >= config.minVolume ? '✅ 超过阈值' : '❌ 低于阈值'}
  - 最大频率强度: ${maxFreqValue.toFixed(2)} dB
  - 采样率: ${config.sampleRate} Hz
  - FFT大小: ${config.fftSize}
  - 平滑系数: ${config.smoothing}
        `);
      }
    }, 2000);
  }

  stop(): void {
    if (this.debugInterval !== null) {
      clearInterval(this.debugInterval);
      this.debugInterval = null;
    }
    this.detector.stop();
  }

  getDetector(): AudioDetector {
    return this.detector;
  }

  /**
   * 测试麦克风是否正常工作
   */
  async testMicrophone(): Promise<{
    hasPermission: boolean;
    isReceivingAudio: boolean;
    averageVolume: number;
    peakVolume: number;
  }> {
    console.log('🔍 开始测试麦克风...');
    
    await this.detector.start();
    
    // 收集5秒的音量数据
    const volumes: number[] = [];
    const audioInput = this.detector.getAudioInput();
    
    return new Promise((resolve) => {
      const sampleInterval = setInterval(() => {
        volumes.push(audioInput.getCurrentVolume());
      }, 100);
      
      setTimeout(() => {
        clearInterval(sampleInterval);
        
        const averageVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
        const peakVolume = Math.max(...volumes);
        const isReceivingAudio = peakVolume > 0.0001;
        
        console.log(`
✅ 麦克风测试完成:
  - 权限状态: ✅ 已授权
  - 接收音频: ${isReceivingAudio ? '✅ 是' : '❌ 否'}
  - 平均音量: ${averageVolume.toFixed(6)}
  - 峰值音量: ${peakVolume.toFixed(6)}
  - 建议阈值: ${(peakVolume * 0.1).toFixed(6)}
        `);
        
        resolve({
          hasPermission: true,
          isReceivingAudio,
          averageVolume,
          peakVolume,
        });
      }, 5000);
    });
  }
}

// 导出便捷函数
export async function debugAudioDetection(config?: AudioInputConfig): Promise<AudioDetectorDebugger> {
  const dbg = new AudioDetectorDebugger(config);
  await dbg.start();
  return dbg;
}

export async function testMicrophone(): Promise<void> {
  const dbg = new AudioDetectorDebugger();
  await dbg.testMicrophone();
  dbg.stop();
}

