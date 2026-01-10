/**
 * Auth Services - Drizzle Auth Service
 * 基于 Drizzle ORM 的认证服务
 */

import { eq, and, gt } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { user, session } from '../schema';
import { hashPassword, verifyPassword } from './password-utils';
import { generateToken, verifyJwtToken } from './token-utils';
import type {
  AuthServiceConfig,
  AuthResult,
  VerifyResult,
  UserInfo,
  SessionInfo,
} from './types';
import type { UserRole } from '../schema/enums';

/**
 * Drizzle 认证服务类
 *
 * @example
 * ```typescript
 * import { DrizzleAuthService } from '@qhr123/sa2kit/auth/services';
 * import { db } from './db';
 *
 * const authService = new DrizzleAuthService({
 *   db,
 *   jwtSecret: process.env.JWT_SECRET!,
 *   jwtExpiresIn: '7d',
 * });
 *
 * // 用户注册
 * const result = await authService.signUp('user@example.com', 'password123', 'username');
 *
 * // 用户登录
 * const loginResult = await authService.signIn('user@example.com', 'password123');
 * ```
 */
export class DrizzleAuthService {
  private config: Required<AuthServiceConfig>;

  constructor(config: AuthServiceConfig) {
    // 设置默认值
    this.config = {
      db: config.db,
      jwtSecret: config.jwtSecret,
      jwtExpiresIn: config.jwtExpiresIn || '7d',
      saltRounds: config.saltRounds || 12,
      checkSecretStrength: config.checkSecretStrength !== false,
    };

    // 验证配置
    this.validateConfig();
  }

  /**
   * 验证配置
   */
  private validateConfig(): void {
    if (!this.config.jwtSecret) {
      throw new Error(
        'JWT_SECRET is required. Please provide jwtSecret in config. ' +
          "You can generate a secure secret with: node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\""
      );
    }

    // 生产环境检查密钥强度
    if (
      this.config.checkSecretStrength &&
      process.env.NODE_ENV === 'production' &&
      this.config.jwtSecret.length < 32
    ) {
      throw new Error(
        'JWT_SECRET is too short (' + (this.config.jwtSecret.length) + ' chars, minimum 32 required in production)'
      );
    }
  }

  /**
   * 用户注册
   */
  async signUp(
    email: string,
    password: string,
    username?: string,
    role: UserRole = 'USER'
  ): Promise<AuthResult> {
    try {
      // 检查用户是否已存在
      const existingUser = await this.config.db
        .select()
        .from(user)
        .where(eq(user.email, email))
        .limit(1);

      if (existingUser.length > 0) {
        throw new Error('用户已存在');
      }

      // 哈希密码
      const hashedPassword = await hashPassword(password, this.config.saltRounds);

      // 创建用户
      const [newUser] = await this.config.db
        .insert(user)
        .values({
          id: randomBytes(16).toString('hex'),
          email,
          password: hashedPassword,
          username: username || email.split('@')[0],
          role,
          emailVerified: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .returning();

      // 生成 JWT token
      const token = generateToken(
        {
          userId: newUser.id,
          email: newUser.email,
          role: newUser.role as UserRole,
        },
        this.config.jwtSecret,
        this.config.jwtExpiresIn
      );

      // 创建会话
      await this.createSession(newUser.id, token);

      return {
        user: {
          id: newUser.id,
          email: newUser.email,
          username: newUser.username,
          role: newUser.role as UserRole,
        },
        token,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * 用户登录
   */
  async signIn(email: string, password: string): Promise<AuthResult> {
    try {
      // 查找用户
      const [foundUser] = await this.config.db
        .select()
        .from(user)
        .where(eq(user.email, email))
        .limit(1);

      if (!foundUser) {
        throw new Error('邮箱或密码错误');
      }

      // 验证密码
      if (!foundUser.password) {
        throw new Error('用户密码未设置');
      }

      const isPasswordValid = await verifyPassword(password, foundUser.password);
      if (!isPasswordValid) {
        throw new Error('邮箱或密码错误');
      }

      // 生成 JWT token
      const token = generateToken(
        {
          userId: foundUser.id,
          email: foundUser.email,
          role: foundUser.role as UserRole,
        },
        this.config.jwtSecret,
        this.config.jwtExpiresIn
      );

      // 创建会话
      await this.createSession(foundUser.id, token);

      return {
        user: {
          id: foundUser.id,
          email: foundUser.email,
          username: foundUser.username,
          role: foundUser.role as UserRole,
        },
        token,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * 验证 Token
   */
  async verifyToken(token: string): Promise<VerifyResult> {
    try {
      // 验证 JWT
      const decoded = verifyJwtToken(token, this.config.jwtSecret);

      // 检查会话是否存在且未过期
      const [foundSession] = await this.config.db
        .select()
        .from(session)
        .where(
          and(eq(session.token, token), gt(session.expiresAt, new Date().toISOString()))
        )
        .limit(1);

      if (!foundSession) {
        throw new Error('会话无效或已过期');
      }

      // 获取用户信息
      const [foundUser] = await this.config.db
        .select()
        .from(user)
        .where(eq(user.id, decoded.userId))
        .limit(1);

      if (!foundUser) {
        throw new Error('用户不存在');
      }

      return {
        user: {
          id: foundUser.id,
          email: foundUser.email,
          username: foundUser.username,
          role: foundUser.role as UserRole,
        },
        session: foundSession as SessionInfo,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * 创建会话
   */
  async createSession(
    userId: string,
    token: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7天后过期

    await this.config.db.insert(session).values({
      id: randomBytes(16).toString('hex'),
      userId,
      token,
      expiresAt: expiresAt.toISOString(),
      ipAddress,
      userAgent,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * 删除会话（登出）
   */
  async signOut(token: string): Promise<{ success: boolean }> {
    try {
      await this.config.db.delete(session).where(eq(session.token, token));
      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  /**
   * 获取会话
   */
  async getSession(token: string): Promise<VerifyResult | null> {
    try {
      return await this.verifyToken(token);
    } catch (error) {
      return null;
    }
  }

  /**
   * 检查管理员权限
   */
  async requireAdmin(token: string): Promise<VerifyResult> {
    const result = await this.verifyToken(token);
    if (!['ADMIN', 'SUPER_ADMIN'].includes(result.user.role)) {
      throw new Error('需要管理员权限');
    }
    return result;
  }

  /**
   * 检查超级管理员权限
   */
  async requireSuperAdmin(token: string): Promise<VerifyResult> {
    const result = await this.verifyToken(token);
    if (result.user.role !== 'SUPER_ADMIN') {
      throw new Error('需要超级管理员权限');
    }
    return result;
  }

  /**
   * 通过用户 ID 获取用户信息
   */
  async getUserById(userId: string): Promise<UserInfo | null> {
    try {
      const [foundUser] = await this.config.db
        .select()
        .from(user)
        .where(eq(user.id, userId))
        .limit(1);

      if (!foundUser) {
        return null;
      }

      return {
        id: foundUser.id,
        email: foundUser.email,
        username: foundUser.username,
        role: foundUser.role as UserRole,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * 通过邮箱获取用户信息
   */
  async getUserByEmail(email: string): Promise<UserInfo | null> {
    try {
      const [foundUser] = await this.config.db
        .select()
        .from(user)
        .where(eq(user.email, email))
        .limit(1);

      if (!foundUser) {
        return null;
      }

      return {
        id: foundUser.id,
        email: foundUser.email,
        username: foundUser.username,
        role: foundUser.role as UserRole,
      };
    } catch (error) {
      return null;
    }
  }
}

