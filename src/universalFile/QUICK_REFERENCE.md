# UniversalFile 快速参考手册

> 常用代码片段和最佳实践

## 📌 目录

- [快速启动](#快速启动)
- [常用代码片段](#常用代码片段)
- [最佳实践](#最佳实践)
- [性能优化](#性能优化)
- [安全建议](#安全建议)

---

## 🚀 快速启动

### 最小化配置（5分钟上手）

```typescript
// 1. 安装依赖
// pnpm add ali-oss drizzle-orm postgres

// 2. 环境变量 (.env)
DATABASE_URL=postgresql://localhost:5432/mydb
OSS_ACCESS_KEY_ID=xxx
OSS_ACCESS_KEY_SECRET=xxx
OSS_BUCKET=my-bucket
OSS_REGION=oss-cn-hangzhou

// 3. 创建服务
import { createUniversalFileService, createDrizzleRepository } from '@qhr123/sa2kit/universalFile/server';
import { db } from './db';
import { fileMetadata } from './schema';

const fileService = createUniversalFileService({
  storage: { 
    type: 'aliyun-oss',
    enabled: true,
    region: process.env.OSS_REGION!,
    bucket: process.env.OSS_BUCKET!,
    accessKeyId: process.env.OSS_ACCESS_KEY_ID!,
    accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET!,
  },
  persistence: {
    enabled: true,
    repository: createDrizzleRepository({ db, table: fileMetadata }),
    autoPersist: true,
  },
});

await fileService.initialize();

// 4. 上传文件
const metadata = await fileService.uploadFile({
  file: uploadedFile,
  moduleId: 'my-module',
  businessId: 'item-123',
});

console.log('文件已上传到:', metadata.storagePath);
console.log('访问URL:', metadata.cdnUrl);
```

---

## 📝 常用代码片段

### 上传文件

#### 基础上传

```typescript
const metadata = await fileService.uploadFile({
  file: uploadedFile,
  moduleId: 'blog',
  businessId: 'post-123',
  permission: 'public',
});
```

#### 带进度的上传

```typescript
const metadata = await fileService.uploadFile(
  {
    file: uploadedFile,
    moduleId: 'course',
    businessId: 'lesson-456',
  },
  undefined, // 使用默认存储
  (progress) => {
    console.log(`进度: ${progress.progress}%`);
    console.log(`速度: ${(progress.speed / 1024 / 1024).toFixed(2)} MB/s`);
    console.log(`剩余时间: ${progress.remainingTime.toFixed(0)}s`);
  }
);
```

#### 上传时处理图片

```typescript
const metadata = await fileService.uploadFile({
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
      text: '© 2024 Your Brand',
      position: 'bottom-right',
      opacity: 0.6,
    },
  },
});
```

### 查询文件

#### 查询某个业务的所有文件

```typescript
const result = await fileService.queryFiles({
  moduleId: 'blog',
  businessId: 'post-123',
  page: 1,
  pageSize: 20,
});

console.log(`总计 ${result.total} 个文件`);
result.items.forEach(file => {
  console.log(`- ${file.originalName} (${file.size} bytes)`);
});
```

#### 查询所有图片

```typescript
const images = await fileService.queryFiles({
  moduleId: 'gallery',
  mimeType: 'image/%', // 模糊匹配
  page: 1,
  pageSize: 50,
});
```

#### 查询某个用户的文件

```typescript
const userFiles = await fileService.queryFiles({
  uploaderId: 'user-123',
  page: 1,
  pageSize: 20,
  orderBy: 'uploadTime',
  orderDirection: 'desc',
});
```

### 获取文件URL

#### 获取永久URL（公开文件）

```typescript
const url = await fileService.getFileUrl(fileId);
console.log('访问URL:', url);
```

#### 获取临时URL（私有文件，1小时有效）

```typescript
const tempUrl = await fileService.getFileUrl(
  fileId,
  userId,  // 用于权限检查
  3600     // 1小时 = 3600秒
);
console.log('临时URL:', tempUrl);
```

### 删除文件

#### 删除单个文件

```typescript
await fileService.deleteFile(fileId, userId);
console.log('文件已删除');
```

#### 批量删除

```typescript
const result = await fileService.batchDeleteFiles(
  ['file-1', 'file-2', 'file-3'],
  userId
);

console.log(`成功删除 ${result.successCount} 个文件`);
if (result.failureCount > 0) {
  console.error('失败:', result.failures);
}
```

### 下载文件

```typescript
// 下载到内存（返回 Buffer）
const buffer = await fileService.downloadFile(fileId, userId);

// 转换为 Blob（浏览器环境）
const blob = new Blob([buffer]);
const url = URL.createObjectURL(blob);

// 触发下载
const a = document.createElement('a');
a.href = url;
a.download = 'filename.pdf';
a.click();
```

### 事件监听

```typescript
// 监听上传完成
fileService.on('upload:complete', (event) => {
  console.log('✅ 上传完成:', event.fileId);
  // 发送通知、更新UI等
});

// 监听上传错误
fileService.on('upload:error', (event) => {
  console.error('❌ 上传失败:', event.fileId, event.error);
  // 错误处理、重试等
});

// 监听所有事件
fileService.on('*', (event) => {
  console.log('事件:', event.type, event);
});
```

---

## 🎯 最佳实践

### 1. 模块隔离

```typescript
// ✅ 好：为每个业务模块使用独立的 moduleId
await fileService.uploadFile({
  file,
  moduleId: 'user-profile',  // 用户模块
  businessId: userId,
});

await fileService.uploadFile({
  file,
  moduleId: 'blog',          // 博客模块
  businessId: postId,
});

// ❌ 不好：所有文件使用同一个 moduleId
await fileService.uploadFile({
  file,
  moduleId: 'default',
});
```

### 2. 权限控制

```typescript
// ✅ 好：根据文件类型设置合适的权限
await fileService.uploadFile({
  file: avatarFile,
  moduleId: 'user-profile',
  permission: 'public',      // 头像公开
});

await fileService.uploadFile({
  file: idCardFile,
  moduleId: 'user-kyc',
  permission: 'private',     // 身份证私有
});

await fileService.uploadFile({
  file: courseVideoFile,
  moduleId: 'course',
  permission: 'authenticated', // 需要登录
});
```

### 3. 文件去重

```typescript
// ✅ 好：利用哈希值检查重复
async function uploadWithDeduplication(file: File) {
  const hash = await calculateFileHash(file);
  
  // 检查是否已存在
  const existing = await db
    .select()
    .from(fileMetadata)
    .where(eq(fileMetadata.md5Hash, hash))
    .limit(1);
  
  if (existing.length > 0) {
    console.log('文件已存在，返回已有记录');
    return existing[0];
  }
  
  // 不存在，执行上传
  return await fileService.uploadFile({ file, moduleId: 'gallery' });
}
```

### 4. 批量操作

```typescript
// ✅ 好：使用 Promise.all 并发上传
async function uploadMultiple(files: File[]) {
  const promises = files.map(file => 
    fileService.uploadFile({
      file,
      moduleId: 'batch-upload',
    })
  );
  
  const results = await Promise.allSettled(promises);
  
  const succeeded = results.filter(r => r.status === 'fulfilled');
  const failed = results.filter(r => r.status === 'rejected');
  
  console.log(`成功: ${succeeded.length}, 失败: ${failed.length}`);
  
  return { succeeded, failed };
}
```

### 5. 错误处理

```typescript
// ✅ 好：完整的错误处理
async function safeUpload(file: File) {
  try {
    const metadata = await fileService.uploadFile({
      file,
      moduleId: 'documents',
    });
    
    return { success: true, data: metadata };
  } catch (error) {
    // 分类处理不同的错误
    if (error instanceof FileUploadError) {
      console.error('上传错误:', error.message);
      return { success: false, error: '文件上传失败' };
    }
    
    if (error instanceof StorageProviderError) {
      console.error('存储错误:', error.message);
      return { success: false, error: '存储服务不可用' };
    }
    
    console.error('未知错误:', error);
    return { success: false, error: '系统错误' };
  }
}
```

### 6. 临时文件清理

```typescript
// ✅ 好：设置过期时间，定期清理
async function uploadTempFile(file: File) {
  const metadata = await fileService.uploadFile({
    file,
    moduleId: 'temp',
    permission: 'private',
  });
  
  // 设置24小时后过期
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);
  
  await db
    .update(fileMetadata)
    .set({ expiresAt, isTemporary: true })
    .where(eq(fileMetadata.id, metadata.id));
  
  return metadata;
}

// 定时任务：清理过期文件
async function cleanupExpiredFiles() {
  const now = new Date();
  
  const expiredFiles = await db
    .select()
    .from(fileMetadata)
    .where(
      and(
        lt(fileMetadata.expiresAt, now),
        eq(fileMetadata.isDeleted, false)
      )
    );
  
  for (const file of expiredFiles) {
    await fileService.deleteFile(file.id);
    console.log('已清理过期文件:', file.id);
  }
}
```

---

## ⚡ 性能优化

### 1. 使用缓存

```typescript
// ✅ 启用缓存减少数据库查询
const fileService = createUniversalFileService({
  cache: {
    enabled: true,
    metadataTTL: 3600,  // 元数据缓存1小时
    urlTTL: 1800,       // URL缓存30分钟
    maxSize: 1000,      // 最大缓存1000个条目
  },
});
```

### 2. 使用CDN

```typescript
// ✅ 启用CDN加速文件访问
const fileService = createUniversalFileService({
  storage: {
    type: 'aliyun-oss',
    customDomain: 'https://cdn.yourdomain.com',
  },
  cdn: {
    type: 'aliyun-cdn',
    enabled: true,
    domain: 'https://cdn.yourdomain.com',
  },
});
```

### 3. 图片优化

```typescript
// ✅ 自动转换为 WebP 格式
const metadata = await fileService.uploadFile({
  file: imageFile,
  moduleId: 'gallery',
  needsProcessing: true,
  processingOptions: {
    type: 'image',
    format: 'webp',     // 更小的文件大小
    quality: 85,        // 平衡质量和大小
    width: 1200,        // 限制宽度
  },
});
```

### 4. 分页查询

```typescript
// ✅ 使用合理的分页大小
const result = await fileService.queryFiles({
  moduleId: 'blog',
  page: 1,
  pageSize: 20,  // 不要设置太大
});
```

### 5. 索引优化

```sql
-- ✅ 为高频查询字段创建索引
CREATE INDEX file_metadata_module_business_idx 
ON file_metadata(module_id, business_id, is_deleted);

CREATE INDEX file_metadata_uploader_time_idx 
ON file_metadata(uploader_id, upload_time DESC);
```

---

## 🔒 安全建议

### 1. 文件类型验证

```typescript
// ✅ 严格限制允许的文件类型
const fileService = createUniversalFileService({
  allowedMimeTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    // 不要使用通配符如 '*'
  ],
});
```

### 2. 文件大小限制

```typescript
// ✅ 设置合理的文件大小限制
const fileService = createUniversalFileService({
  maxFileSize: 100 * 1024 * 1024, // 100MB
});

// API 层再次验证
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  
  // 二次验证
  if (file.size > 100 * 1024 * 1024) {
    return NextResponse.json(
      { error: '文件过大' },
      { status: 400 }
    );
  }
  
  // ...
}
```

### 3. 权限检查

```typescript
// ✅ 在所有操作前检查权限
async function getFileUrl(fileId: string, userId: string) {
  const metadata = await fileService.getFileMetadata(fileId);
  
  if (!metadata) {
    throw new Error('文件不存在');
  }
  
  // 权限检查
  if (metadata.permission === 'private' && metadata.uploaderId !== userId) {
    throw new Error('无权访问');
  }
  
  return await fileService.getFileUrl(fileId, userId);
}
```

### 4. 敏感信息保护

```typescript
// ✅ 不要在客户端暴露敏感信息
export async function GET(request: NextRequest) {
  const metadata = await fileService.getFileMetadata(fileId);
  
  // 过滤敏感字段
  return NextResponse.json({
    id: metadata.id,
    originalName: metadata.originalName,
    size: metadata.size,
    mimeType: metadata.mimeType,
    url: await fileService.getFileUrl(metadata.id),
    // ❌ 不要返回: storagePath, accessKeyId 等
  });
}
```

### 5. SQL注入防护

```typescript
// ✅ 使用参数化查询（Drizzle ORM 自动处理）
const files = await db
  .select()
  .from(fileMetadata)
  .where(eq(fileMetadata.moduleId, userInput)); // 安全

// ❌ 永远不要拼接SQL
// const files = await db.execute(
//   `SELECT * FROM file_metadata WHERE module_id = '${userInput}'`
// );
```

---

## 📊 监控和日志

### 1. 性能监控

```typescript
// 启用性能监控
const fileService = createUniversalFileService({
  enableMonitoring: true,
});

// 监听性能事件
fileService.on('upload:complete', (event) => {
  const uploadTime = event.data?.uploadTime;
  if (uploadTime > 5000) {
    console.warn('⚠️ 上传时间过长:', uploadTime + 'ms');
  }
});
```

### 2. 结构化日志

```typescript
import { createLogger } from '@qhr123/sa2kit/logger';

const logger = createLogger('FileService');

logger.info('文件上传成功', {
  fileId: metadata.id,
  fileName: metadata.originalName,
  size: metadata.size,
  uploadTime: Date.now() - startTime,
  userId,
});
```

---

## 🔧 故障排查命令

```bash
# 检查数据库连接
psql $DATABASE_URL -c "SELECT 1"

# 查看文件数量
psql $DATABASE_URL -c "SELECT COUNT(*) FROM file_metadata"

# 查看最新上传
psql $DATABASE_URL -c "SELECT id, original_name, upload_time FROM file_metadata ORDER BY upload_time DESC LIMIT 10"

# 查看存储空间使用
psql $DATABASE_URL -c "SELECT SUM(size) / 1024 / 1024 as mb FROM file_metadata WHERE is_deleted = FALSE"

# 测试 OSS 连接
curl https://your-bucket.oss-cn-hangzhou.aliyuncs.com

# 清理临时文件（手动）
psql $DATABASE_URL -c "DELETE FROM file_metadata WHERE is_temporary = TRUE AND upload_time < NOW() - INTERVAL '24 hours'"
```

---

## 📚 相关文档

- **完整集成指南**: [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)
- **示例代码**: [EXAMPLE_INTEGRATION.md](./EXAMPLE_INTEGRATION.md)
- **API文档**: [types.ts](./types.ts)
- **数据库Schema**: [server/drizzle-schemas/postgres.ts](./server/drizzle-schemas/postgres.ts)

---

## 💡 提示

- 使用 TypeScript 获得完整的类型提示
- 查看示例代码了解更多用法
- 遇到问题先查看日志输出
- 生产环境建议启用 CDN 和缓存

---

快速参考手册 | MIT License © 2024
