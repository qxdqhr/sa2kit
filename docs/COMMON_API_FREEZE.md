# Common API 冻结清单（R2-601）

> **状态**：alpha.8 起进入 **review 冻结候选**；`2.0.0-beta.0` 发布后本清单视为 semver 契约。  
> breaking 变更仅允许 major（`3.0.0`）或事先在本文件登记 deprecation 周期。

## 冻结范围：`sa2kit/common/*`

### logger

- `createLogger`, `logger`, `LogLevel`
- 子路径：`sa2kit/common/logger`

### utils / storage / request

- 1.x 等价导出，路径前缀改为 `common/`

### file（SSOT）

| API | 说明 |
|-----|------|
| `uploadModuleFile` | 浏览器 FormData 上传 |
| `configureOssFileHttp` / `configureOssFileFromPlatform` | fetch 注入 |
| `createOssFileBootstrap` | 服务端初始化 |
| `createFileUrlResolver` | fileId → URL |
| `resolveUploadFolderPath` | 路径解析 |
| `fileMetadata` 等 schema 表 | `common/file/schema` |

子路径：`common/file`、`common/file/server`、`common/file/schema`

### auth（新 API）

- `DrizzleAuthService`, routes handlers, `useAuth`, `BaseApiClient`
- 子路径：`common/auth`、`common/auth/server`
- **不含** `auth/legacy`（business，可变）

### export

- `sa2kit/common/export`、`common/export/server`

### platform

- `PlatformAdapter`, `createWebPlatformAdapter`, `createNodeHonoPlatformAdapter` 等
- 子路径：`common/platform`

## 非冻结（alpha 内可 breaking）

- `sa2kit/business/*` 及 legacy business subpath（calendar、mmd…）
- `sa2kit/auth/legacy/*`
- `sa2kit/components`（整包 UI，待迁出）

## beta 前检查项

- [x] exports 自动生成 + CI `exports:verify`
- [x] `smoke:exports` common 子路径
- [x] `smoke:file-api` bootstrap 冒烟
- [x] browser entry 无 `postgres` / `ali-oss` 静态引用
- [ ] profile-v1 锁定 `^2.0.0-alpha.8` 并跑通 smoke-file-api
- [ ] 本文件与 `MIGRATION_1.x_to_2.0.md` 随 beta 发布同步

## 变更流程

1. 在本文件或 CHANGELOG 登记 deprecation（至少一个 alpha 周期）
2. 更新 `MIGRATION_1.x_to_2.0.md`
3. major 或 beta 标签发布
