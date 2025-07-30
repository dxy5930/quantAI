import { INestApplication } from '@nestjs/common';
import { ApiPrefixService } from '../config/api-prefix.config';

/**
 * API前缀工具类
 * 提供便捷的API前缀访问方法
 */
export class ApiPrefixUtil {
  private static instance: ApiPrefixService;

  /**
   * 设置API前缀服务实例
   * @param service API前缀服务实例
   */
  static setInstance(service: ApiPrefixService): void {
    this.instance = service;
  }

  /**
   * 从NestJS应用程序获取API前缀服务
   * @deprecated 使用 getInstance() 方法代替
   * @param app NestJS应用程序实例
   */
  static fromApp(app: INestApplication): ApiPrefixService {
    console.warn('ApiPrefixUtil.fromApp() is deprecated. Use getInstance() instead.');
    return this.getInstance();
  }

  /**
   * 获取全局前缀
   */
  static getGlobalPrefix(): string {
    if (!this.instance) {
      throw new Error('ApiPrefixService instance not set. Call setInstance() first.');
    }
    return this.instance.getGlobalPrefix();
  }

  /**
   * 获取模块前缀
   * @param moduleName 模块名称
   */
  static getModulePrefix(moduleName: string): string {
    if (!this.instance) {
      throw new Error('ApiPrefixService instance not set. Call setInstance() first.');
    }
    return this.instance.getModulePrefix(moduleName);
  }

  /**
   * 构建完整的API URL
   * @param moduleName 模块名称
   * @param endpoint 端点路径
   * @param baseUrl 基础URL（可选）
   */
  static buildApiUrl(moduleName: string, endpoint: string, baseUrl?: string): string {
    const prefix = this.getModulePrefix(moduleName);
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    
    if (baseUrl) {
      const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
      return `${cleanBaseUrl}/${prefix}/${cleanEndpoint}`;
    }
    
    return `/${prefix}/${cleanEndpoint}`;
  }

  /**
   * 获取API前缀服务实例
   */
  static getInstance(): ApiPrefixService {
    if (!this.instance) {
      throw new Error('ApiPrefixService instance not set. Call setInstance() first.');
    }
    return this.instance;
  }
} 