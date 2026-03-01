import type { NextRequest } from 'next/server';
import type { User } from './types';
import type { LegacyAuthDbService } from './services';

export interface LegacyServerConfig {
  cookieName?: string;
}

export function createLegacyValidateApiAuth(
  authService: LegacyAuthDbService,
  config: LegacyServerConfig = {}
) {
  const cookieName = config.cookieName || 'session_token';
  return async (request: NextRequest): Promise<User | null> => {
    try {
      const sessionToken = request.cookies.get(cookieName)?.value;
      if (!sessionToken) return null;

      const validation = await authService.validateSession(sessionToken);
      return validation.valid && validation.user ? validation.user : null;
    } catch (error) {
      console.error('💥 [LegacyAuth] API权限验证异常:', error);
      return null;
    }
  };
}
