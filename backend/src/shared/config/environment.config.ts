export interface EnvironmentConfig {
  app: {
    port: number;
    env: string;
    name: string;
  };
  database: {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
  services: {
    pythonServiceUrl: string;
  };
  frontend: {
    url: string;
    domains: string[];
  };
  api: {
    prefix: string;
  };
}

export class EnvironmentService {
  private config: EnvironmentConfig;

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): EnvironmentConfig {
    const env = process.env.NODE_ENV || 'development';
    
    return {
      app: {
        port: parseInt(process.env.PORT || '3001', 10),
        env,
        name: process.env.APP_NAME || 'strat chain',
      },
      database: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306', 10),
        username: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || '',
        database: process.env.DB_NAME || 'strat_chain',
      },
      jwt: {
        secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      },
      services: {
        pythonServiceUrl: process.env.PYTHON_SERVICE_URL || 'http://localhost:8000',
      },
      frontend: {
        url: this.getFrontendUrl(),
        domains: this.getAllowedDomains(),
      },
      api: {
        prefix: process.env.API_PREFIX || '/api/v1',
      },
    };
  }

  /**
   * 获取前端URL，支持多环境配置
   */
  private getFrontendUrl(): string {
    const env = process.env.NODE_ENV || 'development';
    
    // 如果直接设置了 FRONTEND_URL，优先使用
    if (process.env.FRONTEND_URL) {
      return process.env.FRONTEND_URL;
    }

    // 根据环境自动推断
    switch (env) {
      case 'production':
        return process.env.FRONTEND_URL_PROD || 'https://inhandle.com';
      case 'staging':
        return process.env.FRONTEND_URL_STAGING || 'https://test.inhandle.com';
      case 'test':
        return process.env.FRONTEND_URL_TEST || 'http://localhost:3000';
      default:
        return process.env.FRONTEND_URL_DEV || 'http://localhost:5174';
    }
  }

  /**
   * 获取允许的域名列表，用于CORS等配置
   */
  private getAllowedDomains(): string[] {
    const domainsStr = process.env.ALLOWED_DOMAINS;
    if (domainsStr) {
      return domainsStr.split(',').map(domain => domain.trim());
    }

    const env = process.env.NODE_ENV || 'development';
    switch (env) {
      case 'production':
        return [
          'https://inhandle.com',
          'https://inhandle.com'
        ];
      case 'staging':
        return [
          'https://test.inhandle.com',
          'https://test.inhandle.com'
        ];
      default:
        return [
          'http://localhost:3000',
          'http://localhost:5173',
          'http://localhost:5174',
          'http://127.0.0.1:3000',
          'http://127.0.0.1:5173',
          'http://127.0.0.1:5174'
        ];
    }
  }

  /**
   * 获取完整配置
   */
  getConfig(): EnvironmentConfig {
    return this.config;
  }

  /**
   * 获取前端URL
   */
  getFrontendURL(): string {
    return this.config.frontend.url;
  }

  /**
   * 获取允许的域名
   */
  getAllowedDomainsConfig(): string[] {
    return this.config.frontend.domains;
  }

  /**
   * 检查是否为生产环境
   */
  isProduction(): boolean {
    return this.config.app.env === 'production';
  }

  /**
   * 检查是否为开发环境
   */
  isDevelopment(): boolean {
    return this.config.app.env === 'development';
  }

  /**
   * 获取数据库配置
   */
  getDatabaseConfig() {
    return this.config.database;
  }

  /**
   * 获取JWT配置
   */
  getJwtConfig() {
    return this.config.jwt;
  }

  /**
   * 动态生成分享链接
   * @param path 路径，如 '/strategy-square/123'
   * @returns 完整的分享链接
   */
  generateShareUrl(path: string): string {
    const baseUrl = this.getFrontendURL();
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${baseUrl}${cleanPath}`;
  }

  /**
   * 根据请求头自动检测前端域名
   * @param request 请求对象或请求头
   * @returns 检测到的前端域名或默认域名
   */
  detectFrontendUrl(request?: any): string {
    // 如果有请求对象，尝试从请求头获取origin
    if (request && request.headers) {
      const origin = request.headers.origin || request.headers.referer;
      if (origin && this.isAllowedOrigin(origin)) {
        return origin;
      }
    }

    // 回退到配置的默认URL
    return this.getFrontendURL();
  }

  /**
   * 检查域名是否在允许列表中
   */
  private isAllowedOrigin(origin: string): boolean {
    const allowedDomains = this.getAllowedDomainsConfig();
    return allowedDomains.some(domain => {
      // 精确匹配
      if (origin === domain) return true;
      
      // 通配符匹配（简单实现）
      if (domain.includes('*')) {
        const pattern = domain.replace(/\*/g, '.*');
        const regex = new RegExp(`^${pattern}$`);
        return regex.test(origin);
      }
      
      return false;
    });
  }
}

// 创建全局单例实例
export const environmentService = new EnvironmentService(); 