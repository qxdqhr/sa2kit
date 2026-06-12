#!/usr/bin/env node
/**
 * 本地检查 auth 相关环境变量（无需启动 Next.js）
 * 用法：pnpm auth:env-check
 */
import { checkAuthEnvFromProcessEnv, logAuthEnvReport } from '../dist/common/auth/server/index.js';

const report = checkAuthEnvFromProcessEnv();
logAuthEnvReport(report, { force: true });
process.exit(report.ok ? 0 : 1);
