# Common Platform Adapters（R2-221 / R2-222 / R2-223）

> 跨平台运行时抽象：`storage`、`fetch`、`filePick`，供 Web / Taro / Electron / Hono 等消费方注入。

## 入口

```ts
import {
  createWebPlatformAdapter,
  createNodeHonoPlatformAdapter,
  configureOssFileFromPlatform,
} from 'sa2kit/common/platform';

import { uploadModuleFile } from 'sa2kit/common/file';
```

## PlatformAdapter 结构

| 字段 | 类型 | 说明 |
|------|------|------|
| `storage` | `StorageAdapter` | 本地 KV（token、偏好等） |
| `fetch` | `RequestAdapter` | JSON HTTP（非 multipart） |
| `filePick?` | `FilePickAdapter` | 文件选择（可选） |

## 官方骨架

| 平台 | 工厂函数 | 说明 |
|------|----------|------|
| Web / Next.js CSR | `createWebPlatformAdapter()` | WebStorage + WebRequest + `<input type="file">` |
| Hono / Node | `createNodeHonoPlatformAdapter()` | 内存 storage + 全局 fetch |
| Taro 小程序 | `createTaroPlatformAdapter(partial)` | **需宿主注入** Taro storage / request |
| Electron | `createElectronPlatformAdapter()` | ElectronStorage + Web fetch |

### Web 示例

```ts
const platform = createWebPlatformAdapter();
configureOssFileFromPlatform(platform);

await uploadModuleFile({
  file,
  moduleId: 'portfolio',
});
```

### Hono SSR 示例

```ts
const platform = createNodeHonoPlatformAdapter();
configureOssFileFromPlatform(platform, {
  // Node 18+ 原生 fetch 可处理 FormData 上传
  uploadFetch: fetch,
});
```

### Taro 示例（需自行桥接 multipart）

```ts
import Taro from '@tarojs/taro';

const taroFetch: OssFileFetchFn = async (url, init) => {
  if (init?.body instanceof FormData) {
    const entry = init.body.entries().next().value;
    const tempPath = entry?.[1] as string; // 宿主需先把 file 写入临时路径
    const upload = await Taro.uploadFile({
      url,
      filePath: tempPath,
      name: 'file',
    });
    return new Response(upload.data, { status: upload.statusCode });
  }
  const res = await Taro.request({ url, method: init?.method ?? 'GET' });
  return new Response(JSON.stringify(res.data), { status: res.statusCode });
};

configureOssFileHttp({ fetch: taroFetch });
```

## ossFile HTTP 注入（R2-223）

| API | 用途 |
|-----|------|
| `configureOssFileHttp({ fetch })` | 直接注入兼容 fetch |
| `configureOssFileFromPlatform(platform, { uploadFetch? })` | 从 PlatformAdapter 派生：JSON 走 adapter，FormData 走 `uploadFetch` |
| `createOssFileFetchFromAdapter(adapter)` | 仅桥接 JSON 请求 |
| `uploadModuleFile({ fetch })` | 单次调用覆盖全局配置 |

## 依赖方向

```text
common/platform  →  storage / request 适配器
common/file      →  platform/types（类型）+ ossFile httpClient
business/*       →  可依赖 common/platform、common/file
```

## 相关文档

- [REFACTOR_2.0_BACKLOG.md](./REFACTOR_2.0_BACKLOG.md) — R2-221 ~ R2-224
- [UNIVERSAL_FILE_GUIDE.md](./UNIVERSAL_FILE_GUIDE.md)
