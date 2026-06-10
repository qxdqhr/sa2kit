/**
 * Better Auth 服务端工厂（sa2kit 3.0 SSOT）
 */
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { emailOTP } from 'better-auth/plugins';
import { phoneNumber } from 'better-auth/plugins';
import { bearer } from 'better-auth/plugins';
import { authDrizzleSchema } from '../schema';
import type { Sa2kitAuthConfig, Sa2kitAuthInstance } from './types';
import {
  createDevOtpLogger,
  defaultPhoneValidator,
  defaultTempEmailFromPhone,
} from './plugins/dev-otp';

export type { Sa2kitAuthInstance } from './types';

export function createSa2kitAuth(config: Sa2kitAuthConfig): Sa2kitAuthInstance {
  if (!config.secret || config.secret.length < 32) {
    throw new Error('createSa2kitAuth: secret 至少 32 字符');
  }

  const devLog = createDevOtpLogger(config.logOtpInDev ?? process.env.NODE_ENV !== 'production');
  const phoneValidator = config.phoneNumberValidator ?? defaultPhoneValidator;

  const auth = betterAuth({
    appName: 'sa2kit',
    baseURL: config.baseURL,
    basePath: config.basePath ?? '/api/auth',
    secret: config.secret,
    trustedOrigins: config.trustedOrigins,
    database: drizzleAdapter(config.db as never, {
      provider: 'pg',
      schema: authDrizzleSchema,
    }),
    emailAndPassword: {
      enabled: true,
    },
    user: {
      additionalFields: {
        role: {
          type: 'string',
          required: false,
          defaultValue: 'USER',
          input: false,
        },
      },
    },
    plugins: [
      bearer(),
      emailOTP({
        async sendVerificationOTP({ email, otp, type }) {
          devLog?.('email', `${email} (${type})`, otp);
          if (config.email?.sendVerificationOTP) {
            await config.email.sendVerificationOTP(email, otp, type);
          }
        },
      }),
      phoneNumber({
        allowedAttempts: 5,
        phoneNumberValidator: phoneValidator,
        async sendOTP({ phoneNumber: phone, code }) {
          devLog?.('sms', phone, code);
          if (config.sms?.sendOTP) {
            void config.sms.sendOTP(phone, code);
          }
        },
        signUpOnVerification: {
          getTempEmail: defaultTempEmailFromPhone,
          getTempName: (phone) => phone,
        },
      }),
    ],
  }) as unknown as Sa2kitAuthInstance;

  return auth;
}
