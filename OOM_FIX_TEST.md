# MMD 播放器 OOM 修复 - 测试指南

## 修复内容

✅ **已修复**: WebAssembly (Ammo.js) 内存溢出问题

### 问题根源

`three-stdlib` 的 `MMDPhysics._createWorld()` 方法存在严重的内存泄漏：

```javascript
// MMDPhysics.js 第143-148行
_createWorld() {
  const config = new Ammo.btDefaultCollisionConfiguration();      // ❌ 泄漏
  const dispatcher = new Ammo.btCollisionDispatcher(config);      // ❌ 泄漏
  const cache = new Ammo.btDbvtBroadphase();                      // ❌ 泄漏  
  const solver = new Ammo.btSequentialImpulseConstraintSolver();  // ❌ 泄漏
  const world = new Ammo.btDiscreteDynamicsWorld(dispatcher, cache, solver, config);
  return world;  // ✅ 只有world被保存
}
```

**结果**: 每次切换MMD模型时，4个Ammo对象被泄漏到WASM内存中，累积导致OOM。

### 解决方案

使用 **Monkey Patching** 技术拦截所有Ammo构造函数，捕获并保存这5个对象的引用，然后在清理时按正确顺序销毁它们。

## 测试步骤

### 1. 准备测试环境

1. **刷新浏览器** - 清空所有缓存和内存
2. **打开开发者工具** - `Cmd+Option+I` (Mac) 或 `F12` (Windows/Linux)
3. **打开 Performance Monitor**:
   - `Cmd+Shift+P` (Mac) 或 `Ctrl+Shift+P` (Windows/Linux)
   - 输入 "Show Performance Monitor"
   - 选中该选项

### 2. 观察指标

Performance Monitor 应显示：
- **JS heap size** - JavaScript 堆内存使用
- **DOM Nodes** - DOM 节点数量
- **JS event listeners** - 事件监听器数量

### 3. 执行切换测试

1. **点击 "下一个" 按钮** 10-15 次
2. **等待每个模型完全加载**
3. **观察控制台和内存指标**

### 4. 检查控制台日志

#### ✅ 成功的日志示例

每次切换时应该看到：

```
[MMDPlayerBase] Cleanup started
[MMDPlayerBase] Cleaning up AnimationHelper
[MMDPlayerBase] 🔥 Starting CRITICAL physics components cleanup...
[MMDPlayerBase]   🔍 Captured btDefaultCollisionConfiguration
[MMDPlayerBase]   🔍 Captured btCollisionDispatcher
[MMDPlayerBase]   🔍 Captured btDbvtBroadphase
[MMDPlayerBase]   🔍 Captured btSequentialImpulseConstraintSolver
[MMDPlayerBase]   🔍 Captured btDiscreteDynamicsWorld
[MMDPlayerBase]   🗑️ Destroying btDiscreteDynamicsWorld...
[MMDPlayerBase]   ✅ btDiscreteDynamicsWorld destroyed
[MMDPlayerBase]   🗑️ Destroying btSequentialImpulseConstraintSolver...
[MMDPlayerBase]   ✅ btSequentialImpulseConstraintSolver destroyed
[MMDPlayerBase]   🗑️ Destroying btDbvtBroadphase...
[MMDPlayerBase]   ✅ btDbvtBroadphase destroyed
[MMDPlayerBase]   🗑️ Destroying btCollisionDispatcher...
[MMDPlayerBase]   ✅ btCollisionDispatcher destroyed
[MMDPlayerBase]   🗑️ Destroying btDefaultCollisionConfiguration...
[MMDPlayerBase]   ✅ btDefaultCollisionConfiguration destroyed
[MMDPlayerBase] 🎉 Physics components cleanup completed!
[MMDPlayerBase] Cleanup completed
```

#### ❌ 失败的标志

如果看到以下任一情况，说明有问题：
```
ammo.wasm.js:18 OOM
RuntimeError: abort(OOM)
[MMDPlayerBase] ❌ Error destroying ...
```

## 成功标准

### ✅ 必须满足的条件

1. **无 OOM 错误** - 切换 10-15 次后不出现 `OOM` 错误
2. **内存稳定** - JS Heap Size 在初期增长后趋于稳定
3. **完整日志** - 每次切换都有完整的清理日志
4. **所有组件被销毁** - 看到5个 "✅ destroyed" 消息

### 📊 内存使用预期

- **初始**: ~50-100 MB
- **加载第一个模型**: 增长到 ~150-200 MB
- **切换2-3次**: 可能达到 ~250-300 MB
- **稳定后**: 应该保持在 ~250-350 MB 范围内波动
- **不应该**: 持续增长超过 500 MB

## 故障排查

### 问题 1: 没有看到 "🔍 Captured" 日志

**原因**: Monkey Patch 未生效

**解决方案**:
1. 检查 `loadAmmo()` 是否成功
2. 检查 `stage.enablePhysics` 是否为 true
3. 检查是否禁用了物理引擎

### 问题 2: 看到 "❌ Error destroying" 日志

**原因**: 某个组件销毁失败

**解决方案**:
1. 查看具体错误信息
2. 检查是否有空引用
3. 检查 Ammo.destroy 是否可用

### 问题 3: 仍然出现 OOM 错误

**可能原因**:
1. 其他资源未清理（纹理、几何体等）
2. 物理引擎以外的内存泄漏
3. 浏览器内存限制过低

**解决方案**:
1. 使用 Chrome Memory Profiler 分析
2. 查找其他未清理的资源
3. 尝试禁用物理引擎测试：
   ```typescript
   const stageConfig = {
     enablePhysics: false,
   };
   ```

### 问题 4: 内存持续增长

**诊断步骤**:
1. 打开 Chrome DevTools -> Memory
2. 切换几次模型
3. 点击 "Take heap snapshot"
4. 搜索关键词：
   - "btDiscreteDynamicsWorld"
   - "btDefaultCollisionConfiguration"
   - "MMDPhysics"
   - "SkinnedMesh"
5. 查看 "Retained Size" 列

## 高级测试

### 1. 内存快照对比

```javascript
// 在控制台执行
// 1. 切换前拍快照
// 2. 切换 5 次
// 3. 切换后拍快照
// 4. 对比两个快照
```

### 2. 强制垃圾回收测试

```bash
# 启动 Chrome 时添加参数
chrome --js-flags="--expose-gc"
```

```javascript
// 在控制台执行
gc();  // 手动触发垃圾回收
```

### 3. 长时间运行测试

```javascript
// 在控制台执行
let count = 0;
const interval = setInterval(() => {
  if (count++ >= 20) {
    clearInterval(interval);
    console.log('✅ 长时间测试完成');
    return;
  }
  // 假设有 goToNext 函数
  // goToNext();
  console.log(`切换次数: ${count}`);
}, 5000); // 每5秒切换一次
```

## 报告问题

如果测试失败，请提供：

1. **浏览器信息**:
   - 浏览器类型和版本
   - 操作系统

2. **控制台日志**:
   - 完整的错误信息
   - 清理日志
   - 任何警告或错误

3. **内存快照**:
   - 测试前的快照
   - 测试后的快照
   - Performance Monitor 截图

4. **重现步骤**:
   - 切换了多少次
   - 使用的模型列表
   - 其他配置

## 预期结果

✅ **修复成功后应该看到**:
- 无 OOM 错误
- 内存稳定在合理范围
- 完整的清理日志
- 流畅的模型切换

🎉 **这个修复应该彻底解决 MMD 播放器的 OOM 问题！**

