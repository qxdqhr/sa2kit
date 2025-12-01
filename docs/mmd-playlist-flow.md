# MMD Playlist 模块 (`mmdplaylist`) 整体调用流程文档

## 1. 概览

`mmd` 模块中的播放列表功能旨在提供一个功能丰富、内存高效的 MMD 连续播放解决方案。其核心设计思想是 **“按需渲染与组件生命周期管理”**，通过在切换时仅渲染当前活动的播放节点，并依靠 React 组件的卸载机制来自动清理资源，从而实现稳定的播放体验和避免内存溢出。

这种策略通过确保在任何给定时间只有一份重度资源（3D 模型、纹理、物理模拟等）被加载到内存中，极大地提升了应用的稳定性，特别是在处理较长播放列表或资源密集型模型时。

整个功能主要由两个 React 组件和一个类型定义文件构成：

*   `MMDPlaylist.tsx`: **总调度器 (Orchestrator)**，负责管理整个播放列表的生命周期、UI 控制和节点切换逻辑。
*   `MMDPlayerEnhanced.tsx`: **工作单元 (Workhorse)**，负责单个 MMD 场景的渲染、资源加载、动画播放和物理模拟。
*   `types.ts`: **数据契约 (Data Contracts)**，定义了所有相关的 TypeScript 接口，如 `MMDPlaylistConfig`、`MMDPlaylistNode` 和 `MMDResources`。

---

## 2. 核心数据流与架构

调用流程始于用户向 `MMDPlaylist` 组件提供一个符合 `MMDPlaylistConfig` 接口的 `playlist` 属性。

```mermaid
graph TD
    subgraph User Application
        A[提供 playlist 数据<br>(MMDPlaylistConfig)] --> B(渲染 <MMDPlaylist /> 组件)
    end

    subgraph MMDPlaylist (总调度器)
        B --> C{根据 currentNodeIndex 渲染<br>单个 <MMDPlayerEnhanced />}
        C -- key={currentNode.id} --> D[React 重新挂载/卸载 <br>MMDPlayerEnhanced]
        D --> E{如果 autoPlay=true, <br>触发播放}

        F(播放器结束<br>onAudioEnded / onAnimationEnded) --> G{处理播放结束<br>(handlePlaybackEnded)}
        G --> H{更新当前节点索引<br>(setCurrentNodeIndex)}
        H --> C

        I[用户操作 UI 控制<br>(上一首/下一首/跳转)] --> J{更新当前节点索引<br>(setCurrentNodeIndex)}
        J --> C
    end

    subgraph MMDPlayerEnhanced (工作单元)
        D -- 挂载时 --> P(加载3D资源<br>Model, Motion, Audio...)
        P --> Q(调用 onLoad prop)
        E -- 触发 --> R(播放动画与音频)
        R --> F
        D -- 卸载时 --> S(自动清理内存<br>dispose 3D对象)
    end

    style B fill:#cde4ff
    style C fill:#cde4ff
    style P fill:#e6ffcd
    style R fill:#e6ffcd
    style S fill:#ffcdcd
```

---

## 3. 组件详解

### 3.1. `MMDPlaylist.tsx` - 总调度器

这是用户直接使用的顶层组件。它的核心职责是“调度”和“渲染”。

**主要工作流程:**

1.  **初始化**:
    *   接收 `playlist` 数据 (`MMDPlaylistConfig`)。
    *   在内部，它通过 `currentNodeIndex` state 仅渲染**一个** `<MMDPlayerEnhanced>` 组件实例。
    *   `MMDPlayerEnhanced` 组件的 `key` 属性绑定到 `currentNode.id`，确保在 `currentNodeIndex` 改变时，React 会卸载旧的实例并挂载新的实例。

2.  **播放与切换**:
    *   通过 `currentNodeIndex` (一个 React state) 来控制哪个播放节点被渲染。
    *   当一个节点的播放结束时（通过 `onAudioEnded` 或 `onAnimationEnded` 回调），`handlePlaybackEnded` 函数被触发。
    *   此函数根据当前节点和播放列表的 `loop` 属性来决定下一步操作：
        *   如果当前节点设置了循环，则不执行任何操作（当前节点会再次播放）。
        *   如果不循环且不是最后一个节点，则 `setCurrentNodeIndex(currentNodeIndex + 1)`。
        *   如果是最后一个节点且播放列表循环，则 `setCurrentNodeIndex(0)`。
        *   否则，调用 `onPlaylistComplete` 回调。
    *   `currentNodeIndex` 的改变会触发 React 重新渲染，导致旧的 `MMDPlayerEnhanced` 实例卸载（并自动清理资源），新的实例挂载（并加载资源）。

