# OOM 错误报告增强

## 新增功能

在 OOM 错误弹窗中显示系统运行统计信息，帮助评估修复效果。

## 弹窗信息示例

### 如果 v1 方案（20次切换后OOM）

```
⚠️ 内存溢出错误 (OOM)

📊 系统运行统计：
• 运行时间: 18分32秒
• 模型切换次数: 20
• 启动时间: 2025-12-07 20:15:30
• 错误时间: 2025-12-07 20:34:02

❌ 问题：物理引擎内存不足！
这通常意味着之前的物理世界没有正确清理。

🔍 错误详情：
RuntimeError: abort(OOM). Build with -sASSERTIONS for more info.

💡 建议：请刷新页面或联系开发者
```

**分析**: 
- 运行时间短（18分钟）
- 切换次数少（20次）
- 说明 v1 方案不完整 ❌

### 如果 v2 方案（应该不会OOM）

理论上不应该看到此弹窗。如果出现，可能是：

```
⚠️ 内存溢出错误 (OOM)

📊 系统运行统计：
• 运行时间: 5小时23分47秒
• 模型切换次数: 850
• 启动时间: 2025-12-07 15:00:00
• 错误时间: 2025-12-07 20:23:47

❌ 问题：物理引擎内存不足！
这通常意味着之前的物理世界没有正确清理。

🔍 错误详情：
RuntimeError: abort(OOM). Build with -sASSERTIONS for more info.

💡 建议：请刷新页面或联系开发者
```

**分析**:
- 运行时间长（5小时+）
- 切换次数多（850次）
- 说明 v2 方案基本有效，但可能还有其他内存泄漏源 ⚠️

## 评估标准

### ✅ v2 修复成功的标志

**永远不应该看到 OOM 弹窗**

如果系统能够：
- 运行 > 2 小时
- 切换 > 100 次
- 内存稳定

则 v2 修复成功！

### ⚠️ v2 需要进一步优化

如果看到 OOM 且：
- 运行时间 > 2 小时
- 切换次数 > 100 次

说明 v2 大幅改善但可能还有其他泄漏源（如纹理、几何体等）

### ❌ v2 仍有问题

如果看到 OOM 且：
- 运行时间 < 30 分钟
- 切换次数 < 50 次

说明 v2 方案仍有问题，需要检查：
1. 数组是否正确保存了所有对象
2. 清理逻辑是否正确执行
3. 是否有其他未知的物理对象创建路径

## 实现细节

### 1. 运行时间追踪

```typescript
// 记录启动时间
const startTimeRef = useRef<number>(Date.now());

// 记录模型切换次数
const modelSwitchCountRef = useRef<number>(0);
```

### 2. 每次切换时更新统计

```typescript
if (modelSwitchCountRef.current === 0) {
  // 首次加载
  startTimeRef.current = Date.now();
  modelSwitchCountRef.current = 1;
} else {
  // 模型切换
  modelSwitchCountRef.current++;
  console.log(`模型切换 #${modelSwitchCountRef.current}`);
}
```

### 3. OOM 错误时显示统计

```typescript
if (errorMessage.includes('OOM')) {
  const runningTime = Date.now() - startTimeRef.current;
  const hours = Math.floor(runningTime / 3600000);
  const minutes = Math.floor((runningTime % 3600000) / 60000);
  const seconds = Math.floor((runningTime % 60000) / 1000);
  
  alert(`
运行时间: ${hours}小时${minutes}分${seconds}秒
模型切换次数: ${modelSwitchCountRef.current}
...
  `);
}
```

## 使用方法

1. **正常使用系统**
   - 切换模型
   - 播放动画
   - 正常操作

2. **如果出现 OOM**
   - 查看弹窗中的统计信息
   - 截图保存
   - 报告给开发者

3. **分析数据**
   ```
   运行时间 / 切换次数 = 平均每次切换时间
   
   例如：
   18分32秒 / 20次 = 56秒/次
   这说明用户大约每56秒切换一次模型
   ```

## 对比测试

### 测试场景 1: 快速切换
- 每 10 秒切换一次
- 预期 v1: ~2-3 分钟后 OOM
- 预期 v2: 永不 OOM

### 测试场景 2: 正常使用
- 每 1-2 分钟切换一次
- 预期 v1: ~20-30 分钟后 OOM
- 预期 v2: 永不 OOM

### 测试场景 3: 长时间运行
- 连续播放 2 小时
- 每 2 分钟切换一次（~60次）
- 预期 v1: 不可能达到
- 预期 v2: 正常运行

## 日志输出

### 系统启动

```
[MMDPlayerBase] 🕐 系统启动时间: 2025-12-07 20:15:30
```

### 模型切换

```
[MMDPlayerBase] 🔄 模型切换 #2 (运行时间: 1分23秒)
[MMDPlayerBase] 🔄 模型切换 #3 (运行时间: 2分45秒)
[MMDPlayerBase] 🔄 模型切换 #4 (运行时间: 4分12秒)
...
[MMDPlayerBase] 🔄 模型切换 #20 (运行时间: 18分32秒)
```

### OOM 错误

```
MMDPlayerBase initialization failed: RuntimeError: abort(OOM)
```

然后弹出包含统计信息的警告框。

## 总结

这个功能让我们能够：

1. **量化修复效果** - 通过运行时间和切换次数评估
2. **快速诊断问题** - 看到统计信息就知道是哪个版本
3. **收集用户反馈** - 用户截图就能提供完整信息
4. **对比测试结果** - v1 vs v2 一目了然

**关键指标**：
- v1: 通常在 18-25 分钟，15-25 次切换后 OOM
- v2: 理论上永不 OOM（或 > 2 小时，> 100 次切换）
