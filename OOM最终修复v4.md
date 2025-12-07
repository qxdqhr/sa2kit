# 🎯 OOM 最终修复 - v4 (清理时序修复)

## 问题发现过程

### v3 的问题
虽然新代码已经在运行，但：
- ✅ 看到了 "🧹 Checking for previous physics components"
- ❌ 但没有看到 "⚠️ 检测到未清理的物理组件"
- ❌ OOM 仍然发生

### 根本原因：时序错误

**执行顺序**：
```
1. 清理检查（但此时 Ammo 还没加载）
   ↓
2. Ammo.destroy 不存在
   ↓  
3. 清理条件不满足，跳过清理
   ↓
4. 加载 Ammo
   ↓
5. 设置 Monkey Patch
   ↓
6. 创建新对象
   ↓
7. WASM 内存累积 → OOM
```

**问题**：在 `await loadAmmo()` **之前**检查 `Ammo.destroy`，但此时 Ammo 还没加载！

## v4 解决方案

### 新的执行顺序

```
1. 保存旧组件的副本
   const oldComponents = { ...physicsComponentsRef.current };
   ↓
2. 立即重置数组（防止 Monkey Patch 往旧数组添加）
   physicsComponentsRef.current = { configs: [], ... };
   ↓
3. 加载 Ammo
   await loadAmmo();
   ↓
4. 现在可以清理了！✅
   if (AmmoLib && AmmoLib.destroy && totalOldCount > 0) {
     // 销毁所有旧对象
   }
   ↓
5. 设置 Monkey Patch
   ↓
6. 创建新对象（添加到新数组）
```

### 关键改进

1. **保存副本** - 在重置数组前复制所有旧对象引用
2. **立即重置** - 避免新对象添加到旧数组
3. **延迟清理** - 等 Ammo 加载后再清理
4. **计数器** - 显示实际销毁的对象数（destroyedCount/totalOldCount）

## 测试步骤

### 1. 重启服务器
```bash
cd /Users/qihongrui/Desktop/sa2kit
npm run dev
```

### 2. 刷新浏览器
强制刷新：`Cmd+Shift+R` 或使用隐身模式

### 3. 首次加载应该看到
```
[MMDPlayerBase] 🕐 系统启动时间: ...
[MMDPlayerBase] Loading Ammo.js physics engine...
[MMDPlayerBase] Ammo.js loaded successfully
[MMDPlayerBase] ℹ️ 没有需要清理的物理组件  ← totalOldCount = 0
[MMDPlayerBase] 🎯 Setting up physics component tracking (FIRST TIME)...
[MMDPlayerBase] ✅ Physics component tracking setup complete
[MMDPlayerBase] 🔍 Captured btDefaultCollisionConfiguration #1
[MMDPlayerBase] 🔍 Captured btDefaultCollisionConfiguration #2
...
[MMDPlayerBase] 🔍 Captured btDefaultCollisionConfiguration #29
[MMDPlayerBase] 🔍 Captured btDiscreteDynamicsWorld #1
...
[MMDPlayerBase] 🔍 Captured btDiscreteDynamicsWorld #29
```

### 4. 切换模型（第2次）应该看到
```
[MMDPlayerBase] 🔄 模型切换 #2 (运行时间: 1分30秒)
[MMDPlayerBase] Loading Ammo.js physics engine...
[MMDPlayerBase] Ammo.js loaded successfully
[MMDPlayerBase] ⚠️ 检测到未清理的物理组件，立即清理...  ← 关键！
[MMDPlayerBase] 📊 未清理组件数量: {
  worlds: 29,
  solvers: 29,
  caches: 29,
  dispatchers: 29,
  configs: 29,
  total: 145
}
[MMDPlayerBase] ✅ 已清理 145/145 个物理组件  ← 全部清理！
[MMDPlayerBase] ℹ️ Monkey Patch already setup, skipping
[MMDPlayerBase] 🔍 Captured btDefaultCollisionConfiguration #1  ← 从1开始
[MMDPlayerBase] 🔍 Captured btDefaultCollisionConfiguration #2
...
[MMDPlayerBase] 🔍 Captured btDefaultCollisionConfiguration #29
```

