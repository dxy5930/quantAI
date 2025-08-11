import { httpClient } from '../../utils/httpClient';
import { UnifiedApiResponse as ApiResponse } from '../../types';

const API_PREFIX = import.meta.env.VITE_API_PREFIX || '/api/v1';

export interface ReviewItem {
  id: string;
  reviewId: string;
  userId: string;
  title: string;
  reviewDate: string;
  status: 'draft' | 'completed';
  summary?: string;
  content?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ReviewListResponse {
  total: number;
  items: ReviewItem[];
}

export const reviewApi = {
  async create(): Promise<ApiResponse<ReviewItem>> {
    return httpClient.post(`${API_PREFIX}/reviews`, {});
  },
  async list(): Promise<ApiResponse<ReviewListResponse>> {
    return httpClient.get(`${API_PREFIX}/reviews`);
  },
  async update(reviewId: string, data: Partial<ReviewItem>): Promise<ApiResponse<ReviewItem>> {
    return httpClient.post(`${API_PREFIX}/reviews/${reviewId}/update`, data);
  },
  async remove(reviewId: string): Promise<ApiResponse<void>> {
    return httpClient.post(`${API_PREFIX}/reviews/${reviewId}/delete`);
  }
};

export default reviewApi; 