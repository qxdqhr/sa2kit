import { NextRequest } from 'next/server';
import { getTokenFromRequest, verifyJwtToken } from './services';

/**
 * 验证 API 请求的身份
 * 从请求头中获取 Token 并验证，返回用户信息
 */
export async function validateApiAuth(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return null;

    // 注意：这里需要 JWT_SECRET，在演示环境中可能没有
    // 这是一个基础实现，实际使用时需要确保环境变量正确
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const payload = await verifyJwtToken(token, secret);
    
    if (!payload || !payload.userId) return null;

    return {
      id: payload.userId,
      email: payload.email,
      username: payload.username,
      role: payload.role,
    };
  } catch (error) {
    console.error('API 身份验证失败:', error);
    return null;
  }
}

/**
 * 验证 API 请求的身份（针对使用数字 ID 的项目）
 * 将 string 类型的 userId 转换为 number 类型
 */
export async function validateApiAuthNumeric(request: NextRequest) {
  const user = await validateApiAuth(request);
  if (!user) return null;
  
  return {
    ...user,
    id: parseInt(user.id, 10)
  };
}




