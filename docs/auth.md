# Auth Module Documentation

Sa2kit 3.0 认证基于 **Better Auth**，统一入口为 `sa2kit/common/auth`。

> 迁移指南见 [MIGRATION_2.x_to_3.0.md](./MIGRATION_2.x_to_3.0.md) · ADR [001-auth-better-auth.md](./adr/001-auth-better-auth.md)

## 安装

```bash
pnpm add @qhr123/sa2kit better-auth drizzle-orm
```

环境变量与 GitHub Secrets 清单见 **[auth-env.md](./auth-env.md)**。接入时调用 `createSa2kitAuthFromEnv({ db })` 会在启动时自动提示缺失配置。

## 服务端（Next.js App Router）

```typescript
// lib/auth.ts
import { createSa2kitAuth } from 'sa2kit/common/auth/server';
import { db } from './db';

export const auth = createSa2kitAuth({
  db,
  baseURL: process.env.BETTER_AUTH_URL!,
  secret: process.env.BETTER_AUTH_SECRET!,
  trustedOrigins: [process.env.BETTER_AUTH_URL!],
  sms: {
    sendOTP: async (phone, code) => {
      await yourSmsProvider.send(phone, code);
    },
  },
  email: {
    sendVerificationOTP: async (email, otp, type) => {
      await yourMailer.send(email, otp, type);
    },
  },
});
```

```typescript
// app/api/auth/[...all]/route.ts
import { auth } from '@/lib/auth';
import { mountNextAuthHandler } from 'sa2kit/common/auth/server';

export const { GET, POST, PUT, PATCH, DELETE } = mountNextAuthHandler(auth);
```

### 受保护 API

```typescript
import { createSessionValidator } from 'sa2kit/common/auth/server';

const { getSessionUser } = createSessionValidator(auth);

export async function GET(request: Request) {
  const user = await getSessionUser(request);
  if (!user) return new Response('Unauthorized', { status: 401 });
  // ...
}
```

## 客户端（Web / React）

```tsx
'use client';

import { createSa2kitAuthClient, AuthProvider } from 'sa2kit/common/auth/react';
import { LoginModal, UserMenu } from 'sa2kit/common/auth/components';

export const authClient = createSa2kitAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL!,
});

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <AuthProvider authClient={authClient}>{children}</AuthProvider>;
}

export function Header() {
  return <UserMenu />;
}
```

Headless 表单（自定义 UI）：

```tsx
import { SignInForm } from 'sa2kit/common/auth/components';

<SignInForm authClient={authClient} onSuccess={() => router.push('/')}>
  {(state) => (/* 自定义 UI */)}
</SignInForm>
```

## Calendar 模块接入

在应用启动时（如 `instrumentation.ts` 或 route 模块顶部）配置 Better Auth：

```typescript
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { configureCalendarApiWithBetterAuth } from 'sa2kit/calendar/routes';

configureCalendarApiWithBetterAuth(auth, { db });
```

复制或 re-export `sa2kit/calendar/api/**/route.ts` 到 `app/api/calendar/**` 即可。

## Legacy 兼容（3.0 shim）

`sa2kit/business/auth-legacy` 与 `sa2kit/auth/legacy/*` 在 3.0 仅为 **re-export shim**，指向 `common/auth`。旧 API（`useAuth`、`createLegacyLoginHandler`、`LegacyAuthDbService`）调用时将抛出迁移提示。

- 新应用：直接使用 `sa2kit/common/auth/*`

## React Native

服务端已启用 `bearer` 插件；RN 客户端通过 `set-auth-token` 响应头持久化 Bearer token（AsyncStorage）。

```typescript
import { initSa2kitRnAuthClient, RnAccountLoginForm, getRnBearerToken } from 'sa2kit/common/auth/rn';

const client = await initSa2kitRnAuthClient('http://10.0.2.2:3000/api');
const token = await getRnBearerToken();
```

详见 [MIGRATION §7](./MIGRATION_2.x_to_3.0.md)。

## Schema

```typescript
export {
  user,
  session,
  account,
  verification,
} from 'sa2kit/common/auth/schema';
```

## 登录方式

| 方式 | Client API |
|------|------------|
| 邮箱 + 密码 | `authClient.signIn.email({ email, password })` |
| 手机 + 密码 | `authClient.signIn.phoneNumber({ phoneNumber, password })` |
| 邮箱 OTP | `emailOtp.sendVerificationOtp` / `signIn.emailOtp` |
| 手机 OTP | `phoneNumber.sendOtp` / `verify` |

完整 API：[Better Auth 文档](https://www.better-auth.com/docs)
