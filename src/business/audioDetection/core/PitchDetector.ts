/**
 * 音高检测器
 * Pitch Detector
 * 
 * 使用自相关算法检测音频中的音高
 * Uses autocorrelation algorithm to detect pitch in audio
 */

import type { NoteInfo } from '../types';

export class PitchDetector {
  private sampleRate: number;
  private minFrequency: number;
  private maxFrequency: number;

  // 音符名称映射
  private static readonly NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  constructor(sampleRate: number = 44100, minFrequency: number = 27.5, maxFrequency: number = 4186) {
    this.sampleRate = sampleRate;
    this.minFrequency = minFrequency;
    this.maxFrequency = maxFrequency;
  }

  /**
   * 检测音高
   * Detect pitch using autocorrelation
   */
  detectPitch(audioBuffer: Float32Array, minVolume: number = 0.01): number | null {
    // 计算RMS音量
    const volume = this.calculateRMS(audioBuffer);
    if (volume < minVolume) {
      return null; // 音量太小，不检测
    }

    // 使用自相关算法检测音高
    const frequency = this.autoCorrelate(audioBuffer);
    
    if (frequency === -1 || frequency < this.minFrequency || frequency > this.maxFrequency) {
      return null;
    }

    return frequency;
  }

  /**
   * 自相关算法
   * Autocorrelation algorithm
   */
  private autoCorrelate(buffer: Float32Array): number {
    const SIZE = buffer.length;
    const MAX_SAMPLES = Math.floor(SIZE / 2);
    let best_offset = -1;
    let best_correlation = 0;
    let rms = 0;

    // 计算RMS
    for (let i = 0; i < SIZE; i++) {
      const val = buffer[i];
      if (val !== undefined) {
        rms += val * val;
      }
    }
    rms = Math.sqrt(rms / SIZE);

    // 音量太小，不是音符
    if (rms < 0.01) {
      return -1;
    }

    // 找到第一个过零点
    let lastCorrelation = 1;
    for (let offset = 0; offset < MAX_SAMPLES; offset++) {
      let correlation = 0;

      for (let i = 0; i < MAX_SAMPLES; i++) {
        const val1 = buffer[i];
        const val2 = buffer[i + offset];
        if (val1 !== undefined && val2 !== undefined) {
          correlation += Math.abs(val1 - val2);
        }
      }

      correlation = 1 - correlation / MAX_SAMPLES;

      if (correlation > 0.9 && correlation > lastCorrelation) {
        const foundGoodCorrelation = correlation > best_correlation;
        if (foundGoodCorrelation) {
          best_correlation = correlation;
          best_offset = offset;
        }
      }

      lastCorrelation = correlation;
    }

    if (best_correlation > 0.01 && best_offset !== -1) {
      // 使用抛物线插值改进频率估计
      const frequency = this.sampleRate / best_offset;
      return frequency;
    }

    return -1;
  }

  /**
   * 计算RMS音量
   * Calculate RMS volume
   */
  private calculateRMS(buffer: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) {
      const val = buffer[i];
      if (val !== undefined) {
        sum += val * val;
      }
    }
    return Math.sqrt(sum / buffer.length);
  }

  /**
   * 将频率转换为音符信息
   * Convert frequency to note information
   */
  frequencyToNote(frequency: number, volume: number = 1): NoteInfo | null {
    if (frequency <= 0) {
      return null;
    }

    // 计算MIDI音符编号
    const midi = Math.round(12 * Math.log2(frequency / 440) + 69);
    
    if (midi < 0 || midi > 127) {
      return null;
    }

    // 计算音符名称和八度
    const noteIndex = midi % 12;
    const octave = Math.floor(midi / 12) - 1;
    const noteName = PitchDetector.NOTE_NAMES[noteIndex] || 'C';
    const name = (noteName) + (octave);

    // 计算标准频率（用于计算置信度）
    const standardFrequency = 440 * Math.pow(2, (midi - 69) / 12);
    const cents = 1200 * Math.log2(frequency / standardFrequency);
    const confidence = Math.max(0, 1 - Math.abs(cents) / 50); // 50音分容差

    return {
      name,
      frequency,
      noteName,
      octave,
      midi,
      volume,
      confidence,
    };
  }

  /**
   * 使用FFT检测主频率
   * Detect dominant frequency using FFT
   */
  detectDominantFrequency(frequencyData: Float32Array, minVolume: number = -60): number | null {
    const nyquist = this.sampleRate / 2;
    const binWidth = nyquist / frequencyData.length;
    
    let maxIndex = -1;
    let maxValue = -Infinity;

    // 只在我们关心的频率范围内搜索
    const minBin = Math.floor(this.minFrequency / binWidth);
    const maxBin = Math.ceil(this.maxFrequency / binWidth);

    for (let i = minBin; i < Math.min(maxBin, frequencyData.length); i++) {
      const value = frequencyData[i];
      if (value !== undefined && value > maxValue && value > minVolume) {
        maxValue = value;
        maxIndex = i;
      }
    }

    if (maxIndex === -1) {
      return null;
    }

    // 使用抛物线插值改进频率估计
    const frequency = this.parabolicInterpolation(frequencyData, maxIndex, binWidth);
    
    return frequency;
  }

  /**
   * 抛物线插值
   * Parabolic interpolation for better frequency estimation
   */
  private parabolicInterpolation(data: Float32Array, index: number, binWidth: number): number {
    if (index <= 0 || index >= data.length - 1) {
      return index * binWidth;
    }

    const y1 = data[index - 1];
    const y2 = data[index];
    const y3 = data[index + 1];

    if (y1 === undefined || y2 === undefined || y3 === undefined) {
      return index * binWidth;
    }

    const delta = 0.5 * (y3 - y1) / (2 * y2 - y1 - y3);
    const interpolatedIndex = index + delta;

    return interpolatedIndex * binWidth;
  }

  /**
   * 检测多个音高（和弦）
   * Detect multiple pitches (chords)
   */
  detectMultiplePitches(frequencyData: Float32Array, minVolume: number = -60): NoteInfo[] {
    const notes: NoteInfo[] = [];
    const nyquist = this.sampleRate / 2;
    const binWidth = nyquist / frequencyData.length;
    
    // 找到所有峰值
    const peaks: { index: number; value: number }[] = [];
    
    for (let i = 1; i < frequencyData.length - 1; i++) {
      const freq = i * binWidth;
      if (freq < this.minFrequency || freq > this.maxFrequency) {
        continue;
      }

      const value = frequencyData[i];
      if (value !== undefined && value > minVolume && 
          value > (frequencyData[i - 1] ?? -Infinity) && 
          value > (frequencyData[i + 1] ?? -Infinity)) {
        peaks.push({ index: i, value });
      }
    }

    // 按强度排序，取前5个
    peaks.sort((a, b) => b.value - a.value);
    const topPeaks = peaks.slice(0, 5);

    // 转换为音符
    for (const peak of topPeaks) {
      const frequency = this.parabolicInterpolation(frequencyData, peak.index, binWidth);
      
      // 计算相对音量（归一化到0-1）
      const volume = Math.pow(10, peak.value / 20); // 从dB转换
      
      const note = this.frequencyToNote(frequency, volume);
      if (note) {
        notes.push(note);
      }
    }

    return notes;
  }
}

