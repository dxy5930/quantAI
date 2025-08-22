/**
 * 复盘模块API服务
 * Review Module API Service
 */

import { httpClient } from '../../../utils/httpClient';
import { UnifiedApiResponse as ApiResponse } from '../../../types';
import { Review, ReviewListResponse, ReviewCreateParams, ReviewUpdateParams } from '../types';

const API_PREFIX = import.meta.env.VITE_API_PREFIX || '/api/v1';

export class ReviewApiService {
  /**
   * 创建新复盘
   */
  async create(params?: ReviewCreateParams): Promise<ApiResponse<Review>> {
    return httpClient.post(`${API_PREFIX}/reviews`, params || {});
  }

  /**
   * 获取复盘列表
   */
  async list(): Promise<ApiResponse<ReviewListResponse>> {
    return httpClient.get(`${API_PREFIX}/reviews`);
  }

  /**
   * 更新复盘
   */
  async update(reviewId: string, data: ReviewUpdateParams): Promise<ApiResponse<Review>> {
    return httpClient.post(`${API_PREFIX}/reviews/${reviewId}/update`, data);
  }

  /**
   * 删除复盘
   */
  async remove(reviewId: string): Promise<ApiResponse<void>> {
    return httpClient.post(`${API_PREFIX}/reviews/${reviewId}/delete`);
  }

  /**
   * 获取单个复盘详情
   */
  async getById(reviewId: string): Promise<ApiResponse<Review>> {
    return httpClient.get(`${API_PREFIX}/reviews/${reviewId}`);
  }
}

// 导出单例实例
export const reviewApiService = new ReviewApiService();