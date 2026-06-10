/**
 * 音频检测模块类型定义
 * Audio Detection Module Type Definitions
 */

/**
 * 音符信息
 * Note Information
 */
export interface NoteInfo {
  /** 音符名称 (例如: "C4", "A#3") */
  name: string;
  /** 频率 (Hz) */
  frequency: number;
  /** 音高类别 (不含八度，例如: "C", "A#") */
  noteName: string;
  /** 八度 */
  octave: number;
  /** 音符的MIDI编号 */
  midi: number;
  /** 音量/强度 (0-1) */
  volume: number;
  /** 音符检测的置信度 (0-1) */
  confidence: number;
}

/**
 * 和弦信息
 * Chord Information
 */
export interface ChordInfo {
  /** 和弦名称 (例如: "Cmaj", "Am7") */
  name: string;
  /** 根音 */
  root: string;
  /** 和弦类型 (例如: "major", "minor", "diminished") */
  type: string;
  /** 组成音符 */
  notes: NoteInfo[];
  /** 和弦检测的置信度 (0-1) */
  confidence: number;
}

/**
 * 音频检测结果
 * Audio Detection Result
 */
export interface AudioDetectionResult {
  /** 检测到的所有音符 */
  notes: NoteInfo[];
  /** 检测到的和弦（如果有） */
  chord?: ChordInfo;
  /** 检测时间戳 */
  timestamp: number;
  /** 是否正在检测到声音 */
  isDetecting: boolean;
}

/**
 * 音频输入配置
 * Audio Input Configuration
 */
export interface AudioInputConfig {
  /** 采样率 (默认: 44100) */
  sampleRate?: number;
  /** FFT大小 (默认: 4096) */
  fftSize?: number;
  /** 最小音量阈值 (0-1, 默认: 0.01) */
  minVolume?: number;
  /** 最小检测置信度 (0-1, 默认: 0.7) */
  minConfidence?: number;
  /** 平滑系数 (0-1, 默认: 0.8) */
  smoothing?: number;
  /** 检测频率范围 */
  frequencyRange?: {
    min: number; // Hz
    max: number; // Hz
  };
}

/**
 * 音频输入状态
 * Audio Input State
 */
export type AudioInputState = 'idle' | 'initializing' | 'active' | 'error' | 'stopped';

/**
 * 音频检测器事件
 * Audio Detector Events
 */
export interface AudioDetectorEvents {
  /** 检测到新的音频结果 */
  onDetection?: (result: AudioDetectionResult) => void;
  /** 状态变化 */
  onStateChange?: (state: AudioInputState) => void;
  /** 错误发生 */
  onError?: (error: Error) => void;
}

/**
 * 频率到音符的映射
 * Frequency to Note Mapping
 */
export interface FrequencyToNoteMap {
  [frequency: number]: NoteInfo;
}

