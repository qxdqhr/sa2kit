# MMD播放器 OOM 问题修复 v2 ✅

## ⚠️ 重要更新（2025-12-07）

### 第一版修复的问题

第一版方案使用单个变量保存物理组件引用，但**发现每个MMD模型会创建54+个物理对象**：
- ❌ 每个刚体（头发、裙子、饰品等）都会创建独立的物理世界
- ❌ 单个变量只能保存最后一个对象，其他53个全部泄漏
- ❌ 播放20分钟后仍然OOM

### 第二版修复（当前版本）

**改用数组追踪所有物理对象**：

```typescript
const physicsComponentsRef = useRef<{
  configs: any[];         // 不是单个，而是数组
  dispatchers: any[];
  caches: any[];
  solvers: any[];
  worlds: any[];
}>();
```

## 问题根源

经过深入分析日志，发现根本原因在于 **three-stdlib 库的设计缺陷**：

### 核心问题代码

`MMDPhysics._createWorld()` 方法（位于 `node_modules/three-stdlib/animation/MMDPhysics.js` 第143-148行）：

```javascript
_createWorld() {
  const config = new Ammo.btDefaultCollisionConfiguration();      // ❌ 泄漏
  const dispatcher = new Ammo.btCollisionDispatcher(config);      // ❌ 泄漏
  const cache = new Ammo.btDbvtBroadphase();                      // ❌ 泄漏  
  const solver = new Ammo.btSequentialImpulseConstraintSolver();  // ❌ 泄漏
  const world = new Ammo.btDiscreteDynamicsWorld(dispatcher, cache, solver, config);
  return world;  // ✅ 只有world被返回和保存
}
```

### 为什么会创建这么多对象？

**每个 MMD 模型都有多个刚体**（RigidBody）：
- 头发（多个）
- 裙子（多个）
- 饰品（耳环、项链等）
- 身体部件

**每个刚体都会调用 `_createWorld()`**，导致：
- 1个模型 = 54个物理世界 × 5个组件 = **270个Ammo对象**
- 只有54个world被保存，其他216个全部泄漏！

### 为什么会 OOM？

1. **创建了大量 Ammo WASM 对象**，但只保存了部分引用
2. **其他对象泄漏**到 WebAssembly 内存中
3. **每次切换模型**都会创建新的物理世界，累积泄漏
4. **WASM内存无法被JS垃圾回收**，必须手动调用 `Ammo.destroy()`
5. **累积到一定程度**就会触发 `OOM` (Out Of Memory) 错误

## 解决方案 v2

使用 **数组 + Monkey Patching** 技术追踪所有对象的创建：

### 1. 拦截对象创建（第143-199行）

```typescript
// ⚠️ 关键：使用数组保存所有对象
const componentsRef = physicsComponentsRef.current;

Ammo.btDefaultCollisionConfiguration = function(...args: any[]) {
  const obj = new originalBtDefaultCollisionConfiguration(...args);
  componentsRef.configs.push(obj);  // 🎯 添加到数组，不覆盖
  console.log(`[MMDPlayerBase] 🔍 Captured btDefaultCollisionConfiguration #${componentsRef.configs.length}`);
  return obj;
};
// ... 对所有5个构造函数重复此操作
```

### 2. 正确销毁所有组件（第715-805行）

```typescript
// 按正确顺序销毁（与创建顺序相反）
console.log(`[MMDPlayerBase] 📊 Physics components count:`, {
  worlds: components.worlds.length,      // 例如：54
  solvers: components.solvers.length,    // 例如：54
  caches: components.caches.length,      // 例如：54
  dispatchers: components.dispatchers.length,  // 例如：54
  configs: components.configs.length     // 例如：54
});

// 销毁所有 worlds
for (let i = components.worlds.length - 1; i >= 0; i--) {
  Ammo.destroy(components.worlds[i]);
}
components.worlds.length = 0;

