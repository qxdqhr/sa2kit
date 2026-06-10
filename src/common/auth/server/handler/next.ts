/**
 * Next.js App Router handler 挂载
 */
import { toNextJsHandler } from 'better-auth/next-js';
import type { Sa2kitAuthInstance } from '../create-auth';

export function mountNextAuthHandler(auth: Sa2kitAuthInstance) {
  return toNextJsHandler(auth);
}
