# nodeNotes — 多端支持矩阵（Phase G7）

> 蓝图骨架：`domain/` + `server/` + `routes/` + `ui/web` + 宿主薄壳。  
> 模板：`calendar/PLATFORMS.md`

## 状态

| 端 | 入口 | 状态 | 说明 |
|----|------|------|------|
| **domain** | `sa2kit/business/nodeNotes/domain` | ✅ | 类型、slug、样式、导入导出、API client |
| **Server** | `sa2kit/business/nodeNotes/server` | ✅ | schema + NodeNotesDbService 工厂；无 auth FK |
| **API routes** | `sa2kit/business/nodeNotes/routes` | ✅ | handler 工厂；session 经宿主注入 |
| **Web** | `sa2kit/business/nodeNotes/ui/web` | ✅ | Gallery/Canvas；Auth 壳在 `app_web/node-notes/lib` |
| **RN** | — | ⬜ | 暂无计划 |
| **Taro** | — | ⬜ | 暂无计划 |

## profile-v1 宿主

| 路径 | 职责 |
|------|------|
| `app_web/node-notes` | 薄 page + Docker |
| `app_web/node-notes/lib` | AuthProvider 壳 + hostRouteConfig |
| `app_web/node-notes/app/api/node-notes/*` | 直连 sa2kit routes + session 鉴权 |

## UI 约定

- 画布依赖 `@xyflow/react`；Markdown 预览用 `react-markdown`。
- 鉴权：页面内 `AuthGuard`（`sa2kit/common/auth/components`）；宿主 `AuthProvider`。
- 禁止 `@profile/*` 进入 sa2kit。

## 后续

- [x] G7：迁入 sa2kit；删除 `@profile/node-notes-core`
