# Vocaloid Booth 模块开发计划（子任务拆分）

## 总体阶段
- P0：领域模型与核心服务（进行中）
- P1：Web 上传/兑换页面组件
- P2：服务端适配器（对象存储 + DB）
- P3：安全/限流/可观测
- P4：联调与文档完善

---

## P0：核心能力（已完成）
- [x] 定义业务类型（record/file/matchCode）
- [x] 匹配码生成与规范化
- [x] 核心服务（创建上传记录、按码查询、下载计数）
- [x] 内存存储适配器（便于测试）
- [x] 单元测试补齐
- [x] 对外导出与构建配置接入

## P1：Web 组件（已完成可演示版本）
- [x] UploadPanel（文件选择、大小/数量校验、提交）
- [x] RedeemPanel（输入匹配码、查询结果）
- [x] SuccessCard（展示匹配码、到期时间、复制）
- [x] 空态/错误态文案

## P2：Server 适配（已完成接口层）
- [x] DB Store 抽象（RepositoryBoothVaultStore）
- [x] Object Storage 抽象（BoothObjectStorageProvider）
- [x] 过期清理任务接口（expireBoothRecords）
- [x] 下载签名 URL（signRecordFiles）

## P3：稳定性与安全（已完成核心）
- [x] 兑换接口限流（BoothRedeemGuard）
- [x] 匹配码爆破防护（失败次数封禁）
- [x] 上传格式/大小校验（validateUploadFiles）
- [x] 日志与审计字段（BoothAuditEvent + audit sink）

## P4：交付（进行中）
- [x] 模块文档（使用示例）
- [x] API 样例
- [ ] 版本发布说明

---

## 里程碑建议
- M1（今天）：P0 完成并可跑测试
- M2（+1~2天）：P1 页面能力可演示
- M3（+2~4天）：P2/P3 联调可上线试运行
