# festivalCard — 多端支持矩阵（Phase C 试点）

> 蓝图骨架：`domain/` + `server/` + `ui/{web,rn,taro}` + 宿主薄 re-export。

## 状态

| 端 | 入口 | 状态 | 说明 |
|----|------|------|------|
| **Web** | `sa2kit/business/festivalCard/ui/web` | ✅ | 3D 贺卡编辑/展示；alias `sa2kit/business/festivalCard` |
| **Server** | `sa2kit/business/festivalCard/server` | ✅ | drizzle schema + DbService |
| **API routes** | `sa2kit/business/festivalCard/routes` | ✅ | Next handler 工厂；鉴权由宿主 re-export 层负责 |
| **Taro** | `sa2kit/business/festivalCard/ui/taro` | 🟡 部分 | 小程序组件雏形；alias 旧路径 `miniapp/` |
| **RN** | `sa2kit/business/festivalCard/ui/rn` | ⬜ stub | 仅 export 占位；WebView 加载 web 为推荐过渡 |
| **domain** | `sa2kit/business/festivalCard/domain` | ✅ | 类型 + normalize（原 `core/`） |

## profile-v1 宿主

| 路径 | 职责 |
|------|------|
| `app/(pages)/testField/(sa2kit)/festivalCard/*` | 薄 page |
| `app/api/festivalCard/*` | re-export routes + **PUT/DELETE 管理员鉴权** |

## UI 约定

- 基础交互件逐步改用 `sa2kit/common/ui`（Button 等）；3D/canvas 域组件保留在 business。
- 禁止新增 `animal-island-ui` 或第二套 Modal/Button。

## 后续

- [ ] RN 原生 UI（非 stub）
- [ ] Taro 与 `ui/taro` 完全对齐并弃用 `miniapp/` 路径名
- [x] 页面内剩余原生 `<button>` 迁入门面 Button（PageRenderer 缩放柄除外）
