import type { AppLaunchProvider } from '../types';
import { requireNonEmptyString, encodeQuery } from '../utils/query';

export type QqShareParams = {
  title: string;
  summary?: string;
  url: string;
  imageUrl?: string;
};

/** QQ 好友分享 — mqqapi scheme */
export const qqProvider: AppLaunchProvider = {
  id: 'qq',
  actions: ['share', 'open'] as const,

  validateParams(action, params) {
    if (action === 'open') {
      return;
    }
    requireNonEmptyString(params.title, 'title');
    requireNonEmptyString(params.url, 'url');
  },

  buildUrls(action, params, context) {
    if (action === 'open') {
      return {
        primary: 'mqqapi://',
        fallback: context.options.fallbackUrl ?? 'https://im.qq.com/',
      };
    }

    const title = encodeQuery(requireNonEmptyString(params.title, 'title'));
    const summary = encodeQuery(
      typeof params.summary === 'string' ? params.summary : '',
    );
    const url = encodeQuery(requireNonEmptyString(params.url, 'url'));
    const imageUrl = params.imageUrl
      ? encodeQuery(String(params.imageUrl))
      : '';

    const primary = [
      'mqqapi://share/to_fri',
      '?src_type=web',
      '&version=1',
      '&file_type=news',
      `&title=${title}`,
      `&description=${summary}`,
      `&url=${url}`,
      imageUrl ? `&image_url=${imageUrl}` : '',
    ].join('');

    return {
      primary,
      fallback: context.options.fallbackUrl ?? `https://connect.qq.com/`,
    };
  },
};
