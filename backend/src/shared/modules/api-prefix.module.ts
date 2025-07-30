import { Module, Global, DynamicModule } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiPrefixService, ApiPrefixConfig } from '../config/api-prefix.config';

/**
 * API前缀模块
 * 提供全局的API前缀服务
 */
@Global()
@Module({})
export class ApiPrefixModule {
  /**
   * 创建动态模块
   * @param config 可选的API前缀配置
   */
  static forRoot(config?: Partial<ApiPrefixConfig>): DynamicModule {
    return {
      module: ApiPrefixModule,
      providers: [
        {
          provide: ApiPrefixService,
          useFactory: (configService: ConfigService) => {
            const apiPrefixConfig: Partial<ApiPrefixConfig> = {
              global: configService.get("API_PREFIX", "api/v1"),
              modules: {
                auth: configService.get("API_PREFIX_AUTH", "api/v1/auth"),
                users: configService.get("API_PREFIX_USERS", "api/v1/users"),
                strategies: configService.get("API_PREFIX_STRATEGIES", "api/v1/strategies"),
                backtest: configService.get("API_PREFIX_BACKTEST", "api/v1/backtest"),
                stocks: configService.get("API_PREFIX_STOCKS", "api/v1/stocks"),
                'ai-workflow': configService.get("API_PREFIX_AI_WORKFLOW", "api/v1/ai-workflow"),
                ...config?.modules,
              },
              ...config,
            };
            
            return new ApiPrefixService(apiPrefixConfig);
          },
          inject: [ConfigService],
        },
      ],
      exports: [ApiPrefixService],
    };
  }

  /**
   * 创建带有自定义配置的模块
   * @param config 自定义API前缀配置
   */
  static forRootWithConfig(config: Partial<ApiPrefixConfig>): DynamicModule {
    return {
      module: ApiPrefixModule,
      providers: [
        {
          provide: ApiPrefixService,
          useValue: new ApiPrefixService(config),
        },
      ],
      exports: [ApiPrefixService],
    };
  }
} 