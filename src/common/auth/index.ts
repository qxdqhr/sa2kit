/**
 * @package sa2kit/common/auth
 *
 * Browser / client 安全入口（Better Auth 3.0）
 */
export {
  createSa2kitAuthClient,
  type Sa2kitAuthClient,
  type Sa2kitAuthClientOptions,
} from './client';
export { useSession, type UseSessionReturn } from './hooks/useSession';

export * from './types';
