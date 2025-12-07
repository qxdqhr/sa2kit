# MMD 播放器内存泄漏修复文档

## 问题描述

在 MMDPlaylist 组件中切换节点时出现两种内存问题：

### 1. JavaScript 堆内存泄漏 ✅ 已修复
- **症状**：Chrome DevTools 中 JS Heap 持续增长
- **原因**：Three.js 资源（几何体、材质、纹理）未正确清理
- **状态**：已通过深度清理材质、纹理、骨骼等资源解决

### 2. WebAssembly (Ammo.js) 内存溢出 ✅ 已修复
- **症状**：`RuntimeError: abort(OOM)` from ammo.wasm.js
- **根本原因**：**MMDPhysics._createWorld() 创建了5个Ammo对象，但只保存了world引用**
  - 创建的对象：`config`, `dispatcher`, `cache`, `solver`, `world`
  - 问题：只有 `world` 被引用，其他4个对象泄漏到WASM内存中
  - 累积效应：每次切换节点创建新世界，未清理的对象累积导致OOM
- **影响**：WASM 线性内存独立于 JS Heap，不会被 JS GC 清理
- **状态**：✅ 已通过 Monkey Patching 拦截并正确清理所有组件

## 修复方案

### 核心修复：拦截并销毁所有物理引擎组件

问题的关键在于 `three-stdlib` 的 `MMDPhysics._createWorld()` 方法：

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

**解决方案**：在加载Ammo后，使用 Monkey Patching 拦截这些构造函数：

```typescript
// 1. 保存原始构造函数
const originalBtDefaultCollisionConfiguration = Ammo.btDefaultCollisionConfiguration;
// ... 其他构造函数

// 2. 替换为拦截版本
Ammo.btDefaultCollisionConfiguration = function(...args) {
  const obj = new originalBtDefaultCollisionConfiguration(...args);
  physicsComponentsRef.current.config = obj;  // 🎯 捕获引用
  return obj;
};
// ... 其他构造函数类似处理

// 3. 在清理时按正确顺序销毁
// 销毁顺序：world -> solver -> cache -> dispatcher -> config
Ammo.destroy(components.world);
Ammo.destroy(components.solver);
Ammo.destroy(components.cache);
Ammo.destroy(components.dispatcher);
Ammo.destroy(components.config);
```

### 实现细节

#### 1. 添加物理组件引用（MMDPlayerBase.tsx）

```typescript
const physicsComponentsRef = useRef<{
  config: any | null;
  dispatcher: any | null;
  cache: any | null;
  solver: any | null;
  world: any | null;
}>({
  config: null,
  dispatcher: null,
  cache: null,
  solver: null,
  world: null
});
```

#### 2. Monkey Patch Ammo构造函数

在 `loadAmmo()` 之后立即执行：

```typescript
const Ammo = (window as any).Ammo;
const componentsRef = physicsComponentsRef.current;

// 保存原始构造函数
const originalBtDefaultCollisionConfiguration = Ammo.btDefaultCollisionConfiguration;
// ...

// 替换构造函数以拦截对象创建
Ammo.btDefaultCollisionConfiguration = function(...args: any[]) {
  const obj = new originalBtDefaultCollisionConfiguration(...args);
  componentsRef.config = obj;
  return obj;
};
// ... 对所有5个构造函数重复此操作
```

#### 3. 按正确顺序销毁所有组件

在 cleanup 函数中：

```typescript
// 销毁顺序必须与创建顺序相反
// 创建: config -> dispatcher -> cache -> solver -> world
// 销毁: world -> solver -> cache -> dispatcher -> config

if (components.world) {
  Ammo.destroy(components.world);
  components.world = null;
}
if (components.solver) {
  Ammo.destroy(components.solver);
  components.solver = null;
}
if (components.cache) {
  Ammo.destroy(components.cache);
  components.cache = null;
}
if (components.dispatcher) {
  Ammo.destroy(components.dispatcher);
  components.dispatcher = null;
}
if (components.config) {
  Ammo.destroy(components.config);
  components.config = null;
}
```

#### 4. 每次初始化时重置引用

```typescript
// 在 init() 开始时
physicsComponentsRef.current = {
  config: null,
  dispatcher: null,
  cache: null,
  solver: null,
  world: null
};
```

## 测试方案

### 测试步骤

1. **刷新浏览器**，清空所有缓存和内存

2. **打开浏览器开发者工具**
   ```bash
   Cmd + Opt + I  (Mac)
   F12             (Windows/Linux)
   ```

3. **打开 Performance Monitor**
   ```bash
   Cmd + Shift + P -> 输入 "Performance Monitor"
   ```
   
   观察指标：
   - JS Heap Size（应该稳定）
   - DOM Nodes（应该稳定）

4. **多次切换节点**（10-15次）
   - 点击"下一个"按钮
   - 等待每个模型完全加载
   - 观察控制台输出

5. **检查清理日志**
   
   成功的清理日志应该包含：
   ```
   [MMDPlayerBase] Cleanup started
   [MMDPlayerBase] 🔥 Starting CRITICAL physics components cleanup...
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
   ```

### 成功标准

1. ✅ **切换 10-15 次节点后不出现 OOM 错误**
2. ✅ **Chrome 内存监控显示稳定**（允许小幅波动）
3. ✅ **控制台显示完整的物理引擎清理日志**
4. ✅ **没有 Ammo 相关的错误或警告**

### 失败情况处理

如果仍出现 OOM（可能性极低）：

