# 🎉 OOM 问题最终修复 - v3

## 问题发现

通过分析 `log.md`（30万行），发现：

```
[MMDPlayerBase] 🔍 Captured #44, #43, ... #2, #1, #1  ← OOM
```

**关键证据**：
1. ❌ 物理对象累积到 #44
2. ❌ 完全没有清理日志
3. ❌ 只有2次模型切换，但累积了44个对象

**结论**：清理逻辑根本没有执行！

## 根本原因

### 原因 1：清理代码被删除
之前的清理逻辑（第131-169行）不见了，直接变成：

```typescript
// ❌ 错误代码
physicsComponentsRef.current = {
  configs: [],
  dispatchers: [],
  // ... 直接重置，没有清理旧对象！
};
```

### 原因 2：Monkey Patch 重复设置
每次 `init()` 都重新执行：

```typescript
const originalBtDefaultCollisionConfiguration = Ammo.btDefaultCollisionConfiguration;
Ammo.btDefaultCollisionConfiguration = function(...args) {
  const obj = new originalBtDefaultCollisionConfiguration(...args);  // ❌ 第二次时这已经是被替换后的函数
  // ...
};
```

第二次执行时会导致无限递归或引用错误。

## 修复方案 v3

### 修复 1：恢复并增强清理逻辑

```typescript
// 3. 先清理旧的物理引擎组件
console.log('[MMDPlayerBase] 🧹 Checking for previous physics components...');
const oldComponents = physicsComponentsRef.current;
const totalOldCount = oldComponents.worlds.length + oldComponents.solvers.length + 
                      oldComponents.caches.length + oldComponents.dispatchers.length + 
                      oldComponents.configs.length;

if (Ammo && Ammo.destroy && totalOldCount > 0) {
  console.log('[MMDPlayerBase] ⚠️ 检测到未清理的物理组件，立即清理...');
  console.log('[MMDPlayerBase] 📊 未清理组件数量:', {
    worlds: oldComponents.worlds.length,
    solvers: oldComponents.solvers.length,
    caches: oldComponents.caches.length,
    dispatchers: oldComponents.dispatchers.length,
    configs: oldComponents.configs.length,
    total: totalOldCount
  });
  
  // 按正确顺序销毁
  for (let i = oldComponents.worlds.length - 1; i >= 0; i--) {
    try { 
      Ammo.destroy(oldComponents.worlds[i]); 
      console.log(`[MMDPlayerBase]   ✅ Destroyed world #${i+1}`);
    } catch (e) { 
      console.warn(`[MMDPlayerBase]   ❌ 销毁world #${i+1}失败:`, e); 
    }
  }
  // ... 其他组件类似
  
  console.log(`[MMDPlayerBase] ✅ 已清理 ${totalOldCount} 个物理组件`);
}

