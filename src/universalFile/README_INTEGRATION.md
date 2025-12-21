# UniversalFile 模块集成文档中心

> 🚀 企业级通用文件上传管理系统 - 完整集成指南

## 📚 文档导航

### 🎯 新手入门

- **[集成指南 (INTEGRATION_GUIDE.md)](./INTEGRATION_GUIDE.md)**
  - 环境准备和依赖安装
  - 数据库表创建
  - 服务端配置
  - API路由实现
  - 前端组件使用
  - 完整的配置说明

- **[示例代码 (EXAMPLE_INTEGRATION.md)](./EXAMPLE_INTEGRATION.md)**
  - 完整的项目结构示例
  - 数据库 Schema 定义
  - 文件服务初始化
  - Next.js API Routes 示例
  - React 前端页面示例
  - 真实场景代码演示

- **[快速参考 (QUICK_REFERENCE.md)](./QUICK_REFERENCE.md)**
  - 5分钟快速启动
  - 常用代码片段
  - 最佳实践
  - 性能优化建议
  - 安全建议
  - 故障排查命令

### 📖 详细文档

- **[核心模块文档](./README.md)**
  - 模块概览
  - 架构设计
  - 完整API文档
  - 类型定义

- **[类型定义 (types.ts)](./types.ts)**
  - 完整的 TypeScript 类型
  - 接口定义
  - 异常类型

- **[数据库 Schema](./server/drizzle-schemas/postgres.ts)**
  - 8张完整数据表定义
  - 索引和关系设计
  - Drizzle ORM 配置

---

## 🎓 学习路径

### 第1步：理解架构（10分钟）

