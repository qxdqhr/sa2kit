import type { NextRequest } from 'next/server';
import { createBatchDeleteEventsHandler } from '../../../routes';
import {
  createDefaultCalendarRouteConfig,
  withCalendarDbGuard,
} from '../../_shared';

const routeConfig = createDefaultCalendarRouteConfig();
const batchDeleteEventsHandler = createBatchDeleteEventsHandler(routeConfig);

export const DELETE = withCalendarDbGuard((request: NextRequest) =>
  batchDeleteEventsHandler(request),
);
