# Business exports 收敛说明（R2-303 / R2-404）

> 2.0 alpha 起，npm `exports` 与 `tsup.entries.business.ts` 同步，**仅保留 profile-v1 仍直接 import 的 subpath**。

## 已从 npm exports 移除（源码仍保留于仓库，可本地 deep import 开发）

| 模块 | 移除的 subpath | 原因 |
|------|----------------|------|
| ar | `./ar` | profile-v1 使用 `sa2kit/mmd` AR 能力 |
| iflytek | `./iflytek*` | profile-v1 无直接引用 |
| bubbleShooter | `./bubbleShooter*` | 实验田已本地化 `src/modules/bubbleShooter` |
| calendar | `./calendar/core` 等 | 仅 `./calendar` 入口 |
| qqbot | `./qqbot` `./qqbot/core` `./qqbot/web` | 保留 `./qqbot/server` `./qqbot/ui/web` |
| screenReceiver | 除 `./screenReceiver` 外 | 页面仅用 Panel 入口 |
| festivalCard | miniapp/core/routes/web | 保留 index + server |
| mikuContest | 除 `./mikuContest/ui/web` 外 | 实验田单页引用 |
| huarongdao | `./huarongdao*` | 2.0.0 已迁 profile-v1，源码与 export 已删 |
| mikuFlick | `./mikuFlick*` | 2.0.0 已迁 profile-v1，源码与 export 已删 |
| mikuFireworks3D | `./mikuFireworks3D/server` | 无 profile-v1 引用 |

## 恢复导出

若其他 consumer 需要 deep subpath，在 `tsup.entries.business.ts` 追加 entry 后执行：

```bash
pnpm exports:sync && pnpm build:business
```
