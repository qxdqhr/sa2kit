# MMD后台管理系统 - 快速参考

## 🎯 核心功能

已完成的MMD后台管理系统包括：

### ✅ 数据库设计
- **4个核心表**：播放列表、播放节点、资源选项、预设项
- **完整索引**：优化查询性能
- **软删除支持**：数据安全
- **关系定义**：Drizzle ORM relations

### ✅ 类型系统
- **数据库类型**：MmdPlaylistDB, MmdPlaylistNodeDB等
- **前端类型**：MmdPlaylistWithFiles（含URL映射）
- **API类型**：请求/响应接口
- **转换类型**：数据转换函数类型

### ✅ 核心组件
1. **MmdAdminPanel** - 主管理面板
2. **MmdPlaylistEditor** - 播放列表编辑器
3. **MmdResourceSelector** - 资源选择器（含文件上传）

### ✅ 工具函数
- **文件ID提取**：extractFileIdsFromPlaylist
- **格式转换**：convertPlaylistToFrontend
- **MMD格式**：convertPlaylistToMmdConfig
- **验证工具**：validateFileUrls

## 📂 文件结构

```
src/mmd/
├── admin/
│   ├── components/
│   │   ├── MmdAdminPanel.tsx         # 主面板
│   │   ├── MmdPlaylistEditor.tsx     # 编辑器
│   │   └── MmdResourceSelector.tsx   # 选择器
│   ├── types.ts                      # 类型定义
│   ├── utils.ts                      # 工具函数
│   └── index.ts                      # 统一导出
├── server/
│   └── drizzle-schema.ts             # 数据库Schema
└── types.ts                          # MMD组件类型

docs/
└── MMD_ADMIN_GUIDE.md                # 完整文档
```

## 🚀 快速使用

### 1. 导入组件

```typescript
import { MmdAdminPanel } from '@qhr123/sa2kit/mmd/admin';
import { createUniversalFileService } from '@qhr123/sa2kit/universalFile/server';
```

### 2. 使用管理面板

```typescript
const fileService = createUniversalFileService({
  storage: 'aliyun-oss',
  oss: { /* OSS配置 */ }
});

<MmdAdminPanel
  fileService={fileService}
  userId="user-123"
  apiBaseUrl="/api/mmd"
/>
```

### 3. 数据转换

```typescript
import { 
  convertPlaylistToFrontend,
  convertPlaylistToMmdConfig 
} from '@qhr123/sa2kit/mmd/admin';

// 数据库 → 前端
const playlistWithFiles = convertPlaylistToFrontend(dbPlaylist, dbNodes, fileUrls);

// 前端 → MMD组件
const mmdConfig = convertPlaylistToMmdConfig(playlistWithFiles);
```

### 4. 在播放器中使用

```typescript
<MMDPlaylist
  playlist={mmdConfig}  // 转换后的配置
  stage={stageConfig}
/>
```

## 💾 数据库迁移

```bash
# 1. 导入Schema
import { mmdPlaylists, mmdPlaylistNodes } from '@qhr123/sa2kit/mmd/admin';

# 2. 生成迁移
drizzle-kit generate:pg

# 3. 执行迁移
drizzle-kit push:pg
```

## 🔄 数据流

```
用户操作
  ↓
MmdPlaylistEditor
  ↓
API保存 (文件ID)
  ↓
数据库 (mmd_playlists + mmd_playlist_nodes)
  ↓
API读取
  ↓
convertPlaylistToFrontend (ID → URL)
  ↓
convertPlaylistToMmdConfig
  ↓
MMDPlaylist组件
```

## 🎨 资源类型配置

```typescript
MMD_RESOURCE_TYPE_CONFIGS = {
  model: { 
    acceptedTypes: ['.pmx', '.pmd'], 
    maxFileSize: 50MB 
  },
  motion: { 
    acceptedTypes: ['.vmd'], 
    maxFileSize: 20MB 
  },
  audio: { 
    acceptedTypes: ['.mp3', '.wav', '.ogg', '.m4a'], 
    maxFileSize: 20MB 
  },
  // ...
}
```

## 📊 数据库表关系

```
mmd_playlists (播放列表)
  ├── 1:N → mmd_playlist_nodes (播放节点)
  │         ├── → file_metadata (模型文件)
  │         ├── → file_metadata (动作文件)
  │         ├── → file_metadata (音频文件)
  │         └── → file_metadata (其他文件)
  └── → file_metadata (缩略图)

mmd_resource_options (资源选项)
  └── → file_metadata (资源文件)

mmd_preset_items (预设项)
  ├── → file_metadata (模型文件)
  ├── → file_metadata (动作文件)
  └── → file_metadata (其他文件)
```

## 🔑 关键特性

### 文件ID映射
- **存储**：数据库只存文件ID（UUID）
- **读取**：自动转换为OSS URL
- **优势**：文件迁移不影响业务数据

### 组件化设计
- **独立使用**：每个组件可单独使用
- **组合使用**：通过MmdAdminPanel整合
- **易扩展**：可自定义样式和行为

### 类型安全
- **完整类型**：TypeScript全覆盖
- **转换安全**：类型推导保证正确性
- **IDE友好**：完整的智能提示

## 📝 提交记录

```
8ff14d3 ✨ 添加MMD后台管理系统
9c83385 ✨ 添加列表循环功能开关
b9861a3 🐛 修复统计信息 - 正确计算运行时间和模型加载次数
4e9924f 🔥 修复清理时序问题 - 在Ammo加载后再清理
```

## 📚 文档

完整文档：`docs/MMD_ADMIN_GUIDE.md`

包含：
- 功能概述
- 数据库设计
- 快速开始
- 组件使用
- API集成
- 数据转换
- 完整示例
- 常见问题

---

**所有功能已完成！可以开始使用了！** 🎉

提交：commit 8ff14d3

