/**
 * 服务模块入口文件
 * 导出所有业务逻辑服务
 */

// 统一导出所有服务
export { Login as LoginService } from './login';
export { Mine as MineService } from './mine';
export { UserService } from './user';

// 重新导出 axios 相关类型，方便其他模块使用
export { BusinessError, type BusinessResult } from '../utils/axios';

/**
 * API 服务使用指南
 * 
 * 1. 错误处理已在 axios 层统一处理
 * 2. service 层直接获取 BusinessResult<T>，包含 data 和 message
 * 3. 业务错误会抛出 BusinessError，包含友好的错误消息
 * 4. 网络错误和HTTP错误都会被转换为 BusinessError
 * 
 * 使用示例：
 * 
 * ```typescript
 * import { api, BusinessError } from '../utils/axios';
 * 
 * export class UserService {
 *   static async getUserInfo(userId: string): Promise<UserInfo> {
 *     try {
 *       const result = await api.get<UserInfo>(`/users/${userId}`);
 *       return result.data; // 直接拿到数据
 *     } catch (error) {
 *       if (error instanceof BusinessError) {
 *         // 错误已经被统一处理，这里可以做额外的业务逻辑
 *         console.log('获取用户信息失败:', error.message);
 *       }
 *       throw error; // 重新抛出，让上层处理
 *     }
 *   }
 * 
 *   static async updateUserInfo(userId: string, data: Partial<UserInfo>): Promise<UserInfo> {
 *     const result = await api.put<UserInfo>(`/users/${userId}`, data);
 *     return result.data; // 简洁的成功处理
 *   }
 * }
 * ```
 */

// 类型导出
export type { LoginData, LoginRequest } from './login';
export type { MenuItem, UserStats } from './mine';
export type { UpdateProfileRequest, ChangePasswordRequest, UserPreferences } from './user'; 