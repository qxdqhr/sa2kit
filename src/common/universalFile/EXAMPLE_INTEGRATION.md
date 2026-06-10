# UniversalFile 模块实战示例

> 真实项目中的完整集成代码示例

## 📁 项目结构

```
your-project/
├── src/
│   ├── db/
│   │   ├── schema/
│   │   │   └── file-storage.ts          # 数据库表定义
│   │   └── index.ts                     # 数据库连接
│   ├── services/
│   │   └── file-service.ts              # 文件服务初始化
│   ├── app/
│   │   ├── api/
│   │   │   └── files/
│   │   │       ├── upload/
│   │   │       │   └── route.ts         # 上传 API
│   │   │       ├── [fileId]/
│   │   │       │   └── route.ts         # 单文件操作 API
│   │   │       └── query/
│   │   │           └── route.ts         # 查询 API
│   │   └── gallery/
│   │       └── page.tsx                 # 前端页面示例
│   └── lib/
│       └── file-utils.ts                # 工具函数
├── .env                                 # 环境变量
└── drizzle.config.ts                    # Drizzle 配置
```

---

## 1️⃣ 数据库配置

### `src/db/schema/file-storage.ts`

```typescript
import {
  pgTable,
  uuid,
  varchar,
  bigint,
  timestamp,
  json,
  integer,
  boolean,
  text,
  index,
} from 'drizzle-orm/pg-core';

/**
 * 文件元数据表
 * 完整的企业级字段设计
 */
export const fileMetadata = pgTable(
  'file_metadata',
  {
    // ========== 主键 ==========
    id: uuid('id').primaryKey().defaultRandom(),

    // ========== 文件基本信息 ==========
    /** 原始文件名（用户上传时的文件名） */
    originalName: varchar('original_name', { length: 500 }).notNull(),
    
    /** 存储文件名（系统生成的唯一文件名） */
    storedName: varchar('stored_name', { length: 500 }).notNull(),
    
    /** 文件扩展名（如：.jpg, .pdf） */
    extension: varchar('extension', { length: 20 }),
    
    /** MIME 类型（如：image/jpeg） */
    mimeType: varchar('mime_type', { length: 100 }).notNull(),
    
    /** 文件大小（字节） */
    size: bigint('size', { mode: 'number' }).notNull(),

    // ========== 文件校验 ==========
    /** MD5 哈希（用于去重和完整性校验） */
    md5Hash: varchar('md5_hash', { length: 32 }).notNull(),
    
    /** SHA256 哈希（增强安全性） */
    sha256Hash: varchar('sha256_hash', { length: 64 }),

    // ========== 存储信息 ==========
    /** 存储提供者 ID（关联 storage_providers 表） */
    storageProviderId: integer('storage_provider_id'),
    
    /** 存储路径（OSS 上的完整路径） */
    storagePath: text('storage_path').notNull(),
    
    /** CDN 访问 URL（加速访问） */
    cdnUrl: text('cdn_url'),

    // ========== 业务关联 ==========
    /** 模块 ID（如：blog, user-profile, course） */
    moduleId: varchar('module_id', { length: 100 }),
    
    /** 业务 ID（如：post-123, user-456） */
    businessId: varchar('business_id', { length: 255 }),
    
    /** 文件标签（JSON 数组，如：["头像", "封面"]） */
    tags: json('tags').$type<string[]>(),
    
    /** 自定义元数据（JSON 对象） */
    metadata: json('metadata').$type<Record<string, any>>(),

    // ========== 状态字段 ==========
    /** 是否为临时文件（临时文件会定期清理） */
    isTemporary: boolean('is_temporary').notNull().default(false),
    
    /** 是否已删除（软删除） */
    isDeleted: boolean('is_deleted').notNull().default(false),

    // ========== 统计字段 ==========
    /** 访问次数 */
    accessCount: integer('access_count').notNull().default(0),
    
    /** 下载次数 */
    downloadCount: integer('download_count').notNull().default(0),

    // ========== 用户和权限 ==========
    /** 上传者 ID */
    uploaderId: varchar('uploader_id', { length: 255 }).notNull(),
    
    /** 上传时间 */
    uploadTime: timestamp('upload_time').defaultNow().notNull(),
    
    /** 最后访问时间 */
    lastAccessTime: timestamp('last_access_time'),
    
    /** 过期时间（自动清理） */
    expiresAt: timestamp('expires_at'),

    // ========== 审计字段 ==========
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    // 性能优化索引
    md5Index: index('file_metadata_md5_idx').on(table.md5Hash),
    moduleIndex: index('file_metadata_module_idx').on(table.moduleId),
    businessIndex: index('file_metadata_business_idx').on(table.businessId),
    uploaderIndex: index('file_metadata_uploader_idx').on(table.uploaderId),
    mimeTypeIndex: index('file_metadata_mime_type_idx').on(table.mimeType),
    isDeletedIndex: index('file_metadata_is_deleted_idx').on(table.isDeleted),
    uploadTimeIndex: index('file_metadata_upload_time_idx').on(table.uploadTime),
    
    // 复合索引（高频查询优化）
    moduleBusinessIdx: index('file_metadata_module_business_idx').on(
      table.moduleId,
      table.businessId,
      table.isDeleted
    ),
  })
);

// TypeScript 类型导出
export type FileMetadata = typeof fileMetadata.$inferSelect;
export type NewFileMetadata = typeof fileMetadata.$inferInsert;
```

