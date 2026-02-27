import type { NextRequest } from 'next/server';
import {
  createDeleteEventHandler,
  createGetEventByIdHandler,
  createUpdateEventHandler,
} from '../../../routes';
import {
  createDefaultCalendarRouteConfig,
  withCalendarDbGuard,
} from '../../_shared';

interface RouteParams {
  params: {
    id: string;
  };
}

const routeConfig = createDefaultCalendarRouteConfig();
const getEventByIdHandler = createGetEventByIdHandler(routeConfig);
const updateEventHandler = createUpdateEventHandler(routeConfig);
const deleteEventHandler = createDeleteEventHandler(routeConfig);

export const GET = withCalendarDbGuard(
  (request: NextRequest, routeParams: RouteParams) =>
    getEventByIdHandler(request, routeParams),
);

export const PUT = withCalendarDbGuard(
  (request: NextRequest, routeParams: RouteParams) =>
    updateEventHandler(request, routeParams),
);

export const DELETE = withCalendarDbGuard(
  (request: NextRequest, routeParams: RouteParams) =>
    deleteEventHandler(request, routeParams),
);
