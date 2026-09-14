import { and, eq, lt, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { vocaloidBoothRecords } from './schema';

type RecordStatus = 'active' | 'expired' | 'deleted';

export interface BoothFileRef {
  id?: string;
  fileName: string;
  objectKey: string;
  size: number;
  mimeType?: string;
  checksum?: string;
  kind?: string;
}

export interface CreateVocaloidBoothRecordInput {
  boothId: string;
  files: BoothFileRef[];
  ttlHours?: number;
  metadata?: Record<string, unknown>;
}

export type VocaloidBoothDrizzleDb = {
  select: (...args: any[]) => any;
  insert: (...args: any[]) => any;
  update: (...args: any[]) => any;
};

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

const genCode = (len = 6) =>
  Array.from({ length: len })
    .map(() => ALPHABET[Math.floor(Math.random() * ALPHABET.length)])
    .join('');

export class VocaloidBoothDbService {
  constructor(private readonly db: VocaloidBoothDrizzleDb) {}

  async createRecord(input: CreateVocaloidBoothRecordInput) {
    if (!input.files?.length) {
      throw new Error('files required');
    }

    const now = new Date();
    const ttl = Math.max(1, input.ttlHours ?? 24 * 14);
    const expiresAt = new Date(now.getTime() + ttl * 3600_000);

    let matchCode = genCode();
    for (let i = 0; i < 8; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      const exists = await this.db
        .select({ id: vocaloidBoothRecords.id })
        .from(vocaloidBoothRecords)
        .where(eq(vocaloidBoothRecords.matchCode, matchCode))
        .limit(1);
      if (exists.length === 0) break;
      matchCode = genCode();
    }

    const files = input.files.map((file) => ({
      ...file,
      id: file.id ?? randomUUID(),
    }));

    const [record] = await this.db
      .insert(vocaloidBoothRecords)
      .values({
        id: randomUUID(),
        matchCode,
        boothId: input.boothId,
        status: 'active',
        metadata: input.metadata ?? null,
        files,
        downloadCount: 0,
        createdAt: now,
        updatedAt: now,
        expiresAt,
      })
      .returning();

    return record;
  }

  async redeemByCode(matchCode: string) {
    const [record] = await this.db
      .select()
      .from(vocaloidBoothRecords)
      .where(eq(vocaloidBoothRecords.matchCode, matchCode.toUpperCase()))
      .limit(1);

    if (!record) return null;

    if (record.status !== 'active') return record;
    if (record.expiresAt.getTime() <= Date.now()) {
      await this.db
        .update(vocaloidBoothRecords)
        .set({ status: 'expired', updatedAt: new Date() })
        .where(eq(vocaloidBoothRecords.id, record.id));
      return { ...record, status: 'expired' as RecordStatus };
    }

    await this.db
      .update(vocaloidBoothRecords)
      .set({
        downloadCount: sql`${vocaloidBoothRecords.downloadCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(vocaloidBoothRecords.id, record.id));

    return {
      ...record,
      downloadCount: (record.downloadCount ?? 0) + 1,
    };
  }

  async expireRecords() {
    await this.db
      .update(vocaloidBoothRecords)
      .set({ status: 'expired', updatedAt: new Date() })
      .where(
        and(
          eq(vocaloidBoothRecords.status, 'active'),
          lt(vocaloidBoothRecords.expiresAt, new Date())
        )
      );
  }
}

export function createVocaloidBoothDbService(db: VocaloidBoothDrizzleDb) {
  return new VocaloidBoothDbService(db);
}
