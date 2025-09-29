import axios, { 
  AxiosInstance, 
  AxiosRequestConfig, 
  AxiosResponse, 
  AxiosError,
  InternalAxiosRequestConfig 
} from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useRef, useEffect } from 'react';
import { userStore } from '../store/userStore';
import { useNavigation } from '../hooks/useNavigation';

// HTTP客户端配置接口
export interface HttpConfig extends AxiosRequestConfig {
  retry?: number; // 重试次数
  retryDelay?: number; // 重试延迟（毫秒）
  retryCondition?: (error: AxiosError) => boolean; // 重试条件
  silent?: boolean; // 静默错误（不显示错误提示）
  skipErrorHandling?: boolean; // 跳过自动错误处理
}

// 响应数据格式
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
  success: boolean;
}

// 业务成功响应 - service层直接拿到data
export interface BusinessResult<T = any> {
  data: T;
  message?: string;
}

// 业务错误类型
export class BusinessError extends Error {
  message: string;
  code?: number;
  status?: number;
  url?: string;
  
  constructor(message: string, code?: number, status?: number, url?: string) {
    super(message);
    this.name = 'BusinessError';
    this.message = message; // 显式设置message属性
    this.code = code;
    this.status = status;
    this.url = url;
  }
}

// 错误信息类型
export interface ErrorInfo {
  code?: number;
  message: string;
  status?: number;
  url?: string;
}

// HTTP状态码常量
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  REQUEST_TIMEOUT: 408,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

// 需要重试的HTTP状态码
const RETRY_STATUS_CODES = [
  HTTP_STATUS.REQUEST_TIMEOUT,
  HTTP_STATUS.INTERNAL_SERVER_ERROR,
  HTTP_STATUS.BAD_GATEWAY,
  HTTP_STATUS.SERVICE_UNAVAILABLE,
  HTTP_STATUS.GATEWAY_TIMEOUT,
];

// 网络错误类型
const NETWORK_ERROR_CODES = [
  'ECONNABORTED', // 请求超时
  'ENOTFOUND',    // DNS解析失败
  'ECONNREFUSED', // 连接被拒绝
  'ETIMEDOUT',    // 连接超时
];

// HTTP客户端钩子函数接口
export interface HttpClientHooks {
  onUnauthorized?: () => void; // 未授权处理
  onError?: (message: string) => void; // 错误提示
  getToken?: () => Promise<string | null>; // 获取Token
  setToken?: (token: string) => Promise<void>; // 设置Token
  removeToken?: () => Promise<void>; // 移除Token
}

class HttpClient {
  private instance: AxiosInstance;
  private readonly baseURL: string;
  private readonly timeout: number;
  private hooks: HttpClientHooks = {};

  constructor(baseURL: string = '', timeout: number = 10000) {
    this.baseURL = baseURL;
    this.timeout = timeout;
    this.instance = this.createInstance();
    this.setupInterceptors();
  }

  /**
   * 设置钩子函数
   */
  public setHooks(hooks: HttpClientHooks): void {
    this.hooks = { ...this.hooks, ...hooks };
  }

  /**
   * 创建Axios实例
   */
  private createInstance(): AxiosInstance {
    return axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * 设置请求和响应拦截器
   */
  private setupInterceptors(): void {
    // 请求拦截器
    this.instance.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        // 添加认证token
        const token = await this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // 添加请求ID用于日志追踪
        config.headers['X-Request-ID'] = this.generateRequestId();

        console.log(`[HTTP Request] ${config.method?.toUpperCase()} ${config.url}`, {
          headers: config.headers,
          data: config.data,
        });

        return config;
      },
      (error: AxiosError) => {
        console.error('[HTTP Request Error]', error);
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => {
        console.log(`[HTTP Response] ${response.status} ${response.config.url}`, {
          data: response.data,
        });

        return response;
      },
      (error: AxiosError) => {
        console.error('[HTTP Response Error]', {
          status: error.response?.status,
          url: error.config?.url,
          message: error.message,
          data: error.response?.data,
        });

        return Promise.reject(error);
      }
    );
  }

  /**
   * 获取认证Token
   */
  private async getAuthToken(): Promise<string | null> {
    if (this.hooks.getToken) {
      return await this.hooks.getToken();
    }
    
    try {
      return await AsyncStorage.getItem('access_token');
    } catch (error) {
      console.error('获取Token失败:', error);
      return null;
    }
  }

