/**
 * Auth Services
 * 认证服务模块
 *
 * @example
 * ```typescript
 * import { DrizzleAuthService } from '@qhr123/sa2kit/auth/services';
 *
 * const authService = new DrizzleAuthService({
 *   db: myDb,
 *   jwtSecret: process.env.JWT_SECRET!,
 * });
 * ```
 */

export { DrizzleAuthService } from './drizzle-auth-service';
export { hashPassword, verifyPassword } from './password-utils';
export { generateToken, verifyJwtToken, getTokenFromRequest } from './token-utils';
export type {
  AuthServiceConfig,
  UserInfo,
  AuthResult,
  SessionInfo,
  VerifyResult,
} from './types';
export type { JwtPayload } from './token-utils';

