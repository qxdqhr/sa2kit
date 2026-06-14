import type { AppLaunchProvider } from '../types';
import { requireNonEmptyString } from '../utils/query';

export type GenericOpenParams = {
  url: string;
  fallback?: string;
};

/** 通用 scheme / https 唤起 */
export const genericProvider: AppLaunchProvider = {
  id: 'generic',
  actions: ['open'] as const,

  validateParams(_action, params) {
    requireNonEmptyString(params.url, 'url');
  },

  buildUrls(_action, params, context) {
    const url = requireNonEmptyString(params.url, 'url');
    const fallback =
      context.options.fallbackUrl ??
      (typeof params.fallback === 'string' ? params.fallback : undefined);

    return { primary: url, fallback };
  },
};
