import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  clearAnalyticsRegistry,
  getRegisteredAnalytics,
  registerAnalytics,
  unregisterAnalytics,
} from '../../src/common/analytics/registry';

afterEach(() => {
  clearAnalyticsRegistry();
});

describe('analytics registry (R2-234)', () => {
  it('register and get default analytics', () => {
    const analytics = { track: vi.fn() } as never;
    registerAnalytics(analytics);
    expect(getRegisteredAnalytics()).toBe(analytics);
  });

  it('supports named registration', () => {
    const a = { track: vi.fn() } as never;
    const b = { track: vi.fn() } as never;
    registerAnalytics(a, 'app-a');
    registerAnalytics(b, 'app-b');
    expect(getRegisteredAnalytics('app-a')).toBe(a);
    expect(getRegisteredAnalytics('app-b')).toBe(b);
  });

  it('unregister clears entry', () => {
    registerAnalytics({ track: vi.fn() } as never);
    unregisterAnalytics();
    expect(getRegisteredAnalytics()).toBeNull();
  });
});
