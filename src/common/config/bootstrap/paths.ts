import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

export type AppConfigEnvName = 'local' | 'production' | 'test';

export type ResolveAppConfigPathOptions = {
  cwd?: string;
  env?: AppConfigEnvName;
  explicitPath?: string;
};

const FILE_BY_ENV: Record<AppConfigEnvName, string> = {
  local: 'config/app.config.local.yaml',
  production: 'config/app.config.production.yaml',
  test: 'config/app.config.test.yaml',
};

/** SOPS 密文默认路径（解密前由运维/脚本处理，应用运行时读明文 production.yaml） */
export const SOPS_ENCRYPTED_PATH = 'config/production.enc.yaml';

export function resolveAppConfigEnv(): AppConfigEnvName {
  const fromEnv = process.env.APP_CONFIG_ENV?.trim();
  if (fromEnv === 'local' || fromEnv === 'production' || fromEnv === 'test') {
    return fromEnv;
  }
  if (process.env.NODE_ENV === 'production') return 'production';
  if (process.env.NODE_ENV === 'test') return 'test';
  return 'local';
}

export function isNextBuildPhaseWithoutRuntimeEnv(): boolean {
  return (
    process.env.NEXT_PHASE === 'phase-production-build' ||
    process.env.NEXT_PHASE === 'phase-export'
  );
}

export function resolveAppConfigPath(options: ResolveAppConfigPathOptions = {}): string {
  const cwd = options.cwd ?? process.cwd();

  if (options.explicitPath) {
    return resolve(cwd, options.explicitPath);
  }

  const fromEnv = process.env.APP_CONFIG_PATH?.trim();
  if (fromEnv) {
    return resolve(cwd, fromEnv);
  }

  const envName = options.env ?? resolveAppConfigEnv();
  const candidate = resolve(cwd, FILE_BY_ENV[envName]);

  if (existsSync(candidate)) {
    return candidate;
  }

  const examplePath = resolve(cwd, 'config/app.config.example.yaml');
  if (isNextBuildPhaseWithoutRuntimeEnv() && existsSync(examplePath)) {
    return examplePath;
  }

  // 开发回退：local 不存在时尝试 production（CI / 解密后路径）
  if (envName === 'local') {
    const productionFallback = resolve(cwd, FILE_BY_ENV.production);
    if (existsSync(productionFallback)) {
      return productionFallback;
    }
  }

  return candidate;
}
