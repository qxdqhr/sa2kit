import { describe, expect, it } from 'vitest';
import { BoothRedeemGuard, validateUploadFiles } from '../../src/vocaloidBooth/server';

describe('vocaloidBooth security', () => {
  it('blocks requester after too many failed attempts', () => {
    const guard = new BoothRedeemGuard({ maxAttempts: 3, windowMs: 60_000, blockMs: 10_000 });
    const key = 'ip:127.0.0.1';

    guard.assertAllowed(key, 1);
    guard.registerAttempt(key, false, 1);
    guard.registerAttempt(key, false, 2);
    guard.registerAttempt(key, false, 3);

    expect(() => guard.assertAllowed(key, 4)).toThrow(/Too many attempts/);
  });

  it('validates upload files constraints', () => {
    expect(() =>
      validateUploadFiles(
        [
          { fileName: 'demo.vsqx', size: 10 },
          { fileName: 'audio.wav', size: 20 },
        ],
        { maxFiles: 3, allowedExtensions: ['vsqx', 'wav'] }
      )
    ).not.toThrow();

    expect(() =>
      validateUploadFiles([{ fileName: 'bad.exe', size: 10 }], { allowedExtensions: ['vsqx'] })
    ).toThrow(/not allowed/);
  });
});
