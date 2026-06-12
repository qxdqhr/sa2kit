import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  checkAppConfigFromFile,
  readAppConfigFile,
  resetAppConfigCache,
} from '../../../src/common/config/bootstrap';

const minimalYaml = `
app:
  name: test-app
  env: development
database:
  url: postgresql://user:pass@localhost:5432/db
auth:
  secret: dev-better-auth-secret-min-32-chars!!
  url: http://localhost:3000
  publicUrl: http://localhost:3000
  sms:
    provider: console
`;

describe('app config bootstrap', () => {
  afterEach(() => {
    resetAppConfigCache();
  });

  it('parses and validates minimal yaml', () => {
    const dir = mkdtempSync(join(tmpdir(), 'app-config-'));
    const file = join(dir, 'app.config.local.yaml');
    writeFileSync(file, minimalYaml, 'utf8');

    const config = readAppConfigFile(file);
    expect(config.app.name).toBe('test-app');
    expect(config.auth.sms?.provider).toBe('console');
  });

  it('doctor reports missing aliyun sms keys', () => {
    const dir = mkdtempSync(join(tmpdir(), 'app-config-'));
    const file = join(dir, 'app.config.local.yaml');
    writeFileSync(
      file,
      `
app:
  name: test-app
  env: production
database:
  url: postgresql://user:pass@localhost:5432/db
auth:
  secret: dev-better-auth-secret-min-32-chars!!
  url: https://example.com
  publicUrl: https://example.com
  sms:
    provider: aliyun-pnvs
`,
      'utf8',
    );

    const { report } = checkAppConfigFromFile(file);
    expect(report.ok).toBe(false);
    expect(report.issues.some((i) => i.featureId === 'auth-sms')).toBe(true);
  });
});
