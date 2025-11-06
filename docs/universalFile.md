# Universal File Service Documentation

通用文件服务模块提供完整的文件上传、下载、管理功能，支持多种存储提供商和 CDN。

## 功能特性

- ✅ 文件上传（支持进度跟踪）
- ✅ 文件元数据管理
- ✅ 多存储提供商支持（Local、Aliyun OSS、AWS S3、Qcloud COS）
- ✅ 文件查询和批量操作
- ✅ 完整的文件验证工具
- ✅ 文件大小格式化
- ✅ MIME 类型检测
- ✅ 访问权限控制

## 安装

```bash
pnpm add @qhr123/sa2kit
```

## 快速开始

### 基础使用

```typescript
import { universalFileClient } from '@qhr123/sa2kit/universalFile';

// 上传文件
const uploadFile = async (file: File) => {
  try {
    const fileMetadata = await universalFileClient.uploadFile(
      {
        file,
        moduleId: 'user-avatars',
        businessId: 'user-123',
        permission: 'public',
      },
      (progress) => {
        console.log(`上传进度: ${progress.progress}%`);
        console.log(`上传速度: ${progress.speed} 字节/秒`);
        console.log(`剩余时间: ${progress.remainingTime} 秒`);
      }
    );

    console.log('文件上传成功:', fileMetadata);
    return fileMetadata;
  } catch (error) {
    console.error('文件上传失败:', error);
    throw error;
  }
};
```

### 查询文件

```typescript
import { universalFileClient } from '@qhr123/sa2kit/universalFile';

// 查询文件列表
const queryFiles = async () => {
  const result = await universalFileClient.queryFiles({
    moduleId: 'user-avatars',
    pageSize: 20,
    page: 1,
    sortBy: 'uploadTime',
    sortOrder: 'desc',
  });

  console.log('文件列表:', result.items);
  console.log('总数:', result.total);
  console.log('总页数:', result.totalPages);
};

// 获取文件元数据
const getFileInfo = async (fileId: string) => {
  const metadata = await universalFileClient.getFileMetadata(fileId);
  console.log('文件信息:', metadata);
};

// 获取文件访问 URL
const getUrl = async (fileId: string) => {
  const url = await universalFileClient.getFileUrl(fileId, 3600); // 1小时有效期
  console.log('文件 URL:', url);
};
```

### 删除文件

```typescript
import { universalFileClient } from '@qhr123/sa2kit/universalFile';

// 删除单个文件
await universalFileClient.deleteFile('file-id');

// 批量删除文件
const result = await universalFileClient.batchDeleteFiles([
  'file-id-1',
  'file-id-2',
  'file-id-3',
]);

console.log(`成功删除 ${result.successCount} 个文件`);
console.log(`失败 ${result.failureCount} 个文件`);
```

## 工具函数

### 文件验证

```typescript
import { validateFile, validateFileName } from '@qhr123/sa2kit/universalFile';

// 验证文件
const validation = validateFile(file, {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['image/jpeg', 'image/png'],
});

if (!validation.valid) {
  console.error('文件验证失败:', validation.errors);
}

// 验证文件名
if (!validateFileName('my-file.pdf')) {
  console.error('文件名包含非法字符');
}
```

### 文件大小格式化

```typescript
import { formatFileSize, parseFileSize } from '@qhr123/sa2kit/universalFile';

// 格式化文件大小
console.log(formatFileSize(1024)); // "1.00 KB"
console.log(formatFileSize(1048576)); // "1.00 MB"

// 解析文件大小字符串
console.log(parseFileSize('10 MB')); // 10485760
console.log(parseFileSize('500 KB')); // 512000
```

### MIME 类型检测

```typescript
import {
  isImageFile,
  isVideoFile,
  getFileCategory,
  getMimeTypeFromFileName,
} from '@qhr123/sa2kit/universalFile';

// 检查文件类型
console.log(isImageFile('image/jpeg')); // true
console.log(isVideoFile('video/mp4')); // true

// 获取文件类别
console.log(getFileCategory('image/jpeg')); // "image"
console.log(getFileCategory('video/mp4')); // "video"

// 从文件名获取 MIME 类型
console.log(getMimeTypeFromFileName('photo.jpg')); // "image/jpeg"
console.log(getMimeTypeFromFileName('video.mp4')); // "video/mp4"
```

### 文件读取

