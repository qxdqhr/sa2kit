/**
 * 基础 API 客户端（泛型）
 * Base API Client (Generic)
 *
 * 提供统一的 API 调用逻辑，通过适配器模式支持多平台
 * 使用泛型 TUser 支持不同项目的用户类型
 */

import type { StorageAdapter } from '../storage';
import type { RequestAdapter, RequestConfig } from '../request';
import type { ApiResponse, AuthResponse, StorageKeys, ApiRoutes } from './types';
import { DEFAULT_STORAGE_KEYS, DEFAULT_API_ROUTES } from './types';

/**
 * 基础 API 客户端配置
 */
export interface BaseApiClientConfig {
  /** 基础 URL */
  baseUrl: string;
  /** 存储适配器 */
  storage: StorageAdapter;
  /** 请求适配器 */
  request: RequestAdapter;
  /** 自定义存储键（可选） */
  storageKeys?: Partial<StorageKeys>;
  /** API 路由配置（可选） */
  routes?: ApiRoutes;
}

/**
 * 基础 API 客户端
 * @template TUser 用户类型（泛型）
 */
export class BaseApiClient<TUser = any> {
  protected token: string | null = null;
  protected user: TUser | null = null;
  protected baseUrl: string;
  protected storage: StorageAdapter;
  protected request: RequestAdapter;
  protected storageKeys: StorageKeys;
  protected routes: ApiRoutes;

  constructor(config: BaseApiClientConfig) {
    this.baseUrl = config.baseUrl;
    this.storage = config.storage;
    this.request = config.request;
    this.storageKeys = {
      ...DEFAULT_STORAGE_KEYS,
      ...(config.storageKeys || {}),
    };
    this.routes = {
      ...DEFAULT_API_ROUTES,
      ...(config.routes || {}),
      auth: {
        ...DEFAULT_API_ROUTES.auth,
        ...(config.routes?.auth || {}),
      },
      users: {
        ...DEFAULT_API_ROUTES.users,
        ...(config.routes?.users || {}),
      },
    };
  }