### `src/db/index.ts`

```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema/file-storage';

// 创建数据库连接
const queryClient = postgres(process.env.DATABASE_URL!);

// 创建 Drizzle 实例
export const db = drizzle(queryClient, { schema });

// 导出类型
export type Database = typeof db;
```

---

## 2️⃣ 文件服务初始化

### `src/services/file-service.ts`

```typescript
import { db } from '@/db';
import { fileMetadata } from '@/db/schema/file-storage';
import {
  createUniversalFileService,
  createDrizzleRepository,
  type UniversalFileService,
} from '@qhr123/sa2kit/universalFile/server';

/**
 * 创建文件仓储
 */
const fileRepository = createDrizzleRepository({
  db,
  table: fileMetadata,
  // 如果表字段名与 FileMetadata 不同，可以在这里映射
  fieldMapping: {
    // 示例：如果数据库列名是 original_filename
    // originalName: 'original_filename',
  },
});

/**
 * 文件服务配置
 */
const fileServiceConfig = {
  // ========== 存储配置 ==========
  storage: {
    type: 'aliyun-oss' as const,
    enabled: true,
    region: process.env.OSS_REGION || 'oss-cn-hangzhou',
    bucket: process.env.OSS_BUCKET!,
    accessKeyId: process.env.OSS_ACCESS_KEY_ID!,
    accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET!,
    customDomain: process.env.OSS_CUSTOM_DOMAIN,
    secure: true,
    internal: false, // 使用公网访问
  },

  // ========== CDN 配置（可选） ==========
  cdn: {
    type: 'aliyun-cdn' as const,
    enabled: false, // 生产环境建议开启
    domain: process.env.CDN_DOMAIN,
  },

  // ========== 缓存配置 ==========
  cache: {
    enabled: true,
    metadataTTL: 3600, // 元数据缓存 1 小时
    urlTTL: 1800, // URL 缓存 30 分钟
    maxSize: 1000, // 最大缓存条目数
  },

  // ========== 持久化配置（重要！） ==========
  persistence: {
    enabled: true,
    repository: fileRepository,
    autoPersist: true, // 自动保存到数据库
    cacheFirst: false, // 查询时优先从数据库获取
  },

  // ========== 文件处理器（可选） ==========
  processors: [
    'image', // 图片处理
    // 'audio',  // 音频处理
    // 'video',  // 视频处理
  ] as const,

  // ========== 文件限制 ==========
  maxFileSize: 100 * 1024 * 1024, // 100MB
  allowedMimeTypes: [
    // 图片
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    // 视频
    'video/mp4',
    'video/quicktime',
    // 音频
    'audio/mpeg',
    'audio/mp3',
    // 文档
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],

  // ========== 监控配置 ==========
  enableMonitoring: true,
};

/**
 * 文件服务实例（单例）
 */
let fileServiceInstance: UniversalFileService | null = null;

/**
 * 获取文件服务实例
 */
export function getFileService(): UniversalFileService {
  if (!fileServiceInstance) {
    fileServiceInstance = createUniversalFileService(fileServiceConfig);
  }
  return fileServiceInstance;
}

/**
 * 初始化文件服务
 */
export async function initFileService() {
  try {
    console.log('🚀 正在初始化文件服务...');
    
    const service = getFileService();
    await service.initialize();
    
    console.log('✅ 文件服务初始化完成');
    
    // 设置事件监听器
    setupFileEventListeners(service);
    
    return service;
  } catch (error) {
    console.error('❌ 文件服务初始化失败:', error);
    throw error;
  }
}

/**
 * 设置文件事件监听器
 */
function setupFileEventListeners(service: UniversalFileService) {
  // 上传完成
  service.on('upload:complete', (event) => {
    console.log('📤 文件上传完成:', {
      fileId: event.fileId,
      fileName: event.data?.fileName,
      size: event.data?.size,
      uploadTime: event.data?.uploadTime,
    });
  });

  // 上传错误
  service.on('upload:error', (event) => {
    console.error('❌ 文件上传失败:', {
      fileId: event.fileId,
      error: event.error,
    });
  });

  // 文件删除
  service.on('delete:complete', (event) => {
    console.log('🗑️ 文件已删除:', event.fileId);
  });

  // 处理完成
  service.on('processing:complete', (event) => {
    console.log('⚙️ 文件处理完成:', {
      fileId: event.fileId,
      result: event.data,
    });
  });
}

// 默认导出
export const fileService = getFileService();
export default fileService;
```

