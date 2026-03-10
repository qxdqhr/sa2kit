# Vocaloid Booth 模块

用于线下展场景的文件寄存与匹配码回取。

## 导入

```ts
import { BoothVaultService, InMemoryBoothVaultStore } from '@qhr123/sa2kit/vocaloidBooth';
import { BoothUploadPanel, BoothRedeemPanel, BoothSuccessCard } from '@qhr123/sa2kit/vocaloidBooth/web';
```

## 核心服务

```ts
const store = new InMemoryBoothVaultStore();
const service = new BoothVaultService({
  store,
  defaultTtlHours: 24 * 14,
});

const created = await service.createUpload({
  boothId: 'cp-01',
  files: [
    {
      fileName: 'project.zip',
      size: 1024,
      objectKey: 'booth/cp-01/project.zip',
      kind: 'project',
    },
  ],
});

const record = await service.getByMatchCode(created.record.matchCode);
```

## P2 适配接口

- `BoothVaultRecordRepository`: 对接数据库（MySQL/Postgres）
- `BoothObjectStorageProvider`: 对接 OSS/COS/S3
- `signRecordFiles(record, storage)`: 生成带签名下载地址的文件列表
- `expireBoothRecords(store)`: 扫描并过期处理

## P3 安全能力

- `BoothRedeemGuard`: 兑换限流与防爆破（按 requesterKey）
- `validateUploadFiles(files, options)`: 上传数量/大小/后缀校验
- `BoothAuditEvent` + `createAuditLogger`: 上传/兑换/封禁/过期审计事件
