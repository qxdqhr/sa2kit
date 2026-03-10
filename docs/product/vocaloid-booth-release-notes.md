# Vocaloid Booth 模块发布说明（草案）

## 版本
建议：`1.6.86`（或下一个 patch 版本）

## 新增

### 核心能力
- 新增 `vocaloidBooth` 模块：
  - 匹配码生成与规范化
  - 上传记录创建与查询
  - 下载计数
  - 过期状态判断

### Web 组件（P1）
- `BoothUploadPanel`
- `BoothRedeemPanel`
- `BoothSuccessCard`

### Server 能力（P2/P3）
- `RepositoryBoothVaultStore`（DB 适配抽象）
- `BoothObjectStorageProvider`（对象存储抽象）
- `signRecordFiles`（签名下载地址）
- `expireBoothRecords`（过期清理任务）
- `BoothRedeemGuard`（兑换限流、防爆破）
- `validateUploadFiles`（上传校验）
- `uploadToOSSAndCreateBoothRecord`（对接 universalFile/OSS 上传）
- `BoothAuditEvent` + `createAuditLogger`（审计日志）

## 导出路径
- `@qhr123/sa2kit/vocaloidBooth`
- `@qhr123/sa2kit/vocaloidBooth/web`
- `@qhr123/sa2kit/vocaloidBooth/server`

## 文档
- PRD：`docs/product/vocaloid-booth-prd.md`
- 开发计划：`docs/product/vocaloid-booth-dev-plan.md`
- API 示例：`docs/product/vocaloid-booth-api-example.md`
- 模块说明：`docs/vocaloidBooth.md`

## 测试
- vocaloidBooth 相关测试：14 passed

## 升级注意事项
- 文档文件默认被仓库 `.gitignore` 中 `*.md` 规则忽略，发布时请确认需要纳入版本管理的 md 已显式 add。
- 生产环境需接入真实 DB 与 OSS Provider，不建议使用内存存储。

## 后续建议
- 增加打包下载（zip）能力
- 增加后台查询/人工失效页面
- 补齐实际 API route 示例到 examples（若仓库后续开放示例目录）
