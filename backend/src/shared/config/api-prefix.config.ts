export interface ApiPrefixConfig {
  global: string;
  modules: {
    [key: string]: string;
  };
}

export const DEFAULT_API_PREFIX_CONFIG: ApiPrefixConfig = {
  global: 'api/v1',
  modules: {
    auth: 'api/v1/auth',
    users: 'api/v1/users',
    strategies: 'api/v1/strategies',
    backtest: 'api/v1/backtest',
    stocks: 'api/v1/stocks',
    system: 'api/v1/system',
    'ai-workflow': 'api/v1/ai-workflow',
    // 可以根据需要添加更多模块前缀
    // admin: 'api/v1/admin',
    // public: 'api/public',
    // internal: 'api/internal/v1',
  },
};

export class ApiPrefixService {
  private config: ApiPrefixConfig;

  constructor(config?: Partial<ApiPrefixConfig>) {
    this.config = {
      ...DEFAULT_API_PREFIX_CONFIG,
      ...config,
      modules: {
        ...DEFAULT_API_PREFIX_CONFIG.modules,
        ...config?.modules,
      },
    };
  }

  /**
   * 获取全局API前缀
   */
  getGlobalPrefix(): string {
    return this.config.global;
  }

  /**
   * 获取指定模块的API前缀
   */
  getModulePrefix(moduleName: string): string {
    return this.config.modules[moduleName] || this.config.global;
  }

  /**
   * 获取所有模块前缀配置
   */
  getAllModulePrefixes(): Record<string, string> {
    return { ...this.config.modules };
  }

  /**
   * 动态设置模块前缀
   */
  setModulePrefix(moduleName: string, prefix: string): void {
    this.config.modules[moduleName] = prefix;
  }

  /**
   * 获取完整的API前缀配置
   */
  getConfig(): ApiPrefixConfig {
    return { ...this.config };
  }
} 