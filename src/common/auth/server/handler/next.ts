/**
 * Next.js App Router handler 挂载
 *
 * 始终走 `auth.handler`，避免宿主用 Proxy 懒初始化时
 * `toNextJsHandler` 因 `"handler" in proxy` 为 false 而把 proxy 当函数调用
 * （TypeError: auth is not a function）。
 */
import { toNextJsHandler } from 'better-auth/next-js';
import type { Sa2kitAuthInstance } from '../create-auth';

export function mountNextAuthHandler(auth: Sa2kitAuthInstance) {
  return toNextJsHandler({
    handler: (request: Request) => auth.handler(request),
  });
}
