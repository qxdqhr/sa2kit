# UniversalFile 模块集成指南

> 为新模块快速集成通用文件上传功能（支持数据库存储 + OSS上传下载）

## 📋 目录

- [快速开始](#快速开始)
- [环境准备](#环境准备)
- [数据库配置](#数据库配置)
- [服务端集成](#服务端集成)
- [前端集成](#前端集成)
- [API使用示例](#api使用示例)
- [常见场景](#常见场景)
- [故障排查](#故障排查)

---

## 🚀 快速开始

### 1. 安装依赖

```bash
# 核心依赖
pnpm add ali-oss sharp drizzle-orm

# 数据库驱动（根据使用的数据库选择）
pnpm add postgres  # PostgreSQL
# 或
pnpm add mysql2    # MySQL

# 开发依赖
pnpm add -D drizzle-kit
```

### 2. 环境变量配置

在你的 `.env` 文件中添加：

```env
# 阿里云 OSS 配置
OSS_ACCESS_KEY_ID=your_access_key_id
OSS_ACCESS_KEY_SECRET=your_access_key_secret
OSS_BUCKET=your-bucket-name
OSS_REGION=oss-cn-hangzhou
OSS_CUSTOM_DOMAIN=https://cdn.yourdomain.com  # 可选

# 数据库配置
DATABASE_URL=postgresql://user:password@localhost:5432/your_database

# 本地存储配置（备用）
UPLOAD_DIR=./uploads
BASE_URL=http://localhost:3000
```

---

## 💾 数据库配置

### 步骤 1：创建数据库表

#### 使用 Drizzle ORM（推荐）

**1.1 创建 schema 文件**

```typescript
// src/db/schema/file-storage.ts
import { pgTable, uuid, varchar, bigint, timestamp, json, integer, boolean, text, index } from 'drizzle-orm/pg-core';

/**
 * 文件元数据表
 */
export const fileMetadata = pgTable(
  'file_metadata',
  {
    // 主键
    id: uuid('id').primaryKey().defaultRandom(),
    
    // 文件信息
    originalName: varchar('original_name', { length: 500 }).notNull(),
    storedName: varchar('stored_name', { length: 500 }).notNull(),
    extension: varchar('extension', { length: 20 }),
    mimeType: varchar('mime_type', { length: 100 }).notNull(),
    size: bigint('size', { mode: 'number' }).notNull(),
    
    // 哈希值（用于去重）
    md5Hash: varchar('md5_hash', { length: 32 }).notNull(),
    sha256Hash: varchar('sha256_hash', { length: 64 }),
    
    // 存储信息
    storageProviderId: integer('storage_provider_id'),
    storagePath: text('storage_path').notNull(),
    cdnUrl: text('cdn_url'),
    
    // 业务字段
    moduleId: varchar('module_id', { length: 100 }),
    businessId: varchar('business_id', { length: 255 }),
    tags: json('tags'),
    metadata: json('metadata'),
    
    // 状态字段
    isTemporary: boolean('is_temporary').notNull().default(false),
    isDeleted: boolean('is_deleted').notNull().default(false),
    
    // 统计字段
    accessCount: integer('access_count').notNull().default(0),
    downloadCount: integer('download_count').notNull().default(0),
    
    // 用户和时间
    uploaderId: varchar('uploader_id', { length: 255 }).notNull(),
    uploadTime: timestamp('upload_time').defaultNow().notNull(),
    lastAccessTime: timestamp('last_access_time'),
    expiresAt: timestamp('expires_at'),
    
    // 审计字段
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    md5Index: index('file_metadata_md5_idx').on(table.md5Hash),
    moduleIndex: index('file_metadata_module_idx').on(table.moduleId),
    businessIndex: index('file_metadata_business_idx').on(table.businessId),
    uploaderIndex: index('file_metadata_uploader_idx').on(table.uploaderId),
    mimeTypeIndex: index('file_metadata_mime_type_idx').on(table.mimeType),
    isDeletedIndex: index('file_metadata_is_deleted_idx').on(table.isDeleted),
    uploadTimeIndex: index('file_metadata_upload_time_idx').on(table.uploadTime),
  })
);

// 导出类型
export type FileMetadata = typeof fileMetadata.$inferSelect;
export type NewFileMetadata = typeof fileMetadata.$inferInsert;
```

**1.2 生成迁移文件**

```bash
# 生成迁移
pnpm drizzle-kit generate:pg

# 执行迁移
pnpm drizzle-kit push:pg
```

#### 或使用原始 SQL

```sql
-- PostgreSQL
CREATE TABLE file_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_name VARCHAR(500) NOT NULL,
    stored_name VARCHAR(500) NOT NULL,
    extension VARCHAR(20),
    mime_type VARCHAR(100) NOT NULL,
    size BIGINT NOT NULL,
    md5_hash VARCHAR(32) NOT NULL,
    sha256_hash VARCHAR(64),
    storage_provider_id INTEGER,
    storage_path TEXT NOT NULL,
    cdn_url TEXT,
    module_id VARCHAR(100),
    business_id VARCHAR(255),
    tags JSONB,
    metadata JSONB,
    is_temporary BOOLEAN NOT NULL DEFAULT FALSE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    access_count INTEGER NOT NULL DEFAULT 0,
    download_count INTEGER NOT NULL DEFAULT 0,
    uploader_id VARCHAR(255) NOT NULL,
    upload_time TIMESTAMP NOT NULL DEFAULT NOW(),
    last_access_time TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- 创建索引
CREATE INDEX file_metadata_md5_idx ON file_metadata(md5_hash);
CREATE INDEX file_metadata_module_idx ON file_metadata(module_id);
CREATE INDEX file_metadata_business_idx ON file_metadata(business_id);
CREATE INDEX file_metadata_uploader_idx ON file_metadata(uploader_id);
CREATE INDEX file_metadata_mime_type_idx ON file_metadata(mime_type);
CREATE INDEX file_metadata_is_deleted_idx ON file_metadata(is_deleted);
CREATE INDEX file_metadata_upload_time_idx ON file_metadata(upload_time);
```

---

## 🔧 服务端集成

### 步骤 2：创建文件服务

```typescript
// src/services/file-service.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import {
  createUniversalFileService,
  createDrizzleRepository,
  UniversalFileService,
} from '@qhr123/sa2kit/universalFile/server';
import { fileMetadata } from '@/db/schema/file-storage';

// 1. 创建数据库连接
const queryClient = postgres(process.env.DATABASE_URL!);
const db = drizzle(queryClient);

// 2. 创建文件仓储
const fileRepository = createDrizzleRepository({
  db,
  table: fileMetadata,
  fieldMapping: {
    // 如果你的表字段名不同，可以在这里映射
    // originalName: 'original_filename',
  },
});

// 3. 创建文件服务实例
export const universalFileService = createUniversalFileService({
  // 存储配置 - 阿里云 OSS
  storage: {
    type: 'aliyun-oss',
    enabled: true,
    region: process.env.OSS_REGION!,
    bucket: process.env.OSS_BUCKET!,
    accessKeyId: process.env.OSS_ACCESS_KEY_ID!,
    accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET!,
    customDomain: process.env.OSS_CUSTOM_DOMAIN, // 可选
    secure: true, // 使用 HTTPS
  },

  // CDN 配置（可选）
  cdn: {
    type: 'aliyun-cdn',
    enabled: false, // 如果不需要 CDN 加速，设为 false
  },

  // 缓存配置
  cache: {
    enabled: true,
    metadataTTL: 3600, // 元数据缓存 1 小时
    urlTTL: 1800, // URL 缓存 30 分钟
  },

  // 数据库持久化配置（重要！）
  persistence: {
    enabled: true,
    repository: fileRepository,
    autoPersist: true, // 自动保存到数据库
  },

  // 文件限制
  maxFileSize: 100 * 1024 * 1024, // 100MB
  allowedMimeTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'audio/mpeg',
    'application/pdf',
  ],

  // 启用监控
  enableMonitoring: true,
});

// 4. 初始化服务
export async function initFileService() {
  await universalFileService.initialize();
  console.log('✅ 文件服务初始化完成');
}

// 5. 导出单例
export default universalFileService;
```

### 步骤 3：创建 API 路由

#### Next.js App Router 示例

```typescript
// app/api/files/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { universalFileService } from '@/services/file-service';

/**
 * 文件上传 API
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 解析表单数据
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const moduleId = formData.get('moduleId') as string;
    const businessId = formData.get('businessId') as string;
    const userId = request.headers.get('x-user-id') || 'anonymous';

    if (!file) {
      return NextResponse.json(
        { success: false, error: '请选择文件' },
        { status: 400 }
      );
    }

    // 2. 上传文件（会自动保存到 OSS 和数据库）
    const metadata = await universalFileService.uploadFile(
      {
        file,
        moduleId,
        businessId,
        permission: 'public', // public | private | authenticated
        metadata: {
          uploadedBy: userId,
          source: 'web',
        },
      },
      'aliyun-oss' // 指定使用 OSS 存储
    );

    // 3. 返回文件信息
    return NextResponse.json({
      success: true,
      file: {
        id: metadata.id,
        originalName: metadata.originalName,
        url: await universalFileService.getFileUrl(metadata.id),
        cdnUrl: metadata.cdnUrl,
        size: metadata.size,
        mimeType: metadata.mimeType,
        uploadTime: metadata.uploadTime,
      },
    });
  } catch (error) {
    console.error('文件上传失败:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '上传失败' 
      },
      { status: 500 }
    );
  }
}
```

```typescript
// app/api/files/[fileId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { universalFileService } from '@/services/file-service';

/**
 * 获取文件信息
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const fileId = params.fileId;
    
    // 从数据库获取文件元数据
    const metadata = await universalFileService.getFileMetadata(fileId);
    
    if (!metadata) {
      return NextResponse.json(
        { success: false, error: '文件不存在' },
        { status: 404 }
      );
    }

    // 生成访问 URL（支持过期时间）
    const url = await universalFileService.getFileUrl(fileId, undefined, 3600);

    return NextResponse.json({
      success: true,
      file: {
        ...metadata,
        url,
      },
    });
  } catch (error) {
    console.error('获取文件失败:', error);
    return NextResponse.json(
      { success: false, error: '获取失败' },
      { status: 500 }
    );
  }
}

/**
 * 删除文件
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const fileId = params.fileId;
    const userId = request.headers.get('x-user-id');

    // 删除文件（会从 OSS 和数据库中删除）
    await universalFileService.deleteFile(fileId, userId || undefined);

    return NextResponse.json({
      success: true,
      message: '文件已删除',
    });
  } catch (error) {
    console.error('删除文件失败:', error);
    return NextResponse.json(
      { success: false, error: '删除失败' },
      { status: 500 }
    );
  }
}
```

```typescript
// app/api/files/query/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { universalFileService } from '@/services/file-service';

/**
 * 查询文件列表
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // 查询参数
    const queryOptions = {
      moduleId: searchParams.get('moduleId') || undefined,
      businessId: searchParams.get('businessId') || undefined,
      uploaderId: searchParams.get('uploaderId') || undefined,
      mimeType: searchParams.get('mimeType') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      pageSize: parseInt(searchParams.get('pageSize') || '20'),
    };

    // 从数据库查询
    const result = await universalFileService.queryFiles(queryOptions);

    return NextResponse.json({
      success: true,
      items: result.items,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
      hasNext: result.hasNext,
      hasPrev: result.hasPrev,
    });
  } catch (error) {
    console.error('查询文件失败:', error);
    return NextResponse.json(
      { success: false, error: '查询失败' },
      { status: 500 }
    );
  }
}
```

---

## 🎨 前端集成

### 步骤 4：使用上传组件

```typescript
// app/your-module/page.tsx
'use client';

import { useState } from 'react';
import { FileUploader } from '@qhr123/sa2kit/universalFile/components';
import { createFileClient } from '@qhr123/sa2kit/universalFile';
import type { FileMetadata, UploadProgress } from '@qhr123/sa2kit/universalFile';

// 创建客户端实例
const fileClient = createFileClient({
  baseUrl: '', // API 前缀，默认为空
});

export default function YourModulePage() {
  const [uploadedFiles, setUploadedFiles] = useState<FileMetadata[]>([]);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);

  // 上传成功回调
  const handleUploadSuccess = (files: FileMetadata[]) => {
    console.log('✅ 上传成功:', files);
    setUploadedFiles((prev) => [...prev, ...files]);
  };

  // 上传失败回调
  const handleUploadError = (error: string) => {
    console.error('❌ 上传失败:', error);
    alert(`上传失败: ${error}`);
  };

  // 上传进度回调
  const handleProgress = (progress: UploadProgress[]) => {
    setUploadProgress(progress);
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">文件上传</h1>

      {/* 文件上传组件 */}
      <FileUploader
        fileService={fileClient as any}
        moduleId="your-module"
        businessId="business-123"
        acceptedTypes={['image/jpeg', 'image/png', 'image/gif', 'image/webp']}
        maxFileSize={10} // 10MB
        maxFiles={5}
        multiple={true}
        onUploadSuccess={handleUploadSuccess}
        onUploadError={handleUploadError}
        onProgress={handleProgress}
        mode="detailed"
      />

      {/* 已上传文件列表 */}
      {uploadedFiles.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">已上传文件</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                className="border rounded-lg p-4 hover:shadow-lg transition-shadow"
              >
                <img
                  src={file.cdnUrl || file.storagePath}
                  alt={file.originalName}
                  className="w-full h-48 object-cover rounded"
                />
                <p className="mt-2 text-sm font-medium truncate">
                  {file.originalName}
                </p>
                <p className="text-xs text-gray-500">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

### 步骤 5：直接使用客户端 SDK

```typescript
// 场景：表单中上传单个文件
import { universalFileClient } from '@qhr123/sa2kit/universalFile';

async function handleFormSubmit(formData: FormData) {
  try {
    const file = formData.get('avatar') as File;

    // 上传文件
    const metadata = await universalFileClient.uploadFile(
      {
        file,
        moduleId: 'user-profile',
        businessId: 'user-456',
        permission: 'private',
      },
      (progress) => {
        console.log('上传进度:', progress.progress + '%');
      }
    );

    console.log('✅ 上传成功:', metadata);
    
    // 获取访问 URL
    const url = await universalFileClient.getFileUrl(metadata.id);
    console.log('文件 URL:', url);

    return metadata;
  } catch (error) {
    console.error('❌ 上传失败:', error);
    throw error;
  }
}
```

---

## 📖 API 使用示例

### 查询文件列表

```typescript
// 查询某个业务的所有图片
const result = await universalFileService.queryFiles({
  moduleId: 'blog',
  businessId: 'post-123',
  mimeType: 'image/%', // 模糊匹配
  page: 1,
  pageSize: 20,
});

console.log('总计:', result.total);
console.log('文件列表:', result.items);
```

### 获取文件下载 URL

```typescript
// 生成一个 1 小时有效的下载链接
const downloadUrl = await universalFileService.getFileUrl(
  fileId,
  userId, // 用于权限检查
  3600    // 过期时间（秒）
);

console.log('下载链接:', downloadUrl);
```

### 批量删除文件

```typescript
const result = await universalFileService.batchDeleteFiles(
  ['file-id-1', 'file-id-2', 'file-id-3'],
  userId
);

console.log('成功:', result.successCount);
console.log('失败:', result.failureCount);
console.log('失败详情:', result.failures);
```

### 监听文件事件

```typescript
// 监听上传完成事件
universalFileService.on('upload:complete', (event) => {
  console.log('文件上传完成:', event);
  // 发送通知、更新状态等
});

// 监听上传错误
universalFileService.on('upload:error', (event) => {
  console.error('上传错误:', event);
  // 错误处理、重试等
});

// 监听文件删除
universalFileService.on('delete:complete', (event) => {
  console.log('文件已删除:', event);
});
```

---

## 🎯 常见场景

### 场景 1：用户头像上传

```typescript
// app/api/user/avatar/route.ts
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('avatar') as File;
  const userId = request.headers.get('x-user-id')!;

  // 上传头像
  const metadata = await universalFileService.uploadFile({
    file,
    moduleId: 'user-profile',
    businessId: userId,
    permission: 'public',
    metadata: {
      type: 'avatar',
      userId,
    },
  });

  // 更新用户表
  await db
    .update(users)
    .set({ avatarUrl: metadata.cdnUrl })
    .where(eq(users.id, userId));

  return NextResponse.json({ success: true, avatarUrl: metadata.cdnUrl });
}
```

### 场景 2：博客文章图片

```typescript
// 上传文章图片
const metadata = await universalFileService.uploadFile({
  file: imageFile,
  moduleId: 'blog',
  businessId: postId,
  permission: 'public',
  needsProcessing: true, // 开启图片处理
  processingOptions: {
    type: 'image',
    quality: 85,
    width: 1200,
    format: 'webp',
  },
});

// 保存到文章内容
const imageUrl = metadata.cdnUrl || metadata.storagePath;
const content = `![图片](${imageUrl})`;
```

### 场景 3：视频课程资源

```typescript
// 上传课程视频
const metadata = await universalFileService.uploadFile({
  file: videoFile,
  moduleId: 'course',
  businessId: courseId,
  permission: 'authenticated', // 需要登录才能访问
  metadata: {
    courseId,
    lessonId,
    duration: videoDuration,
  },
});

// 查询课程所有视频
const videos = await universalFileService.queryFiles({
  moduleId: 'course',
  businessId: courseId,
  mimeType: 'video/mp4',
});
```

### 场景 4：临时文件（自动清理）

```typescript
// 上传临时文件（24小时后过期）
const metadata = await universalFileService.uploadFile({
  file: tempFile,
  moduleId: 'temp',
  permission: 'private',
  metadata: {
    isTemporary: true,
  },
});

// 设置过期时间
const expiresAt = new Date();
expiresAt.setHours(expiresAt.getHours() + 24);

await db
  .update(fileMetadata)
  .set({ expiresAt, isTemporary: true })
  .where(eq(fileMetadata.id, metadata.id));
```

---

## 🔍 故障排查

### 问题 1：OSS 上传失败

**症状**: `StorageProviderError: 阿里云OSS初始化失败`

**解决方案**:
```bash
# 1. 检查环境变量
echo $OSS_ACCESS_KEY_ID
echo $OSS_ACCESS_KEY_SECRET

# 2. 检查 OSS 配置
# - Region 是否正确（如：oss-cn-hangzhou）
# - Bucket 是否存在
# - AccessKey 是否有权限

# 3. 检查网络连接
ping oss-cn-hangzhou.aliyuncs.com
```

### 问题 2：数据库连接失败

**症状**: `数据库查询失败`

**解决方案**:
```typescript
// 测试数据库连接
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client);

// 测试查询
const result = await db.select().from(fileMetadata).limit(1);
console.log('数据库连接正常:', result);
```

### 问题 3：文件上传后找不到

**症状**: 前端上传成功，但数据库查询不到

**解决方案**:
```typescript
// 检查持久化配置
const service = createUniversalFileService({
  persistence: {
    enabled: true,           // ✅ 必须启用
    repository: fileRepo,    // ✅ 必须配置
    autoPersist: true,       // ✅ 自动保存
  },
});

// 手动检查
const metadata = await service.getFileMetadata(fileId);
console.log('数据库记录:', metadata);
```

### 问题 4：CDN URL 不生效

**症状**: `cdnUrl` 字段为空

**解决方案**:
```typescript
// 检查 CDN 配置
const service = createUniversalFileService({
  cdn: {
    type: 'aliyun-cdn',
    enabled: true,  // ✅ 必须启用
    domain: 'https://cdn.yourdomain.com',
  },
});

// 或使用自定义域名
const service = createUniversalFileService({
  storage: {
    type: 'aliyun-oss',
    customDomain: 'https://cdn.yourdomain.com',  // ✅ OSS 自定义域名
  },
});
```

---

## 📚 进阶配置

### 多存储提供者

```typescript
// 同时支持本地存储和 OSS（本地开发 + 生产环境）
const service = createUniversalFileService({
  storage: {
    type: process.env.NODE_ENV === 'production' ? 'aliyun-oss' : 'local',
    enabled: true,
    // ... 配置
  },
});
```

### 图片自动处理

```typescript
// 上传时自动生成缩略图和 WebP 格式
const metadata = await service.uploadFile({
  file: imageFile,
  moduleId: 'gallery',
  needsProcessing: true,
  processingOptions: {
    type: 'image',
    quality: 85,
    width: 1200,
    format: 'webp',
    watermark: true,
    watermarkOptions: {
      text: '© Your Brand',
      position: 'bottom-right',
      opacity: 0.5,
    },
  },
});
```

### 自定义仓储适配器

```typescript
// 适配自定义表结构
const customRepo = createDrizzleRepository({
  db,
  table: myCustomFileTable,
  fieldMapping: {
    originalName: 'file_name',
    storagePath: 'path',
    uploaderId: 'user_id',
    // ... 更多映射
  },
});
```

---

## ✅ 集成检查清单

- [ ] 安装所需依赖（ali-oss, drizzle-orm, sharp）
- [ ] 配置环境变量（OSS、数据库）
- [ ] 创建数据库表（fileMetadata）
- [ ] 创建文件服务实例
- [ ] 配置持久化仓储
- [ ] 创建上传 API 路由
- [ ] 测试文件上传功能
- [ ] 测试文件查询功能
- [ ] 测试文件删除功能
- [ ] 配置 CDN（可选）
- [ ] 配置缓存（可选）
- [ ] 添加监控和日志

---

## 🆘 获取帮助

- **文档**: [src/universalFile/README.md](./README.md)
- **示例**: [examples/app/universal-file](../../examples/app/universal-file)
- **类型定义**: [src/universalFile/types.ts](./types.ts)
- **问题反馈**: 提交 Issue

---

## 📝 许可证

MIT License © 2024
