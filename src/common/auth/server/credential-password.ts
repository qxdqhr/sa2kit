import { and, eq } from 'drizzle-orm';
import { hashPassword } from 'better-auth/crypto';
import { account } from '../schema/account';

type AuthDb = {
  select: (...args: unknown[]) => {
    from: (...args: unknown[]) => {
      where: (...args: unknown[]) => {
        limit: (...args: unknown[]) => Promise<Array<{ id: string }>>;
      };
    };
  };
  update: (...args: unknown[]) => {
    set: (...args: unknown[]) => {
      where: (...args: unknown[]) => Promise<unknown>;
    };
  };
  insert: (...args: unknown[]) => {
    values: (...args: unknown[]) => Promise<unknown>;
  };
};

function createId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `acc_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

/** 为手机号注册用户写入 credential 密码，供「手机+密码」登录 */
export async function upsertCredentialPassword(
  db: unknown,
  userId: string,
  plainPassword: string,
): Promise<void> {
  const database = db as AuthDb;
  const now = new Date();
  const passwordHash = await hashPassword(plainPassword);

  const existing = await database
    .select({ id: account.id })
    .from(account)
    .where(and(eq(account.userId, userId), eq(account.providerId, 'credential')))
    .limit(1);

  if (existing[0]) {
    await database
      .update(account)
      .set({ password: passwordHash, updatedAt: now })
      .where(eq(account.id, existing[0].id));
    return;
  }

  await database.insert(account).values({
    id: createId(),
    accountId: userId,
    providerId: 'credential',
    userId,
    password: passwordHash,
    createdAt: now,
    updatedAt: now,
  });
}
