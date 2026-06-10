# sa2kit/ossFile

OSS 文件上传 / 下载 / 删除的**统一入口**，内部基于 `universalFile` 实现，不重复维护第二套 OSS SDK 逻辑。

## 为什么有 ossFile 而不是直接用 universalFile？

| 层级 | 职责 |
|------|------|
| `universalFile` | 完整文件平台（多存储、DB 元数据、处理器、UI 组件） |
| `ossFile` | **对外推荐 API**：OSS 配置合并、上传路径生成、浏览器 FormData 上传、fileId → URL |

业务代码（如 ShowMasterpiece）只依赖 `sa2kit/ossFile`，不再复制 `getShowMasterpieceFileConfig` / `uploadArtworkImage` 等。

## 服务端

```typescript
import {
  createOssFileConfigManagerFromEnv,
  createUniversalFileServiceFromConfigManager,
  getFileUrlByFileId,
  resolveFileUrlMap,
} from 'sa2kit/ossFile/server';

const configManager = await createOssFileConfigManagerFromEnv();
const url = await getFileUrlByFileId(fileId, { configManager });
```

## 浏览器端

```typescript
import { uploadArtworkImage, getArtworkImageUrl } from 'sa2kit/ossFile';

const { fileId, accessUrl } = await uploadArtworkImage(file, collectionId);
const url = await getArtworkImageUrl(fileId);
```

## 与 universalFile 的关系

- **保留** `sa2kit/universalFile` 作为底层实现与 DB 持久化
- **新增** `sa2kit/ossFile` 作为业务侧 SSOT，避免各模块重复封装
