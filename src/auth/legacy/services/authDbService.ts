import { randomBytes } from 'crypto';
import { eq, and, gt, lt } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import type { AuthService, SessionValidation, User, UserSession } from '../types';
import { legacyUsers, legacyUserSessions, legacyVerificationCodes } from '../schema';

export interface LegacyAuthDbConfig {
  db: any;
  tables?: {
    users?: typeof legacyUsers;
    userSessions?: typeof legacyUserSessions;
    verificationCodes?: typeof legacyVerificationCodes;
  };
  saltRounds?: number;
  sessionDurationMs?: number;
}

type LegacyAuthTables = {
  users: NonNullable<NonNullable<LegacyAuthDbConfig['tables']>['users']>;
  userSessions: NonNullable<NonNullable<LegacyAuthDbConfig['tables']>['userSessions']>;
  verificationCodes: NonNullable<NonNullable<LegacyAuthDbConfig['tables']>['verificationCodes']>;
};

/**
 * 认证数据库服务类（Legacy：手机号 + Cookie 会话）
 */
export class LegacyAuthDbService implements AuthService {
  private db: LegacyAuthDbConfig['db'];
  private tables: LegacyAuthTables;
  private saltRounds: number;
  private sessionDurationMs: number;

  constructor(config: LegacyAuthDbConfig) {
    this.db = config.db;
    this.tables = {
      users: config.tables?.users ?? legacyUsers,
      userSessions: config.tables?.userSessions ?? legacyUserSessions,
      verificationCodes: config.tables?.verificationCodes ?? legacyVerificationCodes,
    };
    this.saltRounds = config.saltRounds || 12;
    this.sessionDurationMs = config.sessionDurationMs || 30 * 24 * 60 * 60 * 1000;
  }

