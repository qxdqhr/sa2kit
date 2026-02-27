# SA2Kit 项目概况与模块分析（群公告草案）

更新时间：2026-02-27
仓库：`sa2kit`（npm: `@qhr123/sa2kit`）
当前版本：`1.6.60`

## 1. 项目定位

SA2Kit 是一个多模块 TypeScript SDK，核心目标是提供跨端（Web/Node/小程序/Electron/RN）可复用的通用能力与业务组件。

- 技术形态：TypeScript + React 组件 + Server 侧能力（按子路径导出）
- 发布形态：单仓库多模块、按 `exports` 子路径消费
- 构建形态：`tsup` 打包，产出 `esm/cjs + d.ts`

一句话：这是一个“工具层 + 服务层 + 业务组件层”并存的 SDK 聚合仓库。

## 2. 当前规模与工程状态

### 2.1 规模快照

- `package.json` 子路径导出：65 个（含根导出）
- `src` 下 TS/TSX 文件：614 个
- `tests` 测试文件：10 个
- 主要大模块（按文件数量粗略统计）：
  - `showmasterpiece`（88）
  - `mmd`（77）
  - `auth`（46）
  - `universalFile`（41）
  - `ai`（40）

### 2.2 本地工作区状态（阅读时刻）

当前仓库存在未提交改动（含新增目录）：

- 已修改：`package.json`、`tsup.config.ts`、`src/index.ts`、`src/mmd/*`、`src/showmasterpiece/ui/miniapp/*` 等
- 新增：`src/ai/llm/`、`src/ar/`、`src/mmd/ar/MMDARApp.tsx`、`types/ar-threex.d.ts`、`tests/ai/*` 等

这意味着目前处于“持续开发中”的阶段，公告内容建议按“当前主线 + 在研模块”双视角维护。

## 3. 架构分层（建议统一认知）

可按 4 层理解 SA2Kit：

1) 基础工具与适配层
- `logger`、`utils`、`request`、`storage`

2) 通用业务能力层
- `universalFile`、`universalExport`、`i18n`、`analytics`、`auth`、`calendar`

3) 垂直能力/重交互层
- `mmd`、`showmasterpiece`、`music`、`ai/*`、`iflytek`、`audioDetection`、`imageCrop`

4) UI/组合层
- `components`、`navigation`、`portfolio`、`testYourself` 等

> 消费建议：优先使用子路径导出（例如 `@qhr123/sa2kit/universalFile`），避免从根入口一次性引入过多模块。

## 4. 核心模块一览（面向需求沟通）

### 4.1 auth（认证）

- 文档：`docs/auth.md`
- 能力：Drizzle + JWT 的认证服务、路由生成器、中间件、前端 hooks
- 典型场景：注册登录、权限路由保护（admin/super admin）
- 关键导出：`auth/schema`、`auth/services`、`auth/routes`、`auth/middleware`、`auth/hooks`

### 4.2 universalFile（文件服务）

- 文档：`docs/UNIVERSAL_FILE_GUIDE.md`、`docs/universalFile.md`
- 能力：本地/OSS 存储抽象、预设配置、上传处理、可选 DB 记录管理
- 场景：头像、文档、视频上传与文件管理后台
- 关键导出：`universalFile`、`universalFile/server`

### 4.3 universalExport（数据导出）

- 文档：`docs/UNIVERSAL_EXPORT_GUIDE.md`、`docs/universalExport.md`
- 能力：CSV/XLSX/JSON 导出、不同规模预设、流式导出
- 场景：运营报表、后台数据下载
- 关键导出：`universalExport`、`universalExport/server`

### 4.4 mmd（3D/MMD 多场景）

- 文档：`docs/mmd-components-flow.md`、`docs/MMD_ADMIN_GUIDE.md` 及多份调试文档
- 能力：基础播放器、播放列表、视觉小说、音乐播放器、AR 播放器、PMX 工具链
- 现状特征：模块丰富、交互复杂、文档较多、正在持续演进
- 关键导出：`mmd`、`mmd/admin`、`mmd/server`

### 4.5 showmasterpiece（业务重模块）

- 代码体量最大之一，含 `ui/web`、`ui/miniapp`、`logic`、`db`、`server`
- 特点：横跨前端页面、业务逻辑、数据层，需求变更影响面通常较大
- 关键导出：`showmasterpiece/*` 系列

### 4.6 ai（AI 能力集）

- 已有：`ocr`、`background-removal`、`sentiment-analysis`、`text-generation`
- 在研：`ai/llm`（可见规划文档 `docs/ai-llm-module-plan.md`，当前代码目录已存在）
- 场景：文本、视觉、LLM 对话能力集成

## 5. 文档体系现状（可作为开发入口）

当前 `docs/` 下已形成较完整文档簇，建议按优先级阅读：

1) 快速接入与通用模块
- `docs/auth.md`
- `docs/UNIVERSAL_FILE_GUIDE.md`
- `docs/UNIVERSAL_EXPORT_GUIDE.md`
- `docs/tailwind-setup.md`

2) 重模块深度文档
- `docs/mmd-components-flow.md`
- `docs/MMD_RENDERING_COMPARISON.md`
- `docs/visual-novel-*`
- `docs/audioDetection*.md`

3) 规划与路线文档
- `docs/ai-llm-module-plan.md`
- `docs/miku-fireworks-3d-plan.md`
- `docs/miku-fusion-game-plan.md`

## 6. 当前可见风险与维护建议

### 6.1 风险点（短期）

- 根入口注释版本仍写 `0.3.0`（`src/index.ts`），与包版本 `1.6.60` 不一致
- 子路径导出与构建入口存在不完全对齐（例如命名口径不统一的条目）
- 测试覆盖相对模块总量偏低（10 个测试文件对应 600+ 源文件）
- 仓库当前在开发态，未提交改动集中在 `mmd/ar`、`showmasterpiece/ui/miniapp`、`ai/llm` 等关键模块

### 6.2 建议优先级（用于需求开发维护）

P0（先做）
- 固化“模块 owner + 变更边界”表（尤其 `showmasterpiece`、`mmd`、`auth`）
- 做导出面/构建入口自动校验（CI）
- 补充关键链路回归测试（auth、file、export、mmd 主链）

P1（近期）
- 建立“文档与代码同步”流程（版本号、模块状态、是否在研）
- 对在研模块（`ai/llm`、`ar`）标记成熟度等级（alpha/beta/stable）

P2（中期）
- 将重模块拆分成更清晰的 capability package 或内部子包，降低单仓复杂度

## 7. 面向本群的协作约定（建议纳入群公告）

1. 提需求时请明确：模块、端（web/node/miniapp）、是否需要 server 配套。
2. 提 Bug 时请附：使用子路径、版本号、最小复现。
3. 涉及 `showmasterpiece`/`mmd` 的改动默认走影响面评估。
4. 新模块必须给出：导出路径、最小示例、文档页、至少 1 条测试。
5. 发布前统一检查：`build`、`test`、导出路径可用性、文档是否更新。

## 8. 建议的新人阅读路径（30 分钟版）

1) `README.md`（5 分钟，建立全局感知）
2) `package.json` 的 `exports` 与 `scripts`（5 分钟，理解消费方式）
3) `docs/auth.md` + `docs/UNIVERSAL_FILE_GUIDE.md`（10 分钟，掌握通用模块）
4) 按业务进入：`docs/mmd-components-flow.md` 或 `showmasterpiece` 代码（10 分钟）

---

如本文件作为群公告，建议每周更新一次“版本号 + 在研模块 + 风险状态”。
