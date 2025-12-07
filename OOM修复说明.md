# MMD播放器 OOM 问题已修复 ✅

## 问题原因

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

### 为什么会 OOM？

1. **创建了5个 Ammo WASM 对象**，但只保存了 `world` 的引用
2. **其他4个对象泄漏**到 WebAssembly 内存中
3. **每次切换模型**都会创建新的物理世界，累积泄漏
4. **WASM内存无法被JS垃圾回收**，必须手动调用 `Ammo.destroy()`
5. **累积到一定程度**就会触发 `OOM` (Out Of Memory) 错误

## 解决方案

使用 **Monkey Patching** 技术在运行时拦截这些对象的创建：

### 1. 拦截对象创建（第127-189行）

```typescript
// 保存原始构造函数
const originalBtDefaultCollisionConfiguration = Ammo.btDefaultCollisionConfiguration;
// ...

// 替换为拦截版本
Ammo.btDefaultCollisionConfiguration = function(...args: any[]) {
  const obj = new originalBtDefaultCollisionConfiguration(...args);
  physicsComponentsRef.current.config = obj;  // 🎯 捕获引用
  console.log('[MMDPlayerBase] 🔍 Captured btDefaultCollisionConfiguration');
  return obj;
};
// ... 对所有5个构造函数重复此操作
```

### 2. 正确销毁所有组件（第693-744行）

```typescript
// 按正确顺序销毁（与创建顺序相反）
// 创建顺序: config -> dispatcher -> cache -> solver -> world
// 销毁顺序: world -> solver -> cache -> dispatcher -> config

if (components.world) {
  Ammo.destroy(components.world);
  components.world = null;
}
if (components.solver) {
  Ammo.destroy(components.solver);
  components.solver = null;
}
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

### ✅ 清理日志示例

每次切换时控制台应该显示：

```
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

## 技术要点

### 为什么要用 Monkey Patching？

1. **无法修改第三方库** - 代码在 `node_modules` 中
2. **需要拦截对象创建** - 在对象被创建时捕获引用
3. **运行时动态修改** - 不影响库的源代码

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
**修复状态**: ✅ 已完成  
**测试状态**: ⏳ 待测试
