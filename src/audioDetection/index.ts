/**
 * 音频检测模块
 * Audio Detection Module
 * 
 * 用于检测麦克风输入的音高和和弦
 * For detecting pitch and chords from microphone input
 * 
 * @example
 * ```tsx
 * import { AudioDetectionDisplay } from 'sa2kit/audioDetection';
 * 
 * function App() {
 *   return (
 *     <AudioDetectionDisplay
 *       autoStart={false}
 *       minVolume={0.01}
 *       minConfidence={0.7}
 *       showDebugInfo={false}
 *     />
 *   );
 * }
 * ```
 * 
 * @example
 * ```tsx
 * import { useAudioDetection, PianoKeyboard } from 'sa2kit/audioDetection';
 * 
 * function CustomDetector() {
 *   const { result, isDetecting, start, stop } = useAudioDetection({
 *     autoStart: true,
 *   });
 * 
 *   return (
 *     <div>
 *       <button onClick={isDetecting ? stop : start}>
 *         {isDetecting ? '停止' : '开始'}
 *       </button>
 *       <PianoKeyboard activeNotes={result?.notes} />
 *     </div>
 *   );
 * }
 * ```
 */

// 核心模块
export * from './core';

// 类型定义
export * from './types';

// React Hooks
export * from './hooks';

// React 组件
export * from './components';

// 默认导出
export { AudioDetector } from './core/AudioDetector';
export { useAudioDetection } from './hooks/useAudioDetection';
export { AudioDetectionDisplay } from './components/AudioDetectionDisplay';
export { PianoKeyboard } from './components/PianoKeyboard';



















