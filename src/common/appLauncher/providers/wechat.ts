import type { AppLaunchProvider, AppLaunchUrls } from '../types';
import { requireNonEmptyString, encodeQuery } from '../utils/query';

export type WechatShareParams = {
  title: string;
  description?: string;
  url: string;
  thumbUrl?: string;
};

/**
 * 微信外链唤起能力受场景限制：
 * - 微信内 H5 通常需 JS-SDK
 * - 外部浏览器多仅能打开微信或跳转 Universal Link
 */
export const wechatProvider: AppLaunchProvider = {
  id: 'wechat',
  actions: ['open', 'share'] as const,

  validateParams(action, params) {
    if (action === 'open') {
      return;
    }
    requireNonEmptyString(params.title, 'title');
    requireNonEmptyString(params.url, 'url');
  },

  buildUrls(action, params, context): AppLaunchUrls {
    const sourceApplication = encodeQuery(context.sourceApplication);

    if (action === 'open') {
      return {
        primary: `weixin://`,
        fallback: context.options.fallbackUrl ?? 'https://weixin.qq.com/',
      };
    }

    const title = encodeQuery(requireNonEmptyString(params.title, 'title'));
    const description = encodeQuery(
      typeof params.description === 'string' ? params.description : '',
    );
    const url = encodeQuery(requireNonEmptyString(params.url, 'url'));
    const thumbUrl = params.thumbUrl
      ? encodeQuery(String(params.thumbUrl))
      : '';

    // 移动端常用唤起：打开微信并进入分享流程（具体能力依赖微信版本与场景）
    const primary = `weixin://dl/businessWebview/link?appid=&url=${url}&title=${title}&description=${description}`;

    return {
      primary,
      fallback:
        context.options.fallbackUrl ??
        `https://open.weixin.qq.com/connect/oauth2/authorize?appid=APPID&redirect_uri=${url}&response_type=code&scope=snsapi_userinfo&state=${sourceApplication}#wechat_redirect`,
    };
  },
};