```typescript
import {
  readFileAsBase64,
  readFileAsArrayBuffer,
  readFileAsText,
} from '@qhr123/sa2kit/universalFile';

// 读取为 Base64
const base64 = await readFileAsBase64(file);

// 读取为 ArrayBuffer
const buffer = await readFileAsArrayBuffer(file);

// 读取为文本
const text = await readFileAsText(file, 'UTF-8');
```

## 自定义客户端

```typescript
import { createFileClient } from '@qhr123/sa2kit/universalFile';

// 创建自定义客户端
const customClient = createFileClient({
  baseUrl: 'https://api.example.com',
  timeout: 60000,
  uploadTimeout: 300000,
  headers: {
    Authorization: 'Bearer your-token',
  },
});

// 使用自定义客户端
await customClient.uploadFile({
  file,
  moduleId: 'documents',
});
```

## 类型定义

### FileMetadata

```typescript
interface FileMetadata {
  id: string;
  originalName: string;
  storageName: string;
  size: number;
  mimeType: string;
  extension: string;
  hash?: string;
  uploadTime: Date;
  permission: AccessPermission;
  uploaderId: string;
  moduleId: string;
  businessId?: string;
  storageProvider: StorageType;
  storagePath: string;
  cdnUrl?: string;
  accessCount: number;
  lastAccessTime?: Date;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}
```

### UploadFileInfo

```typescript
interface UploadFileInfo {
  file: File;
  moduleId: string;
  businessId?: string;
  permission?: AccessPermission;
  customPath?: string;
  metadata?: Record<string, any>;
  needsProcessing?: boolean;
  processingOptions?: ProcessingOptions;
}
```

### UploadProgress

```typescript
interface UploadProgress {
  fileId: string;
  status: UploadStatus;
  progress: number;
  uploadedBytes: number;
  totalBytes: number;
  speed: number;
  remainingTime: number;
  error?: string;
}
```

## 错误处理

```typescript
import {
  FileServiceError,
  FileUploadError,
  StorageProviderError,
} from '@qhr123/sa2kit/universalFile';

try {
  await universalFileClient.uploadFile(fileInfo);
} catch (error) {
  if (error instanceof FileUploadError) {
    console.error('文件上传错误:', error.message);
    console.error('错误代码:', error.code);
    console.error('错误详情:', error.details);
  } else if (error instanceof StorageProviderError) {
    console.error('存储提供商错误:', error.message);
  } else {
    console.error('未知错误:', error);
  }
}
```

## 最佳实践

1. **文件验证**: 始终在上传前验证文件大小和类型
2. **进度跟踪**: 为大文件上传提供进度反馈
3. **错误处理**: 妥善处理各种错误情况
4. **权限控制**: 根据业务需求设置合适的访问权限
5. **元数据**: 使用自定义元数据存储额外信息
6. **CDN 加速**: 使用 CDN URL 提高访问速度

## React 组件示例

```typescript
import React, { useState } from 'react';
import { universalFileClient } from '@qhr123/sa2kit/universalFile';

function FileUploader() {
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileMetadata = await universalFileClient.uploadFile(
        {
          file,
          moduleId: 'user-uploads',
        },
        (progress) => {
          setProgress(progress.progress);
        }
      );

      console.log('上传成功:', fileMetadata);
      alert('文件上传成功！');
    } catch (error) {
      console.error('上传失败:', error);
      alert('文件上传失败！');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} disabled={uploading} />
      {uploading && (
        <div>
          <progress value={progress} max={100} />
          <span>{progress}%</span>
        </div>
      )}
    </div>
  );
}
```

## 常见问题

### Q: 支持哪些文件类型？

A: 支持图片、视频、音频、文档等常见文件类型。可以通过 `allowedTypes` 参数自定义允许的类型。

### Q: 如何实现断点续传？

A: 目前版本暂不支持断点续传，建议将大文件分片上传（未来版本将支持）。

### Q: 如何限制文件大小？

A: 使用 `validateFile` 函数在上传前验证文件大小：

```typescript
const validation = validateFile(file, { maxSize: 10 * 1024 * 1024 });
if (!validation.valid) {
  // 处理验证失败
}
```

### Q: 如何自定义存储路径？

A: 在上传时指定 `customPath` 参数：

```typescript
await universalFileClient.uploadFile({
  file,
  moduleId: 'documents',
  customPath: 'custom/path/to/file',
});
```

