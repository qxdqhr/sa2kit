# sa2kit Auth 环境变量

接入 `sa2kit/common/auth` 时，宿主项目需在 **环境变量 / GitHub Secrets / 运行时注入** 中配置下列变量。  
sa2kit 在 `createSa2kitAuthFromEnv()` 首次初始化时会自动打印配置检查结果（`[sa2kit/auth] 环境配置检查`）。

也可手动检查：

```bash
# 在 sa2kit 仓库
pnpm auth:env-check

# 或在宿主项目（需能读取 process.env）
node -e "import('sa2kit/common/auth/server').then(m=>m.logAuthEnvReport(m.checkAuthEnvFromProcessEnv()))"
```

---

## 功能 ↔ 环境变量速查

| 功能 | 变量 | 必需 | 说明 |
|------|------|------|------|
| **核心认证** | `BETTER_AUTH_SECRET` | 是 | ≥32 字符；可回退 `NEXTAUTH_SECRET` |
| | `BETTER_AUTH_URL` | 是 | 站点对外 URL；可回退 `NEXT_PUBLIC_APP_URL` |
| **Web 客户端** | `NEXT_PUBLIC_APP_URL` | 是（Web） | 浏览器 auth client baseURL |
| **跨域** | `BETTER_AUTH_TRUSTED_ORIGINS` | 否 | 逗号分隔 origin |
| **手机短信 OTP** | `SA2KIT_SMS_PROVIDER` | 生产建议 | `console` / `aliyun-pnvs` / `none` |
| | `ALIYUN_SMS_ACCESS_KEY_ID` | aliyun 时 | RAM AccessKey |
| | `ALIYUN_SMS_ACCESS_KEY_SECRET` | aliyun 时 | RAM Secret |
| | `ALIYUN_SMS_SIGN_NAME` | aliyun 时 | 控制台赠送签名 |
| | `ALIYUN_SMS_TEMPLATE_CODE` | aliyun 时 | 控制台赠送模板 CODE |
| | `ALIYUN_SMS_COUNTRY_CODE` | 否 | 默认 `86` |
| | `ALIYUN_SMS_CODE_VALID_MINUTES` | 否 | 模板展示分钟数，默认 `5` |
| **邮箱 OTP** | `SA2KIT_EMAIL_PROVIDER` | 否 | 仅检查提示；实现需 `config.email` |
| **数据库** | `DATABASE_URL` | 是 | 宿主 Drizzle 使用（sa2kit 不直接读） |
| **开发调试** | `SA2KIT_AUTH_LOG_OTP` | 否 | `1` 打印 OTP 日志；`0` 关闭（生产无效） |
| **兼容别名** | `NEXTAUTH_SECRET` | 否 | 等同 `BETTER_AUTH_SECRET` |
| | `NEXTAUTH_URL` | 否 | 等同 `BETTER_AUTH_URL` 回退之一 |

---

## 开发 vs 生产推荐

### 开发（零成本）

```bash
# .env.development
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=dev-better-auth-secret-min-32-chars!!
NEXT_PUBLIC_APP_URL=http://localhost:3000
SA2KIT_SMS_PROVIDER=console
DATABASE_URL=postgresql://...
```

验证码出现在 **服务端终端**：`[sa2kit/auth][dev-otp][sms] 13800138000 => 123456`

### 生产（阿里云短信认证，个人可用）

1. 开通 [阿里云号码认证 - 短信认证](https://dypns.console.aliyun.com/)
2. 选用 **赠送签名 + 赠送验证码模板**
3. 创建 RAM 用户，授权 `dypns:SendSmsVerifyCode`
4. 宿主安装：`pnpm add @alicloud/pop-core`

```bash
# .env.production 或 GitHub Secrets
SA2KIT_SMS_PROVIDER=aliyun-pnvs
ALIYUN_SMS_ACCESS_KEY_ID=LTAI...
ALIYUN_SMS_ACCESS_KEY_SECRET=...
ALIYUN_SMS_SIGN_NAME=速通互联验证码
ALIYUN_SMS_TEMPLATE_CODE=100001
```

成本约 **0.042 元/次**，100 次套餐约 **5 元/年**（以阿里云定价为准）。

---

## GitHub Actions Secrets 建议

| Secret 名称 | 用途 |
|-------------|------|
| `BETTER_AUTH_SECRET` | 生产 JWT/会话签名 |
| `BETTER_AUTH_URL` | 生产站点 URL |
| `NEXT_PUBLIC_APP_URL` | 构建时注入客户端 |
| `DATABASE_URL` | 生产数据库 |
| `ALIYUN_SMS_ACCESS_KEY_ID` | 短信认证 |
| `ALIYUN_SMS_ACCESS_KEY_SECRET` | 短信认证 |
| `ALIYUN_SMS_SIGN_NAME` | 短信认证 |
| `ALIYUN_SMS_TEMPLATE_CODE` | 短信认证 |
| `SA2KIT_SMS_PROVIDER` | 设为 `aliyun-pnvs` |

非敏感项（如 `SA2KIT_SMS_PROVIDER=aliyun-pnvs`）也可写在仓库 Variables。

---

## 宿主项目接线示例

```typescript
// lib/auth/server.ts
import { createSa2kitAuthFromEnv } from 'sa2kit/common/auth/server';
import { db } from '@/db';

export const auth = createSa2kitAuthFromEnv({ db });
```

```typescript
// app/api/auth/phone-signup-intent/route.ts
import { handlePhoneSignupIntentRequest } from 'sa2kit/common/auth/server';

export async function POST(request: Request) {
  return handlePhoneSignupIntentRequest(request);
}
```

手机号注册需 **phone-signup-intent** 路由，用于在发送 OTP 前暂存用户密码（验证通过后写入 credential）。

---

## 自动提醒行为

| 场景 | 行为 |
|------|------|
| `createSa2kitAuthFromEnv()` | 启动时打印一次 env 检查 |
| 生产未配置 SMS | ⚠ 警告：用户收不到验证码 |
| 生产使用 `console` SMS | ⚠ 警告：仅日志 OTP |
| 开发未配置 SMS | ○ 提示：可设 `SA2KIT_SMS_PROVIDER=console` |
| 缺少 `BETTER_AUTH_SECRET` | 抛出错误，阻止启动 |

关闭 OTP 日志：`SA2KIT_AUTH_LOG_OTP=0`（仍可用 SMS provider 发真短信）。

**Next.js 构建**：`next build` 时若尚未注入生产 Secret，sa2kit 会使用占位 secret 完成构建；**运行时**仍须在 Docker `--env-file` 或 GitHub Secrets 中配置真实 `BETTER_AUTH_SECRET`。

---

## 相关文档

- [auth.md](./auth.md) — API 与 UI 用法
- [MIGRATION_2.x_to_3.0.md](./MIGRATION_2.x_to_3.0.md) — Better Auth 迁移
