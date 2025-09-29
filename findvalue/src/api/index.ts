/**
 * API 层统一入口
 * 
 * 按模块组织 API 接口，提供清晰的分层架构：
 * - HTTP 层：axios 统一错误处理
 * - API 层：接口封装和类型定义  
 * - Service 层：业务逻辑处理
 * - Component 层：UI 交互
 */

// 按模块导出 API
export * as AuthApi from './auth';
export * as UserApi from './user';
export * as MineApi from './mine';

// 重新导出常用类型
export { BusinessError, type BusinessResult } from '../utils/axios';

/**
 * API 层设计原则：
 * 
 * 1. 职责单一：只负责 HTTP 接口调用
 * 2. 类型完整：完整的请求和响应类型定义
 * 3. 模块化：按业务模块组织文件结构
 * 4. 一致性：统一的命名和导出方式
 * 
 * 使用示例：
 * 
 * ```typescript
 * // 在 Service 层中使用
 * import * as UserApi from '../api/user';
 * 
 * export class UserService {
 *   static async getUserInfo(id: string) {
 *     const result = await UserApi.getUserInfo(id);
 *     return result.data; // 直接拿到业务数据
 *   }
 * }
 * ```
 */ 