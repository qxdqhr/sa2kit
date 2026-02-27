import type { NextRequest } from 'next/server';
import {
  createCreateEventHandler,
  createGetEventsHandler,
} from '../../routes';
import {
  createDefaultCalendarRouteConfig,
  withCalendarDbGuard,
} from '../_shared';

const routeConfig = createDefaultCalendarRouteConfig();
const getEventsHandler = createGetEventsHandler(routeConfig);
const createEventHandler = createCreateEventHandler(routeConfig);

export const GET = withCalendarDbGuard((request: NextRequest) =>
  getEventsHandler(request),
);

export const POST = withCalendarDbGuard((request: NextRequest) =>
  createEventHandler(request),
);
