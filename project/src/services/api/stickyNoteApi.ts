import { httpClient } from '../../utils/httpClient';
import { UnifiedApiResponse as ApiResponse } from '../../types';
import { StickyNoteColor } from '../../utils/stickyNoteColors';

// 获取 API 前缀
const API_PREFIX = import.meta.env.VITE_API_PREFIX || '/api/v1';

// 便利贴创建数据接口
export interface CreateStickyNoteData {
  title: string;
  content: string;
  positionX?: number;
  positionY?: number;
  width?: number;
  height?: number;
  color: StickyNoteColor;
  isMinimized?: boolean;
  zIndex?: number;
}

// 便利贴更新数据接口
export interface UpdateStickyNoteData {
  title?: string;
  content?: string;
  positionX?: number;
  positionY?: number;
  width?: number;
  height?: number;
  color?: StickyNoteColor;
  isMinimized?: boolean;
  zIndex?: number;
}

// 便利贴响应接口
export interface StickyNoteResponse {
  id: number;
  noteId: string;
  userId: number;
  title: string;
  content: string;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  color: StickyNoteColor;
  isMinimized: boolean;
  zIndex: number;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

// 便利贴API
export const stickyNoteApi = {
  /**
   * 创建便利贴
   */
  async create(data: CreateStickyNoteData): Promise<ApiResponse<StickyNoteResponse>> {
    return httpClient.post(`${API_PREFIX}/sticky-notes`, data);
  },

  /**
   * 获取用户的所有便利贴
   */
  async getAll(): Promise<ApiResponse<StickyNoteResponse[]>> {
    return httpClient.get(`${API_PREFIX}/sticky-notes`);
  },

  /**
   * 根据ID获取便利贴详情
   */
  async getById(noteId: string): Promise<ApiResponse<StickyNoteResponse>> {
    return httpClient.get(`${API_PREFIX}/sticky-notes/${noteId}`);
  },

  /**
   * 更新便利贴
   */
  async update(noteId: string, data: UpdateStickyNoteData): Promise<ApiResponse<StickyNoteResponse>> {
    return httpClient.put(`${API_PREFIX}/sticky-notes/${noteId}`, data);
  },

  /**
   * 删除便利贴
   */
  async delete(noteId: string): Promise<ApiResponse<{ message: string }>> {
    return httpClient.delete(`${API_PREFIX}/sticky-notes/${noteId}`);
  },
};

export default stickyNoteApi;