# 开发计划：Vocaloid Booth Vault

## 阶段 0：需求冻结（已完成）
- [x] PRD 初稿落文档
- [x] MVP 范围定义（上传记录 + 匹配码 + 回取查询）

## 阶段 1：领域模型与核心服务（进行中）
- [x] 定义 `BoothUploadRecord` / `BoothFileItem` 等核心类型
- [x] 定义 `BoothVaultStore` 存储抽象接口
- [x] 实现匹配码生成器（排除易混字符）
- [x] 实现 `BoothVaultService.createUpload/getByMatchCode/markDownloaded`

## 阶段 2：服务端适配与可运行样例
- [x] 增加 `InMemoryBoothVaultStore`（开发环境）
- [ ] 增加 DB Store（PostgreSQL）
- [ ] 增加对象存储上传适配器（S3/OSS）

## 阶段 3：Web 交互层
- [ ] 上传页面组件（拖拽、进度、完成态）
- [ ] 匹配码查询页面组件（输入、结果、下载）
- [ ] 错误态与过期态展示

## 阶段 4：平台能力
- [ ] 限流与防刷
- [ ] 过期清理任务
- [ ] 基础审计日志

## 阶段 5：测试与发布
- [x] 核心单测（匹配码、服务流程）
- [ ] API 集成测试
- [ ] 文档补充（接入示例）

---

## 子任务拆解（可并行）

### A. Core（当前已启动）
1. Type 定义
2. Match code 生成逻辑
3. Upload record 生命周期

### B. Persistence
1. DB schema
2. Repository 实现
3. 过期任务

### C. Web UI
1. Upload 页面
2. Redeem 页面
3. Success 页面（码 + 二维码）

### D. Ops/Security
1. 接口限流
2. 上传类型白名单/黑名单
3. 下载日志

## 当前进度说明
已完成模块骨架 + 核心服务，下一步优先接入真实持久化与对象存储上传通道，再落地 Web 页面。
