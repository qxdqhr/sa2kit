# 音频检测模块 (Audio Detection Module)

## 概述

音频检测模块已成功添加到 SA2Kit！这个模块提供了实时的音高和和弦检测功能，特别适合电子琴、钢琴等乐器的音频识别。

## 新增文件

### 核心模块 (`src/audioDetection/core/`)
- **AudioInputService.ts**: 音频输入服务，处理麦克风访问和音频流
- **PitchDetector.ts**: 音高检测器，使用自相关和FFT算法
- **ChordRecognizer.ts**: 和弦识别器，支持多种和弦类型
- **AudioDetector.ts**: 主控制器，整合所有功能

### React 组件 (`src/audioDetection/components/`)
- **AudioDetectionDisplay.tsx**: 完整的音频检测UI组件
- **PianoKeyboard.tsx**: 钢琴键盘可视化组件

### Hooks (`src/audioDetection/hooks/`)
- **useAudioDetection.ts**: React Hook，提供音频检测功能

### 类型定义 (`src/audioDetection/`)
- **types.ts**: 完整的TypeScript类型定义

### 文档和示例
- **docs/audioDetection.md**: 详细的API文档和使用指南
- **examples/AudioDetectionExample.tsx**: 三个完整的使用示例

## 快速开始

### 1. 基础使用

```tsx
import { AudioDetectionDisplay } from 'sa2kit/audioDetection';

function App() {
  return <AudioDetectionDisplay autoStart={false} />;
}
```

### 2. 使用 Hook

```tsx
import { useAudioDetection, PianoKeyboard } from 'sa2kit/audioDetection';

function MyComponent() {
  const { result, isDetecting, start, stop } = useAudioDetection();

  return (
    <div>
      <button onClick={isDetecting ? stop : start}>
        {isDetecting ? '停止' : '开始'}
      </button>
      <PianoKeyboard activeNotes={result?.notes} />
    </div>
  );
}
```

## 主要功能

1. **实时音高检测**
   - 自相关算法检测主音高
   - FFT算法检测多个音高
   - 高精度频率识别

2. **和弦识别**
   - 支持三和弦（大、小、减、增、挂留）
   - 支持七和弦（大七、小七、属七等）
   - 支持扩展和弦（九和弦等）

3. **可视化组件**
   - 钢琴键盘显示
   - 实时音符信息
   - 和弦信息展示

4. **高度可配置**
   - 采样率、FFT大小
   - 音量阈值、置信度
   - 频率范围限制

## 技术特点

- 使用 Web Audio API 实现
- TypeScript 类型安全
- React Hooks 架构
- 高性能实时处理
- 完整的错误处理

## 浏览器兼容性

- Chrome 60+
- Firefox 55+
- Safari 14+
- Edge 79+

需要浏览器支持 Web Audio API 和 MediaDevices API。

## 下一步

1. 查看完整文档: `docs/audioDetection.md`
2. 运行示例代码: `examples/AudioDetectionExample.tsx`
3. 根据需要自定义配置和UI

## 构建

模块已添加到构建配置中：
- package.json 已更新 exports
- tsup.config.ts 已添加入口点
- src/index.ts 已添加导出

运行 `pnpm build` 构建整个项目。

---

享受音频检测功能！🎹🎵











