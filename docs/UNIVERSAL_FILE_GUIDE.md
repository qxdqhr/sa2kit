# UniversalFile 快速接入指南

## 🚀 快速开始

### 1. 最简配置（本地开发）

```typescript
import { createUniversalFileService, createLocalDevPreset } from '@qhr123/sa2kit/universalFile/server';

// 一行代码初始化
const fileService = createUniversalFileService({
  storage: createLocalDevPreset(),
});
```

### 2. 生产环境配置

```typescript
import {
  createUniversalFileService,
  createAliyunOSSPreset,
} from '@qhr123/sa2kit/universalFile/server';

const fileService = createUniversalFileService({
  storage: createAliyunOSSPreset({
    accessKeyId: process.env.OSS_ACCESS_KEY_ID!,
    accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET!,
    bucket: process.env.OSS_BUCKET!,
    region: process.env.OSS_REGION,
  }),
  db: drizzleDb, // 可选：如果需要文件记录管理
});
```

### 3. 智能预设（自动选择）

```typescript
import {
  createUniversalFileService,
  createSmartPreset,
} from '@qhr123/sa2kit/universalFile/server';

// 根据环境自动选择本地存储或云存储
const fileService = createUniversalFileService({
  storage: createSmartPreset(),
});
```

### 4. 从环境变量初始化

```env
# .env
STORAGE_TYPE=aliyun-oss
OSS_ACCESS_KEY_ID=your_key_id
OSS_ACCESS_KEY_SECRET=your_secret
OSS_BUCKET=my-bucket
OSS_REGION=oss-cn-hangzhou
```

```typescript
import { createFileServiceFromEnv } from '@qhr123/sa2kit/universalFile/server';

// 零配置，从环境变量自动加载
const fileService = createFileServiceFromEnv(drizzleDb);
```

## 📦 场景化预设

### 图片服务

```typescript
import {
  createUniversalFileService,
  createImageServicePreset,
  createLocalDevPreset,
} from '@qhr123/sa2kit/universalFile/server';

const imageService = createUniversalFileService({
  ...createImageServicePreset(createLocalDevPreset()),
  // 自动配置：
  // - maxFileSize: 5MB
  // - allowedMimeTypes: 仅图片格式
});
```

### 视频服务

```typescript
import {
  createUniversalFileService,
  createVideoServicePreset,
  createAliyunOSSPreset,
} from '@qhr123/sa2kit/universalFile/server';

const videoService = createUniversalFileService({
  ...createVideoServicePreset(
    createAliyunOSSPreset({
      accessKeyId: process.env.OSS_ACCESS_KEY_ID!,
      accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET!,
      bucket: process.env.OSS_BUCKET!,
    })
  ),
  // 自动配置：
  // - maxFileSize: 100MB
  // - allowedMimeTypes: 仅视频格式
  // - enableStreaming: true
});
```

### 文档服务

```typescript
import {
  createUniversalFileService,
  createDocumentServicePreset,
  createLocalDevPreset,
} from '@qhr123/sa2kit/universalFile/server';

const docService = createUniversalFileService({
  ...createDocumentServicePreset(createLocalDevPreset()),
  // 自动配置：
  // - maxFileSize: 20MB
  // - allowedMimeTypes: PDF, Word, Excel 等
});
```

## ✅ 配置验证

```typescript
import {
  validateServiceConfig,
  validateEnvironment,
  getRequiredEnvVars,
  ConfigValidationError,
} from '@qhr123/sa2kit/universalFile/server';

try {
  // 验证环境变量
  const requiredVars = getRequiredEnvVars('aliyun-oss');
  validateEnvironment(requiredVars);

  // 验证配置对象
  validateServiceConfig(config);
} catch (error) {
  if (error instanceof ConfigValidationError) {
    console.error(`配置错误 [${error.field}]: ${error.message}`);
  }
}
```

## 🔌 使用 Storage Providers

### 直接使用 LocalStorageProvider

```typescript
import {
  LocalStorageProvider,
  type UploadFileInfo,
} from '@qhr123/sa2kit/universalFile/server';

const provider = new LocalStorageProvider();

await provider.initialize({
  type: 'local',
  rootPath: './uploads',
  baseUrl: 'http://localhost:3000',
});

// 上传文件
const result = await provider.upload(fileInfo, 'path/to/file.jpg');

// 下载文件
const buffer = await provider.download('path/to/file.jpg');

// 删除文件
await provider.delete('path/to/file.jpg');
```

### 直接使用 AliyunOSSProvider

```typescript
import { AliyunOSSProvider } from '@qhr123/sa2kit/universalFile/server';

const provider = new AliyunOSSProvider();

await provider.initialize({
  type: 'aliyun-oss',
  accessKeyId: process.env.OSS_ACCESS_KEY_ID!,
  accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET!,
  bucket: 'my-bucket',
  region: 'oss-cn-hangzhou',
});

// 获取预签名上传 URL
const uploadUrl = await provider.getUploadUrl('path/to/file.jpg', 3600);

// 获取访问 URL
const accessUrl = await provider.getAccessUrl('path/to/file.jpg');
```

## 🎨 使用 File Processors

### 图片处理

