/**
 * 复盘多维表格API服务
 * 使用项目现有的httpClient和环境变量配置
 */

import { httpClient } from '../../../utils/httpClient';
import { 
  Table, 
  Field, 
  TableRecord, 
  View, 
  CreateTableParams, 
  CreateFieldParams, 
  CreateRecordParams, 
  QueryParams, 
  BatchOperation,
  ExportConfig,
  ImportConfig,
  RecordData
} from '../types';
import { UnifiedApiResponse as ApiResponse } from '../../../types';

// 获取 API 前缀
const API_PREFIX = import.meta.env.VITE_API_PREFIX || '/api/v1';

class ReviewTableAPI {
  // ==================== 表格操作 ====================

  /**
   * 获取所有表格列表
   */
  async getTables(): Promise<Table[]> {
    const response = await httpClient.get<Table[]>(`${API_PREFIX}/review/database/databases`);
    return response.data || [];
  }

  /**
   * 获取单个表格详情
   */
  async getTable(tableId: string): Promise<Table> {
    const response = await httpClient.get<Table>(`${API_PREFIX}/review/database/databases/${tableId}`);
    if (!response.data) {
      throw new Error('表格不存在');
    }
    return response.data;
  }

  /**
   * 创建新表格
   */
  async createTable(params: CreateTableParams): Promise<Table> {
    const response = await httpClient.post<Table>(`${API_PREFIX}/review/database/databases`, params);
    if (!response.data) {
      throw new Error('创建表格失败');
    }
    return response.data;
  }

  /**
   * 更新表格基本信息/字段/视图/设置
   */
  async updateTable(
    tableId: string,
    updates: Partial<Pick<Table, 'name' | 'description' | 'icon' | 'fields' | 'views' | 'records'>> & { id?: string; settings?: any }
  ): Promise<Table> {
    const body = { id: tableId, ...updates } as any;
    const response = await httpClient.put<Table>(`${API_PREFIX}/review/database/databases/${tableId}`, body);
    if (!response.data) {
      throw new Error('更新表格失败');
    }
    return response.data;
  }

  /**
   * 删除表格
   */
  async deleteTable(tableId: string): Promise<boolean> {
    const response = await httpClient.delete(`${API_PREFIX}/review/database/databases/${tableId}`);
    return response.success;
  }

  // ==================== 字段操作 ====================
  // 注意：后端将字段存储为数据库的属性，所以字段操作通过更新数据库来实现

  /**
   * 获取表格字段列表
   */
  async getFields(tableId: string): Promise<Field[]> {
    const table = await this.getTable(tableId);
    return table.fields || [];
  }

  /**
   * 创建新字段
   */
  async createField(tableId: string, params: CreateFieldParams): Promise<Field> {
    const table = await this.getTable(tableId);
    const newField: Field = {
      ...params,
      id: this.generateId(),
      order: Math.max(...table.fields.map(f => f.order), -1) + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPreset: (params as any).isPreset === true,
    } as unknown as Field;
    
    const updatedFields = [...table.fields, newField];
    await this.updateTable(tableId, { fields: updatedFields } as any);
    
    return newField;
  }

  /**
   * 更新字段
   */
  async updateField(
    tableId: string, 
    fieldId: string, 
    updates: Partial<Field>
  ): Promise<Field> {
    const table = await this.getTable(tableId);
    const fieldIndex = table.fields.findIndex(f => f.id === fieldId);
    
    if (fieldIndex === -1) {
      throw new Error('字段不存在');
    }
    
    const updatedField = {
      ...table.fields[fieldIndex],
      ...updates,
      // 保持 isPreset 不被误覆盖为 undefined
      isPreset: (updates as any).isPreset !== undefined ? (updates as any).isPreset : (table.fields[fieldIndex] as any).isPreset,
      updatedAt: new Date().toISOString(),
    } as unknown as Field;
    
    const updatedFields = [...table.fields];
    updatedFields[fieldIndex] = updatedField;
    
    await this.updateTable(tableId, { fields: updatedFields } as any);
    
    return updatedField;
  }

