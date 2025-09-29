import { api } from '../../utils/axios';

/**
 * Mine 模块 API 接口封装
 */

// ==================== 数据类型定义 ====================

export interface BizObject {
  id: string;
  code: string;
  name: string;
  type: string;
  status: string;
  metadata?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface ObjectMetadata {
  fields: Array<{
    name: string;
    type: string;
    required: boolean;
    description?: string;
  }>;
  relations: Array<{
    name: string;
    target: string;
    type: 'one-to-one' | 'one-to-many' | 'many-to-many';
  }>;
  permissions: {
    read: boolean;
    write: boolean;
    delete: boolean;
  };
}

export interface CreateObjectRequest {
  code: string;
  name: string;
  type: string;
  metadata?: Record<string, any>;
}

export interface UpdateObjectRequest {
  name?: string;
  type?: string;
  status?: string;
  metadata?: Record<string, any>;
}

export interface ObjectQueryParams {
  code?: string;
  type?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

// ==================== API 接口封装 ====================

/**
 * 获取单个业务对象
 */
export const getSingleBizObject = (objectCode: string) => {
  return api.get<BizObject>('/operation-manager/object/metadata/getObjectMetadata', {
    params: { code: objectCode }
  });
};

/**
 * 获取对象元数据
 */
export const getObjectMetadata = (objectCode: string) => {
  return api.get<ObjectMetadata>(`/operation-manager/object/metadata/${objectCode}`);
};

/**
 * 查询业务对象列表
 */
export const queryBizObjects = (params: ObjectQueryParams) => {
  return api.get<{ items: BizObject[]; total: number }>('/operation-manager/objects', {
    params
  });
};

/**
 * 创建业务对象
 */
export const createBizObject = (data: CreateObjectRequest) => {
  return api.post<BizObject>('/operation-manager/objects', data);
};

/**
 * 更新业务对象
 */
export const updateBizObject = (objectId: string, data: UpdateObjectRequest) => {
  return api.put<BizObject>(`/operation-manager/objects/${objectId}`, data);
};

/**
 * 删除业务对象
 */
export const deleteBizObject = (objectId: string) => {
  return api.delete<void>(`/operation-manager/objects/${objectId}`);
};

/**
 * 批量操作业务对象
 */
export const batchOperateBizObjects = (operation: 'delete' | 'update', objectIds: string[], data?: any) => {
  return api.post<{ success: number; failed: number }>('/operation-manager/objects/batch', {
    operation,
    objectIds,
    data
  });
};

/**
 * 获取对象关联关系
 */
export const getObjectRelations = (objectId: string) => {
  return api.get<Array<{ id: string; name: string; type: string }>>(`/operation-manager/objects/${objectId}/relations`);
};

/**
 * 获取对象操作历史
 */
export const getObjectHistory = (objectId: string, page: number = 1, pageSize: number = 20) => {
  return api.get<{
    items: Array<{
      id: string;
      action: string;
      operator: string;
      timestamp: string;
      changes: Record<string, any>;
    }>;
    total: number;
  }>(`/operation-manager/objects/${objectId}/history`, {
    params: { page, pageSize }
  });
}; 