```typescript
import {
  ImageProcessor,
  type ImageProcessingOptions,
} from '@qhr123/sa2kit/universalFile/server';

const processor = new ImageProcessor();
await processor.initialize();

const options: ImageProcessingOptions = {
  type: 'image',
  width: 800,
  height: 600,
  quality: 80,
  format: 'webp',
  watermark: true,
  watermarkOptions: {
    text: 'My Watermark',
    position: 'bottom-right',
    opacity: 0.5,
  },
};

const result = await processor.process(
  'input.jpg',
  'output.webp',
  options
);
```

### 音频处理

```typescript
import {
  AudioProcessor,
  type AudioProcessingOptions,
} from '@qhr123/sa2kit/universalFile/server';

const processor = new AudioProcessor();
await processor.initialize();

const options: AudioProcessingOptions = {
  type: 'audio',
  format: 'mp3',
  bitrate: 192,
  sampleRate: 44100,
  channels: 2,
};

const result = await processor.process(
  'input.wav',
  'output.mp3',
  options
);
```

### 视频处理

```typescript
import {
  VideoProcessor,
  type VideoProcessingOptions,
} from '@qhr123/sa2kit/universalFile/server';

const processor = new VideoProcessor();
await processor.initialize();

const options: VideoProcessingOptions = {
  type: 'video',
  format: 'mp4',
  quality: 80,
  generateThumbnail: true,
  thumbnailTime: 5,
};

const result = await processor.process(
  'input.mov',
  'output.mp4',
  options
);
```

### 使用处理队列

```typescript
import {
  ProcessingQueue,
  ImageProcessor,
  type QueueOptions,
} from '@qhr123/sa2kit/universalFile/server';

const queue = new ProcessingQueue({
  maxConcurrentTasks: 3,
  maxRetries: 2,
  autoStart: true,
});

// 注册处理器
const imageProcessor = new ImageProcessor();
await imageProcessor.initialize();
queue.registerProcessor(imageProcessor);

// 添加任务
const taskId = await queue.addTask({
  inputPath: 'input.jpg',
  outputPath: 'output.jpg',
  options: {
    type: 'image',
    width: 800,
  },
  priority: 'high',
});

// 监听任务完成
queue.on('taskCompleted', (task, result) => {
  console.log(`任务 ${task.id} 完成:`, result);
});

// 启动队列
queue.start();

// 获取统计信息
const stats = queue.getStats();
console.log('队列统计:', stats);
```

## 🛠️ 环境变量配置

### 本地存储

```env
STORAGE_TYPE=local
UPLOAD_DIR=./uploads
BASE_URL=http://localhost:3000
```

### 阿里云 OSS

```env
STORAGE_TYPE=aliyun-oss
OSS_ACCESS_KEY_ID=your_access_key_id
OSS_ACCESS_KEY_SECRET=your_access_key_secret
OSS_BUCKET=your_bucket_name
OSS_REGION=oss-cn-hangzhou
```

## 📚 类型定义

Sa2kit 提供了完整的 TypeScript 类型支持：

```typescript
import type {
  // 配置类型
  UniversalFileServiceConfig,
  StorageConfig,
  LocalStorageConfig,
  AliyunOSSConfig,
  CDNConfig,
  // 处理选项
  ProcessingOptions,
  ImageProcessingOptions,
  AudioProcessingOptions,
  VideoProcessingOptions,
  // 结果类型
  StorageResult,
  ProcessingResult,
  UploadResult,
  // 接口
  IStorageProvider,
  ICDNProvider,
  IFileProcessor,
} from '@qhr123/sa2kit/universalFile/server';
```

## 🔥 迁移指南

如果你已经在使用 LyricNote 的 universalFile，迁移到 Sa2kit 非常简单：

### 之前（LyricNote）

```typescript
import { UniversalFileService } from '@/lib/universalFile';
import { fileConfig } from '@/lib/config';

const service = new UniversalFileService(fileConfig);
```

### 现在（Sa2kit）

```typescript
import { createFileServiceFromEnv } from '@qhr123/sa2kit/universalFile/server';

const service = createFileServiceFromEnv(db);
```

## 💡 最佳实践

1. **开发环境**：使用 `createLocalDevPreset()` 快速开始
2. **生产环境**：使用 `createAliyunOSSPreset()` 或其他云存储
3. **自动适配**：使用 `createSmartPreset()` 根据环境自动选择
4. **类型安全**：充分利用 TypeScript 类型定义
5. **配置验证**：在初始化前使用 `validateServiceConfig()` 验证配置
6. **错误处理**：捕获并处理 `ConfigValidationError`

## 🚨 常见问题

### 1. Sharp 或 FFmpeg 未安装？

Processors 会自动降级到模拟模式，不影响开发和测试。生产环境请安装对应依赖：

```bash
# 图片处理
pnpm add sharp

# 音视频处理
pnpm add fluent-ffmpeg
```

### 2. 如何自定义配置？

所有预设都是普通对象，可以自由合并和覆盖：

```typescript
const service = createUniversalFileService({
  ...createImageServicePreset(createLocalDevPreset()),
  maxFileSize: 10 * 1024 * 1024, // 覆盖为 10MB
  customOption: 'value', // 添加自定义选项
});
```

### 3. 环境变量未生效？

确保在初始化前已加载环境变量（如使用 `dotenv`）：

```typescript
import 'dotenv/config';
import { createFileServiceFromEnv } from '@qhr123/sa2kit/universalFile/server';

const service = createFileServiceFromEnv();
```

