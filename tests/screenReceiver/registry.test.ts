import { afterEach, describe, expect, it } from 'vitest';
import {
  clearScreenReceiverRegistry,
  getScreenReceiverServer,
  setScreenReceiverServer,
} from '../../src/screenReceiver/server/registry';

afterEach(() => {
  clearScreenReceiverRegistry();
});

describe('screenReceiver registry (R2-234)', () => {
  it('stores and retrieves server handle by key', () => {
    const handle = { close: () => undefined };
    setScreenReceiverServer('next-default', handle);
    expect(getScreenReceiverServer('next-default')).toBe(handle);
  });

  it('returns null for missing key', () => {
    expect(getScreenReceiverServer('missing')).toBeNull();
  });
});
