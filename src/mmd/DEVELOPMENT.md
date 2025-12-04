# MMD 播放器模块开发文档

> 🚧 **重构计划** - 本模块正在重新设计和开发中

## 1. 模块概述

`mmd` 模块是 `sa2kit` 中用于在 React 应用中渲染和控制 MMD (MikuMikuDance) 内容的功能模块。基于 `three.js` 和 `three-stdlib` 构建，提供从简单到高级的多层次组件。

### 1.1 核心能力

- 🎬 加载和渲染 PMX/PMD 模型
- 支持逐个加载播放节点资源以及预加载全部播放节点(可选),并能预防内存泄露
- 全部mmd文件的oss文件加载
- 💃 播放 VMD 动作文件
- 🎥 支持 VMD 相机动画
- 🎥 支持 mmd场景文件加载
- 🔊 音频同步播放
- ⚡ 物理引擎模拟 (Ammo.js)
- 📱 响应式设计，支持移动端
---

## 2. 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| `three` | ^0.181.2 | 3D 渲染引擎 |
| `three-stdlib` | ^2.36.0 | MMD 加载器和动画工具 |
| `ammo.js` | - | 物理引擎 (WASM) |
| `react` | >=18.0.0 | UI 框架 |

---

## 3. 架构设计

### 3.1 组件层级

```
┌─────────────────────────────────────────────────────┐
│                  MMDPlaylist                         │
│  (播放列表管理器 - 多场景无缝切换)                    │
├─────────────────────────────────────────────────────┤
│                MMDPlayerEnhanced                     │
│  (增强播放器 - 资源管理 + UI 控制)                   │
├─────────────────────────────────────────────────────┤
│                  MMDPlayerBase                       │
│  (基础播放器 - 核心渲染逻辑)                         │
└─────────────────────────────────────────────────────┘
```

### 3.2 数据流

```
用户配置 (MMDResources)
       ↓
   资源加载器 (MMDLoader)
       ↓
   场景构建 (THREE.Scene)
       ↓
   动画系统 (MMDAnimationHelper)
       ↓
   渲染循环 (requestAnimationFrame)
```

---

## 4. 核心类型定义

### 4.1 资源配置

```typescript
/** MMD 资源配置 */
interface MMDResources {
  /** 模型文件路径 (.pmx/.pmd) */
  modelPath: string;
  /** 动作文件路径 (.vmd) - 可选 */
  motionPath?: string;
  /** 相机动画路径 (.vmd) - 可选 */
  cameraPath?: string;
  /** 音频文件路径 - 可选 */
  audioPath?: string;
  /** 舞台/场景模型路径 (.pmx/.x) - 可选 (新增) */
  stageModelPath?: string;
  /** 附加动作文件 - 可选 */
  additionalMotions?: string[];
}

/** 资源列表项 - 用于预设切换 */
interface MMDResourceItem {
  id: string;
  name: string;
  resources: MMDResources;
  thumbnail?: string;
}

/** 资源选项 - 用于自由组合 */
interface MMDResourceOptions {
  models: ResourceOption[];
  motions: ResourceOption[];
  cameras?: ResourceOption[];
  audios?: ResourceOption[];
}

interface ResourceOption {
  id: string;
  name: string;
  path: string;
}
```

### 4.2 舞台配置

```typescript
/** 舞台/场景配置 */
interface MMDStage {
  /** 背景颜色 */
  backgroundColor?: string;
  /** 是否启用物理模拟 */
  enablePhysics?: boolean;
  /** 物理引擎路径 (ammo.wasm) */
  physicsPath?: string;
  /** 是否启用阴影 */
  enableShadow?: boolean;
  /** 环境光强度 */
  ambientLightIntensity?: number;
  /** 方向光强度 */
  directionalLightIntensity?: number;
  /** 相机初始位置 */
  cameraPosition?: { x: number; y: number; z: number };
  /** 相机目标点 */
  cameraTarget?: { x: number; y: number; z: number };
}
```

