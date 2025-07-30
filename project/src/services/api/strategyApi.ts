import { httpClient } from "../../utils/httpClient";
import { Strategy, ListResponse, PaginationParams } from "./types";
import { UnifiedApiResponse as ApiResponse } from "../../types";

// 获取 API 前缀
const API_PREFIX = import.meta.env.VITE_API_PREFIX || "/api/v1";

export const strategyApi = {
  // 获取策略列表
  async getStrategies(params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    strategyType?: string;
    sortBy?: string;
  }): Promise<ApiResponse<ListResponse<Strategy>>> {
    return httpClient.post(`${API_PREFIX}/strategies/list`, params);
  },

  // 获取我的策略
  async getMyStrategies(params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    strategyType?: string;
  }): Promise<ApiResponse<Strategy[]>> {
    return httpClient.post(`${API_PREFIX}/strategies/my`, params);
  },

  // 获取热门策略
  async getPopularStrategies(params?: {
    limit?: number;
    type?: "popularity" | "likes" | "usageCount" | "rating";
  }): Promise<ApiResponse<Strategy[]>> {
    return httpClient.post(`${API_PREFIX}/strategies/popular`, params);
  },

  // 创建新策略
  async createStrategy(data: any): Promise<ApiResponse<Strategy>> {
    return httpClient.post(`${API_PREFIX}/strategies/create`, data);
  },

  // 更新现有策略
  async updateStrategy(id: string, data: any): Promise<ApiResponse<Strategy>> {
    return httpClient.put(`${API_PREFIX}/strategies/${id}`, data);
  },

  // 兼容旧接口的创建策略
  async createStrategyLegacy(data: any): Promise<ApiResponse<{ id: string }>> {
    return httpClient.post(`${API_PREFIX}/strategies`, data);
  },

  // 删除策略
  async deleteStrategy(id: string): Promise<ApiResponse<void>> {
    return httpClient.delete(`${API_PREFIX}/strategies/${id}`);
  },

  // 根据ID获取策略
  async getStrategyById(id: string): Promise<ApiResponse<Strategy>> {
    return httpClient.post(`${API_PREFIX}/strategies/${id}`);
  },

  // 获取策略详情
  async getStrategyDetail(id: string): Promise<ApiResponse<Strategy>> {
    return httpClient.post(`${API_PREFIX}/strategies/${id}/detail`);
  },



  // 分享策略
  async shareStrategy(id: string): Promise<ApiResponse<{ share_url: string }>> {
    return httpClient.post(`${API_PREFIX}/strategies/${id}/share`);
  },

  // 点赞策略（切换模式）
  async likeStrategy(id: string): Promise<ApiResponse<boolean>> {
    return httpClient.post(`${API_PREFIX}/strategies/${id}/like`);
  },

  // 收藏策略（切换模式）
  async favoriteStrategy(id: string): Promise<ApiResponse<boolean>> {
    return httpClient.post(`${API_PREFIX}/strategies/${id}/favorite`);
  },

  // 获取我的收藏策略
  async getMyFavorites(
    query: PaginationParams
  ): Promise<ApiResponse<ListResponse<Strategy>>> {
    return httpClient.post(`${API_PREFIX}/strategies/my/favorites`, query);
  },

  // 获取我的所有相关策略（包括创建、点赞、收藏的）
  async getMyAllStrategies(params?: {
    search?: string;
    category?: string;
    strategyType?: string;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<ApiResponse<ListResponse<Strategy>>> {
    return httpClient.post(`${API_PREFIX}/strategies/my/all-strategies`, params);
  },

  // 复制策略
  async cloneStrategy(id: string): Promise<ApiResponse<Strategy>> {
    return httpClient.post(`${API_PREFIX}/strategies/${id}/clone`);
  },

  // 复制策略（基于现有策略创建新策略）
  async copyStrategy(
    id: string, 
    data?: { 
      name?: string; 
      description?: string; 
      category?: string; 
    }
  ): Promise<ApiResponse<{ id: string; name: string }>> {
    return httpClient.post(`${API_PREFIX}/strategies/${id}/copy`, data);
  },

  // 获取策略类型和分类元数据
  async getStrategyMeta(): Promise<
    ApiResponse<{
      types: { value: string; label: string; description?: string }[];
      categories: { value: string; label: string }[];
      sortOptions: { value: string; label: string }[];
    }>
  > {
    return httpClient.post(`${API_PREFIX}/strategies/meta`);
  },

  // 获取策略广场统计数据
  async getStatistics(): Promise<
    ApiResponse<{
      totalStrategies: number;
      totalUsageCount: number;
      totalLikes: number;
      avgRating: string;
    }>
  > {
    return httpClient.post(`${API_PREFIX}/strategies/statistics`);
  },

  // 获取策略配置
  async getStrategyConfig(strategyId: string): Promise<ApiResponse<any>> {
    return httpClient.post(`${API_PREFIX}/strategies/${strategyId}/config`);
  },

  // 保存策略配置
  async saveStrategyConfig(strategyId: string, data: any): Promise<ApiResponse<any>> {
    return httpClient.post(`${API_PREFIX}/strategies/${strategyId}/save`, data);
  },

  // 发布策略到广场
  async publishStrategyToSquare(strategyId: string): Promise<ApiResponse<any>> {
    return httpClient.post(`${API_PREFIX}/strategies/${strategyId}/publish`);
  },

  // 生成分享链接
  async generateShareLink(strategyId: string): Promise<ApiResponse<any>> {
    return httpClient.post(`${API_PREFIX}/strategies/${strategyId}/generate-share-link`);
  },
};

export default strategyApi;
