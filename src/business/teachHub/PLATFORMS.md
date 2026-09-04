# teachHub — 多端支持矩阵（Phase F）

> npm 子路径：`sa2kit/business/teachHub/*`（camelCase）。  
> 模板：`festivalCard/PLATFORMS.md`

## 状态

| 端 | 入口 | 状态 | 说明 |
|----|------|------|------|
| **domain** | `sa2kit/business/teachHub/domain` | ✅ | 类型 + lessonProgress + ApiClient + parsers/templates（跨端 client） |
| **Server** | `sa2kit/business/teachHub/server` | ✅ | schema + TeachHubDbService（fileStore 注入） |
| **API routes** | `sa2kit/business/teachHub/routes` | ✅ | workspace/files/import/generate；OSS/AI 经 adapter 注入 |
| **AI tasks** | `server/tasks` | ✅ | `teach.generateLesson`；core 薄 re-export |
| **Web** | `sa2kit/business/teachHub/ui/web` | ✅ | T3：pages/layout/components；Auth 壳在 teach-hub-core |
| **RN** | `sa2kit/business/teachHub/ui/rn` | 🟡 | stub + re-export domain；mobile 自绘 UI 直引 domain |
| **Taro** | — | ⬜ | 暂无计划 |
| **Desktop** | teach-hub-desktop | 🟡 | Web 子集 / WebView |

## profile-v1 宿主

| 路径 | 职责 |
|------|------|
| `app_web/teach-hub` | 薄壳 + Docker |
| `app/api/teach-hub/*` | re-export + workspace 归属校验 |
| `@profile/teach-hub-core` | AuthProvider 壳 + 兼容导出；UI 自 sa2kit ui/web |

## UI 约定

- 动森 UI 经 `sa2kit/common/ui`（子应用 layout 已 load style）。
- 鉴权经 `sa2kit/common/auth`；宿主用 `@profile/auth/react` AuthProvider 包裹 TeachHubLayout。

## 后续

- [x] T2 server（routes ✅；AI tasks ✅）
- [x] T3 ui/web
- [x] T4 RN / mobile 改引 domain（ui/rn stub + domain re-export）
- [x] T5 删 core 冗余
