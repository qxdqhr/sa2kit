# 音频检测模块 README

一个用于实时检测麦克风输入的音高和和弦的完整模块。

## 📦 安装

```bash
pnpm install sa2kit
```

## 🚀 快速开始

### 方式 1: 使用预构建组件

最简单的方式是使用 `AudioDetectionDisplay` 组件：

```tsx
import { AudioDetectionDisplay } from 'sa2kit/audioDetection';

function App() {
  return (
    <div>
      <h1>电子琴音频识别</h1>
      <AudioDetectionDisplay 
        autoStart={false}
        minVolume={0.01}
        minConfidence={0.7}
      />
    </div>
  );
}
```

### 方式 2: 使用 Hook 自定义UI

使用 `useAudioDetection` Hook 完全控制UI：

```tsx
import { useAudioDetection, PianoKeyboard } from 'sa2kit/audioDetection';

function CustomDetector() {
  const { result, isDetecting, start, stop, error } = useAudioDetection({
    autoStart: false,
    minVolume: 0.01,
    minConfidence: 0.7,
  });

  return (
    <div>
      <button onClick={isDetecting ? stop : start}>
        {isDetecting ? '🔴 停止' : '🎵 开始'}
      </button>

      {error && <div>错误: {error.message}</div>}

      <PianoKeyboard 
        activeNotes={result?.notes || []}
        startOctave={2}
        endOctave={6}
      />

      {result?.chord && (
        <div>
          <h3>和弦: {result.chord.name}</h3>
          <p>类型: {result.chord.type}</p>
        </div>
      )}

      {result?.notes.map((note, i) => (
        <div key={i}>
          {note.name} - {note.frequency.toFixed(2)} Hz
        </div>
      ))}
    </div>
  );
}
```

### 方式 3: 使用核心类（高级）

直接使用 `AudioDetector` 类：

```tsx
import { AudioDetector } from 'sa2kit/audioDetection';

const detector = new AudioDetector(
  {
    sampleRate: 44100,
    fftSize: 4096,
    minVolume: 0.01,
    minConfidence: 0.7,
  },
  {
    onDetection: (result) => {
      console.log('检测到:', result);
      if (result.chord) {
        console.log('和弦:', result.chord.name);
      }
    },
    onError: (error) => {
      console.error('错误:', error);
    },
  }
);

// 启动
await detector.start();

// 停止
detector.stop();
```

## ✨ 主要功能

### 🎼 音高检测
- **单音检测**: 使用自相关算法精确检测主音高
- **多音检测**: 使用FFT同时检测多个音符
- **频率转音符**: 自动将频率转换为标准音符表示（如 C4, A#3）

### 🎹 和弦识别
支持识别 20+ 种和弦类型：

**三和弦**
- 大三和弦 (C, Cmaj)
- 小三和弦 (Cm, Cmin)
- 减三和弦 (Cdim, C°)
- 增三和弦 (Caug, C+)
- 挂留和弦 (Csus2, Csus4)

**七和弦**
- 大七和弦 (Cmaj7, CM7)
- 小七和弦 (Cm7, Cmin7)
- 属七和弦 (C7)
- 减七和弦 (Cdim7, C°7)
- 半减七和弦 (Cm7b5, Cø7)

**扩展和弦**
- 九和弦 (Cmaj9, Cm9, C9)
- 加九和弦 (Cadd9)

### 🎨 可视化组件
- **钢琴键盘**: 实时显示按下的键
- **音符显示**: 显示音符名称、频率、置信度
- **和弦显示**: 显示和弦名称、类型、组成音符

## ⚙️ 配置选项

```typescript
interface AudioInputConfig {
  // 采样率 (默认: 44100)
  sampleRate?: number;
  
  // FFT大小 (默认: 4096)
  // 可选: 2048, 4096, 8192, 16384
  fftSize?: number;
  
  // 最小音量阈值 (默认: 0.01)
  // 低于此值的音量将被忽略
  minVolume?: number;
  
  // 最小置信度 (默认: 0.7)
  // 低于此值的检测结果将被过滤
  minConfidence?: number;
  
  // 平滑系数 (默认: 0.8)
  // 0-1之间，越高越平滑但响应越慢
  smoothing?: number;
  
  // 频率范围 (默认: 27.5-4186 Hz，即 A0-C8)
  frequencyRange?: {
    min: number;
    max: number;
  };
}
```

## 📊 数据类型

### NoteInfo (音符信息)

```typescript
interface NoteInfo {
  name: string;           // "C4", "A#3"
  frequency: number;      // 440.0
  noteName: string;       // "C", "A#"
  octave: number;         // 4
  midi: number;           // 60
  volume: number;         // 0-1
  confidence: number;     // 0-1
}
```

### ChordInfo (和弦信息)

```typescript
interface ChordInfo {
  name: string;           // "Cmaj", "Am7"
  root: string;           // "C"
  type: string;           // "major", "minor7"
  notes: NoteInfo[];
  confidence: number;     // 0-1
}
```

### AudioDetectionResult (检测结果)

```typescript
interface AudioDetectionResult {
  notes: NoteInfo[];
  chord?: ChordInfo;
  timestamp: number;
  isDetecting: boolean;
}
```

## 🎯 使用场景

- **音乐教学**: 实时显示学生弹奏的音符和和弦
- **练习工具**: 帮助学习者识别音高和和弦
- **调音器**: 精确的音高检测
- **和弦库**: 识别和学习不同的和弦
- **音乐创作**: 捕捉灵感并转换为数字格式

## 🔧 性能优化建议

1. **调整更新频率**: 
   ```tsx
   useAudioDetection({ updateInterval: 100 }) // 默认100ms
   ```

2. **选择合适的FFT大小**:
   - 2048: 低延迟，低精度
   - 4096: 平衡（推荐）
   - 8192: 高精度，高延迟

3. **限制检测范围**:
   ```tsx
   frequencyRange: { min: 82.41, max: 987.77 } // E2-B5
   ```

4. **提高阈值**:
   ```tsx
   minVolume: 0.02,      // 过滤背景噪音
   minConfidence: 0.8    // 只显示高置信度结果
   ```

## 🌐 浏览器支持

| 浏览器 | 版本 |
|--------|------|
| Chrome | 60+ |
| Firefox | 55+ |
| Safari | 14+ |
| Edge | 79+ |

需要支持:
- Web Audio API
- MediaDevices API (getUserMedia)

## 🔒 权限要求

需要麦克风权限。首次使用时浏览器会提示用户授权。

**注意**: 必须在 HTTPS 环境下使用（localhost 除外）。

## 📖 完整文档

详细的API文档和指南请查看:
- [完整文档](./docs/audioDetection.md)
- [使用示例](./examples/AudioDetectionExample.tsx)

## 🐛 常见问题

### Q: 麦克风权限被拒绝
**A**: 检查浏览器权限设置，确保使用 HTTPS。

### Q: 检测不准确
**A**: 尝试调整:
- 增大 `fftSize`
- 调整 `minVolume` 和 `minConfidence`
- 确保环境安静

### Q: 延迟太大
**A**: 尝试:
- 减小 `fftSize`
- 减小 `smoothing`
- 增大 `updateInterval`

### Q: 和弦识别错误
**A**: 确保:
- 同时清晰地弹奏所有音符
- 调整 `minConfidence`
- 避免泛音干扰

## 📝 示例代码

查看 `examples/AudioDetectionExample.tsx` 获取三个完整示例：
1. 基础使用 - 预构建组件
2. 自定义UI - Hook + 钢琴键盘
3. 高级配置 - 完全自定义

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT

---

Made with ❤️ for music lovers

