### 4.3 播放器配置

```typescript
/** 播放器属性 */
interface MMDPlayerProps {
  /** 资源配置 (三选一) */
  resources?: MMDResources;
  resourcesList?: MMDResourceItem[];
  resourceOptions?: MMDResourceOptions;
  
  /** 舞台配置 */
  stage?: MMDStage;
  
  /** 播放控制 */
  autoPlay?: boolean;
  loop?: boolean;
  defaultResourceId?: string;
  
  /** 事件回调 */
  onLoad?: () => void;
  onError?: (error: Error) => void;
  onProgress?: (progress: number) => void;
  onAudioEnded?: () => void;
  onAnimationEnded?: () => void;
  
  /** 样式 */
  className?: string;
  style?: React.CSSProperties;
}
```

### 4.4 播放列表配置

```typescript
/** 播放列表节点 */
interface MMDPlaylistNode {
  id: string;
  name: string;
  resources: MMDResources;
  loop?: boolean;
  duration?: number;
}

/** 播放列表配置 */
interface MMDPlaylistConfig {
  id: string;
  name: string;
  nodes: MMDPlaylistNode[];
  loop?: boolean;
  /** 预加载策略 (新增)
   * - 'none': 不预加载 (默认)
   * - 'next': 预加载下一个节点
   * - 'all': 预加载所有节点
   */
  preload?: 'none' | 'next' | 'all';
  autoPlay?: boolean;
}

/** 播放列表属性 */
interface MMDPlaylistProps {
  playlist: MMDPlaylistConfig;
  stage?: MMDStage;
  onNodeChange?: (node: MMDPlaylistNode, index: number) => void;
  onPlaylistComplete?: () => void;
  className?: string;
  style?: React.CSSProperties;
}
```

---

## 5. 组件规格

### 5.1 MMDPlayerBase

**定位**: 最底层的播放器，封装核心渲染逻辑

**职责**:
- Three.js 场景初始化和销毁
- 资源加载 (模型、动作、音频)
- 动画播放控制
- 物理模拟
- 渲染循环管理

**对外接口**:
```typescript
interface MMDPlayerBaseRef {
  play: () => void;
  pause: () => void;
  stop: () => void;
  seek: (time: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  isPlaying: () => boolean;
}
```

### 5.2 MMDPlayerEnhanced

**定位**: 增强型播放器，内置 UI 和资源管理

**职责**:
- 封装 MMDPlayerBase
- 提供播放控制 UI (播放/暂停/停止)
- 资源切换 UI (设置面板)
- 加载进度显示
- 错误处理和重试
- 内存管理 (资源清理)

**特性**:
- 支持三种资源加载模式 (单一/列表/自由组合)
- 内置响应式控制栏
- 全屏支持
- 音量控制

### 5.3 MMDPlaylist

**定位**: 播放列表管理器

**职责**:
- 管理多个播放节点
- 实现无缝切换
- 预加载策略
- 智能内存回收
- 播放列表 UI (上一首/下一首/节点选择)

**设计要点**:
- 按需渲染: 仅挂载当前活动节点的 MMDPlayerEnhanced
- 通过 React key 变化触发组件重新挂载实现资源切换
- 依赖组件生命周期自动清理资源

---

## 6. 开发计划

### Phase 1: 基础架构 (进行中)

- [x] 类型定义文件 (`types.ts`)
- [x] Ammo.js 加载器 (`utils/ammo-loader.ts`)
- [ ] MMDPlayerBase 组件 (拆解)
  - [ ] **核心渲染环境初始化** (Scene, Camera, Renderer, Lights, Controls)
  - [ ] **MMD 资源加载** (Model, Motion, Audio, Camera, Stage)
  - [ ] **动画与播放控制** (MMDAnimationHelper, Audio Sync, Seek)
  - [ ] **资源清理与内存管理** (Dispose Pattern)

