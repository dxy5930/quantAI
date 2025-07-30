import { applyDecorators, Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

/**
 * 带有API前缀的控制器装饰器
 * @param prefix - 控制器路径前缀
 * @param tag - Swagger标签
 */
export function ApiController(prefix: string, tag?: string) {
  const decorators = [Controller(prefix)];
  
  if (tag) {
    decorators.push(ApiTags(tag));
  }
  
  return applyDecorators(...decorators);
}

/**
 * 模块化API控制器装饰器
 * @param moduleName - 模块名称
 * @param tag - Swagger标签
 */
export function ModuleApiController(moduleName: string, tag?: string) {
  return ApiController(moduleName, tag || moduleName);
} 