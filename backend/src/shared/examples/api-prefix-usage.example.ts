import { Controller, Get, Injectable } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ApiPrefixService } from '../config/api-prefix.config';
import { ModuleApiController } from '../decorators';

/**
 * 示例1: 在控制器中使用依赖注入的API前缀服务
 */
@ApiTags('example')
@Controller('example')
export class ExampleController {
  constructor(private readonly apiPrefixService: ApiPrefixService) {}

  @Get('prefixes')
  @ApiOperation({ summary: '获取所有API前缀配置' })
  getAllPrefixes() {
    return {
      global: this.apiPrefixService.getGlobalPrefix(),
      modules: this.apiPrefixService.getAllModulePrefixes(),
      config: this.apiPrefixService.getConfig(),
    };
  }

  @Get('module-prefix/:moduleName')
  @ApiOperation({ summary: '获取指定模块的API前缀' })
  getModulePrefix(moduleName: string) {
    return {
      module: moduleName,
      prefix: this.apiPrefixService.getModulePrefix(moduleName),
    };
  }
}

/**
 * 示例2: 使用新的装饰器
 */
@ModuleApiController('example-new')
export class ExampleNewController {
  constructor(private readonly apiPrefixService: ApiPrefixService) {}

  @Get('info')
  @ApiOperation({ summary: '获取API前缀信息' })
  getInfo() {
    return {
      message: '这是使用新装饰器的控制器',
      prefix: this.apiPrefixService.getModulePrefix('example-new'),
    };
  }
}

/**
 * 示例3: 在服务中使用API前缀服务
 */
@Injectable()
export class ExampleService {
  constructor(private readonly apiPrefixService: ApiPrefixService) {}

  /**
   * 构建外部API调用URL
   */
  buildExternalApiUrl(moduleName: string, endpoint: string): string {
    const prefix = this.apiPrefixService.getModulePrefix(moduleName);
    return `http://external-api.com/${prefix}/${endpoint}`;
  }

  /**
   * 获取当前服务的API前缀
   */
  getCurrentApiPrefix(): string {
    return this.apiPrefixService.getModulePrefix('example');
  }

  /**
   * 动态设置新的模块前缀
   */
  setNewModulePrefix(moduleName: string, prefix: string): void {
    this.apiPrefixService.setModulePrefix(moduleName, prefix);
  }
}

/**
 * 示例4: 在模块中注册
 */
import { Module } from '@nestjs/common';

@Module({
  controllers: [ExampleController, ExampleNewController],
  providers: [ExampleService],
  exports: [ExampleService],
})
export class ExampleModule {}

/**
 * 示例5: 使用工具类（静态方法）
 */
import { ApiPrefixUtil } from '../utils/api-prefix.util';

export class StaticExampleService {
  /**
   * 使用静态方法获取前缀
   */
  static getAuthApiUrl(): string {
    return ApiPrefixUtil.buildApiUrl('auth', 'login', 'http://localhost:3000');
  }

  /**
   * 获取所有模块前缀
   */
  static getAllModulePrefixes(): Record<string, string> {
    const service = ApiPrefixUtil.getInstance();
    return service.getAllModulePrefixes();
  }
} 