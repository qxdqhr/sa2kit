# 麦克风无声音问题排查指南

## 问题描述
麦克风已开启但似乎没有接收到声音。

## 已修复的问题

### 1. 降低默认阈值
- **minVolume**: `0.01` → `0.001` (降低10倍)
- **minConfidence**: `0.7` → `0.5` (降低要求)

### 2. 添加调试工具

新增 `AudioDetectorDebugger` 类，提供详细的调试信息。

## 快速排查步骤

### 步骤 1: 使用调试工具测试麦克风

```typescript
import { testMicrophone } from 'sa2kit/audioDetection';

// 自动测试5秒，显示详细信息
await testMicrophone();
```

这会输出：
```
✅ 麦克风测试完成:
  - 权限状态: ✅ 已授权
  - 接收音频: ✅ 是
  - 平均音量: 0.003456
  - 峰值音量: 0.012345
  - 建议阈值: 0.001234
```

### 步骤 2: 使用调试模式启动检测器

```typescript
import { debugAudioDetection } from 'sa2kit/audioDetection';

// 启动调试模式
const debugger = await debugAudioDetection({
  minVolume: 0.0001,  // 极低阈值用于测试
  minConfidence: 0.3,
});

// 控制台会每2秒显示:
// 🎤 音频调试信息:
//   - 音量 (RMS): 0.003456
//   - 音量阈值: 0.0001
//   - 音量状态: ✅ 超过阈值
//   ...

// 停止
debugger.stop();
```

### 步骤 3: 手动调整参数

如果测试显示有音频但检测不到音符，尝试这些配置：

```typescript
import { AudioDetectionDisplay } from 'sa2kit/audioDetection';

<AudioDetectionDisplay
  minVolume={0.0001}      // 极低阈值
  minConfidence={0.3}     // 降低置信度要求
  smoothing={0.5}         // 降低平滑，提高响应速度
  fftSize={8192}          // 增大FFT，提高频率分辨率
  showDebugInfo={true}    // 显示调试信息
/>
```

## 常见问题和解决方案

### 问题 1: 麦克风有输入但音量太低
**症状**: 调试显示音量为 0.000001 - 0.0001

**解决方案**:
```typescript
<AudioDetectionDisplay
  minVolume={0.00001}  // 设置更低的阈值
/>
```

### 问题 2: 检测到音量但没有识别音符
**症状**: 音量超过阈值但 notes 数组为空

**解决方案**:
```typescript
<AudioDetectionDisplay
  minVolume={0.0001}
  minConfidence={0.2}   // 大幅降低置信度
  fftSize={8192}        // 增加频率分辨率
/>
```

### 问题 3: 浏览器没有麦克风权限
**症状**: 控制台显示 "NotAllowedError" 或 "Permission denied"

**解决方案**:
1. 检查浏览器地址栏的麦克风图标
2. 确保使用 HTTPS (localhost除外)
3. 在浏览器设置中允许麦克风权限

### 问题 4: 麦克风被其他应用占用
**症状**: 在某些浏览器/系统上无法初始化

**解决方案**:
1. 关闭其他使用麦克风的应用 (Zoom, Teams, etc.)
2. 重启浏览器
3. 尝试不同的浏览器

### 问题 5: 音频处理延迟或卡顿
**症状**: 检测不稳定或响应慢

**解决方案**:
```typescript
<AudioDetectionDisplay
  updateInterval={50}   // 减少到50ms
  smoothing={0.3}       // 降低平滑
  fftSize={2048}        // 减小FFT大小
/>
```

## 浏览器控制台调试

打开浏览器控制台 (F12)，查看输出：

```javascript
// 每2秒会输出:
[AudioDetector] 当前音量: 0.003456, 阈值: 0.001000, 状态: ✅ 有声音

// 检测到音符时:
🎵 检测到音符: C4(261.6Hz), E4(329.6Hz)
🎹 检测到和弦: Cmaj
```

## 完整测试脚本

在浏览器控制台运行：

```javascript
import { AudioDetectorDebugger } from 'sa2kit/audioDetection';

// 创建调试器
const debugger = new AudioDetectorDebugger({
  minVolume: 0.0001,
  minConfidence: 0.3,
});

// 测试麦克风
const result = await debugger.testMicrophone();
console.log('测试结果:', result);

// 如果需要，继续运行检测
// debugger.stop();
```

## 推荐设置

### 电子琴/钢琴
```typescript
{
  minVolume: 0.001,
  minConfidence: 0.5,
  fftSize: 4096,
  smoothing: 0.8,
}
```

### 吉他/其他弦乐器
```typescript
{
  minVolume: 0.002,
  minConfidence: 0.4,
  fftSize: 8192,      // 更高分辨率
  smoothing: 0.7,
}
```

### 人声
```typescript
{
  minVolume: 0.005,
  minConfidence: 0.6,
  fftSize: 4096,
  frequencyRange: { min: 80, max: 1000 },  // 限制在人声范围
}
```

### 嘈杂环境
```typescript
{
  minVolume: 0.01,    // 提高阈值过滤噪音
  minConfidence: 0.7,
  smoothing: 0.9,     // 增加平滑
}
```

## 需要进一步帮助？

如果以上方法都无效，请提供：
1. 浏览器控制台的完整输出
2. `testMicrophone()` 的结果
3. 使用的设备和浏览器
4. 具体的使用场景

这样可以更好地诊断问题！











