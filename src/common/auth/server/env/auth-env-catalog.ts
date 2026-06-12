export type AuthEnvPlacement = 'env_file' | 'github_secret' | 'runtime_env' | 'database';

export type AuthEnvVarDefinition = {
  key: string;
  featureId: string;
  required: boolean;
  placement: AuthEnvPlacement[];
  description: string;
  example?: string;
  secret?: boolean;
};

export type AuthFeatureDefinition = {
  id: string;
  name: string;
  description: string;
  envKeys: string[];
};

export const AUTH_FEATURES: AuthFeatureDefinition[] = [
  {
    id: 'core',
    name: '核心认证',
    description: 'Better Auth 服务端基础能力（会话、Cookie、API 路由）',
    envKeys: ['BETTER_AUTH_SECRET', 'BETTER_AUTH_URL'],
  },
  {
    id: 'client',
    name: 'Web 客户端',
    description: '浏览器端 AuthProvider / 登录弹窗请求正确 origin',
    envKeys: ['NEXT_PUBLIC_APP_URL'],
  },
  {
    id: 'trusted_origins',
    name: '跨域信任源',
    description: '多域名 / 预览环境 CORS 与 Cookie',
    envKeys: ['BETTER_AUTH_TRUSTED_ORIGINS'],
  },
  {
    id: 'sms_phone_otp',
    name: '手机短信 OTP',
    description: '手机号注册 / 登录 / 找回密码的短信验证码',
    envKeys: [
      'SA2KIT_SMS_PROVIDER',
      'ALIYUN_SMS_ACCESS_KEY_ID',
      'ALIYUN_SMS_ACCESS_KEY_SECRET',
      'ALIYUN_SMS_SIGN_NAME',
      'ALIYUN_SMS_TEMPLATE_CODE',
      'ALIYUN_SMS_COUNTRY_CODE',
      'ALIYUN_SMS_CODE_VALID_MINUTES',
      'ALIYUN_SMS_ENDPOINT',
    ],
  },
  {
    id: 'email_otp',
    name: '邮箱 OTP',
    description: '邮箱验证码（需在 createSa2kitAuth 传入 email.sendVerificationOTP）',
    envKeys: ['SA2KIT_EMAIL_PROVIDER'],
  },
  {
    id: 'database',
    name: '数据库',
    description: 'Drizzle + PostgreSQL 持久化 user/session（由宿主项目配置）',
    envKeys: ['DATABASE_URL'],
  },
];

export const AUTH_ENV_CATALOG: AuthEnvVarDefinition[] = [
  {
    key: 'BETTER_AUTH_SECRET',
    featureId: 'core',
    required: true,
    placement: ['env_file', 'github_secret', 'runtime_env'],
    description: 'Better Auth 签名密钥，至少 32 字符。可兼容读取 NEXTAUTH_SECRET。',
    example: 'openssl rand -base64 32',
    secret: true,
  },
  {
    key: 'BETTER_AUTH_URL',
    featureId: 'core',
    required: true,
    placement: ['env_file', 'github_secret', 'runtime_env'],
    description: '对外可访问的站点 URL（含协议与端口）。可回退 NEXT_PUBLIC_APP_URL / NEXTAUTH_URL。',
    example: 'https://example.com',
  },
  {
    key: 'NEXT_PUBLIC_APP_URL',
    featureId: 'client',
    required: true,
    placement: ['env_file', 'github_secret', 'runtime_env'],
    description: '浏览器端 auth client 的 baseURL。',
    example: 'https://example.com',
  },
  {
    key: 'BETTER_AUTH_TRUSTED_ORIGINS',
    featureId: 'trusted_origins',
    required: false,
    placement: ['env_file', 'github_secret', 'runtime_env'],
    description: '逗号分隔的可信 origin 列表，用于预览域 / 多域名部署。',
    example: 'https://example.com,https://www.example.com',
  },
  {
    key: 'SA2KIT_SMS_PROVIDER',
    featureId: 'sms_phone_otp',
    required: false,
    placement: ['env_file', 'github_secret', 'runtime_env'],
    description: '短信 provider：console（开发日志）| aliyun-pnvs（生产）| none。开发默认 console，生产未配置则无法发短信。',
    example: 'aliyun-pnvs',
  },
  {
    key: 'ALIYUN_SMS_ACCESS_KEY_ID',
    featureId: 'sms_phone_otp',
    required: false,
    placement: ['env_file', 'github_secret', 'runtime_env'],
    description: '阿里云 RAM AccessKey ID（短信认证 SendSmsVerifyCode）。',
    secret: true,
  },
  {
    key: 'ALIYUN_SMS_ACCESS_KEY_SECRET',
    featureId: 'sms_phone_otp',
    required: false,
    placement: ['env_file', 'github_secret', 'runtime_env'],
    description: '阿里云 RAM AccessKey Secret。',
    secret: true,
  },
  {
    key: 'ALIYUN_SMS_SIGN_NAME',
    featureId: 'sms_phone_otp',
    required: false,
    placement: ['env_file', 'github_secret', 'runtime_env'],
    description: '短信认证控制台赠送/申请的签名名称。',
    example: '速通互联验证码',
  },
  {
    key: 'ALIYUN_SMS_TEMPLATE_CODE',
    featureId: 'sms_phone_otp',
    required: false,
    placement: ['env_file', 'github_secret', 'runtime_env'],
    description: '短信认证控制台赠送/申请的模板 CODE。',
    example: '100001',
  },
  {
    key: 'ALIYUN_SMS_COUNTRY_CODE',
    featureId: 'sms_phone_otp',
    required: false,
    placement: ['env_file', 'runtime_env'],
    description: '国家码，默认 86（中国大陆）。',
    example: '86',
  },
  {
    key: 'ALIYUN_SMS_CODE_VALID_MINUTES',
    featureId: 'sms_phone_otp',
    required: false,
    placement: ['env_file', 'runtime_env'],
    description: '短信模板中展示的有效分钟数，默认 5（与 Better Auth OTP 有效期独立）。',
    example: '5',
  },
  {
    key: 'ALIYUN_SMS_ENDPOINT',
    featureId: 'sms_phone_otp',
    required: false,
    placement: ['env_file', 'runtime_env'],
    description: '可选，默认 https://dypnsapi.aliyuncs.com',
  },
  {
    key: 'SA2KIT_EMAIL_PROVIDER',
    featureId: 'email_otp',
    required: false,
    placement: ['env_file', 'github_secret', 'runtime_env'],
    description: '邮箱 OTP 由宿主实现 config.email.sendVerificationOTP；此变量仅用于 env 检查提示。',
    example: 'resend | smtp | console',
  },
  {
    key: 'DATABASE_URL',
    featureId: 'database',
    required: true,
    placement: ['env_file', 'github_secret', 'runtime_env', 'database'],
    description: 'PostgreSQL 连接串（宿主项目 Drizzle 使用，非 sa2kit 直接读取）。',
    secret: true,
  },
  {
    key: 'SA2KIT_AUTH_LOG_OTP',
    featureId: 'sms_phone_otp',
    required: false,
    placement: ['env_file', 'runtime_env'],
    description: '设为 1 时在非生产环境将 OTP 打印到服务端日志；生产环境忽略。设为 0 可关闭开发日志。',
    example: '1',
  },
];

export const AUTH_ENV_ALIASES: Record<string, string[]> = {
  BETTER_AUTH_SECRET: ['NEXTAUTH_SECRET'],
  BETTER_AUTH_URL: ['NEXT_PUBLIC_APP_URL', 'NEXTAUTH_URL'],
};