  /**
   * 生成请求ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 默认重试条件
   */
  private defaultRetryCondition(error: AxiosError): boolean {
    if (!error.response && NETWORK_ERROR_CODES.includes(error.code || '')) {
      return true; // 网络错误重试
    }

    if (error.response && RETRY_STATUS_CODES.includes(error.response.status as any)) {
      return true; // 服务器错误重试
    }

    return false;
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 执行带重试的请求
   */
  private async executeWithRetry<T>(
    requestFn: () => Promise<AxiosResponse<T>>,
    config: HttpConfig
  ): Promise<AxiosResponse<T>> {
    const maxRetries = config.retry || 0;
    const retryDelay = config.retryDelay || 1000;
    const retryCondition = config.retryCondition || this.defaultRetryCondition;

    let lastError: AxiosError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await requestFn();
        
        // 如果是重试后成功，记录日志
        if (attempt > 0) {
          console.log(`[HTTP Retry Success] 第 ${attempt} 次重试成功`);
        }
        
        return response;
      } catch (error) {
        lastError = error as AxiosError;
        
        // 如果不是最后一次尝试且满足重试条件
        if (attempt < maxRetries && retryCondition(lastError)) {
          console.warn(`[HTTP Retry] 第 ${attempt + 1} 次请求失败，${retryDelay}ms 后重试`, {
            error: lastError.message,
            status: lastError.response?.status,
          });
          
          await this.delay(retryDelay * Math.pow(2, attempt)); // 指数退避
          continue;
        }
        
        throw lastError;
      }
    }

