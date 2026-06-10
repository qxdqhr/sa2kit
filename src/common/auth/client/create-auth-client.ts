/**
 * Better Auth 客户端（vanilla — RN / 小程序 / Node fetch）
 */
import { createAuthClient } from 'better-auth/client';
import { emailOTPClient } from 'better-auth/client/plugins';
import { phoneNumberClient } from 'better-auth/client/plugins';

export type Sa2kitAuthClientOptions = {
  baseURL: string;
  basePath?: string;
};

function buildSa2kitAuthClient(options: Sa2kitAuthClientOptions) {
  return createAuthClient({
    baseURL: options.baseURL.replace(/\/+$/, ''),
    basePath: options.basePath ?? '/api/auth',
    plugins: [emailOTPClient(), phoneNumberClient()],
  });
}

export type Sa2kitAuthClient = ReturnType<typeof buildSa2kitAuthClient>;

export function createSa2kitAuthClient(options: Sa2kitAuthClientOptions): Sa2kitAuthClient {
  return buildSa2kitAuthClient(options);
}
