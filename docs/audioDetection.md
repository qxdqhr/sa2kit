# 音频检测模块 (Audio Detection Module)

一个用于实时检测麦克风输入的音高和和弦的模块，特别适合电子琴、钢琴等乐器的音频识别。

## 功能特性

- ✅ **实时音高检测**: 使用自相关算法精确检测单音
- ✅ **和弦识别**: 支持识别常见的三和弦、七和弦和扩展和弦
- ✅ **多音检测**: 使用FFT同时检测多个音符
- ✅ **可视化组件**: 提供钢琴键盘可视化和音符显示
- ✅ **高度可配置**: 支持自定义检测参数
- ✅ **TypeScript 支持**: 完整的类型定义

## 快速开始

### 基础使用

```tsx
import { AudioDetectionDisplay } from 'sa2kit/audioDetection';

function App() {
  return (
    <AudioDetectionDisplay
      autoStart={false}
      minVolume={0.01}
      minConfidence={0.7}
      showDebugInfo={false}
    />
  );
}
```

### 使用 Hook 和自定义 UI

```tsx
import { useAudioDetection, PianoKeyboard } from 'sa2kit/audioDetection';

function CustomDetector() {
  const { result, isDetecting, start, stop } = useAudioDetection({
    autoStart: false,
    minVolume: 0.01,
    minConfidence: 0.7,
  });

  return (
    <div>
      <button onClick={isDetecting ? stop : start}>
        {isDetecting ? '停止' : '开始'}
      </button>
      
      <PianoKeyboard 
        activeNotes={result?.notes} 
        startOctave={2}
        endOctave={6}
      />

      {result?.chord && (
        <div>
          <h3>检测到的和弦: {result.chord.name}</h3>
        </div>
      )}
    </div>
  );
}
```

## API 文档

### 组件

#### `AudioDetectionDisplay`

预构建的完整音频检测UI组件。

**Props:**

```typescript
interface AudioDetectionDisplayProps {
  // 音频输入配置
  sampleRate?: number;           // 采样率 (默认: 44100)
  fftSize?: number;              // FFT大小 (默认: 4096)
  minVolume?: number;            // 最小音量阈值 (默认: 0.01)
  minConfidence?: number;        // 最小置信度 (默认: 0.7)
  smoothing?: number;            // 平滑系数 (默认: 0.8)
  frequencyRange?: {
    min: number;                 // 最小频率 (默认: 27.5 Hz)
    max: number;                 // 最大频率 (默认: 4186 Hz)
  };
  
  // UI配置
  autoStart?: boolean;           // 是否自动开始 (默认: false)
  className?: string;            // 自定义类名
  showDebugInfo?: boolean;       // 显示调试信息 (默认: false)
  startButtonText?: string;      // 开始按钮文本
  stopButtonText?: string;       // 停止按钮文本
  
  // 自定义渲染
  renderNote?: (note: NoteInfo) => React.ReactNode;
  renderChord?: (chord: ChordInfo) => React.ReactNode;
}
```

#### `PianoKeyboard`

钢琴键盘可视化组件。

**Props:**

```typescript
interface PianoKeyboardProps {
  activeNotes?: NoteInfo[];      // 当前激活的音符
  startOctave?: number;          // 起始八度 (默认: 2)
  endOctave?: number;            // 结束八度 (默认: 6)
  className?: string;            // 自定义类名
  showNoteNames?: boolean;       // 显示音符名称 (默认: true)
}
```

### Hooks

#### `useAudioDetection`

音频检测的核心Hook。

**参数:**

```typescript
interface UseAudioDetectionOptions {
  sampleRate?: number;
  fftSize?: number;
  minVolume?: number;
  minConfidence?: number;
  smoothing?: number;
  frequencyRange?: { min: number; max: number };
  autoStart?: boolean;
  updateInterval?: number;       // 检测结果更新间隔 (默认: 100ms)
}
```

**返回值:**

```typescript
interface UseAudioDetectionReturn {
  result: AudioDetectionResult | null;  // 检测结果
  state: AudioInputState;               // 音频输入状态
  isDetecting: boolean;                 // 是否正在检测
  error: Error | null;                  // 错误信息
  start: () => Promise<void>;           // 启动检测
  stop: () => void;                     // 停止检测
  getDetector: () => AudioDetector | null; // 获取检测器实例
}
```

### 核心类

#### `AudioDetector`

主音频检测器类。

```typescript
const detector = new AudioDetector(config, events);

// 启动检测
await detector.start();

// 停止检测
detector.stop();

// 获取状态
const state = detector.getState();

// 获取最后的检测结果
const result = detector.getLastResult();
```

#### `PitchDetector`

音高检测器，使用自相关和FFT算法。

```typescript
const pitchDetector = new PitchDetector(sampleRate, minFreq, maxFreq);

// 检测单个音高
const frequency = pitchDetector.detectPitch(audioBuffer, minVolume);

// 检测多个音高
const notes = pitchDetector.detectMultiplePitches(frequencyData, minVolume);

// 频率转音符
const note = pitchDetector.frequencyToNote(frequency, volume);
```

