import { getAppConfig, loadAppConfig, diagnoseAppConfig, logConfigDoctorReport } from '../../config/bootstrap';
import { resolveAuthConfigFromAppConfig } from '../../config/bootstrap/resolve-auth-from-config';
import { createSa2kitAuth, type Sa2kitAuthInstance } from './create-auth';
import type { ResolveAuthEnvInput } from './env';

export type CreateSa2kitAuthFromAppConfigInput = Partial<ResolveAuthEnvInput> &
  Pick<ResolveAuthEnvInput, 'db'>;

export function createSa2kitAuthFromAppConfig(
  input: CreateSa2kitAuthFromAppConfigInput,
  options?: { logDoctor?: boolean; configPath?: string },
): Sa2kitAuthInstance {
  const appConfig = options?.configPath
    ? loadAppConfig({ explicitPath: options.configPath, logDoctor: false })
    : getAppConfig();

  if (options?.logDoctor !== false) {
    logConfigDoctorReport(diagnoseAppConfig(appConfig));
  }

  const authConfig = resolveAuthConfigFromAppConfig(appConfig, input);
  return createSa2kitAuth(authConfig);
}