### 5. 再次切换（第3次）
```
[MMDPlayerBase] 🔄 模型切换 #3 (运行时间: 3分15秒)
[MMDPlayerBase] ⚠️ 检测到未清理的物理组件，立即清理...
[MMDPlayerBase] 📊 未清理组件数量: { total: 145 }
[MMDPlayerBase] ✅ 已清理 145/145 个物理组件
[MMDPlayerBase] 🔍 Captured #1  ← 又从1开始
```

## 成功标准

### ✅ 必须看到

1. **清理日志**：
   - "⚠️ 检测到未清理的物理组件"
   - "📊 未清理组件数量: { total: 145 }"
   - "✅ 已清理 145/145 个物理组件"

2. **计数重置**：
   - 每次切换后，Captured 都从 #1 开始
   - 不再累积到 #30, #40, #50...

3. **无 OOM 错误**：
   - 切换 50+ 次不会 OOM
   - 可以长时间运行（2小时+）

### ❌ 失败标志

1. 没有看到 "⚠️ 检测到未清理的物理组件"
2. 看到 "⚠️ 发现 XX 个未清理组件但无法清理"
3. Captured 计数持续累积
4. 仍然出现 OOM

## 如果还是不行

### 检查清理是否执行

在浏览器控制台查看：
- 有 "⚠️ 检测到未清理" → 清理执行了 ✅
- 只有 "ℹ️ 没有需要清理" → 数组为空 ⚠️
- 看到 "但无法清理" → Ammo.destroy 不可用 ❌

### 调试命令

```javascript
// 在浏览器控制台
console.log('Ammo:', window.Ammo);
console.log('Ammo.destroy:', window.Ammo?.destroy);
console.log('Monkey Patch:', window.Ammo?.__sa2kitMonkeyPatched);
```

### 最后的手段：禁用物理引擎

如果还是不行，临时禁用物理引擎：

```typescript
// 在你的配置中
const stageConfig = {
  enablePhysics: false,  // 禁用物理引擎
  // ... 其他配置
};
```

这样至少可以正常使用，虽然没有物理效果。

## 版本对比

| 版本 | 清理时机 | 清理执行 | 结果 |
|------|----------|----------|------|
| v1 | 组件卸载时 | ❌ 从未 | 20分钟OOM |
| v2 | init 开始前 | ❌ 代码被删除 | 2次切换OOM |
| v3 | init 开始前 | ❌ Ammo未加载 | 仍然OOM |
| **v4** | **Ammo加载后** | **✅ 应该执行** | **✅ 应该成功** |

## 技术细节

### 为什么要立即重置数组？

```typescript
// 1. 保存副本
const oldComponents = { ...physicsComponentsRef.current };

// 2. 立即重置（关键！）
physicsComponentsRef.current = { configs: [], ... };

// 3. 加载 Ammo（可能需要时间）
await loadAmmo();

// 4. 期间如果有对象创建，会添加到新数组，不会影响旧数组
// 5. 然后清理旧数组的对象
```

如果不立即重置，新对象会添加到旧数组，然后被错误地清理掉。

### 为什么用 AmmoLib 而不是 Ammo？

避免变量重复声明错误：
```typescript
const Ammo = window.Ammo;  // 第一次
// ...
const Ammo = window.Ammo;  // 第二次 → 错误！

// 改为
const AmmoLib = window.Ammo;  // 避免冲突
```

## 总结

v4 修复了最后一个关键问题：**清理时序**。

- v1-v2：清理逻辑问题
- v3：清理时序问题
- **v4：应该完全修复了** ✅

现在重启服务器测试吧！

---

**提交**: commit 4e9924f  
**修改**: 82 insertions, 72 deletions  
**状态**: ✅ 已修复，待测试