  /**
   * 删除字段
   */
  async deleteField(tableId: string, fieldId: string): Promise<boolean> {
    const table = await this.getTable(tableId);
    const updatedFields = table.fields.filter(f => f.id !== fieldId);
    
    await this.updateTable(tableId, { fields: updatedFields } as any);
    
    return true;
  }

  private generateId(): string {
    return 'field_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  // ==================== 记录操作 ====================

  /**
   * 获取记录列表（支持分页、过滤、排序）
   */
  async getRecords(tableId: string, params?: QueryParams): Promise<{
    records: TableRecord[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    // 透传排序为后端的 sort 查询参数（只取第一个排序作为主排序）
    let sortParam: string | undefined;
    const firstSort = params?.sorts && params.sorts.length > 0 ? params.sorts[0] : undefined;
    if (firstSort) {
      sortParam = `${firstSort.fieldId}:${firstSort.direction}`;
    }

    const response = await httpClient.get<Table>(
      `${API_PREFIX}/review/database/databases/${tableId}`,
      sortParam ? { sort: sortParam } : undefined
    );

    const table = response.data as Table;
    const records = table?.records || [];
    return {
      records,
      total: records.length,
      page: 1,
      pageSize: records.length,
    };
  }

  /**
   * 获取单条记录
   */
  async getRecord(tableId: string, recordId: string): Promise<TableRecord> {
    const table = await this.getTable(tableId);
    const record = table.records?.find(r => r.id === recordId);
    if (!record) {
      throw new Error('记录不存在');
    }
    return record;
  }

  /**
   * 创建新记录
   */
  async createRecord(tableId: string, params: CreateRecordParams): Promise<TableRecord> {
    const response = await httpClient.post<TableRecord>(
      `${API_PREFIX}/review/database/databases/${tableId}/records`, 
      params
    );
    if (!response.data) {
      throw new Error('创建记录失败');
    }
    return response.data;
  }

  /**
   * 更新记录
   */
  async updateRecord(
    tableId: string, 
    recordId: string, 
    data: Partial<RecordData>
  ): Promise<TableRecord> {
    const response = await httpClient.put<TableRecord>(
      `${API_PREFIX}/review/database/databases/${tableId}/records/${recordId}`, 
      { data }
    );
    if (!response.data) {
      throw new Error('更新记录失败');
    }
    return response.data;
  }

  /**
   * 删除记录
   */
  async deleteRecord(tableId: string, recordId: string): Promise<boolean> {
    const response = await httpClient.delete(
      `${API_PREFIX}/review/database/databases/${tableId}/records/${recordId}`
    );
    return response.success;
  }

  /**
   * 批量操作记录
   */
  async batchOperateRecords(
    tableId: string, 
    operations: BatchOperation[]
  ): Promise<{
    created: TableRecord[];
    updated: TableRecord[];
    deleted: string[];
    errors: Array<{ operation: BatchOperation; error: string }>;
  }> {
    const response = await httpClient.post<{
      created: TableRecord[];
      updated: TableRecord[];
      deleted: string[];
      errors: Array<{ operation: BatchOperation; error: string }>;
    }>(`${API_PREFIX}/review/database/databases/${tableId}/records/batch`, { operations });
    
    return response.data || { created: [], updated: [], deleted: [], errors: [] };
  }

  // 新增：AI补全同行
  async aiCompleteRow(tableId: string, recordId: string, changedFieldId: string, hint?: string): Promise<Record<string, any>> {
    const response = await httpClient.post<{ suggested: Record<string, any> }>(
      `${API_PREFIX}/review/database/databases/${tableId}/records/${recordId}/ai/complete-row`,
      { changedFieldId, hint }
    );
    const suggested = (response.data as any)?.suggested || {};
    return suggested;
  }

  // ==================== 视图操作 ====================
  // 注意：后端将视图存储为数据库的属性，所以视图操作通过更新数据库来实现

  /**
   * 获取表格视图列表
   */
  async getViews(tableId: string): Promise<View[]> {
    const table = await this.getTable(tableId);
    return table.views || [];
  }

  /**
   * 获取单个视图
   */
  async getView(tableId: string, viewId: string): Promise<View> {
    const table = await this.getTable(tableId);
    const view = table.views?.find(v => v.id === viewId);
    if (!view) {
      throw new Error('视图不存在');
    }
    return view;
  }

  /**
   * 创建新视图
   */
  async createView(
    tableId: string, 
    view: Omit<View, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>
  ): Promise<View> {
    const table = await this.getTable(tableId);
    const newView: View = {
      ...view,
      id: this.generateViewId(),
      order: Math.max(...table.views.map(v => v.order), -1) + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const updatedViews = [...table.views, newView];
    await this.updateTable(tableId, { views: updatedViews } as any);
    
    return newView;
  }

  /**
   * 更新视图
   */
  async updateView(
    tableId: string, 
    viewId: string, 
    updates: Partial<View>
  ): Promise<View> {
    const table = await this.getTable(tableId);
    const viewIndex = table.views.findIndex(v => v.id === viewId);
    
    if (viewIndex === -1) {
      throw new Error('视图不存在');
    }
    
    const updatedView = {
      ...table.views[viewIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    const updatedViews = [...table.views];
    updatedViews[viewIndex] = updatedView;
    
    await this.updateTable(tableId, { views: updatedViews } as any);
    
    return updatedView;
  }

  /**
   * 删除视图
   */
  async deleteView(tableId: string, viewId: string): Promise<boolean> {
    const table = await this.getTable(tableId);
    const updatedViews = table.views.filter(v => v.id !== viewId);
    
    await this.updateTable(tableId, { views: updatedViews } as any);
    
    return true;
  }

  private generateViewId(): string {
    return 'view_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  // ==================== 导入导出 ====================

  /**
   * 导出表格数据
   */
  async exportTable(tableId: string, config: ExportConfig): Promise<Blob> {
    // 使用httpClient的request方法进行文件下载
    const response = await httpClient.request({
      method: 'POST',
      url: `${API_PREFIX}/review/database/databases/${tableId}/export`,
      data: config,
      headers: {},
      // axios配置，responseType需要在这里设置
    } as any);

    // 注意：这里需要根据实际后端响应格式调整
    return response.data;
  }

  /**
   * 导入数据到表格
   */
  async importData(
    tableId: string, 
    file: File, 
    config: ImportConfig
  ): Promise<{
    imported: number;
    errors: Array<{ row: number; error: string }>;
  }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('config', JSON.stringify(config));

    const response = await httpClient.request({
      method: 'POST',
      url: `${API_PREFIX}/review/database/databases/${tableId}/import`,
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data?.data || { imported: 0, errors: [] };
  }

  // ==================== 模板相关 ====================

  /**
   * 获取可用模板列表
   */
  async getTemplates(): Promise<Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    preview: {
      fields: Array<{ name: string; type: string }>;
      sampleData: any[];
    };
  }>> {
    const response = await httpClient.get<Array<{
      id: string;
      name: string;
      description: string;
      icon: string;
      preview: {
        fields: Array<{ name: string; type: string }>;
        sampleData: any[];
      };
    }>>(`${API_PREFIX}/review/database/templates`);
    return response.data || [];
  }

  /**
   * 基于模板创建表格
   */
  async createTableFromTemplate(
    templateId: string, 
    params: Pick<CreateTableParams, 'name' | 'description'>
  ): Promise<Table> {
    const response = await httpClient.post<Table>(`${API_PREFIX}/review/database/databases`, {
      ...params,
      templateId,
    });
    if (!response.data) {
      throw new Error('基于模板创建表格失败');
    }
    return response.data;
  }
}

// 创建API实例
export const reviewTableAPI = new ReviewTableAPI(); 