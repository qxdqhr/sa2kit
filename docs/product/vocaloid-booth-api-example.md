# Vocaloid Booth API 接入示例（P4）

## 1) 上传并生成匹配码

```ts
import { uploadToOSSAndCreateBoothRecord } from '@qhr123/sa2kit/vocaloidBooth/server';

const result = await uploadToOSSAndCreateBoothRecord(
  {
    boothId: 'cp-01',
    files: [{ file, kind: 'project' }],
    metadata: { nickname: 'miku' },
  },
  { fileService, vaultService }
);

return {
  matchCode: result.record.matchCode,
  expiresAt: result.record.expiresAt,
  downloadUrlPath: result.downloadUrlPath,
};
```

## 2) 凭码兑换下载

```ts
const record = await vaultService.resolveDownloadFilesByCode(code, {
  requesterKey: `ip:${ip}`,
});

if (!record || record.status !== 'active') {
  throw new Error('匹配码不可用');
}

const files = await signRecordFiles(record, storageProvider, 1800);
return { files };
```

## 3) 定时过期清理

```ts
await expireBoothRecords(store, Date.now(), (record) => {
  auditLogger({
    type: 'record.expired',
    at: new Date().toISOString(),
    recordId: record.id,
    boothId: record.boothId,
    matchCode: record.matchCode,
  });
});
```