    throw lastError!;
  }

  /**
   * 统一错误处理
   */
  private async handleError(error: AxiosError, silent: boolean = false): Promise<never> {
    const errorInfo: ErrorInfo = {
      message: '请求失败',
      url: error.config?.url,
    };

    if (error.response) {
      // 服务器响应错误
      const { status, data } = error.response;
      errorInfo.status = status;
      errorInfo.code = (data as any)?.code || status;
      
      switch (status) {
        case HTTP_STATUS.BAD_REQUEST:
          errorInfo.message = (data as any)?.message || '请求参数错误';
          break;
        case HTTP_STATUS.UNAUTHORIZED:
          errorInfo.message = '未授权，请重新登录';
          await this.handleUnauthorized();
          break;
        case HTTP_STATUS.FORBIDDEN:
          errorInfo.message = '没有权限访问该资源';
          break;
        case HTTP_STATUS.NOT_FOUND:
          errorInfo.message = '请求的资源不存在';
          break;
        case HTTP_STATUS.REQUEST_TIMEOUT:
          errorInfo.message = '请求超时，请稍后重试';
          break;
        case HTTP_STATUS.INTERNAL_SERVER_ERROR:
          errorInfo.message = '服务器内部错误';
          break;
        case HTTP_STATUS.BAD_GATEWAY:
          errorInfo.message = '网关错误';
          break;
        case HTTP_STATUS.SERVICE_UNAVAILABLE:
          errorInfo.message = '服务暂时不可用';
          break;
        default:
          errorInfo.message = (data as any)?.message || `请求失败 (${status})`;
      }
    } else if (error.request) {
      // 网络错误
      if (error.code === 'ECONNABORTED') {
        errorInfo.message = '请求超时，请检查网络连接';
      } else {
        errorInfo.message = '网络连接失败，请检查网络设置';
      }
    } else {
      // 其他错误
      errorInfo.message = error.message || '未知错误';
    }

    // 如果不是静默模式，显示错误提示
    if (!silent) {
      this.showErrorMessage(errorInfo.message);
    }

    console.error('[HTTP Error]', errorInfo);
    
    // 抛出业务错误
    throw new BusinessError(
      errorInfo.message,
      errorInfo.code,
      errorInfo.status,
      errorInfo.url
    );
  }

  /**
   * 通用请求方法 - 返回业务数据
   */
  private async request<T = any>(config: HttpConfig): Promise<BusinessResult<T>> {
    try {
      const response = await this.executeWithRetry<ApiResponse<T>>(
        () => this.instance.request(config),
        config
      );

      const apiResponse = response.data;
      
      // 检查业务成功状态
      if (apiResponse.success === false) {
        // 业务逻辑失败，但HTTP请求成功
        if (!config.silent) {
          this.showErrorMessage(apiResponse.message || '操作失败');
        }
        throw new BusinessError(
          apiResponse.message || '操作失败',
          apiResponse.code,
          response.status,
          config.url
        );
      }

      // 返回业务数据
      return {
        data: apiResponse.data,
        message: apiResponse.message
      };
    } catch (error) {
      // 如果配置了跳过错误处理，直接抛出原始错误
      if (config.skipErrorHandling) {
        throw error;
      }
      
      // 如果已经是BusinessError，直接抛出
      if (error instanceof BusinessError) {
        throw error;
      }
      
      // 否则统一处理错误
      return this.handleError(error as AxiosError, config.silent);
    }
  }

  /**
   * 处理未授权错误
   */
  private async handleUnauthorized(): Promise<void> {
    if (this.hooks.onUnauthorized) {
      this.hooks.onUnauthorized();
    }
    
    await this.clearAuthToken();
  }

  /**
   * 显示错误消息
   */
  private showErrorMessage(message: string): void {
    if (this.hooks.onError) {
      this.hooks.onError(message);
    } else {
      console.error('API Error:', message);
    }
  }

  /**
   * GET请求 - service层直接拿到data
   */
  public get<T = any>(url: string, config?: HttpConfig): Promise<BusinessResult<T>> {
    return this.request<T>({ ...config, method: 'GET', url });
  }

  /**
   * POST请求 - service层直接拿到data
   */
  public post<T = any>(url: string, data?: any, config?: HttpConfig): Promise<BusinessResult<T>> {
    return this.request<T>({ ...config, method: 'POST', url, data });
  }

  /**
   * PUT请求 - service层直接拿到data
   */
  public put<T = any>(url: string, data?: any, config?: HttpConfig): Promise<BusinessResult<T>> {
    return this.request<T>({ ...config, method: 'PUT', url, data });
  }

  /**
   * DELETE请求 - service层直接拿到data
   */
  public delete<T = any>(url: string, config?: HttpConfig): Promise<BusinessResult<T>> {
    return this.request<T>({ ...config, method: 'DELETE', url });
  }

  /**
   * PATCH请求 - service层直接拿到data
   */
  public patch<T = any>(url: string, data?: any, config?: HttpConfig): Promise<BusinessResult<T>> {
    return this.request<T>({ ...config, method: 'PATCH', url, data });
  }

  /**
   * 上传文件 (React Native版本)
   */
  public upload<T = any>(
    url: string, 
    uri: string,
    options?: {
      name?: string;
      type?: string;
      onUploadProgress?: (progressEvent: any) => void;
    } & HttpConfig
  ): Promise<BusinessResult<T>> {
    const formData = new FormData();
    formData.append('file', {
      uri,
      name: options?.name || 'file',
      type: options?.type || 'image/jpeg',
    } as any);

    return this.request<T>({
      ...options,
      method: 'POST',
      url,
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...options?.headers,
      },
      onUploadProgress: options?.onUploadProgress,
    });
  }

  /**
   * 下载文件 (React Native版本 - 返回base64或文件路径)
   */
  public async downloadFile(
    url: string, 
    config?: HttpConfig
  ): Promise<string> {
    try {
      const response = await this.instance.request({
        ...config,
        method: 'GET',
        url,
        responseType: 'blob',
      });

      // 在RN中，通常返回base64字符串或使用react-native-fs等库处理文件
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError, config?.silent);
    }
  }

  /**
   * 取消请求
   */
  public createCancelToken() {
    return axios.CancelToken.source();
  }

  /**
   * 设置默认请求头
   */
  public setDefaultHeader(key: string, value: string): void {
    this.instance.defaults.headers.common[key] = value;
  }

  /**
   * 移除默认请求头
   */
  public removeDefaultHeader(key: string): void {
    delete this.instance.defaults.headers.common[key];
  }

  /**
   * 更新认证Token
   */
  public async setAuthToken(token: string): Promise<void> {
    this.setDefaultHeader('Authorization', `Bearer ${token}`);
    
    if (this.hooks.setToken) {
      await this.hooks.setToken(token);
    } else {
      try {
        await AsyncStorage.setItem('access_token', token);
      } catch (error) {
        console.error('保存Token失败:', error);
      }
    }
  }

  /**
   * 清除认证Token
   */
  public async clearAuthToken(): Promise<void> {
    this.removeDefaultHeader('Authorization');
    
    if (this.hooks.removeToken) {
      await this.hooks.removeToken();
    } else {
      try {
        await AsyncStorage.removeItem('access_token');
        await AsyncStorage.removeItem('refresh_token');
      } catch (error) {
        console.error('清除Token失败:', error);
      }
    }
  }
}

