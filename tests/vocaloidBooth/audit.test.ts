import { describe, expect, it } from 'vitest';
import { BoothVaultService } from '../../src/vocaloidBooth/core';
import {
  BoothRedeemGuard,
  InMemoryBoothAuditSink,
  InMemoryBoothVaultStore,
  createAuditLogger,
  expireBoothRecords,
} from '../../src/vocaloidBooth/server';

describe('vocaloidBooth audit', () => {
  it('captures upload/redeem audit events', async () => {
    const sink = new InMemoryBoothAuditSink();
    const service = new BoothVaultService({
      store: new InMemoryBoothVaultStore(),
      redeemGuard: new BoothRedeemGuard({ maxAttempts: 5 }),
      onAuditEvent: createAuditLogger(sink),
    });

    const created = await service.createUpload({
      boothId: 'cp-audit',
      files: [{ fileName: 'demo.zip', objectKey: 'booth/demo.zip', size: 1 }],
    });

    await service.resolveDownloadFilesByCode(created.record.matchCode, { requesterKey: 'u:1' });
    await service.resolveDownloadFilesByCode('BAD999', { requesterKey: 'u:1' });

    const types = sink.list().map((e) => e.type);
    expect(types).toContain('upload.created');
    expect(types).toContain('redeem.success');
    expect(types).toContain('redeem.failed');
  });

  it('emits expiry callback in cleanup task', async () => {
    const store = new InMemoryBoothVaultStore();
    await store.saveRecord({
      id: 'r-exp',
      boothId: 'cp-audit',
      matchCode: 'EXPIRE',
      createdAt: new Date(0).toISOString(),
      expiresAt: new Date(0).toISOString(),
      files: [],
      status: 'active',
      downloadCount: 0,
    });

    const expiredIds: string[] = [];
    await expireBoothRecords(store, Date.now(), (record) => expiredIds.push(record.id));
    expect(expiredIds).toContain('r-exp');
  });
});