### Phase 2: 增强功能

- [ ] MMDPlayerEnhanced 组件
  - [ ] 播放控制 UI
  - [ ] 加载进度条
  - [ ] 资源切换面板
  - [ ] 错误处理
  
### Phase 3: 高级功能

- [ ] MMDPlaylist 组件
  - [ ] 列表管理
  - [ ] 节点切换
  - [ ] 预加载策略
  
### Phase 4: 优化和扩展

- [ ] 性能优化
- [ ] 移动端适配
- [ ] 单元测试
- [ ] 文档完善

---

## 7. 核心实现要点

### 7.1 内存管理

MMD 模型和贴图会占用大量 GPU 内存，必须在组件卸载时彻底清理：

```typescript
// 清理函数示例
const cleanup = () => {
  // 1. 停止动画
  helper?.dispose();
  
  // 2. 遍历场景清理所有对象
  scene.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.geometry?.dispose();
      if (Array.isArray(object.material)) {
        object.material.forEach(m => disposeMaterial(m));
      } else {
        disposeMaterial(object.material);
      }
    }
  });
  
  // 3. 清理渲染器
  renderer.dispose();
  
  // 4. 清理物理引擎 (如果启用)
  if (physics) {
    physics.destroy();
  }
};
```

### 7.2 物理引擎加载

Ammo.js 需要异步加载 WASM：

```typescript
// utils/ammo-loader.ts
let Ammo: any = null;

export const loadAmmo = async (path?: string): Promise<any> => {
  if (Ammo) return Ammo;
  
  const ammoPath = path || '/libs/ammo.wasm.js';
  // 动态加载并初始化 Ammo
  const AmmoModule = await import(/* webpackIgnore: true */ ammoPath);
  Ammo = await AmmoModule.default();
  
  return Ammo;
};
```

### 7.3 渲染循环

使用 `requestAnimationFrame` 实现渲染循环，注意在组件卸载时取消：

```typescript
const animateRef = useRef<number>();

useEffect(() => {
  const animate = () => {
    animateRef.current = requestAnimationFrame(animate);
    
    const delta = clock.getDelta();
    helper?.update(delta);
    renderer.render(scene, camera);
  };
  
  animate();
  
  return () => {
    if (animateRef.current) {
      cancelAnimationFrame(animateRef.current);
    }
  };
}, []);
```

### 7.4 音频同步

MMD 动画通常需要与音频同步：

```typescript
const syncAudio = (audioElement: HTMLAudioElement) => {
  audioElement.currentTime = helper.getAudioTime();
};

// 或者使用 helper 内置的音频同步
helper.sync(audioContext);
```

### 7.5 OSS 文件加载与安全 (新增)

对于托管在 OSS (如阿里云 OSS, AWS S3) 上的 MMD 资源文件，需要特别处理：

1.  **CORS 配置**：
    *   必须在 OSS Bucket 侧配置允许跨域访问 (CORS)，允许前端域名访问。
    *   `MMDLoader` 内部使用 `FileLoader`，需要确保服务器响应头包含 `Access-Control-Allow-Origin`。

2.  **签名 URL (Signed URL)**：
    *   如果是私有 Bucket，文件路径应为带有签名的临时访问 URL。
    *   组件应支持动态获取 URL 的机制（例如 `resources` 属性可以接受一个异步函数）。

3.  **路径重写**：
    *   MMD 模型文件 (.pmx) 内部通常包含相对路径的贴图引用。
    *   `three-stdlib` 的 `MMDLoader` 支持设置 `resourcePath`。如果是 OSS URL，Loader 会自动处理相对路径，前提是目录结构保持一致，或者贴图与模型在同一目录下。

### 7.6 预加载与内存平衡 (新增)

`MMDPlaylist` 的预加载策略 (`preload`) 需要在用户体验和内存占用之间通过权衡：

