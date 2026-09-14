# 新宿主接入清单（启明星 · 接单弹药库）

> 目标：空的 Next.js / Expo / Taro 客户仓能在 **不复制 profile-v1 源码** 的前提下接入登录、OSS、主题与基础 UI。  
> 蓝图：`profile-v1/docs/code-review/libraries/BLUEPRINT-multiplatform-sa2kit.md` §0 / §3。

## 1. 安装

```bash
pnpm add sa2kit
# UI 设计系统：npm 包名为 @qhr123/sa2kit-ui-react，但门面 CSS/peer 期望作用域名 @sa2kit-ui/react
pnpm add '@sa2kit-ui/react@npm:@qhr123/sa2kit-ui-react@^0.1.7'
# 按能力选装其余 peer，见 sa2kit README「可选 peer 依赖」
```

> **勿只装 `@qhr123/sa2kit-ui-react`**：`import 'sa2kit/common/ui/style'` 会 `@import '@sa2kit-ui/react/style'`；缺少 `@sa2kit-ui/react` 别名时 Vite/Webpack 会 ENOENT。  
> 演练记录：[HOST-ONBOARDING-DRILL-H1-P1.md](./HOST-ONBOARDING-DRILL-H1-P1.md)。

| 宿主 | 额外 peer |
|------|-----------|
| Next.js Web | `react`, `react-dom`, `drizzle-orm`, `postgres`（若用文件服务） |
| Expo / RN | `react-native`；auth 见 `sa2kit/common/auth/rn` |
| Taro 小程序 | `@tarojs/taro`, `@tarojs/components`；OSS 需注入 fetch（见 [common-platform-adapters.md](./common-platform-adapters.md)） |

## 2. 环境变量（auth + OSS）

- Auth：见 [auth-env.md](./auth-env.md) — `AUTH_SECRET`、数据库 URL、可选 SMS/OAuth。  
- OSS / 文件：见 [UNIVERSAL_FILE_GUIDE.md](./UNIVERSAL_FILE_GUIDE.md) — 模块 bucket、endpoint、密钥经 env 或 bootstrap 注入，**禁止**硬编码 profile 域名。

## 3. UI / 主题（Web）

```tsx
// app/layout.tsx 或路由段 layout
import 'sa2kit/common/ui/style';
import { ThemeProvider } from 'sa2kit/common/ui';

export default function RootLayout({ children }) {
  return (
    <ThemeProvider defaultTheme="animal-island">
      {children}
    </ThemeProvider>
  );
}
```

- **禁止**直连 `@sa2kit-ui/react`（宿主应走 `sa2kit/common/ui*` 门面）。  
- RN：`sa2kit/common/ui/rn` + 宿主 link `@sa2kit-ui/rn`。

## 4. 登录（Next.js 示例）

**库内**：session / hooks 在 `sa2kit/common/auth`；弹窗视觉在 `sa2kit/common/ui/auth`。

**宿主**：

1. 配置 `createAuthFromEnv` 或等价 bootstrap（`sa2kit/common/auth/server`）。  
2. 挂载 `app/api/auth/[...all]/route.ts` 转发 Better Auth handler。  
3. 页面使用 `AuthProvider` + `AuthGuard`（可封装为 `@your-app/auth` 薄包，参照 profile `@profile/auth`）。  
4. **鉴权门禁在宿主**：API route 内 `getApiSessionUser` / `isAdminRole`；库内 admin UI 不自带生产鉴权。

## 5. OSS / 文件上传

```ts
import { createWebPlatformAdapter, configureOssFileFromPlatform } from 'sa2kit/common/platform';
import { uploadModuleFile } from 'sa2kit/common/file';

const platform = createWebPlatformAdapter();
configureOssFileFromPlatform(platform);
await uploadModuleFile({ file, moduleId: 'your-module' });
```

服务端文件平台：`sa2kit/common/file/server` + 宿主 drizzle 实例注入 DbService。

## 6. 可选 business 域

```ts
import { FestivalCardManagedPage } from 'sa2kit/business/festivalCard/ui/web';
// 或经稳定 alias：sa2kit/business/festivalCard
```

各域端支持见 `src/business/<feature>/PLATFORMS.md`。

## 7. 宿主职责矩阵（摘要）

| 宿主写什么 | 宿主不写什么 |
|------------|--------------|
| 薄 page、API re-export、env/bootstrap | 第二套 Button/Modal/登录 UI |
| 路由 Guard、管理员 API 鉴权 | 复制 business DbService |
| 品牌主题配置（ThemeProvider） | animal-island-ui / 同功能手写基础件 |

## 8. 验收（启明星判定）

- [x] 新仓 `pnpm build` 通过，无 profile 私有路径 import — 见 [HOST-ONBOARDING-DRILL-H1-P1.md](./HOST-ONBOARDING-DRILL-H1-P1.md)（2026-09-14）  
- [~] 登录 + 登出 + 受保护页可访问 — auth entry resolve OK；E2E 仍以 profile-v1 验证场为准  
- [~] 至少一次 OSS 上传（或 stub env） — file/platform resolve OK；实传 stub  
- [x] 基础 UI 经 `sa2kit/common/ui`，样式随消费边界加载  
- [x] 文档：本清单 + [COMMON-PLATFORMS-EXPORTS.md](./COMMON-PLATFORMS-EXPORTS.md) + H1-P1 演练记录  

（`[~]` = 契约可达、完整宿主 E2E 未在空目录重复建设）

## 参考宿主

- **profile-v1 Web**：首个完整验证场（`app_web/web`）  
- **sa2kit-ui demo**：`apps/demo-web` / `demo-rn` / `demo-taro`