  async verifyPassword(phone: string, password: string): Promise<User | null> {
    try {
      const result = await this.db
        .select()
        .from(this.tables.users)
        .where(eq(this.tables.users.phone, phone))
        .limit(1);

      const user = result[0];
      if (!user) return null;
      if (!user.isActive) return null;

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) return null;

      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword as User;
    } catch (error) {
      console.error('💥 [LegacyAuthDbService] 密码验证异常:', error);
      return null;
    }
  }

  async createUser(phone: string, password: string, name?: string): Promise<User> {
    try {
      const existingUser = await this.db
        .select()
        .from(this.tables.users)
        .where(eq(this.tables.users.phone, phone))
        .limit(1);
      if (existingUser.length > 0) {
        throw new Error('用户已存在');
      }

      const hashedPassword = await bcrypt.hash(password, this.saltRounds);
      const result = await this.db
        .insert(this.tables.users)
        .values({
          phone,
          password: hashedPassword,
          name: name || null,
          isActive: true,
          role: 'user',
        })
        .returning();

      const createdUser = result[0];
      if (!createdUser) {
        throw new Error('创建用户失败: 未返回用户记录');
      }
      const { password: _, ...userWithoutPassword } = createdUser;
      return userWithoutPassword as User;
    } catch (error) {
      console.error('创建用户失败:', error);
      throw new Error('创建用户失败');
    }
  }

  async updateLastLogin(userId: number): Promise<void> {
    try {
      await this.db
        .update(this.tables.users)
        .set({ lastLoginAt: new Date(), updatedAt: new Date() })
        .where(eq(this.tables.users.id, userId));
    } catch (error) {
      console.error('更新最后登录时间失败:', error);
      throw new Error('更新最后登录时间失败');
    }
  }

  async createSession(userId: number): Promise<UserSession> {
    try {
      const sessionToken = randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + this.sessionDurationMs);

      const result = await this.db
        .insert(this.tables.userSessions)
        .values({
          userId,
          sessionToken,
          expiresAt,
        })
        .returning();

      const session = result[0];
      if (!session) {
        throw new Error('创建会话失败: 未返回会话记录');
      }
      return session;
    } catch (error) {
      console.error('创建会话失败:', error);
      throw new Error('创建会话失败');
    }
  }

  async validateSession(sessionToken: string): Promise<SessionValidation> {
    try {
      const now = new Date();
      const result = await this.db
        .select({
          session: this.tables.userSessions,
          user: this.tables.users,
        })
        .from(this.tables.userSessions)
        .innerJoin(this.tables.users, eq(this.tables.userSessions.userId, this.tables.users.id))
        .where(
          and(
            eq(this.tables.userSessions.sessionToken, sessionToken),
            gt(this.tables.userSessions.expiresAt, now),
            eq(this.tables.users.isActive, true)
          )
        )
        .limit(1);

      const row = result[0];
      if (!row) {
        return { valid: false };
      }

      const { password: _, ...userWithoutPassword } = row.user;
      return { valid: true, user: userWithoutPassword as User };
    } catch (error) {
      console.error('会话验证失败:', error);
      return { valid: false };
    }
  }

  async deleteSession(sessionToken: string): Promise<void> {
    try {
      await this.db
        .delete(this.tables.userSessions)
        .where(eq(this.tables.userSessions.sessionToken, sessionToken));
    } catch (error) {
      console.error('删除会话失败:', error);
      throw new Error('删除会话失败');
    }
  }

  async deleteUserSessions(userId: number): Promise<void> {
    try {
      await this.db
        .delete(this.tables.userSessions)
        .where(eq(this.tables.userSessions.userId, userId));
    } catch (error) {
      console.error('删除用户会话失败:', error);
      throw new Error('删除用户会话失败');
    }
  }

  async cleanupExpiredSessions(): Promise<void> {
    try {
      const now = new Date();
      await this.db
        .delete(this.tables.userSessions)
        .where(lt(this.tables.userSessions.expiresAt, now));
    } catch (error) {
      console.error('清理过期会话失败:', error);
    }
  }

  async getUserByPhone(phone: string): Promise<User | null> {
    try {
      const result = await this.db
        .select()
        .from(this.tables.users)
        .where(eq(this.tables.users.phone, phone))
        .limit(1);

      const user = result[0];
      if (!user) return null;
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword as User;
    } catch (error) {
      console.error('查询用户失败:', error);
      throw error;
    }
  }

  async sendVerificationCode(phone: string): Promise<string> {
    try {
      await this.cleanupExpiredVerificationCodes();

      const existingCode = await this.db
        .select()
        .from(this.tables.verificationCodes)
        .where(
          and(
            eq(this.tables.verificationCodes.phone, phone),
            eq(this.tables.verificationCodes.used, false),
            gt(this.tables.verificationCodes.expiresAt, new Date())
          )
        )
        .limit(1);

      const currentCode = existingCode[0];
      if (currentCode) {
        const timeDiff = Date.now() - currentCode.createdAt.getTime();
        if (timeDiff < 60 * 1000) {
          throw new Error('验证码发送过于频繁，请稍后再试');
        }
      }

      const code = Math.floor(100000 + Math.random() * 900000).toString();

      await this.db
        .insert(this.tables.verificationCodes)
        .values({
          phone,
          code,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        })
        .returning();

      return code;
    } catch (error) {
      console.error('发送验证码失败:', error);
      throw error;
    }
  }

  async verifyCode(phone: string, code: string): Promise<boolean> {
    try {
      const result = await this.db
        .select()
        .from(this.tables.verificationCodes)
        .where(
          and(
            eq(this.tables.verificationCodes.phone, phone),
            eq(this.tables.verificationCodes.code, code),
            eq(this.tables.verificationCodes.used, false),
            gt(this.tables.verificationCodes.expiresAt, new Date())
          )
        )
        .limit(1);

      const verificationCode = result[0];
      if (!verificationCode) return false;

      await this.db
        .update(this.tables.verificationCodes)
        .set({ used: true })
        .where(eq(this.tables.verificationCodes.id, verificationCode.id));

      return true;
    } catch (error) {
      console.error('验证码验证失败:', error);
      throw error;
    }
  }

  async resetPassword(phone: string, newPassword: string): Promise<void> {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, this.saltRounds);
      await this.db
        .update(this.tables.users)
        .set({ password: hashedPassword })
        .where(eq(this.tables.users.phone, phone));
    } catch (error) {
      console.error('密码重置失败:', error);
      throw error;
    }
  }

  async cleanupExpiredVerificationCodes(): Promise<void> {
    try {
      const now = new Date();
      await this.db
        .delete(this.tables.verificationCodes)
        .where(lt(this.tables.verificationCodes.expiresAt, now))
        .returning();
    } catch (error) {
      console.error('清理过期验证码失败:', error);
    }
  }
}
