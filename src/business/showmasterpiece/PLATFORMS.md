# showmasterpiece — 多端支持矩阵（Phase G4）

> 大域体量大；F 波下沉 + G4 清零 `*-core`。

## 状态

| 端 | 入口 | 状态 | 说明 |
|----|------|------|------|
| **domain** | `sa2kit/business/showmasterpiece/domain` | ✅ | booking / popup / homeTab + bookingAccess |
| **Server** | `sa2kit/business/showmasterpiece/server` | ✅ | schema + DbService 全家桶 |
| **API routes** | `sa2kit/business/showmasterpiece/routes` | ✅ | booking + catalog + popup + site config + artwork image |
| **Web** | `sa2kit/business/showmasterpiece/ui/web` | ✅ | pages + client；Auth 壳在宿主 |
| **Miniapp** | `sa2kit/business/showmasterpiece/ui/miniapp` | ✅ | Taro UI + wechat deadline hook |
| **RN** | `sa2kit/business/showmasterpiece/ui/rn` | ⬜ | stub |

## profile-v1 宿主

| 路径 | 职责 |
|------|------|
| `app_web/showmasterpiece` | 薄 page + Docker + ThemeRoot |
| `app/api/showmasterpiece/*` | create*Handler + `lib/*HostRouteConfig` |
| `lib/` | OSS、fileUrl、rateLimit、bootstrapDb、Auth 壳 |

## UI 约定

- 强制 `sa2kit/common/ui` + admin；禁止 shadcn 新件。
