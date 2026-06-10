/**
 * 音频检测 React Hook
 * Audio Detection React Hook
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { AudioDetector } from '../core/AudioDetector';
import type { 
  AudioInputConfig, 
  AudioDetectionResult, 
  AudioInputState,
} from '../types';

export interface UseAudioDetectionOptions extends AudioInputConfig {
  /** 是否自动开始检测 */
  autoStart?: boolean;
  /** 检测结果更新间隔（毫秒） */
  updateInterval?: number;
}

export interface UseAudioDetectionReturn {
  /** 当前检测结果 */
  result: AudioDetectionResult | null;
  /** 音频输入状态 */
  state: AudioInputState;
  /** 是否正在检测 */
  isDetecting: boolean;
  /** 错误信息 */
  error: Error | null;
  /** 启动检测 */
  start: () => Promise<void>;
  /** 停止检测 */
  stop: () => void;
  /** 获取检测器实例 */
  getDetector: () => AudioDetector | null;
}

/**
 * 使用音频检测的 Hook
 * Hook for using audio detection
 */
export function useAudioDetection(options: UseAudioDetectionOptions = {}): UseAudioDetectionReturn {
  const { autoStart = false, updateInterval = 100, ...config } = options;
  
  const [result, setResult] = useState<AudioDetectionResult | null>(null);
  const [state, setState] = useState<AudioInputState>('idle');
  const [error, setError] = useState<Error | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  
  const detectorRef = useRef<AudioDetector | null>(null);
  const lastUpdateRef = useRef<number>(0);

  // 初始化检测器
  useEffect(() => {
    const detector = new AudioDetector(config, {
      onDetection: (detectionResult) => {
        // 限制更新频率
        const now = Date.now();
        if (now - lastUpdateRef.current >= updateInterval) {
          setResult(detectionResult);
          lastUpdateRef.current = now;
        }
      },
      onStateChange: (newState) => {
        setState(newState);
      },
      onError: (err) => {
        setError(err);
        setIsDetecting(false);
      },
    });

    detectorRef.current = detector;

    // 自动启动
    if (autoStart) {
      detector.start().catch((err) => {
        setError(err);
      });
      setIsDetecting(true);
    }

    // 清理
    return () => {
      if (detector.isRunning()) {
        detector.stop();
      }
    };
  }, []); // 只在挂载时初始化

  // 启动检测
  const start = useCallback(async () => {
    if (!detectorRef.current) {
      const err = new Error('检测器未初始化');
      setError(err);
      throw err;
    }

    try {
      setError(null);
      await detectorRef.current.start();
      setIsDetecting(true);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setIsDetecting(false);
      throw error;
    }
  }, []);

  // 停止检测
  const stop = useCallback(() => {
    if (detectorRef.current) {
      detectorRef.current.stop();
      setIsDetecting(false);
      setResult(null);
    }
  }, []);

  // 获取检测器实例
  const getDetector = useCallback(() => {
    return detectorRef.current;
  }, []);

  return {
    result,
    state,
    isDetecting,
    error,
    start,
    stop,
    getDetector,
  };
}

