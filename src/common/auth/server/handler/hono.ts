/**
 * Hono / 通用 fetch handler
 */
import type { Sa2kitAuthInstance } from '../create-auth';

export function mountAuthHandler(auth: Sa2kitAuthInstance) {
  return (request: Request) => auth.handler(request);
}

export function createAuthRouteHandlers(auth: Sa2kitAuthInstance) {
  const handler = mountAuthHandler(auth);
  return {
    GET: handler,
    POST: handler,
    PUT: handler,
    PATCH: handler,
    DELETE: handler,
  };
}