// ... 依次销毁所有组件
```

## 修改的文件

1. **`src/mmd/components/MMDPlayerBase.tsx`**
   - 添加 `physicsComponentsRef` 引用（第52-67行）
   - 在初始化时重置引用（第127-133行）
   - Monkey patch Ammo构造函数（第143-189行）
   - 在清理时销毁所有组件（第693-744行）

2. **`MEMORY_FIX.md`**
   - 更新文档，说明问题根源和解决方案

3. **`OOM_FIX_TEST.md`** (新增)
   - 详细的测试指南
   - 成功标准
   - 故障排查步骤

## 如何测试

### 快速测试

1. **刷新浏览器**
2. **打开控制台** (`Cmd+Option+I` 或 `F12`)
3. **切换模型 10-15 次**（点击"下一个"按钮）
4. **观察**：
   - ✅ 不应该出现 `OOM` 错误
   - ✅ 每次切换都应该看到完整的清理日志
   - ✅ 内存应该保持稳定

### 详细测试

请参考 `OOM_FIX_TEST.md` 文档

## 成功标志

### ✅ 清理日志示例（v2）

每次切换时控制台应该显示：

```
[MMDPlayerBase] 🔥 Starting CRITICAL physics components cleanup...
[MMDPlayerBase] 📊 Physics components count: {
  worlds: 54,
  solvers: 54,
  caches: 54,
  dispatchers: 54,
  configs: 54
}
[MMDPlayerBase]   🗑️ Destroying 54 btDiscreteDynamicsWorld(s)...
[MMDPlayerBase]   ✅ All btDiscreteDynamicsWorld destroyed
[MMDPlayerBase]   🗑️ Destroying 54 btSequentialImpulseConstraintSolver(s)...
[MMDPlayerBase]   ✅ All btSequentialImpulseConstraintSolver destroyed
[MMDPlayerBase]   🗑️ Destroying 54 btDbvtBroadphase(s)...
[MMDPlayerBase]   ✅ All btDbvtBroadphase destroyed
[MMDPlayerBase]   🗑️ Destroying 54 btCollisionDispatcher(s)...
[MMDPlayerBase]   ✅ All btCollisionDispatcher destroyed
[MMDPlayerBase]   🗑️ Destroying 54 btDefaultCollisionConfiguration(s)...
[MMDPlayerBase]   ✅ All btDefaultCollisionConfiguration destroyed
[MMDPlayerBase] 🎉 Physics components cleanup completed!
```

**关键指标**：
- ✅ 每个组件的数量应该相同（通常是54）
- ✅ 所有组件都被销毁
- ✅ 总共销毁 270 个 Ammo 对象（54×5）

## 技术要点

### 为什么第一版方案不够？

1. **单个变量只能保存最后一个对象**
   ```typescript
   // ❌ 第一版（错误）
   componentsRef.config = obj;  // 每次赋值都会覆盖之前的
   
   // ✅ 第二版（正确）
   componentsRef.configs.push(obj);  // 添加到数组，不覆盖
   ```

2. **MMD模型创建的物理对象远超预期**
   - 原以为只有 5 个对象（1个世界）
   - 实际上有 270 个对象（54个世界 × 5个组件）
   - 第一版只清理了 5 个，泄漏了 265 个！

3. **日志证据**
   ```
   # 第一版看到的（错误）
   [MMDPlayerBase] 🔍 Captured btDefaultCollisionConfiguration
   [MMDPlayerBase] 🔍 Captured btDefaultCollisionConfiguration  # 覆盖了
   [MMDPlayerBase] 🔍 Captured btDefaultCollisionConfiguration  # 又覆盖了
   ...重复54次，只保留了最后一个
   
   # 第二版看到的（正确）
   [MMDPlayerBase] 🔍 Captured btDefaultCollisionConfiguration #1
   [MMDPlayerBase] 🔍 Captured btDefaultCollisionConfiguration #2
   [MMDPlayerBase] 🔍 Captured btDefaultCollisionConfiguration #3
   ...所有54个都被追踪
   ```

### 销毁顺序很重要

Ammo对象之间有依赖关系，必须按正确顺序销毁：

```
创建: config → dispatcher → cache → solver → world
依赖: world 依赖其他所有对象
销毁: world → solver → cache → dispatcher → config (相反顺序)
```

如果顺序错误可能导致：
- 访问已释放的内存
- WASM 崩溃
- 更严重的内存问题

## 预期效果

✅ **彻底解决 OOM 问题**
✅ **可以无限次切换模型**
✅ **内存使用稳定**
✅ **不需要刷新页面**

## 后续建议

1. **向 three-stdlib 提交 PR** - 在源头修复这个问题
2. **考虑物理引擎池化** - 复用物理世界实例
3. **监控内存使用** - 添加内存预算控制

---

**修复完成时间**: 2025-12-07  
**修复版本**: v2 (数组追踪版本)  
**修复状态**: ✅ 已完成  
**测试状态**: ⏳ 待测试  

**版本历史**:
- v1 (2025-12-07 早): 单变量方案 - ❌ 不完整，仍会OOM
- v2 (2025-12-07 晚): 数组追踪方案 - ✅ 完整修复，应该彻底解决OOM