3.  **内存管理**:
    *   通过“按需渲染”策略从根本上解决了内存溢出问题。
    *   当 `MMDPlayerEnhanced` 组件因 `currentNodeIndex` 变化而被卸载时，其内部 `MMDPlayerBase` 组件的 `useEffect` 清理函数会自动执行，彻底释放所有 `three.js` 相关资源（几何体、材质、纹理、MMDAnimationHelper、WebGL 上下文等）和 Ammo.js 物理世界。
    *   `MMDPlaylist` 组件不再包含复杂的 `clearNodeResources` 或 `emergencyMemoryCleanup` 逻辑，因为它不再需要手动管理多个已挂载播放器的资源。

4.  **UI 和交互**:
    *   提供独立的播放列表控制UI，包括“上一首”、“下一首”和“设置”按钮。
    *   “设置”面板允许用户查看播放列表信息、跳转到任意节点，甚至动态地删除或重排列表中的节点（这些操作会更新组件内部的 `editableNodes` state）。这些操作会触发 `currentNodeIndex` 的更新或 `editableNodes` 的重新计算，从而驱动播放器的切换和更新。

### 3.2. `MMDPlayerEnhanced.tsx` - 工作单元

这是实际执行 MMD 渲染和播放的组件。它被设计为一个独立的、功能完备的播放器。

**主要工作流程:**

1.  **场景设置**:
    *   使用 `three.js` 初始化一个完整的 3D 场景，包括 `WebGLRenderer`, `Scene`, `Camera`, `Light` 和 `OrbitControls`。

2.  **资源加载**:
    *   接收 `resources` prop (`MMDResources` 类型)，其中包含了模型、动作、音频等文件的路径。
    *   使用 `three-stdlib` 中的 `MMDLoader` 异步加载所有资源。
    *   如果 `stage.enablePhysics` 为 `true`，会先通过 `ammo-loader.ts` 加载 Ammo.js 物理引擎。
    *   加载过程中，通过 `onProgress` 回调更新 `loadingProgress` 状态，显示加载进度条。
    *   加载完成后，调用 `onLoad` prop；失败则调用 `onError`。
    *   **健壮性增强**: 在加载动画和物理模拟之前，会检查加载的模型是否为具有有效骨骼的 `THREE.SkinnedMesh`，以防止 `TypeError`。

3.  **动画与物理**:
    *   使用 `MMDAnimationHelper` 来管理动画混合、IK（反向动力学）和物理模拟。
    *   `play`, `pause`, `stop` 方法直接控制 `MMDAnimationHelper` 和 `THREE.Clock` 的状态。
    *   `play()`: 播放音频，并启用 `MMDAnimationHelper` 的所有功能。
    *   `pause()`: 暂停音频，并停止 `THREE.Clock`。
    *   `stop()`: 停止并重置音频，重置模型姿态到 T-pose，并标记 `needReset` 为 `true`，以便下次播放时重建动画状态。

4.  **清理接口 (`useEffect` return)**:
    *   这是与 `MMDPlaylist` 协作的关键。当 `MMDPlayerEnhanced` 组件被卸载时，其 `useEffect` 的清理函数会自动触发。
    *   该清理函数会遍历场景，手动 `dispose()` 所有几何体、材质、纹理，并彻底销毁 Ammo.js 的物理世界和相关对象。这是防止内存泄漏的生命线。

5.  **结束事件**:
    *   通过监听 `<audio>` 元素的 `onended` 事件或检测 `MMDAnimationHelper` 的动画时间不再变化，来判断播放是否结束。
    *   结束时，调用 `onAudioEnded` 或 `onAnimationEnded` prop，将播放完成的信号传递给 `MMDPlaylist`。

---

## 4. 总结

`mmdplaylist` 的整体架构是一个典型的“调度器-工作单元”模式。

*   `MMDPlaylist` 作为**调度器**，专注于管理状态、流程控制和 UI 交互。
*   `MMDPlayerEnhanced` 作为**工作单元**，是一个独立且功能完备的组件，只关心如何根据给定的 `resources` 渲染好一个场景，并提供了必要的事件回调。

这种关注点分离的设计模式，使得 `MMDPlayerEnhanced` 可以被独立复用于其他场景，而 `MMDPlaylist` 则可以专注于实现复杂的播放列表逻辑。内存高效的“按需渲染”机制和 `MMDPlayerBase` 中详尽的资源清理是该模块能够稳定运行的核心保障。
