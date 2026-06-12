import {
  AUTH_ENV_CATALOG,
  AUTH_FEATURES,
  type AuthEnvVarDefinition,
  type AuthFeatureDefinition,
} from './auth-env-catalog';

export type AuthEnvIssueLevel = 'error' | 'warning' | 'info';

export type AuthEnvIssue = {
  level: AuthEnvIssueLevel;
  featureId: string;
  featureName: string;
  message: string;
  missingKeys?: string[];
  hints?: string[];
};

export type AuthEnvReport = {
  ok: boolean;
  issues: AuthEnvIssue[];
  enabledFeatures: string[];
  disabledFeatures: string[];
};

function isSet(snapshot: Record<string, string | undefined>, key: string): boolean {
  const value = snapshot[key];
  return value !== undefined && value !== '[unset]' && value.length > 0;
}

function featureById(id: string): AuthFeatureDefinition {
  return AUTH_FEATURES.find((f) => f.id === id)!;
}

function varsForFeature(featureId: string): AuthEnvVarDefinition[] {
  return AUTH_ENV_CATALOG.filter((item) => item.featureId === featureId);
}

export function checkAuthEnv(
  envSnapshot: Record<string, string | undefined>,
): AuthEnvReport {
  const issues: AuthEnvIssue[] = [];
  const enabledFeatures: string[] = [];
  const disabledFeatures: string[] = [];

  const checkRequiredFeature = (featureId: string, productionOnly = false) => {
    const feature = featureById(featureId);
    const requiredVars = varsForFeature(featureId).filter((item) => item.required);
    const missing = requiredVars.filter((item) => !isSet(envSnapshot, item.key)).map((item) => item.key);

    if (missing.length === 0) {
      enabledFeatures.push(featureId);
      return;
    }

    if (productionOnly && envSnapshot.NODE_ENV !== 'production') {
      disabledFeatures.push(featureId);
      issues.push({
        level: 'info',
        featureId,
        featureName: feature.name,
        message: `开发环境可暂缺：${missing.join(', ')}`,
        missingKeys: missing,
      });
      return;
    }

    disabledFeatures.push(featureId);
    issues.push({
      level: 'error',
      featureId,
      featureName: feature.name,
      message: `缺少必需环境变量：${missing.join(', ')}`,
      missingKeys: missing,
    });
  };

  checkRequiredFeature('core');
  checkRequiredFeature('client', true);
  checkRequiredFeature('database', true);

  // SMS
  const smsFeature = featureById('sms_phone_otp');
  const smsProvider = envSnapshot.SA2KIT_SMS_PROVIDER;
  if (smsProvider === 'aliyun-pnvs') {
    const aliyunKeys = [
      'ALIYUN_SMS_ACCESS_KEY_ID',
      'ALIYUN_SMS_ACCESS_KEY_SECRET',
      'ALIYUN_SMS_SIGN_NAME',
      'ALIYUN_SMS_TEMPLATE_CODE',
    ];
    const missing = aliyunKeys.filter((key) => !isSet(envSnapshot, key));
    if (missing.length === 0) {
      enabledFeatures.push('sms_phone_otp');
    } else {
      disabledFeatures.push('sms_phone_otp');
      issues.push({
        level: 'error',
        featureId: 'sms_phone_otp',
        featureName: smsFeature.name,
        message: `SA2KIT_SMS_PROVIDER=aliyun-pnvs 但缺少：${missing.join(', ')}`,
        missingKeys: missing,
        hints: ['在 GitHub Secrets 或 .env.production 中配置 ALIYUN_SMS_*'],
      });
    }
  } else if (smsProvider === 'console') {
    enabledFeatures.push('sms_phone_otp');
    if (envSnapshot.NODE_ENV === 'production') {
      issues.push({
        level: 'warning',
        featureId: 'sms_phone_otp',
        featureName: smsFeature.name,
        message: '生产环境仍在使用 SA2KIT_SMS_PROVIDER=console，验证码仅输出到日志，用户收不到短信。',
        hints: ['生产请改为 aliyun-pnvs 并配置 ALIYUN_SMS_*'],
      });
    }
  } else {
    disabledFeatures.push('sms_phone_otp');
    issues.push({
      level: envSnapshot.NODE_ENV === 'production' ? 'warning' : 'info',
      featureId: 'sms_phone_otp',
      featureName: smsFeature.name,
      message:
        envSnapshot.NODE_ENV === 'production'
          ? '未配置短信 provider，手机号 OTP 无法送达（用户收不到验证码）。'
          : '未配置短信 provider；开发环境可设置 SA2KIT_SMS_PROVIDER=console 并在服务端日志查看 OTP。',
      hints: [
        '开发：SA2KIT_SMS_PROVIDER=console',
        '生产：SA2KIT_SMS_PROVIDER=aliyun-pnvs + ALIYUN_SMS_*',
      ],
    });
  }

  // Email OTP
  if (isSet(envSnapshot, 'SA2KIT_EMAIL_PROVIDER')) {
    enabledFeatures.push('email_otp');
  } else {
    disabledFeatures.push('email_otp');
    issues.push({
      level: 'info',
      featureId: 'email_otp',
      featureName: featureById('email_otp').name,
      message: '未声明 SA2KIT_EMAIL_PROVIDER；若需邮箱验证码请在 createSa2kitAuth 配置 email.sendVerificationOTP。',
    });
  }

  // Trusted origins optional
  if (isSet(envSnapshot, 'BETTER_AUTH_TRUSTED_ORIGINS')) {
    enabledFeatures.push('trusted_origins');
  } else {
    disabledFeatures.push('trusted_origins');
    issues.push({
      level: 'info',
      featureId: 'trusted_origins',
      featureName: featureById('trusted_origins').name,
      message: '未设置 BETTER_AUTH_TRUSTED_ORIGINS，仅使用 baseURL + localhost 默认值。',
    });
  }

  const ok = !issues.some((issue) => issue.level === 'error');
  return { ok, issues, enabledFeatures, disabledFeatures };
}

