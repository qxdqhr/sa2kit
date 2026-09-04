# showmasterpiece — 多端支持矩阵（Phase F）

> 大域体量大；按 SMP1→SMP3 分波。

## 状态

| 端 | 入口 | 状态 | 说明 |
|----|------|------|------|
| **domain** | `sa2kit/business/showmasterpiece/domain` | 🟡 | booking / popup / homeTab + bookingAccess；全集类型仍在 `*-core` |
| **Server** | `sa2kit/business/showmasterpiece/server` | 🟡 | schema ✅；booking + popup/config/basic + collections/artworks DbService ✅ |
| **API routes** | `sa2kit/business/showmasterpiece/routes` | ✅ | booking + catalog + popup + site config / config items；image 仍宿主 |
| **Web** | `sa2kit/business/showmasterpiece/ui/web` | ⬜ | SMP2 |
| **RN** | `sa2kit/business/showmasterpiece/ui/rn` | ⬜ | 暂无 RN 计划 |
| **Taro** | — | ⬜ | 历史小程序不恢复 |

## profile-v1 宿主

| 路径 | 职责 |
|------|------|
| `app_web/showmasterpiece` | 薄 page + Docker + ThemeRoot |
| `app/api/showmasterpiece/bookings*` | core 薄 → sa2kit handlers（限流 / DB refresh 注入） |
| `@profile/showmasterpiece-core` | DbService 经 `initializeShowmasterpieceDb` 注入；实现在 sa2kit |

## UI 约定

- 强制 `sa2kit/common/ui` + admin；禁止 shadcn 新件。

## 后续

- [x] schema 下沉 + `@profile/db` 聚合
- [x] booking Query/Command + 全套 booking route 工厂
- [x] popup / config / basic（categories·tags·site config）DbService
- [x] `collectionsDbService` / `artworksDbService`（宿主注入 db + fileUrlResolver）
- [ ] SMP2 ui/web
- [ ] SMP3 删 core 冗余 / 可选独立 npm
