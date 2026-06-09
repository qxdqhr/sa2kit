# 从 sa2kit 1.x 迁移到 2.0

> 目标读者：profile-v1 及其他消费方维护者  
> 对应 backlog：**R2-603**  
> SSOT 进度：[REFACTOR_2.0_BACKLOG.md](./REFACTOR_2.0_BACKLOG.md)

## 1. 版本与安装

| 阶段 | 依赖写法 | 说明 |
|------|----------|------|
| 1.6.x 维护线 | `sa2kit@^1.6.0` | 仅 critical fix，无新特性 |
| 2.0 alpha | `sa2kit@^2.0.0-alpha.8` | 当前推荐联调/预发 |
| 2.0 beta+ | `sa2kit@^2.0.0-beta.0` | common API 冻结后 |
| 2.0 stable | `sa2kit@^2.0.0` | 生产默认可用 |

```bash
pnpm add sa2kit@^2.0.0-alpha.8
```

**本地联调 sa2kit 源码**（可选，勿写入生产 `package.json`）：

```json
{
  "pnpm": {
    "overrides": {
      "sa2kit": "file:../sa2kit"
    }
  }
}
```

安装后默认仅构建 **common**（`prepare → build:common`）。需要 business subpath 时：

```bash
cd ../sa2kit && SA2KIT_WITH_BUSINESS=1 pnpm install
```

## 2. 架构变化（一句话）

1.x 单体工具库 → 2.x **`common`（可复用基础设施）** + **`business`（产品域，逐步迁出）**。

## 3. import 路径对照

### 3.1 推荐迁移（common）

| 1.x | 2.0 推荐 | 备注 |
|-----|----------|------|
| `sa2kit/logger` | `sa2kit/common/logger` | 旧路径仍可用 |
| `sa2kit/utils` | `sa2kit/common/utils` | |
| `sa2kit/storage` | `sa2kit/common/storage` | |
| `sa2kit/request` | `sa2kit/common/request` | |
| `sa2kit/ossFile` | `sa2kit/common/file` | **文件 SSOT** |
| `sa2kit/ossFile/server` | `sa2kit/common/file/server` | 含 bootstrap、schema |
| `sa2kit/universalFile` | `sa2kit/common/file` | 客户端仍 re-export |
| `sa2kit/universalFile/server` | `sa2kit/common/file/server` | |
| `sa2kit/universalExport` | `sa2kit/common/export` | |
| `sa2kit/auth/schema` 等新内核 | `sa2kit/common/auth` | browser |
| `sa2kit/auth/server` 等 | `sa2kit/common/auth/server` | node |

### 3.2 条件 exports（browser / node）

以下 subpath 带 `browser` / `node` 条件，**勿在 client 组件静态 import server**：

- `sa2kit/common/file`
- `sa2kit/common/auth`
- `sa2kit/common/export`
- `sa2kit/ossFile`（legacy alias）

### 3.3 已删除 / deprecated

| 路径 | 2.0 状态 |
|------|----------|
| `sa2kit/showmasterpiece/*` | **已删除**（alpha.3）；迁回 profile-v1 本地模块 |
| `sa2kit/bubbleShooter/*` | export 已移除；profile-v1 本地化 |
| `sa2kit/huarongdao` | deprecated，计划 alpha.9 移除 export |
| `sa2kit/mikuFlick` | deprecated，计划 alpha.10 移除 export |
| `sa2kit/auth/legacy/*` | 迁至 business；路径 shim 仍可用 |

详见 [business-deprecated-exports.md](./business-deprecated-exports.md)。

## 4. Breaking 变更清单

### 4.1 文件子系统

- ❌ `globalThis.__sa2kitShowmasterpieceResolveFileUrl` 已移除  
  ✅ 使用 `createFileUrlResolver()` / `OssFileBootstrap.getFileUrl()`
- ✅ `createOssFileBootstrap({ loadEnv })` 服务端一站式初始化
- ✅ `uploadModuleFile` 统一 `folderPath` / `customPath`
- ✅ `configureOssFileFromPlatform()` 跨平台 fetch 注入（Taro / Hono）
- ✅ Drizzle 表结构：`sa2kit/common/file/schema`

### 4.2 认证

- 新 API：`sa2kit/common/auth`、`sa2kit/common/auth/server`
- Legacy UI / 手机号 RN：`sa2kit/auth/legacy`、`sa2kit/auth/rn`（business 构建）
- `common/auth/rn` 仅含 `initRnAuthClient` 等；`RnAccountLoginForm` 在 auth/rn

### 4.3 Analytics / ScreenReceiver

- ❌ `globalThis.__analytics__`  
  ✅ `registerAnalytics()` / `getRegisteredAnalytics()`
- ❌ `globalThis.__sa2kit_screen_receiver_wss__`  
  ✅ `registerScreenReceiverForNext({ registryKey })`

### 4.4 构建体积

- `pnpm build:common` ≈ 1.8MB dist（较 1.x 全量下降 ≥80%）
- exports 从 ~538 收敛至 ~89（自动生成，见 `pnpm exports:verify`）

## 5. 分步迁移流程

```text
1. 升级依赖 → sa2kit@^2.0.0-alpha.8
2. 替换 import → common/*（§3.1）
3. 文件 API → createOssFileBootstrap + common/file（删除 universalFile 直连）
4. 删除 sa2kit/showmasterpiece 等已迁回模块的 import
5. pnpm build && pnpm smoke:exports（sa2kit 侧）/ smoke 脚本（应用侧）
6. 锁定 alpha 范围，待 beta 再升 ^2.0.0-beta.0
```

## 6. profile-v1 专项

消费方清单：[profile-v1/docs/sa2kit-2.0-migration.md](../profile-v1/docs/sa2kit-2.0-migration.md)

冒烟：

```bash
# profile-v1 运行时（需 dev server）
./scripts/smoke-file-api.sh

# sa2kit 包内（无需 HTTP）
pnpm smoke:file-api   # vitest 集成测试
```

## 7. 相关文档

- [COMMON_API_FREEZE.md](./COMMON_API_FREEZE.md) — beta 前 API 冻结范围
- [common-platform-adapters.md](./common-platform-adapters.md)
- [UNIVERSAL_FILE_GUIDE.md](./UNIVERSAL_FILE_GUIDE.md)
- [CHANGELOG.md](../CHANGELOG.md)
