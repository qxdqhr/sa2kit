# showmasterpiece — 多端支持矩阵（Phase F）

> 大域体量大；按 SMP1→SMP3 分波。

## 状态

| 端 | 入口 | 状态 | 说明 |
|----|------|------|------|
| **domain** | `sa2kit/business/showmasterpiece/domain` | 🟡 | booking / popup + bookingAccess；全集类型仍在 `*-core` |
| **Server** | `sa2kit/business/showmasterpiece/server` | 🟡 | schema ✅；DbService / routes ⬜ |
| **Web** | `sa2kit/business/showmasterpiece/ui/web` | ⬜ | SMP2 |
| **RN** | `sa2kit/business/showmasterpiece/ui/rn` | ⬜ | 暂无 RN 计划 |
| **Taro** | — | ⬜ | 历史小程序不恢复 |

## profile-v1 宿主

| 路径 | 职责 |
|------|------|
| `app_web/showmasterpiece` | 薄 page + Docker + ThemeRoot |
| `app/api/*` | re-export + 鉴权 Guard |
| `@profile/showmasterpiece-core` | schema 已 re-export sa2kit；DbService 仍 core |

## UI 约定

- 强制 `sa2kit/common/ui` + admin；禁止 shadcn 新件。

## 后续

- [x] schema 下沉 + `@profile/db` 聚合
- [ ] DbService / route 工厂
- [ ] SMP2 ui/web
- [ ] SMP3 删 core 冗余 / 可选独立 npm
