/**
 * sa2kit auth 服务端配置类型（Better Auth 3.0）
 */

export type Sa2kitSmsProvider = {
  sendOTP: (phoneNumber: string, code: string) => void | Promise<void>;
};

export type Sa2kitEmailProvider = {
  sendVerificationOTP: (
    email: string,
    otp: string,
    type: string,
  ) => void | Promise<void>;
};

export type Sa2kitAuthConfig = {
  db: unknown;
  baseURL: string;
  secret: string;
  trustedOrigins?: string[];
  basePath?: string;
  sms?: Sa2kitSmsProvider;
  email?: Sa2kitEmailProvider;
  phoneNumberValidator?: (phoneNumber: string) => boolean;
  logOtpInDev?: boolean;
};

/** Better Auth 实例（运行时完整 API，类型刻意保持宽松以便跨插件版本） */
export type Sa2kitAuthInstance = {
  handler: (request: Request) => Promise<Response>;
  api: {
    getSession: (ctx: { headers: Headers }) => Promise<{ user: Record<string, unknown> } | null>;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

export type Sa2kitAuth = Sa2kitAuthInstance;
