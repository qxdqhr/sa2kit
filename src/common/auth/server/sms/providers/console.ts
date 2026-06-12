import type { Sa2kitSmsProvider } from '../types';

export function createConsoleSmsProvider(): Sa2kitSmsProvider {
  return {
    async sendOTP(phoneNumber, code) {
      console.info(`[sa2kit/auth][sms][console] ${phoneNumber} => ${code}`);
    },
  };
}
