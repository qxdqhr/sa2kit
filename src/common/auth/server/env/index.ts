export {
  AUTH_ENV_CATALOG,
  AUTH_ENV_ALIASES,
  AUTH_FEATURES,
  type AuthEnvVarDefinition,
  type AuthFeatureDefinition,
  type AuthEnvPlacement,
} from './auth-env-catalog';
export { resolveAuthEnv, type ResolveAuthEnvInput, type ResolvedAuthEnv } from './resolve-auth-env';
export {
  checkAuthEnv,
  checkAuthEnvFromProcessEnv,
  logAuthEnvReport,
  formatAuthEnvSetupMarkdown,
  type AuthEnvReport,
  type AuthEnvIssue,
} from './check-auth-env';
