import type { AppLaunchProvider, AppLaunchUrls } from '../types';
import { AppLaunchError } from '../types';
import { requireNonEmptyString, encodeQuery } from '../utils/query';

function buildSrcParam(sourceApplication: string): string {
  const normalized = sourceApplication.replace(/[^a-zA-Z0-9._-]/g, '');
  return `andr.web.${normalized || 'sa2kit'}`;
}

function buildKeywordNavigationUrl(
  destination: string,
  sourceApplication: string,
): string {
  const encodedDestination = encodeQuery(destination);
  const src = encodeQuery(buildSrcParam(sourceApplication));

  return [
    'baidumap://map/navi',
    `?destination=${encodedDestination}`,
    '&mode=driving',
    '&coord_type=gcj02',
    `&src=${src}`,
  ].join('');
}

export const baiduProvider: AppLaunchProvider = {
  id: 'baidu',
  actions: ['navigate', 'navigateByCoordinate'] as const,

  validateParams(action, params) {
    if (action === 'navigate') {
      requireNonEmptyString(params.destination, 'destination');
      return;
    }
    if (action === 'navigateByCoordinate') {
      if (typeof params.latitude !== 'number' || typeof params.longitude !== 'number') {
        throw new AppLaunchError(
          'INVALID_PARAMS',
          'navigateByCoordinate 需要 latitude 与 longitude',
        );
      }
    }
  },

  buildUrls(action, params, context): AppLaunchUrls {
    const sourceApplication = context.sourceApplication;

    if (action === 'navigate') {
      const destination = requireNonEmptyString(params.destination, 'destination');
      const primary = buildKeywordNavigationUrl(destination, sourceApplication);
      const encodedDestination = encodeQuery(destination);

      return {
        primary,
        fallback:
          context.options.fallbackUrl ??
          `https://map.baidu.com/mobile/webapp/search/search/qt=na&wd=${encodedDestination}&mode=MAP_MODE&newmap=1`,
      };
    }

    if (action === 'navigateByCoordinate') {
      const latitude = String(params.latitude);
      const longitude = String(params.longitude);
      const name = params.destination ? encodeQuery(String(params.destination)) : '';
      const src = encodeQuery(buildSrcParam(sourceApplication));
      const destination = name
        ? `latlng:${latitude},${longitude}|name:${name}`
        : `latlng:${latitude},${longitude}`;

      return {
        primary: `baidumap://map/navi?destination=${encodeQuery(destination)}&mode=driving&coord_type=gcj02&src=${src}`,
        fallback:
          context.options.fallbackUrl ??
          `https://map.baidu.com/mobile/webapp/search/search/qt=na&wd=${encodeQuery(`${latitude},${longitude}`)}&mode=MAP_MODE&newmap=1`,
      };
    }

    throw new Error(`[baiduProvider] 不支持 action: ${action}`);
  },
};

export function buildBaiduNavigationUrl(
  destination: string,
  sourceApplication = 'sa2kit',
): string {
  return buildKeywordNavigationUrl(destination, sourceApplication);
}