// 4. 重置数组
physicsComponentsRef.current = { configs: [], ... };
```

### 修复 2：防止 Monkey Patch 重复设置

```typescript
const Ammo = (window as any).Ammo;
if (Ammo && !(Ammo as any).__sa2kitMonkeyPatched) {
  console.log('[MMDPlayerBase] 🎯 Setting up physics component tracking (FIRST TIME)...');
  
  // 保存原始构造函数
  const originalBtDefaultCollisionConfiguration = Ammo.btDefaultCollisionConfiguration;
  // ...
  
  // 替换构造函数
  Ammo.btDefaultCollisionConfiguration = function(...args) {
    const obj = new originalBtDefaultCollisionConfiguration(...args);
    componentsRef.configs.push(obj);
    console.log(`[MMDPlayerBase] 🔍 Captured btDefaultCollisionConfiguration #${componentsRef.configs.length}`);
    return obj;
  };
  
  // 标记已设置
  (Ammo as any).__sa2kitMonkeyPatched = true;
  console.log('[MMDPlayerBase] ✅ Physics component tracking setup complete');
} else if (Ammo) {
  console.log('[MMDPlayerBase] ℹ️ Monkey Patch already setup, skipping');
}
```

## 测试方法

刷新浏览器，然后切换模型，应该看到：

### 首次加载
```
[MMDPlayerBase] 🕐 系统启动时间: 2025/12/7 16:30:00
[MMDPlayerBase] 🧹 Checking for previous physics components...
[MMDPlayerBase] ℹ️ 没有需要清理的物理组件
[MMDPlayerBase] 🎯 Setting up physics component tracking (FIRST TIME)...
[MMDPlayerBase] 🔍 Captured btDefaultCollisionConfiguration #1
[MMDPlayerBase] 🔍 Captured btDefaultCollisionConfiguration #2
...
[MMDPlayerBase] 🔍 Captured btDefaultCollisionConfiguration #29
[MMDPlayerBase] 🔍 Captured btDiscreteDynamicsWorld #1
...
[MMDPlayerBase] 🔍 Captured btDiscreteDynamicsWorld #29
```

### 切换模型（第2次）
```
[MMDPlayerBase] 🔄 模型切换 #2 (运行时间: 1分30秒)
[MMDPlayerBase] 🧹 Checking for previous physics components...
[MMDPlayerBase] ⚠️ 检测到未清理的物理组件，立即清理...
[MMDPlayerBase] 📊 未清理组件数量: {
  worlds: 29,
  solvers: 29,
  caches: 29,
  dispatchers: 29,
  configs: 29,
  total: 145
}
[MMDPlayerBase]   ✅ Destroyed world #29
[MMDPlayerBase]   ✅ Destroyed world #28
...
[MMDPlayerBase]   ✅ Destroyed world #1
[MMDPlayerBase] ✅ 已清理 145 个物理组件
[MMDPlayerBase] ℹ️ Monkey Patch already setup, skipping
[MMDPlayerBase] 🔍 Captured btDefaultCollisionConfiguration #1  ← 从1开始
[MMDPlayerBase] 🔍 Captured btDefaultCollisionConfiguration #2
...
[MMDPlayerBase] 🔍 Captured btDefaultCollisionConfiguration #29
```

### 再次切换（第3次）
```
[MMDPlayerBase] 🔄 模型切换 #3 (运行时间: 3分15秒)
[MMDPlayerBase] 🧹 Checking for previous physics components...
[MMDPlayerBase] ⚠️ 检测到未清理的物理组件，立即清理...
[MMDPlayerBase] 📊 未清理组件数量: { total: 145 }
[MMDPlayerBase] ✅ 已清理 145 个物理组件
[MMDPlayerBase] ℹ️ Monkey Patch already setup, skipping
[MMDPlayerBase] 🔍 Captured btDefaultCollisionConfiguration #1  ← 又从1开始
...
```

## 成功标准

✅ **每次切换都应该**：
1. 显示清理日志
2. 清理145个对象（29×5）
3. 新对象从#1开始计数
4. 显示"Monkey Patch already setup, skipping"

✅ **切换 50 次后**：
- 不应该出现 OOM
- 内存保持稳定
- 对象计数始终是 #1-#29

✅ **长时间运行（2小时+）**：
- 不应该 OOM
- 内存稳定在合理范围

## 为什么 v3 会成功？

| 版本 | 追踪方式 | 清理时机 | Monkey Patch | 结果 |
|------|----------|----------|--------------|------|
| v1 | 单变量 | ❌ 未执行 | 重复设置 | ❌ 20分钟OOM |
| v2 | 数组 | ❌ 代码被删除 | 重复设置 | ❌ 2次切换OOM |
| **v3** | **数组** | **✅ 每次init前** | **✅ 只设置一次** | **✅ 应该成功** |

v3 的关键改进：
1. ✅ **恢复清理逻辑** - 在重置数组前先清理
2. ✅ **详细日志** - 可以看到清理进度
3. ✅ **防重复设置** - Monkey Patch 只执行一次
4. ✅ **错误处理** - 清理失败不会中断流程

## 后续监控

如果仍然出现 OOM，检查：

1. **清理是否执行？**
   - 看日志有没有 "⚠️ 检测到未清理的物理组件"
   - 如果有，检查是否有 "✅ 已清理 145 个物理组件"

2. **对象计数是否正确？**
   - 每次切换后应该从 #1 开始
   - 如果继续累积（#30, #31...），说明数组没有重置

3. **Monkey Patch 是否生效？**
   - 第一次应该显示 "(FIRST TIME)"
   - 之后应该显示 "already setup, skipping"

## 总结

**v3 是最终版本**，综合了 v1 和 v2 的经验教训：

- ✅ 使用数组追踪所有对象（v2的优点）
- ✅ 每次init前主动清理（新增）
- ✅ 防止Monkey Patch重复设置（新增）
- ✅ 详细的清理日志（新增）

如果 v3 还不行，那么问题可能出在：
1. 其他内存泄漏源（纹理、几何体、音频等）
2. Ammo.js 本身的bug
3. 浏览器内存限制

但基于当前的分析，v3 应该能彻底解决 OOM 问题！

---

**提交**: commit 5d34a15  
**修改文件**: `src/mmd/components/MMDPlayerBase.tsx`  
**修改行数**: +50, -23  
**状态**: ✅ 已提交，待测试

