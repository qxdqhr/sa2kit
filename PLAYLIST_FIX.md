# MMD 播放列表修复文档

## 问题描述

MMD 播放列表（`MMDPlaylist`）组件不能正确播放传入的节点列表，节点切换功能失效。

## 根本原因

1. **动画结束检测不准确**: `MMDPlayerEnhanced` 组件没有正确检测动画结束事件
2. **缺少调试信息**: 没有足够的日志输出来追踪播放状态
3. **重复触发问题**: 动画结束事件可能被多次触发，导致节点切换混乱
4. **舞台配置未应用**: 播放器没有正确应用舞台配置（相机位置、背景色等）

## 解决方案

### 1. MMDPlaylist.tsx 修改

**新增功能:**
- ✅ 添加防重复触发机制（`hasNotifiedAnimationEnd` ref）
- ✅ 同步 `playlist.nodes` 更新
- ✅ 增强日志输出，便于调试
- ✅ 在加载遮罩中显示当前节点信息
- ✅ 添加底部调试信息显示当前播放状态

**关键代码改进:**
```typescript
// 防止重复触发
const hasNotifiedAnimationEnd = useRef(false);

// 同步播放列表节点更新
useEffect(() => {
  console.log('[MMDPlaylist] 播放列表节点更新:', playlist.nodes.length, '个节点');
  setEditableNodes(playlist.nodes);
}, [playlist.nodes]);

// 播放结束处理（带防重复检查）
const handlePlaybackEnded = useCallback(() => {
  if (hasNotifiedAnimationEnd.current) {
    console.log('[MMDPlaylist] 动画结束已处理，跳过重复触发');
    return;
  }
  hasNotifiedAnimationEnd.current = true;
  // ... 节点切换逻辑
}, [editableNodes, playlist.loop, onPlaylistComplete]);
```

### 2. MMDPlayerEnhanced.tsx 修改

**新增功能:**
- ✅ 基于时间的动画结束检测
- ✅ 应用舞台配置（相机位置、背景色、光源等）
- ✅ 完善的资源清理逻辑
- ✅ 详细的日志输出
- ✅ 音频播放错误处理
- ✅ 中文化加载提示

**关键代码改进:**
```typescript
// 获取动画时长
if (vmd && vmd.duration) {
  animationDuration = vmd.duration;
  animationDurationRef.current = animationDuration;
  console.log('[MMDPlayerEnhanced] 动画时长:', animationDuration, '秒');
}

// 在渲染循环中检测动画结束
const animate = () => {
  // ... 渲染逻辑
  
  // 基于时间检测动画结束
  if (!loop && !animationEndedRef.current && animationDuration > 0) {
    const elapsed = (Date.now() - animationStartTimeRef.current) / 1000;
    if (elapsed >= animationDuration) {
      console.log('[MMDPlayerEnhanced] 动画播放结束（基于时长检测）');
      animationEndedRef.current = true;
      setTimeout(() => {
        if (isMounted) {
          onAnimationEnded?.();
        }
      }, 100);
    }
  }
  
  renderer.render(scene, camera);
};
```

**舞台配置应用:**
```typescript
// 应用相机位置
if (stage?.cameraPosition) {
  camera.position.set(
    stage.cameraPosition.x ?? 0,
    stage.cameraPosition.y ?? 10,
    stage.cameraPosition.z ?? 30
  );
}

// 应用背景色
if (stage?.backgroundColor) {
  scene.background = new THREE.Color(stage.backgroundColor);
}

// 设置相机目标
if (stage?.cameraTarget) {
  controls.target.set(
    stage.cameraTarget.x ?? 0,
    stage.cameraTarget.y ?? 10,
    stage.cameraTarget.z ?? 0
  );
  controls.update();
}

// 添加光源
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
directionalLight.position.set(1, 1, 1);
scene.add(directionalLight);
```

## 使用方法

### 1. 重新构建 sa2kit

```bash
cd /Users/qihongrui/Desktop/sa2kit
pnpm build
```

### 2. 在宿主项目中测试

访问测试页面：
```
http://localhost:3000/testField/mmdPlaylist
```

### 3. 查看调试信息

组件现在会在控制台输出详细的调试信息：
- 节点切换状态
- 动画加载进度
- 播放结束事件
- 资源加载状态

同时在页面底部会显示当前播放状态：
- 当前节点编号
- 节点名称
- 节点 ID

## 测试要点

1. **节点自动切换**: 确认每个节点播放完成后自动切换到下一个
2. **循环播放**: 验证 `playlist.loop` 配置生效
3. **节点循环**: 验证单个节点的 `loop` 配置生效
4. **舞台配置**: 检查相机位置、背景色是否正确应用
5. **资源加载**: 确认 OSS 资源和本地资源都能正确加载
6. **错误处理**: 测试资源加载失败的情况

## 版本信息

- **修改日期**: 2025-12-04
- **sa2kit 版本**: 1.1.0
- **修改文件**:
  - `src/mmd/components/MMDPlaylist.tsx`
  - `src/mmd/components/MMDPlayerEnhanced.tsx`

## 注意事项

1. 本次修改是在本地 sa2kit 包中进行的，需要重新构建才能生效
2. 宿主项目通过 `pnpm link` 或 `file:../sa2kit` 引用本地包
3. 修改后需要重启宿主项目的开发服务器以加载新版本
4. 调试信息在生产环境中可能需要移除或改为条件输出

