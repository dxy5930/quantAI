/**
 * API前缀配置使用示例
 * 
 * 这个文件展示了如何使用可扩展的API前缀配置系统
 */

import { ApiPrefixService, ApiPrefixConfig } from './api-prefix.config';

// 示例1: 使用默认配置
const defaultService = new ApiPrefixService();
console.log('默认全局前缀:', defaultService.getGlobalPrefix()); // api/v1
console.log('默认auth模块前缀:', defaultService.getModulePrefix('auth')); // api/v1/auth

// 示例2: 自定义配置
const customConfig: Partial<ApiPrefixConfig> = {
  global: 'api/v2',
  modules: {
    auth: 'api/v2/auth',
    users: 'api/v2/users',
    admin: 'api/v1/admin', // 管理员接口保持v1
    public: 'api/public',  // 公共接口不需要版本号
    internal: 'api/internal/v1', // 内部接口使用独立前缀
  },
};

const customService = new ApiPrefixService(customConfig);

// 示例3: 动态设置前缀
customService.setModulePrefix('webhook', 'api/webhook/v1');

// 示例4: 环境变量配置示例
/*
在 .env 文件中可以这样配置：

# 全局API前缀
API_PREFIX=api/v1

# 特定模块前缀
API_PREFIX_AUTH=api/v1/auth
API_PREFIX_USERS=api/v1/users
API_PREFIX_STRATEGIES=api/v1/strategies
API_PREFIX_BACKTEST=api/v1/backtest
API_PREFIX_STOCKS=api/v1/stocks

# 未来可能的扩展
API_PREFIX_ADMIN=api/v1/admin
API_PREFIX_PUBLIC=api/public
API_PREFIX_INTERNAL=api/internal/v1
API_PREFIX_WEBHOOK=api/webhook/v1
*/

// 示例5: 在控制器中使用
/*
// 传统方式
@ApiTags("auth")
@Controller("auth")
export class AuthController { ... }

// 使用新的装饰器（可选）
import { ModuleApiController } from '../decorators';

@ModuleApiController("auth")
export class AuthController { ... }
*/

export {
  defaultService,
  customService,
  customConfig,
}; 