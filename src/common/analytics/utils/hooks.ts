'use client';

/**
 * React Hooks for Analytics
 * 埋点 React Hooks
 */

import { useEffect, useCallback, useRef } from 'react';
import type { Analytics } from '../core/Analytics';
import { EventType, EventPriority } from '../types';

/**
 * 使用埋点实例
 */
export function useAnalytics(analytics: Analytics | null) {
  return analytics;
}

/**
 * 追踪页面浏览
 */
export function usePageView(analytics: Analytics | null, pageUrl?: string, pageTitle?: string) {
  useEffect(() => {
    if (!analytics) return;

    const url = pageUrl || (typeof window !== 'undefined' ? window.location.href : '');
    const title = pageTitle || (typeof document !== 'undefined' ? document.title : '');

    analytics.trackPageView(url, title);
  }, [analytics, pageUrl, pageTitle]);
}

/**
 * 追踪事件（返回追踪函数）
 */
export function useTrackEvent(analytics: Analytics | null) {
  return useCallback(
    (
      eventType: EventType,
      eventName: string,
      properties?: Record<string, any>,
      priority?: EventPriority
    ) => {
      if (analytics) {
        analytics.track(eventType, eventName, properties, priority);
      }
    },
    [analytics]
  );
}

/**
 * 追踪点击事件
 */
export function useTrackClick(analytics: Analytics | null) {
  return useCallback(
    (elementInfo: {
      elementId?: string;
      elementClass?: string;
      elementText?: string;
      elementType?: string;
    }) => {
      if (analytics) {
        analytics.trackClick(elementInfo);
      }
    },
    [analytics]
  );
}

/**
 * 追踪页面停留时长
 */
export function usePageDuration(analytics: Analytics | null) {
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    startTimeRef.current = Date.now();

    return () => {
      if (analytics) {
        const duration = Date.now() - startTimeRef.current;
        analytics.track(
          EventType.PAGE_LEAVE,
          'page_leave',
          {
            duration,
            page_url: typeof window !== 'undefined' ? window.location.href : '',
          },
          EventPriority.NORMAL
        );
      }
    };
  }, [analytics]);
}

/**
 * 追踪性能指标
 */
export function usePerformanceTracking(analytics: Analytics | null) {
  useEffect(() => {
    if (!analytics || typeof window === 'undefined') return;

    // 监听页面加载性能
    if ('performance' in window && 'timing' in window.performance) {
      const timing = window.performance.timing as any;
      const loadTime = timing.loadEventEnd - timing.navigationStart;
      const domReadyTime = timing.domContentLoadedEventEnd - timing.navigationStart;
      const firstPaintTime = timing.responseStart - timing.navigationStart;

      analytics.trackPerformance('page_load_time', loadTime, 'ms');
      analytics.trackPerformance('dom_ready_time', domReadyTime, 'ms');
      analytics.trackPerformance('first_paint_time', firstPaintTime, 'ms');
    }

    // 监听资源加载性能
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'resource') {
            analytics.trackPerformance('resource_load_time', entry.duration, 'ms', {
              resource_name: entry.name,
            });
          }
        });
      });

      observer.observe({ entryTypes: ['resource'] });

      return () => observer.disconnect();
    }

    return undefined;
  }, [analytics]);
}

/**
 * 追踪错误
 */
export function useErrorTracking(analytics: Analytics | null) {
  useEffect(() => {
    if (!analytics || typeof window === 'undefined') return;

    const handleError = (event: ErrorEvent) => {
      analytics.trackError(event.message, event.error?.stack, event.error?.name, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      analytics.trackError('Unhandled Promise Rejection', undefined, 'PromiseRejection', {
        reason: String(event.reason),
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [analytics]);
}

/**
 * 自动追踪用户行为（综合 Hook）
 */
export function useAutoTracking(
  analytics: Analytics | null,
  options: {
    trackPageView?: boolean;
    trackPageDuration?: boolean;
    trackPerformance?: boolean;
    trackErrors?: boolean;
  } = {}
) {
  const {
    trackPageView = true,
    trackPageDuration = true,
    trackPerformance = true,
    trackErrors = true,
  } = options;

  // 页面浏览
  useEffect(() => {
    if (trackPageView && analytics) {
      const url = typeof window !== 'undefined' ? window.location.href : '';
      const title = typeof document !== 'undefined' ? document.title : '';
      analytics.trackPageView(url, title);
    }
  }, [analytics, trackPageView]);

  // 页面停留时长
  const startTimeRef = useRef<number>(Date.now());
  useEffect(() => {
    if (!trackPageDuration || !analytics) return;

    startTimeRef.current = Date.now();

    return () => {
      const duration = Date.now() - startTimeRef.current;
      analytics.track(
        EventType.PAGE_LEAVE,
        'page_leave',
        {
          duration,
          page_url: typeof window !== 'undefined' ? window.location.href : '',
        },
        EventPriority.NORMAL
      );
    };
  }, [analytics, trackPageDuration]);

  // 性能追踪
  useEffect(() => {
    if (!trackPerformance || !analytics || typeof window === 'undefined') return;

    const handleLoad = () => {
      if ('performance' in window && 'timing' in window.performance) {
        const timing = window.performance.timing as any;
        const loadTime = timing.loadEventEnd - timing.navigationStart;
        analytics.trackPerformance('page_load_time', loadTime, 'ms');
      }
    };

    window.addEventListener('load', handleLoad);
    return () => window.removeEventListener('load', handleLoad);
  }, [analytics, trackPerformance]);

  // 错误追踪
  useEffect(() => {
    if (!trackErrors || !analytics || typeof window === 'undefined') return;

    const handleError = (event: ErrorEvent) => {
      analytics.trackError(event.message, event.error?.stack, event.error?.name);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, [analytics, trackErrors]);
}
