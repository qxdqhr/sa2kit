# Common 模块按端导出表（Phase B）

> 消费方选子路径时对照本表；缺端标 **unsupported**，勿假设全家桶可用。  
> UI 门面见 `sa2kit/common/ui*`（Phase U 已统一）；本表覆盖 **非 UI** common。

## 图例

| 标记 | 含义 |
|------|------|
| ✅ | 已有 export + 实现 |
| 🟡 | 部分实现 / 需宿主注入 adapter |
| ⬜ | unsupported（2.x 未承诺） |

## auth

| 子路径 | Web | Server (Node/Next API) | RN | Taro | Electron |
|--------|-----|------------------------|----|------|----------|
| `sa2kit/common/auth` | ✅ 聚合 | ✅ | 🟡 | ⬜ | ✅ 同 Web |
| `…/client` | ✅ | ⬜ | 🟡 | ⬜ | ✅ |
| `…/react` | ✅ | ⬜ | ⬜ | ⬜ | ✅ |
| `…/components` | ✅ | ⬜ | ⬜ | ⬜ | ✅ |
| `…/hooks` | ✅ | ⬜ | ⬜ | ⬜ | ✅ |
| `…/rn` | ⬜ | ⬜ | ✅ | ⬜ | ⬜ |
| `…/server` | ⬜ | ✅ | ⬜ | ⬜ | ⬜ |
| `…/schema` | ⬜ | ✅ | ⬜ | ⬜ | ⬜ |

**说明**：Taro 小程序暂无独立 auth 入口；可 WebView 壳 + Web auth，或 2.1 评估 `…/taro` stub。

## file / OSS

| 子路径 | Web | Server | RN | Taro | Electron |
|--------|-----|--------|----|------|----------|
| `sa2kit/common/file` | ✅ 客户端上传 | 🟡 条件导出 | 🟡 | 🟡 | ✅ 同 Web |
| `…/client` | ✅ | ⬜ | 🟡 | 🟡 | ✅ |
| `…/server` | ⬜ | ✅ DbService + OSS | ⬜ | ⬜ | ⬜ |
| `…/schema` | ⬜ | ✅ drizzle 表 | ⬜ | ⬜ | ⬜ |
| `sa2kit/common/platform` | ✅ Web adapter | ✅ Node/Hono | ⬜ | 🟡 需注入 | 🟡 |

**说明**：Taro/RN 上传须 `configureOssFileHttp({ fetch })` 桥接 multipart，见 [common-platform-adapters.md](./common-platform-adapters.md)。

## config

| 子路径 | Web | Server | RN | Taro | Electron |
|--------|-----|--------|----|------|----------|
| `sa2kit/common/config` | ✅ | 🟡 | ⬜ | ⬜ | ✅ |
| `…/bootstrap` | ✅ | ✅ | ⬜ | ⬜ | ✅ |
| `…/server` | ⬜ | ✅ | ⬜ | ⬜ | ⬜ |

## aiApi

| 子路径 | Web | Server | RN | Taro | Electron |
|--------|-----|--------|----|------|----------|
| `sa2kit/common/aiApi` | ✅ | 🟡 | ⬜ | ⬜ | ✅ |
| `…/client` | ✅ | ⬜ | ⬜ | ⬜ | ✅ |
| `…/server` | ⬜ | ✅ 任务编排 | ⬜ | ⬜ | ⬜ |

## ui（门面，摘要）

| 子路径 | Web | RN | Taro | Electron |
|--------|-----|----|------|----------|
| `sa2kit/common/ui` | ✅ | ⬜ | ⬜ | ⬜ |
| `…/rn` | ⬜ | ✅ | ⬜ | ⬜ |
| `…/style` | ✅ | ⬜ | ⬜ | ✅ |

完整 UI 矩阵见 profile `UI-UNIFICATION-PLAN.md`。

## 宿主引用速查

```
Next.js 客户仓典型组合：
  sa2kit/common/auth/server + common/auth/react + common/ui
  sa2kit/common/file/server   + common/file + common/platform
  sa2kit/common/config/bootstrap
  sa2kit/common/aiApi/server  + common/aiApi/client（若用 AI）
```

## 维护

- 新增 common 子模块时更新本表 + `package.json` exports。  
- 中长期：CI 校验 PLATFORMS 与 exports 一致（蓝图 §9）。