let loggedOnce = false;

export function logAuthEnvReport(report: AuthEnvReport, options?: { force?: boolean }): void {
  if (loggedOnce && !options?.force) return;
  loggedOnce = true;

  const lines: string[] = ['[sa2kit/auth] 环境配置检查'];
  for (const issue of report.issues) {
    const prefix =
      issue.level === 'error' ? '✗' : issue.level === 'warning' ? '⚠' : '○';
    lines.push(`${prefix} ${issue.featureName}: ${issue.message}`);
    if (issue.hints?.length) {
      for (const hint of issue.hints) {
        lines.push(`    → ${hint}`);
      }
    }
  }
  if (report.issues.length === 0) {
    lines.push('✓ 所有已启用能力的环境变量均已就绪');
  }
  lines.push(`  已启用: ${report.enabledFeatures.join(', ') || '无'}`);
  console.info(lines.join('\n'));
}

export function formatAuthEnvSetupMarkdown(report?: AuthEnvReport): string {
  const lines: string[] = [
    '# sa2kit Auth 环境变量',
    '',
    '完整说明见 sa2kit 文档：`docs/auth-env.md`',
    '',
    '## 功能 ↔ 环境变量',
    '',
  ];

  for (const feature of AUTH_FEATURES) {
    lines.push(`### ${feature.name} (\`${feature.id}\`)`);
    lines.push('');
    lines.push(feature.description);
    lines.push('');
    const vars = varsForFeature(feature.id);
    lines.push('| 变量 | 必需 | 存放位置 | 说明 |');
    lines.push('|------|------|----------|------|');
    for (const item of vars) {
      lines.push(
        `| \`${item.key}\` | ${item.required ? '是' : '否'} | ${item.placement.join(', ')} | ${item.description} |`,
      );
    }
    lines.push('');
  }

  if (report) {
    lines.push('## 当前检查结果');
    lines.push('');
    for (const issue of report.issues) {
      lines.push(`- **${issue.featureName}** (${issue.level}): ${issue.message}`);
    }
  }

  return lines.join('\n');
}

export function checkAuthEnvFromProcessEnv(
  extraSnapshot?: Record<string, string | undefined>,
): AuthEnvReport {
  const snapshot: Record<string, string | undefined> = {
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET || process.env.NEXTAUTH_SECRET ? '[set]' : undefined,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    BETTER_AUTH_TRUSTED_ORIGINS: process.env.BETTER_AUTH_TRUSTED_ORIGINS,
    SA2KIT_SMS_PROVIDER: process.env.SA2KIT_SMS_PROVIDER ?? (process.env.NODE_ENV !== 'production' ? 'console' : undefined),
    ALIYUN_SMS_ACCESS_KEY_ID: process.env.ALIYUN_SMS_ACCESS_KEY_ID ? '[set]' : undefined,
    ALIYUN_SMS_ACCESS_KEY_SECRET: process.env.ALIYUN_SMS_ACCESS_KEY_SECRET ? '[set]' : undefined,
    ALIYUN_SMS_SIGN_NAME: process.env.ALIYUN_SMS_SIGN_NAME,
    ALIYUN_SMS_TEMPLATE_CODE: process.env.ALIYUN_SMS_TEMPLATE_CODE,
    SA2KIT_EMAIL_PROVIDER: process.env.SA2KIT_EMAIL_PROVIDER,
    DATABASE_URL: process.env.DATABASE_URL ? '[set]' : undefined,
    NODE_ENV: process.env.NODE_ENV,
    ...extraSnapshot,
  };
  return checkAuthEnv(snapshot);
}
