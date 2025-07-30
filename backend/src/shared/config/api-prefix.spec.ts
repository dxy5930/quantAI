import { ApiPrefixService, ApiPrefixConfig } from './api-prefix.config';
import { ApiPrefixUtil } from '../utils/api-prefix.util';

describe('ApiPrefixService', () => {
  let service: ApiPrefixService;

  beforeEach(() => {
    service = new ApiPrefixService();
  });

  describe('默认配置', () => {
    it('应该返回默认的全局前缀', () => {
      expect(service.getGlobalPrefix()).toBe('api/v1');
    });

    it('应该返回默认的模块前缀', () => {
      expect(service.getModulePrefix('auth')).toBe('api/v1/auth');
      expect(service.getModulePrefix('users')).toBe('api/v1/users');
      expect(service.getModulePrefix('strategies')).toBe('api/v1/strategies');
    });

    it('应该为未知模块返回全局前缀', () => {
      expect(service.getModulePrefix('unknown')).toBe('api/v1');
    });
  });

  describe('自定义配置', () => {
    it('应该使用自定义的全局前缀', () => {
      const customService = new ApiPrefixService({
        global: 'api/v2',
      });
      expect(customService.getGlobalPrefix()).toBe('api/v2');
    });

    it('应该使用自定义的模块前缀', () => {
      const customService = new ApiPrefixService({
        modules: {
          auth: 'api/v2/auth',
          admin: 'api/v1/admin',
        },
      });
      expect(customService.getModulePrefix('auth')).toBe('api/v2/auth');
      expect(customService.getModulePrefix('admin')).toBe('api/v1/admin');
    });
  });

  describe('动态设置', () => {
    it('应该能够动态设置模块前缀', () => {
      service.setModulePrefix('webhook', 'api/webhook/v1');
      expect(service.getModulePrefix('webhook')).toBe('api/webhook/v1');
    });

    it('应该能够覆盖现有的模块前缀', () => {
      service.setModulePrefix('auth', 'api/v2/auth');
      expect(service.getModulePrefix('auth')).toBe('api/v2/auth');
    });
  });

  describe('获取所有前缀', () => {
    it('应该返回所有模块前缀', () => {
      const allPrefixes = service.getAllModulePrefixes();
      expect(allPrefixes).toHaveProperty('auth');
      expect(allPrefixes).toHaveProperty('users');
      expect(allPrefixes).toHaveProperty('strategies');
    });
  });

  describe('获取配置', () => {
    it('应该返回完整的配置对象', () => {
      const config = service.getConfig();
      expect(config).toHaveProperty('global');
      expect(config).toHaveProperty('modules');
      expect(config.global).toBe('api/v1');
    });
  });
});

describe('ApiPrefixUtil', () => {
  let service: ApiPrefixService;

  beforeEach(() => {
    service = new ApiPrefixService();
    ApiPrefixUtil.setInstance(service);
  });

  describe('静态方法', () => {
    it('应该能够获取全局前缀', () => {
      expect(ApiPrefixUtil.getGlobalPrefix()).toBe('api/v1');
    });

    it('应该能够获取模块前缀', () => {
      expect(ApiPrefixUtil.getModulePrefix('auth')).toBe('api/v1/auth');
    });

    it('应该能够构建API URL', () => {
      const url = ApiPrefixUtil.buildApiUrl('auth', 'login');
      expect(url).toBe('/api/v1/auth/login');
    });

    it('应该能够构建带基础URL的API URL', () => {
      const url = ApiPrefixUtil.buildApiUrl('auth', 'login', 'http://localhost:3000');
      expect(url).toBe('http://localhost:3000/api/v1/auth/login');
    });

    it('应该正确处理端点路径的斜杠', () => {
      const url1 = ApiPrefixUtil.buildApiUrl('auth', '/login');
      const url2 = ApiPrefixUtil.buildApiUrl('auth', 'login');
      expect(url1).toBe('/api/v1/auth/login');
      expect(url2).toBe('/api/v1/auth/login');
    });

    it('应该正确处理基础URL的斜杠', () => {
      const url1 = ApiPrefixUtil.buildApiUrl('auth', 'login', 'http://localhost:3000/');
      const url2 = ApiPrefixUtil.buildApiUrl('auth', 'login', 'http://localhost:3000');
      expect(url1).toBe('http://localhost:3000/api/v1/auth/login');
      expect(url2).toBe('http://localhost:3000/api/v1/auth/login');
    });
  });

  describe('错误处理', () => {
    it('应该在未设置实例时抛出错误', () => {
      // 重置实例
      (ApiPrefixUtil as any).instance = null;
      
      expect(() => ApiPrefixUtil.getGlobalPrefix()).toThrow('ApiPrefixService instance not set');
      expect(() => ApiPrefixUtil.getModulePrefix('auth')).toThrow('ApiPrefixService instance not set');
      expect(() => ApiPrefixUtil.getInstance()).toThrow('ApiPrefixService instance not set');
    });
  });
}); 