# HOST-ONBOARDING 空目录演练（Phase H · H1-P1）

> **日期**：2026-09-14  
> **环境**：macOS · Node · pnpm · 空目录 `/tmp/sa2kit-host-onboarding-drill-20260914`  
> **依赖**：npm 已发布 `sa2kit@3.9.4` + `@qhr123/sa2kit-ui-react@0.1.7`（**非** profile workspace）  
> **清单**：对照 [HOST-ONBOARDING.md](./HOST-ONBOARDING.md) §1–§8

## 1. 步骤摘要

1. `mkdir` 空目录，Vite + React 最小宿主（模拟客户仓，无 `@profile/*` / `app_web` / `host`）。  
2. `pnpm add sa2kit@^3.9.4 @qhr123/sa2kit-ui-react@^0.1.7` → **仅此不足**（见 §2）。  
3. 补装别名：`pnpm add '@sa2kit-ui/react@npm:@qhr123/sa2kit-ui-react@^0.1.7'`。  
4. 页面：`import 'sa2kit/common/ui/style'` + `ThemeProvider` / `Button` / `Title` from `sa2kit/common/ui`。  
5. `pnpm build`（Vite production）。

## 2. 验收对照（§8）

| 项 | 结果 | 说明 |
|----|------|------|
| 新仓 `pnpm build`，无 profile 私有路径 | ✅ | 源码无 `@profile/`；build 在补装 `@sa2kit-ui/react` 别名后通过 |
| 登录 + 登出 + 受保护页 | 🟡 | entry 可 resolve：`sa2kit/common/auth`、`…/client`、`…/react`、`…/server`。完整 Better Auth + DB **未**在空目录起库；仍以 profile-v1 为首个实战验证场 |
| OSS 上传或 stub | 🟡 | `sa2kit/common/file/client`、`sa2kit/common/platform` resolve OK；未配真实 OSS env（按文档允许 stub） |
| UI 经 `sa2kit/common/ui` | ✅ | 门面可用；样式随消费边界加载 |
| 文档 | ✅ | 本文件 + 已修正 [HOST-ONBOARDING.md](./HOST-ONBOARDING.md) §1 安装命令 |

## 3. 发现的接单摩擦（须修文档 / 下版发布）

1. **UI peer 包名双轨**：门面 CSS `@import '@sa2kit-ui/react/style'`，npm 作用域却是 `@qhr123/sa2kit-ui-react`。客户若只 `pnpm add @qhr123/sa2kit-ui-react`，Vite 对 `sa2kit/common/ui/style` 报 **ENOENT**。  
   - **缓解（已写入 HOST-ONBOARDING）**：显式安装 `@sa2kit-ui/react@npm:@qhr123/sa2kit-ui-react@^0.1.7`。  
2. **发布面滞后**：npm `3.9.4` 的 `exports` 无 `sa2kit/business/festivalCard/ui/web`（本地 HEAD 已有）；空目录只能 `sa2kit/business/festivalCard` 聚合路径。下一版 publish 需带齐 ui 子路径。  
3. **包体警告**：最小 UI 页 Vite 产物约 **JS 8.8MB / CSS 1.3MB**（未做按需拆包）→ 强化「禁止 `sa2kit` / `business` 根 import」纪律；**E2/E3 npm 分包仍后置**（见 [PACKAGE-SPLIT-ROADMAP.md](./PACKAGE-SPLIT-ROADMAP.md) H1-E）。

## 4. 结论

- **H1-P1 门禁：通过（有条件）** — 空目录可按修正后的安装命令接入 UI；auth/OSS 契约可 resolve，E2E 登录/上传仍依赖宿主 env + DB（profile 验证场已覆盖）。  
- **模板仓 `profile-customer-template`**：按蓝图 §15 仍 **后置**。  
- **后续**：下次 `sa2kit` npm publish 带上 festivalCard `ui/*` exports；评估是否在 `style.css` 或 peer 元数据层消掉双轨包名。