/**
 * 使用HTTP客户端的自定义Hook
 * 自动集成用户存储和导航功能
 */
export function useHttpClient(config?: { 
  baseURL?: string; 
  timeout?: number;
  onError?: (message: string) => void;
}) {
  const navigation = useNavigation();
  const clientRef = useRef<HttpClient>();

  // 创建HTTP客户端实例
  if (!clientRef.current) {
    clientRef.current = new HttpClient(
      config?.baseURL || 'http://localhost:3000/api',
      config?.timeout || 10000
    );
  }

  const client = clientRef.current;

  // 设置钩子函数
  useEffect(() => {
    let isMounted = true;
    
    if (isMounted) {
      client.setHooks({
        // 获取Token
        getToken: async () => {
          return userStore.authToken || null;
        },
        
        // 设置Token
        setToken: async (token: string) => {
          if (isMounted) {
            await userStore.updateTokens(token);
          }
        },
        
        // 移除Token
        removeToken: async () => {
          if (isMounted) {
            await userStore.logout();
          }
        },
        
        // 未授权处理
        onUnauthorized: () => {
          if (isMounted) {
            console.log('用户未授权，跳转到登录页面');
            navigation.reLaunch('Login');
          }
        },
        
        // 错误提示
        onError: config?.onError || ((message: string) => {
          if (isMounted) {
            console.error('HTTP Error:', message);
            // 这里可以集成Toast或其他提示组件
          }
        }),
      });
    }
    
    return () => {
      isMounted = false;
    };
  }, [userStore, navigation, config?.onError]);

  // 自动设置token
  useEffect(() => {
    if (userStore.authToken) {
      client.setAuthToken(userStore.authToken);
    }
  }, [userStore.authToken]);

  // 封装请求方法
  const get = useCallback(<T = any>(url: string, config?: HttpConfig) => {
    return client.get<T>(url, config);
  }, [client]);

  const post = useCallback(<T = any>(url: string, data?: any, config?: HttpConfig) => {
    return client.post<T>(url, data, config);
  }, [client]);

  const put = useCallback(<T = any>(url: string, data?: any, config?: HttpConfig) => {
    return client.put<T>(url, data, config);
  }, [client]);

  const del = useCallback(<T = any>(url: string, config?: HttpConfig) => {
    return client.delete<T>(url, config);
  }, [client]);

  const patch = useCallback(<T = any>(url: string, data?: any, config?: HttpConfig) => {
    return client.patch<T>(url, data, config);
  }, [client]);

  const upload = useCallback(<T = any>(
    url: string, 
    uri: string, 
    options?: any
  ) => {
    return client.upload<T>(url, uri, options);
  }, [client]);

  const downloadFile = useCallback((url: string, config?: HttpConfig) => {
    return client.downloadFile(url, config);
  }, [client]);

  return {
    // 请求方法
    get,
    post,
    put,
    delete: del,
    patch,
    upload,
    downloadFile,
    
    // 原始客户端实例（高级用法）
    client,
    
    // 用户状态
    isAuthenticated: userStore.isAuthenticated,
    userInfo: userStore.userInfo,
    
    // Token管理
    setAuthToken: client.setAuthToken.bind(client),
    clearAuthToken: client.clearAuthToken.bind(client),
  };
}

// 创建默认实例（向后兼容）
const httpClient = new HttpClient(
  'http://localhost:3000/api',
  10000
);

// 导出实例和类
export { HttpClient };
export default httpClient;

// 导出常用方法的简化版本（向后兼容）
export const api = {
  get: <T = any>(url: string, config?: HttpConfig) => httpClient.get<T>(url, config),
  post: <T = any>(url: string, data?: any, config?: HttpConfig) => httpClient.post<T>(url, data, config),
  put: <T = any>(url: string, data?: any, config?: HttpConfig) => httpClient.put<T>(url, data, config),
  delete: <T = any>(url: string, config?: HttpConfig) => httpClient.delete<T>(url, config),
  patch: <T = any>(url: string, data?: any, config?: HttpConfig) => httpClient.patch<T>(url, data, config),
  upload: <T = any>(url: string, uri: string, options?: any) => httpClient.upload<T>(url, uri, options),
  downloadFile: (url: string, config?: HttpConfig) => httpClient.downloadFile(url, config),
};
