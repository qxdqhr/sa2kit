# calendar — 多端支持矩阵（Phase F）

> 蓝图骨架：`domain/` + `server/` + `ui/{web,rn}` + 宿主薄 re-export。  
> 模板：`festivalCard/PLATFORMS.md`

## 状态

| 端 | 入口 | 状态 | 说明 |
|----|------|------|------|
| **domain** | `sa2kit/business/calendar/domain` | ✅ | 类型、dateUtils、纯 eventDisplay、ApiClient |
| **Server** | `sa2kit/business/calendar/server` | ✅ | schema + CalendarDbService 工厂 |
| **API routes** | `sa2kit/business/calendar/routes` | ✅ | handler 工厂；session 经宿主注入 |
| **Web** | `sa2kit/business/calendar/ui/web` | ✅ | C3：pages/components/hooks；Auth 壳在 calendar-core |
| **RN** | `sa2kit/business/calendar/ui/rn` | ⬜ stub | 仅占位 export |
| **Taro** | — | ⬜ | 暂无计划 |

## profile-v1 宿主

| 路径 | 职责 |
|------|------|
| `app_web/calendar` | 薄 page + Docker |
| `app_web/calendar/app/api/calendar/*` | re-export + session 鉴权 |
| `@profile/calendar-core` | AuthProvider 壳 + 兼容导出；UI 自 sa2kit ui/web |

## UI 约定

- 基础件经 `sa2kit/common/ui`；禁止 animal-island / 第二套 Button-Modal。
- 鉴权组件经 `sa2kit/common/auth`；宿主用 `@profile/auth/react` AuthProvider 包裹 CalendarPage。
- 事件 surface CSS 在 `ui/web/calendarStyles`，domain 只导出 `resolveEventSurfaceKey`。

## 后续

- [x] C2 server
- [x] C3 ui/web
- [ ] C4 RN 非 stub
- [ ] C5 删 core 冗余 components/hooks