  /**
   * 初始化 - 从存储中加载 token 和用户信息
   */
  async init(): Promise<void> {
    try {
      this.token = await this.storage.getItem(this.storageKeys.AUTH_TOKEN);
      const userData = await this.storage.getItem(this.storageKeys.USER_DATA);
      if (userData) {
        this.user = JSON.parse(userData) as TUser;
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
      await this.storage.setItem(this.storageKeys.AUTH_TOKEN, token);
    } else {
      await this.storage.removeItem(this.storageKeys.AUTH_TOKEN);
    }
  }

  /**
   * 设置用户信息
   */
  async setUser(user: TUser | null): Promise<void> {
    this.user = user;
    if (user) {
      await this.storage.setItem(this.storageKeys.USER_DATA, JSON.stringify(user));
    } else {
      await this.storage.removeItem(this.storageKeys.USER_DATA);
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
  getUser(): TUser | null {
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
    await this.storage.removeItem(this.storageKeys.AUTH_TOKEN);
    await this.storage.removeItem(this.storageKeys.USER_DATA);
    if (this.storageKeys.REFRESH_TOKEN) {
      await this.storage.removeItem(this.storageKeys.REFRESH_TOKEN);
    }
    this.token = null;
    this.user = null;
  }

  /**
   * 发送请求的通用方法
   */
  protected async sendRequest<T = any>(config: RequestConfig): Promise<ApiResponse<T>> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(config.headers || {}),
      };

      // 添加认证 token
      if (this.token) {
        headers['Authorization'] = 'Bearer ' + (this.token);
      }

      const response = await this.request.request<ApiResponse<T>>({
        ...config,
        url: (this.baseUrl) + (config.url),
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
   * 发送 PATCH 请求
   */
  async patch<T = any>(url: string, body?: any): Promise<ApiResponse<T>> {
    return this.sendRequest({ url, method: 'PATCH', body });
  }

  /**
   * 发送 DELETE 请求
   */
  async delete<T = any>(url: string): Promise<ApiResponse<T>> {
    return this.sendRequest({ url, method: 'DELETE' });
  }

  // ==================== 默认认证方法（子类可重写） ====================

  /**
   * 用户注册
   * 默认实现，子类可重写以添加自定义逻辑
   */
  async register(
    email: string,
    password: string,
    username: string
  ): Promise<ApiResponse<AuthResponse<TUser>>> {
    if (!this.routes.auth?.register) {
      throw new Error('Register route is not configured');
    }

    const response = await this.post<AuthResponse<TUser>>(this.routes.auth.register, {
      email,
      password,
      username,
    });

    if (response.success && response.data) {
      await this.setToken(response.data.token);
      await this.setUser(response.data.user);
      await this.onAuthSuccess?.(response.data.user, response.data.token);
    } else if (!response.success) {
      await this.onAuthError?.(response.error || 'Registration failed');
    }

    return response;
  }

  /**
   * 用户登录
   * 默认实现，子类可重写以添加自定义逻辑
   */
  async login(email: string, password: string): Promise<ApiResponse<AuthResponse<TUser>>> {
    if (!this.routes.auth?.login) {
      throw new Error('Login route is not configured');
    }

    const response = await this.post<AuthResponse<TUser>>(this.routes.auth.login, {
      email,
      password,
    });

    if (response.success && response.data) {
      await this.setToken(response.data.token);
      await this.setUser(response.data.user);
      await this.onAuthSuccess?.(response.data.user, response.data.token);
    } else if (!response.success) {
      await this.onAuthError?.(response.error || 'Login failed');
    }

    return response;
  }

  /**
   * 用户退出登录
   * 默认实现，子类可重写以添加自定义逻辑
   */
  async logout(): Promise<void> {
    if (this.routes.auth?.logout) {
      await this.post<void>(this.routes.auth.logout);
    }

    // 无论请求成功与否，都清除本地数据
    await this.clearUserData();
    await this.onLogout?.();
  }

  /**
   * 获取当前用户信息
   * 默认实现，子类可重写以添加自定义逻辑
   */
  async getCurrentUser(): Promise<ApiResponse<TUser>> {
    if (!this.routes.auth?.me) {
      throw new Error('Current user route is not configured');
    }

    const response = await this.get<any>(this.routes.auth.me);

    // 统一处理响应格式：自动展开 response.data.user 为 response.data
    if (response.success && response.data) {
      // 如果 data 是嵌套的 {user: {...}, session: {...}} 格式，提取 user
      const userData = response.data.user || response.data;

      await this.setUser(userData);

      return {
        ...response,
        data: userData,
      };
    }

    return response;
  }

  // ==================== 默认用户管理方法（子类可重写） ====================

  /**
   * 获取用户列表
   * 默认实现，子类可重写以添加自定义逻辑
   */
  async getUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<ApiResponse<{ users: TUser[]; total: number }>> {
    if (!this.routes.users?.list) {
      throw new Error('Users list route is not configured');
    }

    return this.get(this.routes.users.list, params);
  }

  /**
   * 获取用户详情
   * 默认实现，子类可重写以添加自定义逻辑
   */
  async getUserById(userId: string): Promise<ApiResponse<TUser>> {
    if (!this.routes.users?.detail) {
      throw new Error('User detail route is not configured');
    }

    return this.get(this.routes.users.detail(userId));
  }

  /**
   * 更新用户信息
   * 默认实现，子类可重写以添加自定义逻辑
   */
  async updateUser(userId: string, data: Partial<TUser>): Promise<ApiResponse<TUser>> {
    if (!this.routes.users?.update) {
      throw new Error('User update route is not configured');
    }

    return this.put(this.routes.users.update(userId), data);
  }

  /**
   * 删除用户
   * 默认实现，子类可重写以添加自定义逻辑
   */
  async deleteUser(userId: string): Promise<ApiResponse<void>> {
    if (!this.routes.users?.delete) {
      throw new Error('User delete route is not configured');
    }

    return this.delete(this.routes.users.delete(userId));
  }

  // ==================== 子类可重写的钩子方法 ====================

  /**
   * 请求前钩子（子类可重写）
   */
  protected async onBeforeRequest?(config: RequestConfig): Promise<RequestConfig>;

  /**
   * 请求后钩子（子类可重写）
   */
  protected async onAfterRequest?<T>(response: ApiResponse<T>): Promise<ApiResponse<T>>;

  /**
   * 请求错误钩子（子类可重写）
   */
  protected async onRequestError?(error: Error): Promise<void>;

  /**
   * 认证成功钩子（子类可重写）
   */
  protected async onAuthSuccess?(user: TUser, token: string): Promise<void>;

  /**
   * 认证失败钩子（子类可重写）
   */
  protected async onAuthError?(error: string): Promise<void>;

  /**
   * 登出钩子（子类可重写）
   */
  protected async onLogout?(): Promise<void>;
}

