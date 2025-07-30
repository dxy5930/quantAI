import axios, { AxiosInstance, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { UnifiedApiResponse, ErrorResponse, SuccessResponse, ErrorCode } from '../types';
import { ROUTES } from '../constants/routes';
import { message } from './message';

// 扩展请求配置
interface RequestConfig {
  method?: string;
  url?: string;
  data?: any;
  params?: any;
  headers?: any;
  _retry?: boolean;
  metadata?: {
    startTime: number;
  };
}

export class HttpError extends Error {
  public statusCode: number;
  public errorCode?: number | string;
  public data?: any;

  constructor(statusCode: number, message: string, data?: any, errorCode?: number | string) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.data = data;
  }

  isNetworkError(): boolean {
    return this.statusCode === 0;
  }

  isTimeoutError(): boolean {
    return this.message.includes('timeout') || this.message.includes('超时');
  }

  isAuthError(): boolean {
    return this.statusCode === 401 || this.errorCode === ErrorCode.UNAUTHORIZED || this.errorCode === ErrorCode.TOKEN_EXPIRED;
  }

  isServerError(): boolean {
    return this.statusCode >= 500;
  }

  isValidationError(): boolean {
    return this.statusCode === 400 || this.errorCode === ErrorCode.VALIDATION_ERROR;
  }
}

