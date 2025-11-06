/**
 * Auth Schema
 * 认证模块数据库表结构定义
 *
 * 使用 Drizzle ORM 定义，支持 PostgreSQL
 *
 * @example
 * ```typescript
 * import { user, session, account } from '@qhr123/sa2kit/auth/schema';
 *
 * // 在你的 schema.ts 中重新导出
 * export { user, session, account } from '@qhr123/sa2kit/auth/schema';
 * ```
 */

// 枚举
export { userRole, type UserRole } from './enums';

// 表定义
export { user, type User, type NewUser } from './user';
export { session, type Session, type NewSession } from './session';
export { account, type Account, type NewAccount } from './account';
export { verifications, type Verification, type NewVerification } from './verification';

// 关系定义
export { userRelations, sessionRelations, accountRelations } from './relations';

