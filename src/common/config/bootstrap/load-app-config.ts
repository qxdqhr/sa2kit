import { readFileSync } from 'node:fs';
import { parse as parseYaml } from 'yaml';
import { applyAppConfigToProcessEnv } from './apply-to-process-env';
import { diagnoseAppConfig, logConfigDoctorReport, type ConfigDoctorReport } from './doctor';
import { resolveAppConfigPath, type ResolveAppConfigPathOptions } from './paths';
import { appConfigSchema, type AppConfig } from './schema';

export type LoadAppConfigOptions = ResolveAppConfigPathOptions & {
  /** 是否写入 process.env（默认 true） */
  applyToProcessEnv?: boolean;
  /** 是否打印 doctor 报告（默认 true） */
  logDoctor?: boolean;
};

let cachedConfig: AppConfig | undefined;
let cachedPath: string | undefined;

export function readAppConfigFile(filePath: string): AppConfig {
  const raw = readFileSync(filePath, 'utf8');
  const parsed = parseYaml(raw);
  const result = appConfigSchema.safeParse(parsed);

  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`AppConfig 校验失败 (${filePath}):\n${details}`);
  }

  return result.data;
}

export function loadAppConfig(options: LoadAppConfigOptions = {}): AppConfig {
  const filePath = resolveAppConfigPath(options);

  if (cachedConfig && cachedPath === filePath) {
    return cachedConfig;
  }

  const config = readAppConfigFile(filePath);
  cachedPath = filePath;
  cachedConfig = config;

  if (options.applyToProcessEnv !== false) {
    applyAppConfigToProcessEnv(config);
  }

  if (options.logDoctor !== false) {
    logConfigDoctorReport(diagnoseAppConfig(config));
  }

  return config;
}

export function getAppConfig(): AppConfig {
  if (!cachedConfig) {
    return loadAppConfig();
  }
  return cachedConfig;
}

export function resetAppConfigCache(): void {
  cachedConfig = undefined;
  cachedPath = undefined;
}

export function checkAppConfigFromFile(
  filePath: string,
): { config: AppConfig; report: ConfigDoctorReport } {
  const config = readAppConfigFile(filePath);
  return { config, report: diagnoseAppConfig(config) };
}
