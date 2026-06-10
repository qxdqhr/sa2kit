/**
 * Better Auth Drizzle Schema（sa2kit/common/auth/schema）
 */
export { userRole, type UserRole } from './enums';
export { user, type User, type NewUser } from './user';
export { session, type Session, type NewSession } from './session';
export { account, type Account, type NewAccount } from './account';
export { verification, verifications, type Verification, type NewVerification } from './verification';
export { userRelations, sessionRelations, accountRelations } from './relations';

import { user } from './user';
import { session } from './session';
import { account } from './account';
import { verification } from './verification';
import { userRelations, sessionRelations, accountRelations } from './relations';

/** drizzleAdapter 传入的 schema 对象 */
export const authDrizzleSchema = {
  user,
  session,
  account,
  verification,
  userRelations,
  sessionRelations,
  accountRelations,
};
