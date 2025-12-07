### MMD 后台管理系统使用文档

---

## 📋 目录

1. [功能概述](#功能概述)
2. [数据库设计](#数据库设计)
3. [快速开始](#快速开始)
4. [组件使用](#组件使用)
5. [API集成](#api集成)
6. [数据转换](#数据转换)
7. [完整示例](#完整示例)
8. [常见问题](#常见问题)

---

## 功能概述

MMD后台管理系统提供完整的MMD资源配置和播放列表管理功能，包括：

### ✅ 核心功能

- **播放列表管理**：创建、编辑、删除播放列表
- **播放节点配置**：为每个节点配置模型、动作、音频等资源
- **文件上传**：集成 UniversalFile，支持文件上传到OSS
- **资源选择器**：可视化选择已上传的文件
- **文件ID映射**：自动处理文件ID到OSS URL的映射
- **预设管理**：管理预设的资源组合
- **资源库管理**：管理可选的MMD资源（模型、动作等）

### 🎯 设计特点

- **无缝集成**：与 universalFile 模块完美集成
- **类型安全**：完整的 TypeScript 类型定义
- **平滑迁移**：数据库表结构可直接接入现有项目
- **组件化**：模块化设计，易于扩展和定制

---

## 数据库设计

### 表结构概览

系统包含4个主要数据库表：

#### 1. mmd_playlists (播放列表)

```typescript
{
  id: uuid,                    // 主键
  name: string,               // 播放列表名称
  description: string,        // 描述
  loop: boolean,              // 是否循环
  preloadStrategy: enum,      // 预加载策略: none/next/all
  autoPlay: boolean,          // 是否自动播放
  thumbnailFileId: uuid,      // 缩略图文件ID
  status: enum,               // 状态: draft/published/archived
  sortOrder: number,          // 排序
  config: json,               // 额外配置
  createdBy: string,          // 创建者ID
  createdAt: timestamp,       // 创建时间
  updatedAt: timestamp,       // 更新时间
  deletedAt: timestamp,       // 删除时间(软删除)
}
```

#### 2. mmd_playlist_nodes (播放节点)

```typescript
{
  id: uuid,                    // 主键
  playlistId: uuid,           // 所属播放列表ID
  name: string,               // 节点名称
  description: string,        // 描述
  loop: boolean,              // 是否循环
  duration: number,           // 时长(秒)
  thumbnailFileId: uuid,      // 缩略图文件ID
  sortOrder: number,          // 排序
  modelFileId: uuid,          // 模型文件ID (必填)
  motionFileId: uuid,         // 动作文件ID
  cameraFileId: uuid,         // 相机文件ID
  audioFileId: uuid,          // 音频文件ID
  stageModelFileId: uuid,     // 舞台文件ID
  additionalMotionFileIds: json, // 附加动作ID列表
  config: json,               // 额外配置
  createdAt: timestamp,       // 创建时间
  updatedAt: timestamp,       // 更新时间
}
```

#### 3. mmd_resource_options (资源选项)

```typescript
{
  id: uuid,                    // 主键
  name: string,               // 资源名称
  description: string,        // 描述
  resourceType: enum,         // 资源类型: model/motion/camera/audio/stage
  fileId: uuid,               // 文件ID (必填)
  thumbnailFileId: uuid,      // 缩略图文件ID
  tags: json,                 // 标签数组
  sortOrder: number,          // 排序
  isActive: boolean,          // 是否启用
  createdBy: string,          // 创建者ID
  createdAt: timestamp,       // 创建时间
  updatedAt: timestamp,       // 更新时间
}
```

#### 4. mmd_preset_items (预设项)

```typescript
{
  id: uuid,                    // 主键
  name: string,               // 预设名称
  description: string,        // 描述
  thumbnailFileId: uuid,      // 缩略图文件ID
  modelFileId: uuid,          // 模型文件ID (必填)
  motionFileId: uuid,         // 动作文件ID
  cameraFileId: uuid,         // 相机文件ID
  audioFileId: uuid,          // 音频文件ID
  stageModelFileId: uuid,     // 舞台文件ID
  additionalMotionFileIds: json, // 附加动作ID列表
  sortOrder: number,          // 排序
  isActive: boolean,          // 是否启用
  tags: json,                 // 标签数组
  createdBy: string,          // 创建者ID
  createdAt: timestamp,       // 创建时间
  updatedAt: timestamp,       // 更新时间
}
```

### 数据库迁移

使用 Drizzle ORM 执行数据库迁移：

```bash
# 1. 导入Schema
import { 
  mmdPlaylists, 
  mmdPlaylistNodes, 
  mmdResourceOptions, 
  mmdPresetItems 
} from '@qhr123/sa2kit/mmd/admin';

# 2. 创建迁移
drizzle-kit generate:pg

# 3. 执行迁移
drizzle-kit push:pg
```

---

## 快速开始

### 1. 安装依赖

```bash
pnpm add @qhr123/sa2kit
```

### 2. 导入组件

```typescript
import { MmdAdminPanel } from '@qhr123/sa2kit/mmd/admin';
import { createUniversalFileService } from '@qhr123/sa2kit/universalFile/server';
```

### 3. 创建文件服务

```typescript
// 服务端
const fileService = createUniversalFileService({
  storage: 'aliyun-oss',
  oss: {
    region: process.env.OSS_REGION,
    accessKeyId: process.env.OSS_ACCESS_KEY_ID,
    accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
    bucket: process.env.OSS_BUCKET,
  },
});
```

### 4. 使用管理面板

```typescript
'use client';

import { MmdAdminPanel } from '@qhr123/sa2kit/mmd/admin';

export default function AdminPage() {
  return (
    <MmdAdminPanel
      fileService={fileService}
      userId="current-user-id"
      apiBaseUrl="/api/mmd"
      showAdvancedOptions={true}
    />
  );
}
```

---

## 组件使用

### MmdAdminPanel (主面板)

完整的后台管理面板，包含所有功能。

```typescript
<MmdAdminPanel
  fileService={fileService}          // UniversalFileService 实例
  userId="user-123"                   // 当前用户ID
  apiBaseUrl="/api/mmd"               // API基础路径
  showAdvancedOptions={true}          // 是否显示高级选项
  className="custom-class"            // 自定义样式类名
/>
```

### MmdPlaylistEditor (播放列表编辑器)

独立的播放列表编辑器组件。

```typescript
<MmdPlaylistEditor
  playlistId="playlist-id"            // 播放列表ID (可选，用于编辑)
  fileService={fileService}           // UniversalFileService 实例
  userId="user-123"                   // 当前用户ID
  onSave={(playlist) => {            // 保存回调
    console.log('保存成功:', playlist);
  }}
  onCancel={() => {                  // 取消回调
    console.log('取消编辑');
  }}
/>
```

### MmdResourceSelector (资源选择器)

文件选择器组件，支持上传和选择。

```typescript
<MmdResourceSelector
  resourceType="model"                // 资源类型
  fileService={fileService}           // UniversalFileService 实例
  userId="user-123"                   // 当前用户ID
  value="file-id"                     // 当前选中的文件ID
  onChange={(fileId, fileUrl) => {   // 选择回调
    console.log('选中文件:', fileId, fileUrl);
  }}
  required={true}                     // 是否必填
/>
```

支持的资源类型：
- `model`: MMD模型 (.pmx, .pmd)
- `motion`: MMD动作 (.vmd)
- `camera`: MMD相机动画 (.vmd)
- `audio`: 音频文件 (.mp3, .wav, .ogg, .m4a)
- `stage`: 舞台模型 (.pmx, .pmd, .x)

---

## API集成

### 后端API设计

#### 1. 播放列表API

```typescript
// POST /api/mmd/playlists - 创建播放列表
interface CreatePlaylistRequest {
  name: string;
  description?: string;
  loop?: boolean;
  preloadStrategy?: 'none' | 'next' | 'all';
  autoPlay?: boolean;
  thumbnailFileId?: string;
}

// GET /api/mmd/playlists/:id - 获取播放列表
interface GetPlaylistResponse {
  playlist: MmdPlaylistWithFiles;  // 包含文件URL映射
}

// PUT /api/mmd/playlists/:id - 更新播放列表
interface UpdatePlaylistRequest extends Partial<CreatePlaylistRequest> {
  status?: 'draft' | 'published' | 'archived';
}

// DELETE /api/mmd/playlists/:id - 删除播放列表 (软删除)
```

#### 2. 播放节点API

```typescript
// POST /api/mmd/playlists/:playlistId/nodes - 创建节点
interface CreateNodeRequest {
  name: string;
  modelFileId: string;  // 必填
  motionFileId?: string;
  audioFileId?: string;
  // ...
}

// PUT /api/mmd/playlists/:playlistId/nodes/:nodeId - 更新节点
// DELETE /api/mmd/playlists/:playlistId/nodes/:nodeId - 删除节点
```

#### 3. 文件URL映射API

```typescript
// POST /api/mmd/files/batch-urls - 批量获取文件URL
interface BatchUrlsRequest {
  fileIds: string[];
}

interface BatchUrlsResponse {
  fileUrls: { [fileId: string]: string };
  missingFileIds: string[];
}
```

### 后端实现示例

```typescript
import { db } from './db';
import { mmdPlaylists, mmdPlaylistNodes } from '@qhr123/sa2kit/mmd/admin';
import { 
  convertPlaylistToFrontend,
  extractFileIdsFromPlaylist 
} from '@qhr123/sa2kit/mmd/admin';

// 获取播放列表（含文件URL映射）
export async function getPlaylistWithUrls(playlistId: string) {
  // 1. 查询播放列表和节点
  const playlist = await db.query.mmdPlaylists.findFirst({
    where: eq(mmdPlaylists.id, playlistId),
  });
  
  const nodes = await db.query.mmdPlaylistNodes.findMany({
    where: eq(mmdPlaylistNodes.playlistId, playlistId),
  });
  
  if (!playlist) throw new Error('Playlist not found');
  
  // 2. 提取所有文件ID
  const fileIds = extractFileIdsFromPlaylist(playlist, nodes);
  
  // 3. 批量获取文件URL
  const fileUrls = await getFileUrls(fileIds);
  
  // 4. 转换为前端格式
  return convertPlaylistToFrontend(playlist, nodes, fileUrls);
}

// 获取文件URL映射
async function getFileUrls(fileIds: string[]): Promise<FileIdToUrlMap> {
  const fileUrls: FileIdToUrlMap = {};
  
  for (const fileId of fileIds) {
    const url = await fileService.getFileUrl(fileId);
    fileUrls[fileId] = url;
  }
  
  return fileUrls;
}
```

---

## 数据转换

系统提供了完整的数据转换工具函数：

### 数据库格式 → 前端格式

```typescript
import { 
  convertPlaylistToFrontend,
  extractFileIdsFromPlaylist 
} from '@qhr123/sa2kit/mmd/admin';

// 1. 获取数据库数据
const playlist = await db.query.mmdPlaylists.findFirst(...);
const nodes = await db.query.mmdPlaylistNodes.findMany(...);

// 2. 提取文件ID
const fileIds = extractFileIdsFromPlaylist(playlist, nodes);

// 3. 获取文件URL映射
const fileUrls = await getFileUrls(fileIds);

// 4. 转换为前端格式
const playlistWithFiles = convertPlaylistToFrontend(playlist, nodes, fileUrls);
```

### 前端格式 → MMD组件格式

```typescript
import { convertPlaylistToMmdConfig } from '@qhr123/sa2kit/mmd/admin';

// 转换为 MMDPlaylist 组件可用的格式
const mmdConfig = convertPlaylistToMmdConfig(playlistWithFiles);

// 使用在 MMDPlaylist 组件中
<MMDPlaylist
  playlist={mmdConfig}
  stage={stageConfig}
  mobileOptimization={mobileConfig}
/>
```

### 完整转换流程

```
数据库(DB)
  ↓ (convertPlaylistToFrontend)
前端格式(WithFiles)
  ↓ (convertPlaylistToMmdConfig)
MMD组件格式(MMDPlaylistConfig)
  ↓
MMDPlaylist组件
```

---

## 完整示例

### 1. Next.js App Router 示例

```typescript
// app/admin/mmd/page.tsx
'use client';

import { MmdAdminPanel } from '@qhr123/sa2kit/mmd/admin';
import { useFileService } from '@/hooks/useFileService';

export default function MmdAdminPage() {
  const fileService = useFileService();
  const userId = useUserId(); // 获取当前用户ID
  
  return (
    <div className="min-h-screen">
      <MmdAdminPanel
        fileService={fileService}
        userId={userId}
        apiBaseUrl="/api/mmd"
      />
    </div>
  );
}
```

### 2. API Route 示例

```typescript
// app/api/mmd/playlists/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getPlaylistWithUrls } from '@/lib/mmd';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const playlist = await getPlaylistWithUrls(params.id);
    return NextResponse.json(playlist);
  } catch (error) {
    return NextResponse.json(
      { error: 'Playlist not found' },
      { status: 404 }
    );
  }
}
```

### 3. 前端播放器集成示例

```typescript
// app/mmd/player/[id]/page.tsx
'use client';

import { MMDPlaylist } from '@qhr123/sa2kit/mmd';
import { usePlaylist } from '@/hooks/usePlaylist';

export default function PlayerPage({ params }: { params: { id: string } }) {
  const { playlist, loading } = usePlaylist(params.id);
  
  if (loading) return <div>加载中...</div>;
  if (!playlist) return <div>播放列表不存在</div>;
  
  return (
    <div className="h-screen">
      <MMDPlaylist
        playlist={playlist}
        stage={{
          backgroundColor: '#000000',
          enablePhysics: true,
        }}
        showDebugInfo={false}
      />
    </div>
  );
}

// hooks/usePlaylist.ts
import { useEffect, useState } from 'react';
import { convertPlaylistToMmdConfig } from '@qhr123/sa2kit/mmd/admin';

export function usePlaylist(playlistId: string) {
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetch(`/api/mmd/playlists/${playlistId}`)
      .then(res => res.json())
      .then(data => {
        // 转换为 MMD 组件格式
        const mmdConfig = convertPlaylistToMmdConfig(data);
        setPlaylist(mmdConfig);
      })
      .finally(() => setLoading(false));
  }, [playlistId]);
  
  return { playlist, loading };
}
```

---

## 常见问题

### Q1: 如何自定义文件上传配置？

修改 `MMD_RESOURCE_TYPE_CONFIGS`：

```typescript
import { MMD_RESOURCE_TYPE_CONFIGS } from '@qhr123/sa2kit/mmd/admin';

// 修改配置
MMD_RESOURCE_TYPE_CONFIGS.model.maxFileSize = 100; // 100MB
MMD_RESOURCE_TYPE_CONFIGS.model.acceptedTypes = ['.pmx', '.pmd', '.pmm'];
```

### Q2: 如何实现权限控制？

在API路由中添加权限检查：

```typescript
export async function POST(request: NextRequest) {
  // 检查用户权限
  const user = await getCurrentUser();
  if (!user.isAdmin) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 403 }
    );
  }
  
  // 处理请求...
}
```

### Q3: 如何自定义UI样式？

所有组件都支持 Tailwind CSS 的深色模式，可以通过 `className` 自定义样式：

```typescript
<MmdAdminPanel
  className="custom-admin-panel"
  // ...
/>
```

### Q4: 文件ID到URL的映射是如何工作的？

1. 上传文件时，universalFile 返回文件ID
2. 保存到数据库时，只存储文件ID
3. 读取数据时，通过 `fileService.getFileUrl(fileId)` 获取OSS URL
4. 转换工具自动处理映射关系

### Q5: 如何处理文件不存在的情况？

使用 `validateFileUrls` 检查：

```typescript
import { validateFileUrls } from '@qhr123/sa2kit/mmd/admin';

const result = validateFileUrls(requiredFileIds, fileUrls);
if (!result.valid) {
  console.error('缺失文件:', result.missingIds);
}
```

---

## 技术支持

- 📚 完整文档：[https://github.com/qhr123/sa2kit](https://github.com/qhr123/sa2kit)
- 🐛 问题反馈：[GitHub Issues](https://github.com/qhr123/sa2kit/issues)
- 💬 社区讨论：[GitHub Discussions](https://github.com/qhr123/sa2kit/discussions)

---

## 更新日志

### v1.0.0 (2025-12-07)

- ✨ 初始版本发布
- ✅ 完整的播放列表管理功能
- ✅ 集成 UniversalFile 文件上传
- ✅ 完整的TypeScript类型定义
- ✅ Drizzle ORM 数据库Schema
- ✅ 数据转换工具函数
- ✅ React组件(MmdAdminPanel, MmdPlaylistEditor, MmdResourceSelector)

---

**Happy Coding! 🎉**

