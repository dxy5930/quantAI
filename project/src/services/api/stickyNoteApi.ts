import { httpClient } from '../../utils/httpClient';
import { UnifiedApiResponse as ApiResponse } from '../../types';

// 获取 API 前缀
const API_PREFIX = import.meta.env.VITE_API_PREFIX || '/api/v1';

// 便利贴数据接口
export interface StickyNoteData {
  noteId: string;
  title?: string;
  content?: string;
  positionX?: number;
  positionY?: number;
  width?: number;
  height?: number;
  color?: 'yellow' | 'pink' | 'blue' | 'green' | 'orange';
  isMinimized?: boolean;
  zIndex?: number;
}

// 便利贴响应接口
export interface StickyNoteResponse extends StickyNoteData {
  id: number;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

// 便利贴API
export const stickyNoteApi = {
  /**
   * 创建便利贴
   */
  async create(data: StickyNoteData): Promise<ApiResponse<StickyNoteResponse>> {
    return httpClient.post(`${API_PREFIX}/sticky-notes/create`, data);
  },

  /**
   * 获取用户的所有便利贴
   */
  async getAll(): Promise<ApiResponse<StickyNoteResponse[]>> {
    return httpClient.post(`${API_PREFIX}/sticky-notes/list`);
  },

  /**
   * 根据ID获取便利贴
   */
  async getById(noteId: string): Promise<ApiResponse<StickyNoteResponse>> {
    return httpClient.post(`${API_PREFIX}/sticky-notes/get`, { noteId });
  },

  /**
   * 更新便利贴
   */
  async update(noteId: string, data: Partial<StickyNoteData>): Promise<ApiResponse<StickyNoteResponse>> {
    return httpClient.post(`${API_PREFIX}/sticky-notes/update`, { noteId, ...data });
  },

  /**
   * 软删除便利贴
   */
  async delete(noteId: string): Promise<ApiResponse<{ message: string }>> {
    return httpClient.post(`${API_PREFIX}/sticky-notes/delete`, { noteId });
  },

  /**
   * 将便利贴置顶
   */
  async bringToFront(noteId: string): Promise<ApiResponse<{ message: string }>> {
    return httpClient.post(`${API_PREFIX}/sticky-notes/bring-to-front`, { noteId });
  },

  /**
   * 同步便利贴状态
   */
  async syncState(noteId: string, data: Partial<StickyNoteData>): Promise<ApiResponse<StickyNoteResponse>> {
    return httpClient.post(`${API_PREFIX}/sticky-notes/sync`, { noteId, ...data });
  },

  /**
   * 保存便利贴到数据库（创建或更新）
   */
  async save(noteId: string, data: StickyNoteData): Promise<ApiResponse<StickyNoteResponse>> {
    const { noteId: _, ...restData } = data;
    return httpClient.post(`${API_PREFIX}/sticky-notes/save`, { noteId, ...restData });
  },

  /**
   * 恢复已删除的便利贴
   */
  async restore(noteId: string): Promise<ApiResponse<StickyNoteResponse>> {
    return httpClient.post(`${API_PREFIX}/sticky-notes/restore`, { noteId });
  },

  /**
   * 获取已删除的便利贴列表
   */
  async getDeleted(): Promise<ApiResponse<StickyNoteResponse[]>> {
    return httpClient.post(`${API_PREFIX}/sticky-notes/deleted`);
  },
};

export default stickyNoteApi;