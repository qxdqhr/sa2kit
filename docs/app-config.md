# AppConfig：统一 YAML 配置 + SOPS

所有启动级与业务配置（数据库、Auth/SMS、OSS、模块 business 节等）使用 **一份 YAML**，由 `sa2kit/common/config/bootstrap` 加载。

## `business` 节（profile-v1 等宿主）

```yaml
business:
  homePage: {}          # 首页 JSON，缺省用代码默认值
  huarongdao:
    theme: miku
    bgmTracks: []
  qiniu:
    accessKey: ""
    secretKey: ""
    bucketName: ""
    domain: ""
```

运行时写入 YAML 由宿主项目实现（如 profile-v1 的 `src/lib/config/persist-app-config.ts`）。

## 文件约定

| 文件 | Git | 用途 |
|------|-----|------|
| `config/app.config.example.yaml` | ✅ | 模板（无真实密钥） |
| `config/app.config.local.yaml` | ❌ gitignore | 本地开发明文 |
| `config/production.enc.yaml` | ✅ SOPS 密文 | 生产配置版本化 |
| `config/app.config.production.yaml` | ❌ | 运行时明文（`sops -d` 生成，或服务器维护） |

## 加载

```typescript
import { loadAppConfig } from 'sa2kit/common/config/bootstrap';

const config = loadAppConfig(); // 校验 + 同步 process.env + doctor 报告
```

环境变量：

- `APP_CONFIG_PATH` — 显式指定 YAML 路径
- `APP_CONFIG_ENV` — `local` | `production` | `test`

## Auth

```typescript
import { createSa2kitAuthFromAppConfig } from 'sa2kit/common/auth/server';

export const auth = createSa2kitAuthFromAppConfig({ db });
```

## CLI

```bash
pnpm config:doctor
pnpm config:doctor config/app.config.local.yaml
```

## SOPS 工作流

见宿主项目 `config/README.md` 与 `scripts/config-sops-init.sh`。
