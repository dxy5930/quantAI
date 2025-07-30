# API前缀配置指南

## 概述

本系统提供了一个可扩展的API前缀配置方案，允许您为不同的模块设置不同的API前缀，以满足各种业务需求。

## 功能特性

- ✅ **全局前缀配置**：统一设置所有API的基础前缀
- ✅ **模块级前缀配置**：为不同模块设置独立的前缀
- ✅ **环境变量支持**：通过环境变量动态配置前缀
- ✅ **运行时动态设置**：支持在运行时修改模块前缀
- ✅ **向后兼容**：保持与现有代码的兼容性
- ✅ **类型安全**：完整的TypeScript类型支持

## 使用方式

### 1. 基本配置

在 `main.ts` 中，系统会自动创建API前缀服务：

```typescript
// 自动从环境变量读取配置
const apiPrefixConfig: Partial<ApiPrefixConfig> = {
  global: configService.get("API_PREFIX", "api/v1"),
  modules: {
    auth: configService.get("API_PREFIX_AUTH", "api/v1/auth"),
    users: configService.get("API_PREFIX_USERS", "api/v1/users"),
    strategies: configService.get("API_PREFIX_STRATEGIES", "api/v1/strategies"),
    backtest: configService.get("API_PREFIX_BACKTEST", "api/v1/backtest"),
    stocks: configService.get("API_PREFIX_STOCKS", "api/v1/stocks"),
  },
};
```

### 2. 环境变量配置

在 `.env` 文件中设置不同的前缀：

```bash
# 全局API前缀
API_PREFIX=api/v1

# 特定模块前缀
API_PREFIX_AUTH=api/v1/auth
API_PREFIX_USERS=api/v1/users
API_PREFIX_STRATEGIES=api/v1/strategies
API_PREFIX_BACKTEST=api/v1/backtest
API_PREFIX_STOCKS=api/v1/stocks

# 未来扩展示例
API_PREFIX_ADMIN=api/v1/admin
API_PREFIX_PUBLIC=api/public
API_PREFIX_INTERNAL=api/internal/v1
API_PREFIX_WEBHOOK=api/webhook/v1
```

### 3. 控制器使用

#### 传统方式（继续支持）
```typescript
@ApiTags("auth")
@Controller("auth")
export class AuthController {
  // 控制器实现
}
```

#### 新装饰器方式（可选）
```typescript
import { ModuleApiController } from '../shared/decorators';

@ModuleApiController("auth")
export class AuthController {
  // 控制器实现
}
```

### 4. 依赖注入使用（推荐）

```typescript
import { Injectable, Controller } from '@nestjs/common';
import { ApiPrefixService } from './shared/config';

@Injectable()
export class MyService {
  constructor(private readonly apiPrefixService: ApiPrefixService) {}

  buildApiUrl(moduleName: string, endpoint: string): string {
    const prefix = this.apiPrefixService.getModulePrefix(moduleName);
    return `/${prefix}/${endpoint}`;
  }
}

@Controller('example')
export class ExampleController {
  constructor(private readonly apiPrefixService: ApiPrefixService) {}

  @Get('config')
  getConfig() {
    return this.apiPrefixService.getConfig();
  }
}
```

### 5. 程序化配置

```typescript
import { ApiPrefixService } from './shared/config';

// 创建自定义配置
const apiPrefixService = new ApiPrefixService({
  global: 'api/v2',
  modules: {
    auth: 'api/v2/auth',
    admin: 'api/v1/admin',
    public: 'api/public',
  },
});

// 动态设置模块前缀
apiPrefixService.setModulePrefix('webhook', 'api/webhook/v1');

// 获取前缀
const authPrefix = apiPrefixService.getModulePrefix('auth');
```

## 扩展场景

### 1. 版本控制
```bash
# 不同版本的API
API_PREFIX_V1=api/v1
API_PREFIX_V2=api/v2
API_PREFIX_BETA=api/beta
```

### 2. 功能分组
```bash
# 按功能分组
API_PREFIX_USER=api/user
API_PREFIX_ADMIN=api/admin
API_PREFIX_PUBLIC=api/public
API_PREFIX_INTERNAL=api/internal
```

### 3. 环境区分
```bash
# 开发环境
API_PREFIX=api/dev/v1

# 生产环境
API_PREFIX=api/v1

# 测试环境
API_PREFIX=api/test/v1
```

### 4. 第三方集成
```bash
# 第三方API集成
API_PREFIX_WEBHOOK=api/webhook/v1
API_PREFIX_CALLBACK=api/callback
API_PREFIX_INTEGRATION=api/integration/v1
```

## API参考

### ApiPrefixService

#### 构造函数
```typescript
constructor(config?: Partial<ApiPrefixConfig>)
```

#### 方法

- `getGlobalPrefix(): string` - 获取全局前缀
- `getModulePrefix(moduleName: string): string` - 获取模块前缀
- `getAllModulePrefixes(): Record<string, string>` - 获取所有模块前缀
- `setModulePrefix(moduleName: string, prefix: string): void` - 设置模块前缀
- `getConfig(): ApiPrefixConfig` - 获取完整配置

### 装饰器

- `@ApiController(prefix: string, tag?: string)` - 带前缀的控制器装饰器
- `@ModuleApiController(moduleName: string, tag?: string)` - 模块化控制器装饰器

## 最佳实践

1. **统一命名**：使用一致的模块名称和前缀格式
2. **环境变量**：优先使用环境变量进行配置
3. **版本管理**：为不同版本的API设置不同前缀
4. **文档同步**：确保Swagger文档与实际前缀保持一致
5. **向后兼容**：在升级API版本时保持旧版本的可用性

## 注意事项

- 修改前缀后需要重启应用程序
- 确保前端代码中的API调用地址与后端前缀保持一致
- 在生产环境中谨慎修改前缀，避免影响现有客户端

## 示例配置

查看 `api-prefix.example.ts` 文件获取更多使用示例。 