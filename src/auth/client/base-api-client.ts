/**
 * Auth Client - Base API Client
 * 基础 API 客户端
 */

import type { StorageAdapter } from '../../storage';
import type { RequestAdapter, RequestConfig } from '../../request';
import { API_ROUTES, STORAGE_KEYS, type ApiResponse, type User, type AuthResponse } from './types';

/**
 * 基础 API 客户端
 * 提供统一的 API 调用逻辑，通过适配器模式支持多平台
 *
 * @example
 * ```typescript
 * import { BaseApiClient } from '@qhr123/sa2kit/auth/client';
 * import { WebStorageAdapter } from '@qhr123/sa2kit/storage';
 * import { WebRequestAdapter } from '@qhr123/sa2kit/request';
 *
 * const apiClient = new BaseApiClient(
 *   new WebStorageAdapter(),
 *   new WebRequestAdapter(),
 *   '/api'
 * );
 *
 * await apiClient.init();
 * const result = await apiClient.login('user@example.com', 'password');
 * ```
 */
export class BaseApiClient {
  private token: string | null = null;
  private user: User | null = null;

  constructor(
    private storage: StorageAdapter,
    private request: RequestAdapter,
    private baseUrl: string
  ) {}

  /**
   * 初始化 - 从存储中加载 token 和用户信息
   */
  async init(): Promise<void> {
    try {
      this.token = await this.storage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const userData = await this.storage.getItem(STORAGE_KEYS.USER_DATA);
      if (userData) {
        this.user = JSON.parse(userData);
      }
    } catch (error) {
      console.error('Failed to load auth data:', error);
    }
  }

  /**
   * 设置认证 token
   */
  async setToken(token: string | null): Promise<void> {
    this.token = token;
    if (token) {
      await this.storage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    } else {
      await this.storage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    }
  }

  /**
   * 设置用户信息
   */
  async setUser(user: User | null): Promise<void> {
    this.user = user;
    if (user) {
      await this.storage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
    } else {
      await this.storage.removeItem(STORAGE_KEYS.USER_DATA);
    }
  }

  /**
   * 获取当前 token
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * 获取当前用户
   */
  getUser(): User | null {
    return this.user;
  }

  /**
   * 检查是否已登录
   */
  async isAuthenticated(): Promise<boolean> {
    return !!this.token;
  }

  /**
   * 清除用户数据
   */
  async clearUserData(): Promise<void> {
    await this.storage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    await this.storage.removeItem(STORAGE_KEYS.USER_DATA);
    this.token = null;
    this.user = null;
  }

  /**
   * 发送请求的通用方法
   */
  private async sendRequest<T = any>(config: RequestConfig): Promise<ApiResponse<T>> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(config.headers || {}),
      };

      // 添加认证 token
      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }

      const response = await this.request.request<ApiResponse<T>>({
        ...config,
        url: `${this.baseUrl}${config.url}`,
        headers,
      });

      return response;
    } catch (error) {
      console.error('API request error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '网络错误，请重试',
      };
    }
  }

  // ==================== 认证相关 API ====================

  /**
   * 用户注册
   */
  async register(
    email: string,
    password: string,
    username: string
  ): Promise<ApiResponse<AuthResponse>> {
    const response = await this.sendRequest<AuthResponse>({
      url: API_ROUTES.AUTH.REGISTER,
      method: 'POST',
      body: { email, password, username },
    });

    if (response.success && response.data) {
      await this.setToken(response.data.token);
      await this.setUser(response.data.user);
    }

    return response;
  }

  /**
   * 用户登录
   */
  async login(email: string, password: string): Promise<ApiResponse<AuthResponse>> {
    const response = await this.sendRequest<AuthResponse>({
      url: API_ROUTES.AUTH.LOGIN,
      method: 'POST',
      body: { email, password },
    });

    if (response.success && response.data) {
      await this.setToken(response.data.token);
      await this.setUser(response.data.user);

      // 触发自定义事件通知登录成功
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('user_login_success', {
            detail: {
              userId: response.data.user.id,
              email: response.data.user.email,
              role: response.data.user.role,
            },
          })
        );
      }
    }

    return response;
  }

  /**
   * 用户退出登录
   */
  async logout(): Promise<ApiResponse<void>> {
    const response = await this.sendRequest<void>({
      url: API_ROUTES.AUTH.LOGOUT,
      method: 'POST',
    });

    // 无论成功与否，都清除本地数据
    await this.clearUserData();

    return response;
  }

  /**
   * 获取当前用户信息
   */
  async getCurrentUser(): Promise<ApiResponse<User>> {
    const response = await this.sendRequest<any>({
      url: API_ROUTES.AUTH.ME,
      method: 'GET',
    });

    // 统一处理响应格式
    if (response.success && response.data) {
      const userData = response.data.user || response.data;
      await this.setUser(userData);
      return {
        ...response,
        data: userData,
      };
    }

    return response;
  }

  // ==================== 通用方法 ====================

  /**
   * 发送 GET 请求
   */
  async get<T = any>(url: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    return this.sendRequest({ url, method: 'GET', params });
  }

  /**
   * 发送 POST 请求
   */
  async post<T = any>(url: string, body?: any): Promise<ApiResponse<T>> {
    return this.sendRequest({ url, method: 'POST', body });
  }

  /**
   * 发送 PUT 请求
   */
  async put<T = any>(url: string, body?: any): Promise<ApiResponse<T>> {
    return this.sendRequest({ url, method: 'PUT', body });
  }

  /**
   * 发送 DELETE 请求
   */
  async delete<T = any>(url: string): Promise<ApiResponse<T>> {
    return this.sendRequest({ url, method: 'DELETE' });
  }
}

