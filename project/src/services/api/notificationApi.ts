import { httpClient } from '../../utils/httpClient';
import { UnifiedApiResponse as ApiResponse } from '../../types';
import { Notification, PaginationParams, ListResponse } from './types';

// 获取 API 前缀
const API_PREFIX = import.meta.env.VITE_API_PREFIX || '/api/v1';

// 通知API
export const notificationApi = {
  // 获取通知列表
  async getNotifications(params?: PaginationParams & {
    type?: string;
    read?: boolean;
  }): Promise<ApiResponse<ListResponse<Notification>>> {
    return httpClient.post(`${API_PREFIX}/notifications`, params);
  },

  // 根据ID获取通知详情
  async getNotificationById(id: string): Promise<ApiResponse<Notification>> {
    return httpClient.post(`${API_PREFIX}/notifications/${id}`);
  },

  // 标记通知为已读
  async markAsRead(id: string): Promise<ApiResponse<void>> {
    return httpClient.put(`${API_PREFIX}/notifications/${id}/read`);
  },

  // 标记所有通知为已读
  async markAllAsRead(): Promise<ApiResponse<void>> {
    return httpClient.put(`${API_PREFIX}/notifications/read-all`);
  },

  // 删除通知
  async deleteNotification(id: string): Promise<ApiResponse<void>> {
    return httpClient.delete(`${API_PREFIX}/notifications/${id}`);
  },

  // 批量删除通知
  async batchDeleteNotifications(ids: string[]): Promise<ApiResponse<void>> {
    return httpClient.post(`${API_PREFIX}/notifications/batch-delete`, { ids });
  },

  // 获取未读通知数量
  async getUnreadCount(): Promise<ApiResponse<{ count: number }>> {
    return httpClient.post(`${API_PREFIX}/notifications/unread-count`);
  },
};

export default notificationApi; 