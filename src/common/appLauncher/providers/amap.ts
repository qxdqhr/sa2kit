import type {
  AppLaunchProvider,
  AppLaunchUrls,
} from '../types';
import { AppLaunchError } from '../types';
import { requireNonEmptyString, encodeQuery } from '../utils/query';
import { isAndroid } from '../detect';

export type AmapNavigateParams = {
  destination: string;
  mode?: 'car' | 'walk' | 'ride' | 'bus';
};

export type AmapNavigateByCoordinateParams = {
  latitude: number;
  longitude: number;
  destination?: string;
  mode?: 'car' | 'walk' | 'ride' | 'bus';
};

function buildKeywordNavigationUrl(
  destination: string,
  sourceApplication: string,
): string {
  const keyword = encodeQuery(destination);

  if (typeof navigator !== 'undefined' && isAndroid()) {
    return `androidamap://keywordNavi?sourceApplication=${encodeQuery(sourceApplication)}&keyword=${keyword}&style=2`;
  }

  return `https://uri.amap.com/navigation?to=,,${keyword}&mode=car&callnative=1`;
}

function buildCoordinateNavigationUrl(
  params: AmapNavigateByCoordinateParams,
  sourceApplication: string,
): AppLaunchUrls {
  const name = params.destination ? encodeQuery(params.destination) : '';
  const mode = params.mode ?? 'car';
  const lon = params.longitude;
  const lat = params.latitude;

  const primary =
    typeof navigator !== 'undefined' && isAndroid()
      ? `androidamap://route?sourceApplication=${encodeQuery(sourceApplication)}&dlat=${lat}&dlon=${lon}&dname=${name}&dev=0&t=0`
      : `iosamap://navi?sourceApplication=${encodeQuery(sourceApplication)}&lat=${lat}&lon=${lon}&dev=0&style=2`;

  const fallback = `https://uri.amap.com/navigation?to=${lon},${lat},${name}&mode=${mode}&callnative=1`;

  return { primary, fallback };
}

export const amapProvider: AppLaunchProvider = {
  id: 'amap',
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
      const url = buildKeywordNavigationUrl(destination, sourceApplication);
      const fallback =
        context.options.fallbackUrl ??
        `https://uri.amap.com/search?keyword=${encodeQuery(destination)}&callnative=1`;

      return { primary: url, fallback };
    }

    if (action === 'navigateByCoordinate') {
      const coordinateParams: AmapNavigateByCoordinateParams = {
        latitude: params.latitude as number,
        longitude: params.longitude as number,
        destination: params.destination as string | undefined,
        mode: params.mode as AmapNavigateByCoordinateParams['mode'],
      };
      const urls = buildCoordinateNavigationUrl(coordinateParams, sourceApplication);
      if (context.options.fallbackUrl) {
        urls.fallback = context.options.fallbackUrl;
      }
      return urls;
    }

    throw new Error(`[amapProvider] 不支持 action: ${action}`);
  },
};

export function buildAmapNavigationUrl(
  destination: string,
  sourceApplication = 'sa2kit',
): string {
  return buildKeywordNavigationUrl(destination, sourceApplication);
}