*   **`preload: 'all'`**:
    *   *优点*: 切换极快，无缝体验最好。
    *   *缺点*: 内存占用极大，仅适用于节点少、模型简单的场景。
    *   *实现*: 在初始化时，后台创建所有节点的 `MMDLoader` 并开始加载。

*   **`preload: 'next'` (推荐)**:
    *   *优点*: 平衡了内存和体验。
    *   *实现*: 当节点 N 开始播放时，静默加载节点 N+1 的资源。

*   **防止内存泄漏**:
    *   无论哪种策略，非活动节点的资源（除了预加载的目标）应被及时清理。
    *   使用 `WeakRef` 或手动引用计数来管理共享资源（如相同的模型文件）。

---

## 8. 使用示例

### 8.1 基础用法

```tsx
import { MMDPlayerEnhanced } from 'sa2kit/mmd';

const MyPage = () => {
  return (
    <div style={{ width: '100%', height: '600px' }}>
      <MMDPlayerEnhanced
        resources={{
          modelPath: '/models/miku.pmx',
          motionPath: '/motions/dance.vmd',
          audioPath: '/audios/music.mp3',
        }}
        stage={{
          backgroundColor: '#1a1a2e',
          enablePhysics: true,
        }}
        autoPlay
        loop
      />
    </div>
  );
};
```

### 8.2 资源列表切换

```tsx
import { MMDPlayerEnhanced } from 'sa2kit/mmd';

const resourceItems = [
  {
    id: 'dance1',
    name: 'Catch The Wave',
    resources: {
      modelPath: '/models/miku.pmx',
      motionPath: '/motions/ctw.vmd',
      audioPath: '/audios/ctw.mp3',
    },
  },
  {
    id: 'dance2',
    name: 'Melt',
    resources: {
      modelPath: '/models/rin.pmx',
      motionPath: '/motions/melt.vmd',
      audioPath: '/audios/melt.mp3',
    },
  },
];

const MyPage = () => {
  return (
    <MMDPlayerEnhanced
      resourcesList={resourceItems}
      defaultResourceId="dance1"
      autoPlay
    />
  );
};
```

### 8.3 播放列表

```tsx
import { MMDPlaylist } from 'sa2kit/mmd';

const playlist = {
  id: 'my-playlist',
  name: '我的 MMD 剧场',
  nodes: [
    { id: 'scene1', name: '开场', resources: { /* ... */ } },
    { id: 'scene2', name: '主舞', resources: { /* ... */ } },
    { id: 'scene3', name: '结尾', resources: { /* ... */ } },
  ],
  loop: false,
  autoPlay: true,
};

const MyPage = () => {
  return (
    <MMDPlaylist
      playlist={playlist}
      onPlaylistComplete={() => console.log('播放完成')}
    />
  );
};
```

---

## 9. 待讨论事项

### 需求确认

1. **资源加载模式**
   - 是否保留三种模式（单一资源 / 资源列表 / 自由组合）？
   - 是否需要增加新的加载模式？

2. **UI 定制**
   - 控制栏样式是否需要可配置？
   - 是否需要提供无 UI 的 headless 版本？

3. **物理引擎**
   - Ammo.js 文件如何分发？(npm / CDN / 内置)
   - 是否支持关闭物理以提升性能？

4. **移动端**
   - 是否需要特别的移动端优化？
   - 触摸手势支持？

5. **其他功能**
   - 截图功能？
   - 录制功能？
   - 字幕支持？

---

## 10. 更新日志

| 日期 | 版本 | 内容 |
|------|------|------|
| 2025-12-04 | v0.0.1 | 创建开发文档，开始重构规划 |

---

## 11. 参考资料

- [three.js 文档](https://threejs.org/docs/)
- [three-stdlib MMDLoader](https://github.com/pmndrs/three-stdlib)
- [MMD 文件格式说明](https://mikumikudance.fandom.com/wiki/MMD:File_Formats)
- [Ammo.js](https://github.com/kripken/ammo.js/)