阅读 [集成指南 - 模块定位](./INTEGRATION_GUIDE.md#模块定位判断) 部分，了解：
- UniversalFile 是什么
- 三层架构设计
- 核心功能清单

### 第2步：环境配置（20分钟）

跟随 [集成指南 - 环境准备](./INTEGRATION_GUIDE.md#环境准备) 完成：
- 安装依赖（ali-oss, drizzle-orm, sharp）
- 配置环境变量（OSS、数据库）
- 创建数据库表

### 第3步：服务端集成（30分钟）

参考 [示例代码 - 文件服务初始化](./EXAMPLE_INTEGRATION.md#2️⃣-文件服务初始化)：
- 创建数据库 Schema
- 初始化文件服务
- 创建 API 路由

### 第4步：前端集成（30分钟）

参考 [示例代码 - 前端页面](./EXAMPLE_INTEGRATION.md#4️⃣-前端页面示例)：
- 使用 FileUploader 组件
- 或直接使用客户端 SDK
- 处理上传进度

### 第5步：测试和调试（30分钟）

使用 [快速参考 - 故障排查](./QUICK_REFERENCE.md#故障排查命令)：
- 测试上传功能
- 验证数据库存储
- 检查 OSS 文件
- 查看日志输出

---

## 🔧 常见任务

### 任务：上传用户头像

```typescript
// 1. 后端 API
import { fileService } from '@/services/file-service';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('avatar') as File;
  const userId = request.headers.get('x-user-id')!;

  const metadata = await fileService.uploadFile({
    file,
    moduleId: 'user-profile',
    businessId: userId,
    permission: 'public',
  });

  // 更新用户表
  await db.update(users)
    .set({ avatarUrl: metadata.cdnUrl })
    .where(eq(users.id, userId));

  return NextResponse.json({ success: true, url: metadata.cdnUrl });
}

// 2. 前端调用
const handleAvatarUpload = async (file: File) => {
  const formData = new FormData();
  formData.append('avatar', file);

  const response = await fetch('/api/user/avatar', {
    method: 'POST',
    body: formData,
  });

  const { url } = await response.json();
  console.log('新头像URL:', url);
};
```

**详细说明**: [示例代码 - 场景1](./EXAMPLE_INTEGRATION.md#场景-1用户头像上传)

---

### 任务：博客文章图片上传

```typescript
// 上传文章配图
const metadata = await fileService.uploadFile({
  file: imageFile,
  moduleId: 'blog',
  businessId: postId,
  permission: 'public',
  needsProcessing: true,
  processingOptions: {
    type: 'image',
    quality: 85,
    width: 1200,
    format: 'webp',
  },
});

// 插入到文章内容
const imageMarkdown = `![${metadata.originalName}](${metadata.cdnUrl})`;
```

**详细说明**: [示例代码 - 场景2](./EXAMPLE_INTEGRATION.md#场景-2博客文章图片)

---

### 任务：查询文件列表

```typescript
// 查询某篇文章的所有图片
const images = await fileService.queryFiles({
  moduleId: 'blog',
  businessId: 'post-123',
  mimeType: 'image/%',
  page: 1,
  pageSize: 20,
});

console.log(`总计 ${images.total} 张图片`);
images.items.forEach(img => {
  console.log(`- ${img.originalName}: ${img.cdnUrl}`);
});
```

**详细说明**: [快速参考 - 查询文件](./QUICK_REFERENCE.md#查询文件)

---

### 任务：批量删除文件

```typescript
const fileIds = ['file-1', 'file-2', 'file-3'];

const result = await fileService.batchDeleteFiles(fileIds, userId);

console.log(`成功: ${result.successCount}, 失败: ${result.failureCount}`);
```

**详细说明**: [快速参考 - 删除文件](./QUICK_REFERENCE.md#删除文件)

---

## 🎯 按场景查找

### 场景：用户内容管理系统（UGC）

- **头像上传**: [示例 - 用户头像](./EXAMPLE_INTEGRATION.md#场景-1用户头像上传)
- **身份认证**: 使用 `permission: 'private'`
- **内容审核**: 使用 `metadata` 字段记录审核状态

### 场景：博客/CMS系统

- **文章配图**: [示例 - 博客图片](./EXAMPLE_INTEGRATION.md#场景-2博客文章图片)
- **富文本编辑器**: 集成上传API
- **图片自动优化**: 启用图片处理器

### 场景：在线课程平台

- **课程视频**: [示例 - 课程资源](./EXAMPLE_INTEGRATION.md#场景-3视频课程资源)
- **课件文档**: 使用 `permission: 'authenticated'`
- **访问统计**: 监听下载事件

### 场景：电商系统

- **商品图片**: 批量上传 + 自动生成缩略图
- **订单附件**: 关联 `businessId`
- **客服聊天**: 上传临时文件

---

## 📊 数据库设计

### 核心表结构

```
file_metadata (文件元数据)
├── id (UUID)
├── original_name (原始文件名)
├── stored_name (存储文件名)
├── mime_type (MIME类型)
├── size (文件大小)
├── md5_hash (MD5哈希)
├── storage_path (存储路径)
├── cdn_url (CDN URL)
├── module_id (模块ID)
├── business_id (业务ID)
├── uploader_id (上传者ID)
├── permission (访问权限)
├── is_deleted (软删除)
├── upload_time (上传时间)
└── metadata (自定义元数据 JSON)
```

**完整表结构**: [数据库 Schema](./server/drizzle-schemas/postgres.ts)

### 索引设计

```sql
-- 业务查询优化
CREATE INDEX file_metadata_module_business_idx 
ON file_metadata(module_id, business_id, is_deleted);

-- 用户文件查询
CREATE INDEX file_metadata_uploader_time_idx 
ON file_metadata(uploader_id, upload_time DESC);

-- 文件去重
CREATE INDEX file_metadata_md5_idx 
ON file_metadata(md5_hash);
```

---

## 🔒 安全最佳实践

### ✅ 必须做

1. **文件类型验证**: 严格限制 `allowedMimeTypes`
2. **文件大小限制**: 设置 `maxFileSize`
3. **权限检查**: 在每个API中验证用户权限
4. **SQL注入防护**: 使用 Drizzle ORM 参数化查询
5. **敏感信息保护**: 不要暴露 `storagePath`、密钥等

### ❌ 禁止做

1. **不要信任客户端**: 在服务端再次验证文件
2. **不要使用通配符**: `allowedMimeTypes: ['*']`
3. **不要拼接SQL**: 永远使用参数化查询
4. **不要在前端暴露密钥**: 使用环境变量
5. **不要忽略错误**: 完整的异常处理

**详细说明**: [快速参考 - 安全建议](./QUICK_REFERENCE.md#安全建议)

---

## ⚡ 性能优化

### 启用缓存

```typescript
const fileService = createUniversalFileService({
  cache: {
    enabled: true,
    metadataTTL: 3600,  // 1小时
    urlTTL: 1800,       // 30分钟
  },
});
```

### 启用CDN

```typescript
const fileService = createUniversalFileService({
  storage: {
    customDomain: 'https://cdn.yourdomain.com',
  },
  cdn: {
    enabled: true,
    domain: 'https://cdn.yourdomain.com',
  },
});
```

### 图片优化

```typescript
const metadata = await fileService.uploadFile({
  file: imageFile,
  needsProcessing: true,
  processingOptions: {
    type: 'image',
    format: 'webp',  // 使用 WebP
    quality: 85,
    width: 1200,
  },
});
```

**详细说明**: [快速参考 - 性能优化](./QUICK_REFERENCE.md#性能优化)

---

## 🐛 故障排查

### 问题：OSS上传失败

```bash
# 1. 检查环境变量
echo $OSS_ACCESS_KEY_ID
echo $OSS_BUCKET

# 2. 测试网络连接
ping oss-cn-hangzhou.aliyuncs.com

# 3. 验证权限
# 登录阿里云控制台检查 AccessKey 权限
```

### 问题：数据库查询不到文件

```typescript
// 检查持久化配置
const fileService = createUniversalFileService({
  persistence: {
    enabled: true,           // ✅ 必须启用
    repository: fileRepo,    // ✅ 必须配置
    autoPersist: true,       // ✅ 自动保存
  },
});
```

### 问题：CDN URL为空

```typescript
// 检查配置
const fileService = createUniversalFileService({
  storage: {
    customDomain: 'https://cdn.yourdomain.com',  // 设置自定义域名
  },
});
```

**详细说明**: [集成指南 - 故障排查](./INTEGRATION_GUIDE.md#故障排查)

---

## 📞 获取帮助

### 文档

- **完整集成指南**: [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)
- **示例代码**: [EXAMPLE_INTEGRATION.md](./EXAMPLE_INTEGRATION.md)
- **快速参考**: [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)

### 代码示例

- **服务端**: [examples/app/universal-file](../../examples/app/universal-file)
- **数据库**: [server/drizzle-schemas](./server/drizzle-schemas)

### 社区

- **问题反馈**: 提交 GitHub Issue
- **功能建议**: 提交 Feature Request

---

## 📝 检查清单

### 环境配置

- [ ] 安装依赖 (`ali-oss`, `drizzle-orm`, `sharp`)
- [ ] 配置环境变量（OSS、数据库）
- [ ] 创建数据库表
- [ ] 测试数据库连接
- [ ] 测试 OSS 连接

### 服务端集成

- [ ] 创建数据库 Schema
- [ ] 初始化文件服务
- [ ] 配置持久化仓储
- [ ] 创建上传 API
- [ ] 创建查询 API
- [ ] 创建删除 API
- [ ] 添加权限检查
- [ ] 添加错误处理

### 前端集成

- [ ] 集成 FileUploader 组件
- [ ] 或使用客户端 SDK
- [ ] 处理上传进度
- [ ] 处理上传错误
- [ ] 显示文件列表
- [ ] 实现文件删除

### 测试验证

- [ ] 测试文件上传
- [ ] 验证数据库存储
- [ ] 检查 OSS 文件
- [ ] 测试文件下载
- [ ] 测试文件删除
- [ ] 测试权限控制

### 生产部署

- [ ] 配置 CDN（可选）
- [ ] 启用缓存
- [ ] 配置监控
- [ ] 配置日志
- [ ] 设置定时清理任务
- [ ] 压力测试

---

## 🎉 开始使用

1. **阅读**: [集成指南](./INTEGRATION_GUIDE.md) 了解完整流程
2. **参考**: [示例代码](./EXAMPLE_INTEGRATION.md) 查看实际代码
3. **查阅**: [快速参考](./QUICK_REFERENCE.md) 快速查找代码片段
4. **实践**: 在你的项目中集成 UniversalFile 模块

祝你使用愉快！🚀

---

**版权**: MIT License © 2024  
**维护者**: Sa2kit Team
