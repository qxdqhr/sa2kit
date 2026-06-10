import type { NextRequest } from 'next/server';
import {
  createBatchDeleteEventsHandler,
  createConfigHandler,
  createCreateEventHandler,
  createDeleteEventHandler,
  createGetEventByIdHandler,
  createGetEventsHandler,
  createUpdateEventHandler,
  type CalendarRouteConfig,
} from '../routes';
import { createDefaultCalendarRouteConfig, withCalendarDbGuard } from './_shared';

function resolveConfig(config?: CalendarRouteConfig): CalendarRouteConfig {
  return config ?? createDefaultCalendarRouteConfig();
}

/** 懒加载：首次请求时再解析 auth / 创建 handler */
function lazyHandler<T extends (...args: never[]) => Promise<Response>>(
  factory: (config: CalendarRouteConfig) => T,
  config?: CalendarRouteConfig,
) {
  let handler: T | null = null;
  return (...args: Parameters<T>) => {
    if (!handler) {
      handler = factory(resolveConfig(config));
    }
    return handler(...args);
  };
}

export function createCalendarEventsRouteHandlers(config?: CalendarRouteConfig) {
  return {
    GET: withCalendarDbGuard(lazyHandler(createGetEventsHandler, config)),
    POST: withCalendarDbGuard(lazyHandler(createCreateEventHandler, config)),
  };
}

export function createCalendarEventByIdRouteHandlers(config?: CalendarRouteConfig) {
  return {
    GET: withCalendarDbGuard(
      lazyHandler(createGetEventByIdHandler, config) as (
        request: NextRequest,
        routeParams: { params: { id: string } },
      ) => Promise<Response>,
    ),
    PUT: withCalendarDbGuard(
      lazyHandler(createUpdateEventHandler, config) as (
        request: NextRequest,
        routeParams: { params: { id: string } },
      ) => Promise<Response>,
    ),
    DELETE: withCalendarDbGuard(
      lazyHandler(createDeleteEventHandler, config) as (
        request: NextRequest,
        routeParams: { params: { id: string } },
      ) => Promise<Response>,
    ),
  };
}

export function createCalendarBatchDeleteRouteHandlers(config?: CalendarRouteConfig) {
  return {
    DELETE: withCalendarDbGuard(lazyHandler(createBatchDeleteEventsHandler, config)),
  };
}

export function createCalendarConfigRouteHandlers(config?: CalendarRouteConfig) {
  let configHandlers: ReturnType<typeof createConfigHandler> | null = null;
  const ensureConfigHandlers = () => {
    if (!configHandlers) {
      configHandlers = createConfigHandler(resolveConfig(config));
    }
    return configHandlers;
  };

  return {
    GET: withCalendarDbGuard((request: NextRequest) => ensureConfigHandlers().GET(request)),
    PUT: withCalendarDbGuard((request: NextRequest) => ensureConfigHandlers().PUT(request)),
  };
}