1. **检查是否有其他未清理的资源**
   - 使用 Chrome Memory Profiler
   - 搜索 "btDiscreteDynamicsWorld" 等关键词
   - 查看是否有残留的 Ammo 对象

2. **检查 Monkey Patch 是否生效**
   - 在控制台查看是否有 "🔍 Captured" 日志
   - 如果没有，说明 Ammo 构造函数未被拦截

3. **增加清理延迟**
   - 在 `MMDPlaylist.tsx` 中增加切换延迟
   - 从 300ms 增加到 500ms 或更多

4. **临时禁用物理引擎测试**
   ```typescript
   const stageConfig = {
     enablePhysics: false,  // 禁用物理引擎
     // ... 其他配置
   };
   ```
   如果禁用后问题消失，确认是物理引擎问题

## 技术细节

### 为什么需要 Monkey Patching？

1. **three-stdlib 的设计缺陷**
   - `MMDPhysics._createWorld()` 创建了5个 Ammo 对象
   - 但只返回并保存了 `world` 对象
   - 其他4个对象（config, dispatcher, cache, solver）没有被引用

2. **WASM 内存管理特性**
   - WebAssembly 有独立的线性内存空间
   - JavaScript 的垃圾回收器无法管理 WASM 内存
   - 必须显式调用 `Ammo.destroy()` 来释放

3. **无法直接修改 three-stdlib**
   - 代码在 node_modules 中
   - 不能直接修改第三方库
   - 需要在运行时动态拦截

### 销毁顺序的重要性

Ammo 对象之间有依赖关系，必须按正确顺序销毁：

```
创建顺序：
  config -> dispatcher -> cache -> solver -> world
  
依赖关系：
  dispatcher 依赖 config
  world 依赖 dispatcher, cache, solver, config
  
销毁顺序（与创建相反）：
  world -> solver -> cache -> dispatcher -> config
```

如果顺序错误，可能导致：
- 访问已释放的内存
- WASM 崩溃
- 更严重的内存泄漏

## 调试技巧

### 1. 查看详细日志

所有清理步骤都有详细日志，在控制台可以看到：
- 🔍 拦截到的对象创建
- 🗑️ 正在销毁的对象
- ✅ 成功销毁的对象
- ❌ 销毁失败的对象

### 2. 监控 WASM 内存

Chrome DevTools -> Memory -> Take heap snapshot
- 搜索 "Ammo" 相关对象
- 搜索 "btDiscreteDynamicsWorld"
- 检查是否有未释放的引用

### 3. 使用 Performance Monitor

实时监控：
- JS Heap size
- DOM Nodes
- JS event listeners
- GPU memory (如果可用)

### 4. 强制垃圾回收测试

启动 Chrome 时添加参数：
```bash
chrome --js-flags="--expose-gc"
```

然后在控制台：
```javascript
gc(); // 手动触发垃圾回收
```

切换几次节点后手动触发 GC，观察内存是否下降。

## 后续优化建议

1. **贡献到 three-stdlib**
   - 向 three-stdlib 提交 PR
   - 在 MMDPhysics 中添加 dispose() 方法
   - 保存并正确销毁所有物理引擎组件

2. **物理引擎池化**
   - 复用物理世界实例而不是每次创建
   - 需要更复杂的状态管理
   - 可以进一步减少内存分配

3. **渐进式加载**
   - 延迟初始化物理引擎
   - 仅在需要时启用物理
   - 减少初始加载时间

4. **内存预算控制**
   - 监控总内存使用
   - 达到阈值时主动清理
   - 限制同时存在的物理世界数量

5. **Worker 线程**
   - 将物理计算移到 Web Worker
   - 隔离主线程内存
   - 提升性能和稳定性

## 相关文件

- `src/mmd/components/MMDPlayerBase.tsx` - 核心清理逻辑和 Monkey Patching
- `src/mmd/components/MMDPlaylist.tsx` - 两阶段切换
- `src/mmd/utils/ammo-loader.ts` - 物理引擎加载器
- `node_modules/.../MMDPhysics.js` - 问题源头（第三方库）

## 更新日志

### 2025-12-07 - 🎯 核心修复
- ✅ **发现根本原因**：MMDPhysics._createWorld() 泄漏4个Ammo对象
- ✅ **实现 Monkey Patching**：拦截所有5个Ammo构造函数
- ✅ **保存所有组件引用**：config, dispatcher, cache, solver, world
- ✅ **按正确顺序销毁**：与创建顺序相反，避免依赖问题
- ✅ **每次初始化重置引用**：确保干净的状态
- ✅ **详细的清理日志**：便于调试和验证

### 2025-12-06
- ✅ 添加物理引擎深度清理（刚体、约束、世界）
- ✅ 实现两阶段切换策略（300ms 过渡）
- ✅ 增强材质和纹理清理（包括 MMD 特有类型）
- ✅ 添加 SkinnedMesh 骨骼清理
- ✅ 清理 WebGL 纹理单元
- ✅ 添加详细清理日志
- ✅ 添加 OOM 错误时强制刷新页面

## 总结

通过 Monkey Patching 技术拦截并追踪 Ammo.js 的所有物理引擎组件，我们解决了 three-stdlib 库中的内存泄漏问题。这个解决方案：

1. **不需要修改第三方库** - 在运行时动态拦截
2. **完整清理所有资源** - 捕获并销毁所有5个Ammo对象
3. **正确的销毁顺序** - 避免依赖关系导致的问题
4. **详细的日志输出** - 便于调试和验证
5. **兼容性好** - 不影响现有代码逻辑

这个修复应该**彻底解决** MMD 播放器的 OOM 问题。
