import type { AppLaunchProvider, AppLaunchUrls } from '../types';
import { AppLaunchError } from '../types';
import { requireNonEmptyString, encodeQuery } from '../utils/query';
import { isAndroid } from '../detect';

function buildKeywordNavigationUrl(destination: string): AppLaunchUrls {
  const encoded = encodeQuery(destination);

  const primary =
    typeof navigator !== 'undefined' && isAndroid()
      ? `google.navigation:q=${encoded}`
      : `comgooglemaps://?daddr=${encoded}&directionsmode=driving`;

  return {
    primary,
    fallback: `https://www.google.com/maps/dir/?api=1&destination=${encoded}&travelmode=driving`,
  };
}

function buildCoordinateNavigationUrl(
  latitude: number,
  longitude: number,
  destination?: string,
): AppLaunchUrls {
  const coordinateQuery = destination
    ? encodeQuery(destination)
    : `${latitude},${longitude}`;

  const primary =
    typeof navigator !== 'undefined' && isAndroid()
      ? `google.navigation:q=${latitude},${longitude}`
      : `comgooglemaps://?daddr=${coordinateQuery}&directionsmode=driving`;

  const fallbackDestination = destination
    ? encodeQuery(destination)
    : `${latitude},${longitude}`;

  return {
    primary,
    fallback: `https://www.google.com/maps/dir/?api=1&destination=${fallbackDestination}&travelmode=driving`,
  };
}

export const googleProvider: AppLaunchProvider = {
  id: 'google',
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
    if (action === 'navigate') {
      const destination = requireNonEmptyString(params.destination, 'destination');
      const urls = buildKeywordNavigationUrl(destination);
      if (context.options.fallbackUrl) {
        urls.fallback = context.options.fallbackUrl;
      }
      return urls;
    }

    if (action === 'navigateByCoordinate') {
      const urls = buildCoordinateNavigationUrl(
        params.latitude as number,
        params.longitude as number,
        params.destination as string | undefined,
      );
      if (context.options.fallbackUrl) {
        urls.fallback = context.options.fallbackUrl;
      }
      return urls;
    }

    throw new Error(`[googleProvider] 不支持 action: ${action}`);
  },
};

export function buildGoogleNavigationUrl(destination: string): string {
  return buildKeywordNavigationUrl(destination).primary;
}
