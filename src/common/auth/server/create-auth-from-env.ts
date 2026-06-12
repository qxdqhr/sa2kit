import { createSa2kitAuth, type Sa2kitAuthInstance } from './create-auth';
import {
  checkAuthEnv,
  logAuthEnvReport,
  resolveAuthEnv,
  type ResolveAuthEnvInput,
} from './env';

export function createSa2kitAuthFromEnv(
  input: ResolveAuthEnvInput,
  options?: { logEnvReport?: boolean },
): Sa2kitAuthInstance {
  const resolved = resolveAuthEnv(input);
  const report = checkAuthEnv(resolved.envSnapshot);
  if (options?.logEnvReport !== false) {
    logAuthEnvReport(report);
  }
  return createSa2kitAuth(resolved.config);
}