---

## 3️⃣ API 路由实现

### `app/api/files/upload/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { fileService } from '@/services/file-service';
import { z } from 'zod';

/**
 * 上传文件 API
 * POST /api/files/upload
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 解析 FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const moduleId = formData.get('moduleId') as string;
    const businessId = formData.get('businessId') as string;
    const permission = (formData.get('permission') as string) || 'public';
    const needsProcessing = formData.get('needsProcessing') === 'true';

    // 2. 验证参数
    if (!file) {
      return NextResponse.json(
        { success: false, error: '请选择文件' },
        { status: 400 }
      );
    }

    if (!moduleId) {
      return NextResponse.json(
        { success: false, error: '缺少 moduleId 参数' },
        { status: 400 }
      );
    }

    // 3. 获取用户信息（从 session/token）
    const userId = request.headers.get('x-user-id') || 'anonymous';

    // 4. 解析处理选项
    let processingOptions;
    if (needsProcessing) {
      const optionsStr = formData.get('processingOptions') as string;
      if (optionsStr) {
        processingOptions = JSON.parse(optionsStr);
      }
    }

    // 5. 上传文件
    console.log('📤 开始上传文件:', {
      fileName: file.name,
      size: file.size,
      type: file.type,
      moduleId,
      businessId,
    });

    const startTime = Date.now();

    const metadata = await fileService.uploadFile(
      {
        file,
        moduleId,
        businessId,
        permission: permission as any,
        needsProcessing,
        processingOptions,
        metadata: {
          uploadedBy: userId,
          source: 'web',
          userAgent: request.headers.get('user-agent'),
          ip: request.headers.get('x-real-ip') || request.headers.get('x-forwarded-for'),
        },
      },
      'aliyun-oss'
    );

    const uploadTime = Date.now() - startTime;

    // 6. 生成访问 URL
    const accessUrl = await fileService.getFileUrl(metadata.id);

    // 7. 返回成功响应
    return NextResponse.json({
      success: true,
      file: {
        id: metadata.id,
        originalName: metadata.originalName,
        size: metadata.size,
        mimeType: metadata.mimeType,
        extension: metadata.extension,
        url: accessUrl,
        cdnUrl: metadata.cdnUrl,
        storagePath: metadata.storagePath,
        uploadTime: metadata.uploadTime,
        hash: metadata.hash,
      },
      meta: {
        uploadTimeMs: uploadTime,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('❌ 文件上传失败:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '上传失败',
        details: process.env.NODE_ENV === 'development' ? error : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * 获取上传配置
 * GET /api/files/upload
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    config: {
      maxFileSize: 100 * 1024 * 1024, // 100MB
      allowedTypes: [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'video/mp4',
        'audio/mpeg',
        'application/pdf',
      ],
      storageType: 'aliyun-oss',
      cdnEnabled: false,
    },
  });
}
```

### `app/api/files/[fileId]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { fileService } from '@/services/file-service';

/**
 * 获取文件信息
 * GET /api/files/:fileId
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const { fileId } = params;

    // 1. 获取文件元数据（从数据库）
    const metadata = await fileService.getFileMetadata(fileId);

    if (!metadata) {
      return NextResponse.json(
        { success: false, error: '文件不存在' },
        { status: 404 }
      );
    }

    // 2. 检查权限（根据需要实现）
    const userId = request.headers.get('x-user-id');
    if (metadata.permission === 'private' && metadata.uploaderId !== userId) {
      return NextResponse.json(
        { success: false, error: '无权访问此文件' },
        { status: 403 }
      );
    }

    // 3. 生成访问 URL（带过期时间）
    const expiresIn = parseInt(request.nextUrl.searchParams.get('expiresIn') || '3600');
    const url = await fileService.getFileUrl(fileId, userId || undefined, expiresIn);

    // 4. 返回文件信息
    return NextResponse.json({
      success: true,
      file: {
        ...metadata,
        url,
      },
    });
  } catch (error) {
    console.error('❌ 获取文件信息失败:', error);
    return NextResponse.json(
      { success: false, error: '获取失败' },
      { status: 500 }
    );
  }
}

/**
 * 删除文件
 * DELETE /api/files/:fileId
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const { fileId } = params;
    const userId = request.headers.get('x-user-id');

    // 1. 获取文件信息
    const metadata = await fileService.getFileMetadata(fileId);

    if (!metadata) {
      return NextResponse.json(
        { success: false, error: '文件不存在' },
        { status: 404 }
      );
    }

    // 2. 权限检查（只有上传者可以删除）
    if (metadata.uploaderId !== userId) {
      return NextResponse.json(
        { success: false, error: '无权删除此文件' },
        { status: 403 }
      );
    }

    // 3. 删除文件（从 OSS 和数据库）
    await fileService.deleteFile(fileId, userId || undefined);

    // 4. 返回成功
    return NextResponse.json({
      success: true,
      message: '文件已删除',
    });
  } catch (error) {
    console.error('❌ 删除文件失败:', error);
    return NextResponse.json(
      { success: false, error: '删除失败' },
      { status: 500 }
    );
  }
}

/**
 * 下载文件
 * GET /api/files/:fileId/download
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const { fileId } = params;
    const userId = request.headers.get('x-user-id');

    // 1. 下载文件（返回 Buffer）
    const fileBuffer = await fileService.downloadFile(fileId, userId || undefined);

    // 2. 获取文件元数据
    const metadata = await fileService.getFileMetadata(fileId);

    if (!metadata) {
      return NextResponse.json(
        { success: false, error: '文件不存在' },
        { status: 404 }
      );
    }

    // 3. 返回文件流
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': metadata.mimeType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(metadata.originalName)}"`,
        'Content-Length': metadata.size.toString(),
      },
    });
  } catch (error) {
    console.error('❌ 下载文件失败:', error);
    return NextResponse.json(
      { success: false, error: '下载失败' },
      { status: 500 }
    );
  }
}
```

### `app/api/files/query/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { fileService } from '@/services/file-service';

/**
 * 查询文件列表
 * GET /api/files/query
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // 1. 构建查询参数
    const queryOptions = {
      moduleId: searchParams.get('moduleId') || undefined,
      businessId: searchParams.get('businessId') || undefined,
      uploaderId: searchParams.get('uploaderId') || undefined,
      mimeType: searchParams.get('mimeType') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      pageSize: parseInt(searchParams.get('pageSize') || '20'),
      orderBy: searchParams.get('orderBy') || 'uploadTime',
      orderDirection: (searchParams.get('orderDirection') || 'desc') as 'asc' | 'desc',
    };

    // 2. 从数据库查询
    console.log('🔍 查询文件列表:', queryOptions);

    const result = await fileService.queryFiles(queryOptions);

    // 3. 返回结果
    return NextResponse.json({
      success: true,
      items: result.items,
      pagination: {
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        totalPages: result.totalPages,
        hasNext: result.hasNext,
        hasPrev: result.hasPrev,
      },
    });
  } catch (error) {
    console.error('❌ 查询文件列表失败:', error);
    return NextResponse.json(
      { success: false, error: '查询失败' },
      { status: 500 }
    );
  }
}
```

---

## 4️⃣ 前端页面示例

### `app/gallery/page.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { createFileClient } from '@qhr123/sa2kit/universalFile';
import type { FileMetadata, UploadProgress } from '@qhr123/sa2kit/universalFile';

const fileClient = createFileClient({
  baseUrl: '', // API 前缀
});

export default function GalleryPage() {
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [loading, setLoading] = useState(true);

  // 加载文件列表
  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const result = await fileClient.queryFiles({
        moduleId: 'gallery',
        page: 1,
        pageSize: 50,
      });
      setFiles(result.items);
    } catch (error) {
      console.error('加载失败:', error);
      alert('加载文件列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 上传文件
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);

      const metadata = await fileClient.uploadFile(
        {
          file,
          moduleId: 'gallery',
          businessId: 'user-gallery',
          permission: 'public',
        },
        (progress) => {
          setUploadProgress(progress);
          console.log('上传进度:', progress.progress + '%');
        }
      );

      console.log('✅ 上传成功:', metadata);
      
      // 刷新列表
      await loadFiles();
      
      alert('上传成功！');
    } catch (error) {
      console.error('上传失败:', error);
      alert('上传失败: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  };

  // 删除文件
  const handleDelete = async (fileId: string) => {
    if (!confirm('确定要删除这个文件吗？')) return;

    try {
      await fileClient.deleteFile(fileId);
      alert('删除成功');
      await loadFiles();
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* 标题 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">图片画廊</h1>
        <p className="text-gray-600">展示 UniversalFile 模块的完整功能</p>
      </div>

      {/* 上传区域 */}
      <div className="mb-8 p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition-colors">
        <input
          type="file"
          accept="image/*"
          onChange={handleUpload}
          disabled={uploading}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100
            disabled:opacity-50"
        />
        {uploading && uploadProgress && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">
                上传进度: {uploadProgress.progress.toFixed(1)}%
              </span>
              <span className="text-xs text-gray-500">
                {(uploadProgress.uploadedBytes / 1024 / 1024).toFixed(2)} MB / 
                {(uploadProgress.totalBytes / 1024 / 1024).toFixed(2)} MB
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${uploadProgress.progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 文件列表 */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {files.map((file) => (
          <div
            key={file.id}
            className="group relative border rounded-lg overflow-hidden hover:shadow-xl transition-shadow"
          >
            {/* 图片 */}
            <div className="aspect-square bg-gray-100">
              <img
                src={file.cdnUrl || file.storagePath}
                alt={file.originalName}
                className="w-full h-full object-cover"
              />
            </div>

            {/* 信息 */}
            <div className="p-4">
              <p className="text-sm font-medium truncate" title={file.originalName}>
                {file.originalName}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {(file.size / 1024).toFixed(2)} KB
              </p>
              <p className="text-xs text-gray-400">
                {new Date(file.uploadTime).toLocaleDateString('zh-CN')}
              </p>
            </div>

            {/* 操作按钮 */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => handleDelete(file.id)}
                className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                title="删除"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 空状态 */}
      {files.length === 0 && (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">暂无文件</h3>
          <p className="mt-1 text-sm text-gray-500">上传第一个文件开始使用</p>
        </div>
      )}

      {/* 统计信息 */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-blue-600">{files.length}</p>
            <p className="text-sm text-gray-600">总文件数</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">
              {(files.reduce((sum, f) => sum + f.size, 0) / 1024 / 1024).toFixed(2)} MB
            </p>
            <p className="text-sm text-gray-600">总大小</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-purple-600">
              {files.filter(f => f.mimeType.startsWith('image/')).length}
            </p>
            <p className="text-sm text-gray-600">图片</p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 5️⃣ 环境变量

### `.env`

```env
# ========== 数据库配置 ==========
DATABASE_URL=postgresql://user:password@localhost:5432/your_database

# ========== 阿里云 OSS 配置 ==========
OSS_ACCESS_KEY_ID=LTAI5txxxxxxxxxx
OSS_ACCESS_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
OSS_BUCKET=your-bucket-name
OSS_REGION=oss-cn-hangzhou

# OSS 自定义域名（可选）
OSS_CUSTOM_DOMAIN=https://cdn.yourdomain.com

# ========== CDN 配置（可选） ==========
CDN_DOMAIN=https://cdn.yourdomain.com

# ========== 本地存储配置（备用） ==========
UPLOAD_DIR=./uploads
BASE_URL=http://localhost:3000

# ========== 应用配置 ==========
NODE_ENV=development
```

---

## ✅ 启动检查

```bash
# 1. 安装依赖
pnpm install

# 2. 创建数据库表
pnpm drizzle-kit push:pg

# 3. 启动开发服务器
pnpm dev

# 4. 测试上传功能
# 访问 http://localhost:3000/gallery
```

---

## 📊 数据库查询示例

```sql
-- 查看所有文件
SELECT id, original_name, size, mime_type, storage_path, cdn_url, upload_time
FROM file_metadata
WHERE is_deleted = FALSE
ORDER BY upload_time DESC
LIMIT 20;

-- 按模块统计
SELECT module_id, COUNT(*) as file_count, SUM(size) as total_size
FROM file_metadata
WHERE is_deleted = FALSE
GROUP BY module_id;

-- 查找大文件
SELECT original_name, size, storage_path
FROM file_metadata
WHERE size > 10485760  -- 10MB
ORDER BY size DESC;

-- 查找重复文件
SELECT md5_hash, COUNT(*) as count
FROM file_metadata
WHERE is_deleted = FALSE
GROUP BY md5_hash
HAVING COUNT(*) > 1;
```

完整示例已创建！🎉
