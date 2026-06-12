export {
  appConfigSchema,
  type AppConfig,
  type AppConfigInput,
} from './schema';

export {
  resolveAppConfigPath,
  resolveAppConfigEnv,
  isNextBuildPhaseWithoutRuntimeEnv,
  SOPS_ENCRYPTED_PATH,
  type AppConfigEnvName,
  type ResolveAppConfigPathOptions,
} from './paths';

export {
  loadAppConfig,
  getAppConfig,
  readAppConfigFile,
  resetAppConfigCache,
  checkAppConfigFromFile,
  type LoadAppConfigOptions,
} from './load-app-config';

export { applyAppConfigToProcessEnv } from './apply-to-process-env';

export {
  diagnoseAppConfig,
  logConfigDoctorReport,
  type ConfigDoctorReport,
  type ConfigDoctorIssue,
} from './doctor';

export { resolveAuthConfigFromAppConfig } from './resolve-auth-from-config';
