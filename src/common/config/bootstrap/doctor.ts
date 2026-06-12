import type { AppConfig } from './schema';

export type ConfigDoctorIssueLevel = 'error' | 'warning' | 'info';

export type ConfigDoctorIssue = {
  level: ConfigDoctorIssueLevel;
  featureId: string;
  featureName: string;
  message: string;
  hints?: string[];
};

export type ConfigDoctorReport = {
  ok: boolean;
  issues: ConfigDoctorIssue[];
  enabledFeatures: string[];
};

function isSet(value: string | undefined): boolean {
  return Boolean(value && value.trim().length > 0);
}

export function diagnoseAppConfig(config: AppConfig): ConfigDoctorReport {
  const issues: ConfigDoctorIssue[] = [];
  const enabledFeatures: string[] = ['app', 'database', 'auth-core'];

  const env = config.app.env ?? process.env.NODE_ENV ?? 'development';
  const isProd = env === 'production';

  // Auth SMS
  const smsProvider = config.auth.sms?.provider ?? (isProd ? undefined : 'console');
  if (smsProvider === 'aliyun-pnvs') {
    const aliyun = config.auth.sms?.aliyun;
    const missing = [
      !isSet(aliyun?.accessKeyId) && 'auth.sms.aliyun.accessKeyId',
      !isSet(aliyun?.accessKeySecret) && 'auth.sms.aliyun.accessKeySecret',
      !isSet(aliyun?.signName) && 'auth.sms.aliyun.signName',
      !isSet(aliyun?.templateCode) && 'auth.sms.aliyun.templateCode',
    ].filter(Boolean) as string[];

    if (missing.length === 0) {
      enabledFeatures.push('auth-sms');
    } else {
      issues.push({
        level: 'error',
        featureId: 'auth-sms',
        featureName: '手机短信 OTP',
        message: `sms.provider=aliyun-pnvs 但缺少：${missing.join(', ')}`,
      });
    }
  } else if (smsProvider === 'console') {
    enabledFeatures.push('auth-sms');
    if (isProd) {
      issues.push({
        level: 'warning',
        featureId: 'auth-sms',
        featureName: '手机短信 OTP',
        message: '生产环境使用 console SMS，验证码仅输出到日志。',
        hints: ['生产请改为 aliyun-pnvs 并填写 auth.sms.aliyun.*'],
      });
    }
  } else {
    issues.push({
      level: isProd ? 'warning' : 'info',
      featureId: 'auth-sms',
      featureName: '手机短信 OTP',
      message: isProd
        ? '未配置短信 provider，用户收不到验证码。'
        : '未配置短信；开发可设 auth.sms.provider: console',
      hints: ['开发：auth.sms.provider: console', '生产：auth.sms.provider: aliyun-pnvs'],
    });
  }

  // OSS
  const oss = config.storage?.aliyunOss;
  const ossComplete =
    oss?.enabled !== false &&
    isSet(oss?.region) &&
    isSet(oss?.bucket) &&
    isSet(oss?.accessKeyId) &&
    isSet(oss?.accessKeySecret);

  if (ossComplete) {
    enabledFeatures.push('storage-oss');
  } else if (oss?.enabled === true) {
    issues.push({
      level: 'error',
      featureId: 'storage-oss',
      featureName: '阿里云 OSS',
      message: 'storage.aliyunOss.enabled 为 true 但配置不完整。',
    });
  } else {
    issues.push({
      level: 'info',
      featureId: 'storage-oss',
      featureName: '阿里云 OSS',
      message: '未启用完整 OSS 配置，文件上传将回退本地存储（若模块允许）。',
    });
  }

  const ok = !issues.some((i) => i.level === 'error');
  return { ok, issues, enabledFeatures };
}

let loggedOnce = false;

export function logConfigDoctorReport(report: ConfigDoctorReport, options?: { force?: boolean }): void {
  if (loggedOnce && !options?.force) return;
  loggedOnce = true;

  const lines: string[] = ['[sa2kit/config] 配置检查'];
  for (const issue of report.issues) {
    const prefix = issue.level === 'error' ? '✗' : issue.level === 'warning' ? '⚠' : '○';
    lines.push(`${prefix} ${issue.featureName}: ${issue.message}`);
    for (const hint of issue.hints ?? []) {
      lines.push(`    → ${hint}`);
    }
  }
  if (report.issues.length === 0) {
    lines.push('✓ 配置项检查通过');
  }
  lines.push(`  已启用: ${report.enabledFeatures.join(', ')}`);
  console.info(lines.join('\n'));
}
