# Auth Module Documentation

Sa2kit 的完整认证解决方案。

## 📦 安装

```bash
pnpm add @qhr123/sa2kit bcryptjs jsonwebtoken drizzle-orm postgres
```

## 🚀 快速开始

### 1. 数据库 Schema

```typescript
// drizzle/schema.ts
export {
  user,
  session,
  account,
  verifications,
  userRole,
} from '@qhr123/sa2kit/auth/schema';
```

### 2. 创建认证服务

```typescript
// lib/auth.ts
import { DrizzleAuthService } from '@qhr123/sa2kit/auth/services';
import { db } from './db';

export const authService = new DrizzleAuthService({
  db,
  jwtSecret: process.env.JWT_SECRET!,
  jwtExpiresIn: '7d',
});
```

### 3. API 路由 (Next.js App Router)

```typescript
// app/api/auth/login/route.ts
import { createLoginHandler } from '@qhr123/sa2kit/auth/routes';
import { authService } from '@/lib/auth';

export const POST = createLoginHandler({
  authService,
});
```

```typescript
// app/api/auth/register/route.ts
import { createRegisterHandler } from '@qhr123/sa2kit/auth/routes';
import { authService } from '@/lib/auth';

export const POST = createRegisterHandler({
  authService,
  defaultRole: 'USER',
});
```

### 4. 受保护的路由

```typescript
// app/api/admin/users/route.ts
import { createAuthMiddleware } from '@qhr123/sa2kit/auth/middleware';
import { authService } from '@/lib/auth';

const { requireAdmin } = createAuthMiddleware({ authService });

export const GET = requireAdmin(async (request, context) => {
  const { user } = context; // 自动注入
  // ... 业务逻辑
});
```

### 5. 前端使用

```typescript
// hooks
import { useAuth } from '@qhr123/sa2kit/auth/hooks';
import { apiClient } from './api-client';

function LoginPage() {
  const { login, loading, error } = useAuth(apiClient);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(email, password);
    if (result.success) {
      router.push('/dashboard');
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* 表单内容 */}
    </form>
  );
}
```

## 📚 API 参考

### DrizzleAuthService

- `signUp(email, password, username?, role?)` - 用户注册
- `signIn(email, password)` - 用户登录
- `verifyToken(token)` - 验证 Token
- `signOut(token)` - 登出
- `requireAdmin(token)` - 检查管理员权限
- `getUserById(userId)` - 通过 ID 获取用户
- `getUserByEmail(email)` - 通过邮箱获取用户

### 路由处理器

- `createLoginHandler(config)` - 登录路由
- `createRegisterHandler(config)` - 注册路由
- `createMeHandler(config)` - 获取当前用户
- `createLogoutHandler(config)` - 登出路由

### 中间件

- `createAuthMiddleware(config)` - 创建中间件
  - `withAuth(handler, level)` - 通用认证
  - `requireAuth(handler)` - 需要登录
  - `requireAdmin(handler)` - 需要管理员
  - `requireSuperAdmin(handler)` - 需要超级管理员

## 🔧 配置选项

### AuthServiceConfig

```typescript
{
  db: any;              // Drizzle 数据库实例
  jwtSecret: string;    // JWT 密钥
  jwtExpiresIn?: string; // 过期时间，默认 '7d'
  saltRounds?: number;  // bcrypt 加密轮数，默认 12
  checkSecretStrength?: boolean; // 生产环境检查密钥强度，默认 true
}
```

### LoginRouteConfig

```typescript
{
  authService: DrizzleAuthService;
  analytics?: {
    track: (eventName: string, properties: any) => Promise<void>;
  };
  cookieOptions?: {
    name?: string;        // Cookie 名称，默认 'auth_token'
    httpOnly?: boolean;   // 默认 true
    secure?: boolean;     // 生产环境默认 true
    sameSite?: 'strict' | 'lax' | 'none'; // 默认 'lax'
    maxAge?: number;      // 默认 7 天
    path?: string;        // 默认 '/'
  };
}
```

## 📖 更多示例

查看 [LOGIN_FLOW_EXTRACTION_PLAN.md](../LOGIN_FLOW_EXTRACTION_PLAN.md) 获取完整的使用示例。

## 🔒 安全最佳实践

1. **JWT Secret**: 至少 32 字符，生产环境强制检查
2. **Cookie 设置**: 使用 `httpOnly` 和 `secure` 
3. **密码哈希**: 使用 bcrypt，默认 12 轮加密
4. **HTTPS**: 生产环境必须使用 HTTPS
5. **CORS**: 正确配置跨域请求

## 📝 许可证

MIT

