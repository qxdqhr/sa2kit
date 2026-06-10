/**
 * 从 Request 解析 Better Auth session（替代自研 JWT validateApiAuth）
 */
import type { Sa2kitAuthInstance } from './types';

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role?: string;
  phoneNumber?: string | null;
};

export async function getSessionUser(
  auth: Sa2kitAuthInstance,
  request: Request,
): Promise<SessionUser | null> {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) return null;

  const user = session.user as SessionUser & { role?: string };
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    phoneNumber: (user as { phoneNumber?: string | null }).phoneNumber ?? null,
  };
}

export type SessionUserNumeric = Omit<SessionUser, 'id'> & { id: number };

/** 兼容 numeric id 消费方（legacy calendar 等） */
export async function getSessionUserNumeric(
  auth: Sa2kitAuthInstance,
  request: Request,
): Promise<SessionUserNumeric | null> {
  const user = await getSessionUser(auth, request);
  if (!user) return null;
  const numericId = Number.parseInt(user.id, 10);
  if (Number.isNaN(numericId)) return null;
  const { id: _id, ...rest } = user;
  return { ...rest, id: numericId };
}

export function createSessionValidator(auth: Sa2kitAuthInstance) {
  return {
    getSessionUser: (request: Request) => getSessionUser(auth, request),
    getSessionUserNumeric: (request: Request) => getSessionUserNumeric(auth, request),
  };
}
