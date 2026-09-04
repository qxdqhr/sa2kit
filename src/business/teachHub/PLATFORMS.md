# teachHub — 多端支持矩阵（Phase F）

> npm 子路径：`sa2kit/business/teachHub/*`（camelCase）。  
> 模板：`festivalCard/PLATFORMS.md`

## 状态

| 端 | 入口 | 状态 | 说明 |
|----|------|------|------|
| **domain** | `sa2kit/business/teachHub/domain` | ✅ | Workspace / Lesson / Mission / Progress 类型 + lessonProgress 纯函数 |
| **Server** | `sa2kit/business/teachHub/server` | 🟡 | schema 已下沉；DbService/OSS/AI routes 仍 core（T2 续） |
| **Web** | `sa2kit/business/teachHub/ui/web` | ⬜ | T3 |
| **RN** | `sa2kit/business/teachHub/ui/rn` | 🟡 stub | mobile 仍用 core/shared 过渡 |
| **Taro** | — | ⬜ | 暂无计划 |
| **Desktop** | teach-hub-desktop | 🟡 | Web 子集 / WebView |

## profile-v1 宿主

| 路径 | 职责 |
|------|------|
| `app_web/teach-hub` | 薄壳 + Docker |
| `app/api/teach-hub/*` | re-export + workspace 归属校验 |
| `@profile/teach-hub-core` | 过渡；types / lessonProgress 已 re-export domain |

## UI 约定

- 动森 UI 经 `sa2kit/common/ui`（子应用 layout 已 load style）。

## 后续

- [ ] T2 server
- [ ] T3 ui/web
- [ ] T4 RN / mobile 改引 domain
- [ ] T5 删 core 冗余
