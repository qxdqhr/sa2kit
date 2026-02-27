import type { NextRequest } from 'next/server';
import { createConfigHandler } from '../../routes';
import {
  createDefaultCalendarRouteConfig,
  withCalendarDbGuard,
} from '../_shared';

const routeConfig = createDefaultCalendarRouteConfig();
const configHandlers = createConfigHandler(routeConfig);

export const GET = withCalendarDbGuard((request: NextRequest) =>
  configHandlers.GET(request),
);

export const PUT = withCalendarDbGuard((request: NextRequest) =>
  configHandlers.PUT(request),
);