#### `ChordRecognizer`

和弦识别器。

```typescript
const chordRecognizer = new ChordRecognizer();

// 识别和弦
const chord = chordRecognizer.recognizeChord(notes);

// 识别音程
const interval = chordRecognizer.recognizeInterval(note1, note2);

// 分析和弦质量
const quality = chordRecognizer.analyzeChordQuality(chord);
```

### 类型定义

#### `NoteInfo`

音符信息。

```typescript
interface NoteInfo {
  name: string;           // 音符名称 (例如: "C4", "A#3")
  frequency: number;      // 频率 (Hz)
  noteName: string;       // 音高类别 (例如: "C", "A#")
  octave: number;         // 八度
  midi: number;           // MIDI编号
  volume: number;         // 音量 (0-1)
  confidence: number;     // 置信度 (0-1)
}
```

#### `ChordInfo`

和弦信息。

```typescript
interface ChordInfo {
  name: string;           // 和弦名称 (例如: "Cmaj", "Am7")
  root: string;           // 根音
  type: string;           // 和弦类型
  notes: NoteInfo[];      // 组成音符
  confidence: number;     // 置信度 (0-1)
}
```

#### `AudioDetectionResult`

检测结果。

```typescript
interface AudioDetectionResult {
  notes: NoteInfo[];      // 检测到的所有音符
  chord?: ChordInfo;      // 检测到的和弦
  timestamp: number;      // 检测时间戳
  isDetecting: boolean;   // 是否正在检测
}
```

## 支持的和弦类型

模块支持识别以下和弦类型：

### 三和弦
- 大三和弦 (major)
- 小三和弦 (minor)
- 减三和弦 (diminished)
- 增三和弦 (augmented)
- 挂二和弦 (sus2)
- 挂四和弦 (sus4)

### 七和弦
- 大七和弦 (major7)
- 小七和弦 (minor7)
- 属七和弦 (dominant7)
- 减七和弦 (diminished7)
- 半减七和弦 (half-diminished7)
- 小大七和弦 (minor-major7)
- 增七和弦 (augmented7)

### 扩展和弦
- 大九和弦 (major9)
- 小九和弦 (minor9)
- 属九和弦 (dominant9)
- 加九和弦 (add9)
- 小加九和弦 (madd9)

## 配置参数说明

### `sampleRate` (采样率)
- **默认值**: 44100 Hz
- **说明**: 音频采样率，越高精度越好，但性能消耗也越大
- **推荐值**: 44100 或 48000

### `fftSize` (FFT大小)
- **默认值**: 4096
- **说明**: FFT窗口大小，影响频率分辨率和延迟
- **可选值**: 2048, 4096, 8192, 16384
- **推荐**: 4096 (平衡精度和性能)

### `minVolume` (最小音量)
- **默认值**: 0.01
- **说明**: 低于此值的音量将被忽略
- **范围**: 0.001 - 0.1
- **推荐**: 0.01 - 0.02

### `minConfidence` (最小置信度)
- **默认值**: 0.7
- **说明**: 低于此值的检测结果将被过滤
- **范围**: 0 - 1
- **推荐**: 0.6 - 0.8

### `smoothing` (平滑系数)
- **默认值**: 0.8
- **说明**: 音频分析的时间平滑，越高越平滑但响应越慢
- **范围**: 0 - 1
- **推荐**: 0.7 - 0.9

### `frequencyRange` (频率范围)
- **默认值**: { min: 27.5, max: 4186 }
- **说明**: 检测的频率范围 (A0 到 C8)
- **推荐**: 根据乐器调整

## 性能优化建议

1. **调整更新频率**: 使用 `updateInterval` 参数控制UI更新频率
2. **合适的FFT大小**: 不要使用过大的FFT size
3. **限制检测范围**: 设置合适的 `frequencyRange`
4. **提高阈值**: 适当提高 `minVolume` 和 `minConfidence`

## 浏览器兼容性

需要浏览器支持：
- Web Audio API
- MediaDevices API (麦克风访问)
- requestAnimationFrame

支持的浏览器：
- Chrome 60+
- Firefox 55+
- Safari 14+
- Edge 79+

## 常见问题

### Q: 麦克风权限被拒绝
A: 确保浏览器有麦克风访问权限，并且网站使用 HTTPS (localhost 除外)。

### Q: 检测不准确
A: 尝试调整以下参数：
- 增大 `fftSize` 提高频率分辨率
- 调整 `minVolume` 和 `minConfidence`
- 减小 `smoothing` 提高响应速度
- 确保环境安静，信号清晰

### Q: 延迟太大
A: 尝试以下优化：
- 减小 `fftSize`
- 减小 `smoothing`
- 增大 `updateInterval`

### Q: 和弦识别错误
A: 和弦识别基于检测到的音符，确保：
- 音符检测准确
- 同时弹奏和弦的所有音符
- 使用足够的 `minConfidence`

## 示例项目

完整的示例代码请参考 `examples/AudioDetectionExample.tsx`，包含：
1. 基础使用示例
2. 自定义UI示例
3. 高级配置示例

## License

MIT