class HttpClient {
  private instance: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (reason?: any) => void;
  }> = [];

  constructor() {
    this.instance = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL || 'http://172.3.65.2:3001',
      timeout: 300000, // 5分钟超时
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  // 设置拦截器
  private setupInterceptors(): void {
    // 请求拦截器
    this.instance.interceptors.request.use(
      (config: any) => {
        // 添加认证token
        const token = this.getAuthToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // 添加请求时间戳
        (config as any).metadata = { startTime: Date.now() };

        console.log(`[HTTP] ${config.method?.toUpperCase()} ${config.url}`, {
          params: config.params,
          data: config.data,
        });

        return config;
      },
      (error: any) => {
        console.error('[HTTP] Request error:', error);
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => {
        const duration = Date.now() - ((response.config as any).metadata?.startTime || 0);
        console.log(`[HTTP] ${response.status} ${response.config.url} (${duration}ms)`);
        
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as any;
        
        // 处理401无权限错误
        if (error.response?.status === 401 && !originalRequest._retry) {
          return this.handleUnauthorized(error, originalRequest);
        }

        // 处理其他需要重试的错误
        if (this.shouldRetry(error, originalRequest)) {
          return this.handleRetry(error, originalRequest);
        }

        console.error('[HTTP] Response error:', {
          status: error.response?.status,
          message: error.message,
          url: error.config?.url,
        });

        // 自动显示错误提示
        this.handleErrorDisplay(error);

        return Promise.reject(this.transformError(error));
      }
    );
  }

  // 自动错误提示显示
  private handleErrorDisplay(error: AxiosError): void {
    const httpError = this.transformError(error);
    
    // 只显示非认证错误的提示（认证错误由路由守卫处理）
    if (!httpError.isAuthError()) {
      let errorMessage = httpError.message;
      
      // 根据错误类型提供更友好的提示
      if (httpError.isNetworkError()) {
        errorMessage = '网络连接失败，请检查网络连接';
      } else if (httpError.isTimeoutError()) {
        errorMessage = '请求超时，请稍后重试';
      } else if (httpError.isServerError()) {
        errorMessage = '服务器暂时无法响应，请稍后重试';
      }
      
      message.error(errorMessage);
    }
  }

  // 处理401无权限错误
  private async handleUnauthorized(error: AxiosError, originalRequest: RequestConfig): Promise<any> {
    if (this.isRefreshing) {
      // 如果正在刷新token，将请求加入队列
      return new Promise((resolve, reject) => {
        this.failedQueue.push({ resolve, reject });
      }).then(() => {
        return this.instance(originalRequest);
      });
    }

    originalRequest._retry = true;
    this.isRefreshing = true;

    try {
      // 尝试刷新token
      const refreshToken = this.getRefreshToken();
      if (refreshToken) {
        const response = await this.refreshAuthToken(refreshToken);
        const newToken = response.data?.access_token;
        
        if (newToken) {
          this.setAuthToken(newToken);
          this.processQueue(null);
          return this.instance(originalRequest);
        }
      }
    } catch (refreshError) {
      console.error('刷新token失败:', refreshError);
      this.processQueue(refreshError);
    } finally {
      this.isRefreshing = false;
    }

    // 只有在刷新token失败且当前不在登录页面时才跳转
    if (window.location.pathname !== ROUTES.LOGIN) {
      this.redirectToLogin();
    }
    return Promise.reject(this.transformError(error));
  }

  // 转换错误格式
  private transformError(error: AxiosError): HttpError {
    const status = error.response?.status || 0;
    let message = '请求失败';
    let errorCode: number | string | undefined;
    let data: any;
    
    if (error.response?.data) {
      const responseData = error.response.data as any;
      
      // 处理统一错误响应格式
      if (responseData && typeof responseData === 'object') {
        if ('success' in responseData && responseData.success === false) {
          // 新的统一错误格式
          message = responseData.message || message;
          errorCode = responseData.code;
          data = responseData.data;
        } else if (responseData.message || responseData.error) {
          // 旧的错误格式
          message = responseData.message || responseData.error || message;
        }
      }
    } else if (error.message) {
      message = error.message;
    }
    
    // 根据状态码提供更友好的错误信息
    if (status === 0) {
      message = '网络连接失败，请检查网络或后端服务';
    } else if (status === 404) {
      message = 'API接口不存在';
    } else if (status === 500) {
      message = '服务器内部错误';
    } else if (status === 401) {
      message = '未授权访问';
      errorCode = ErrorCode.UNAUTHORIZED;
    } else if (status === 403) {
      message = '权限不足';
      errorCode = ErrorCode.PERMISSION_DENIED;
    }
    
    return new HttpError(status, message, data, errorCode);
  }

  // 处理重试队列
  private processQueue(error: any): void {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
    
    this.failedQueue = [];
  }

  // 判断是否应该重试
  private shouldRetry(error: AxiosError, config?: RequestConfig): boolean {
    if (!config || config._retry) return false;
    
    // 网络错误或超时错误可以重试
    if (error.code === 'NETWORK_ERROR' || error.code === 'ECONNABORTED') {
      return true;
    }
    
    // 5xx服务器错误可以重试
    if (error.response?.status && error.response.status >= 500) {
      return true;
    }
    
    return false;
  }

  // 处理重试
  private async handleRetry(error: AxiosError, originalRequest: RequestConfig): Promise<any> {
    originalRequest._retry = true;
    
    // 等待1秒后重试
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return this.instance(originalRequest);
  }

  // 通用请求方法
  async request<T = any>(config: RequestConfig): Promise<UnifiedApiResponse<T>> {
    try {
      console.log('=== HttpClient.request ===');
      console.log('请求配置:', config);
      console.log('完整URL:', `${this.instance.defaults.baseURL}${config.url}`);
      
      const response: AxiosResponse<any> = await this.instance(config);
      
      console.log('HTTP响应状态:', response.status);
      console.log('HTTP响应数据:', response.data);
      
      // 如果后端返回的数据已经是统一格式，直接返回
      if (response.data && typeof response.data === 'object' && 'success' in response.data) {
        console.log('返回统一格式响应数据');
        return response.data;
      }
      
      // 否则包装为统一格式
      const wrappedResponse: SuccessResponse<T> = {
        code: 200,
        message: 'Success',
        data: response.data,
        success: true,
        timestamp: new Date().toISOString(),
      };
      console.log('返回包装后的响应数据:', wrappedResponse);
      return wrappedResponse;
    } catch (error: any) {
      console.error('=== HttpClient.request 错误 ===');
      console.error('错误对象:', error);
      console.error('错误状态:', error.response?.status);
      console.error('错误数据:', error.response?.data);
      console.error('错误配置:', error.config?.url);
      throw error;
    }
  }

  // GET请求
  async get<T = any>(url: string, params?: any): Promise<UnifiedApiResponse<T>> {
    return this.request<T>({ method: 'GET', url, params, headers: {} });
  }

  // POST请求
  async post<T = any>(url: string, data?: any): Promise<UnifiedApiResponse<T>> {
    return this.request<T>({ method: 'POST', url, data, headers: {} });
  }

  // PUT请求
  async put<T = any>(url: string, data?: any): Promise<UnifiedApiResponse<T>> {
    return this.request<T>({ method: 'PUT', url, data, headers: {} });
  }

  // DELETE请求
  async delete<T = any>(url: string): Promise<UnifiedApiResponse<T>> {
    return this.request<T>({ method: 'DELETE', url, headers: {} });
  }

  // 认证相关方法
  private getAuthToken(): string | null {
    return localStorage.getItem('access_token');
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  // 添加公开的认证方法
  setAuthToken(token: string): void {
    localStorage.setItem('access_token', token);
  }

  setRefreshToken(token: string): void {
    localStorage.setItem('refresh_token', token);
  }

  clearAuthToken(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  private async refreshAuthToken(refreshToken: string): Promise<any> {
    return this.instance.post('/auth/refresh', { refreshToken: refreshToken });
  }

  private redirectToLogin(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.href = ROUTES.LOGIN;
  }
}

// 导出单例实例
export const httpClient = new HttpClient();
export default httpClient; 