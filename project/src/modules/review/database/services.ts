/**
 * 多维表格数据库服务
 * Database Services for Multi-dimensional Table System
 */

import {
  ReviewDatabase,
  DatabaseRecord,
  FieldDefinition,
  ViewDefinition,
  RecordData,
  ExportConfig,
  AISuggestion,
  DatabaseTemplate,
  FieldType,
  ViewType,
} from './types';
import { REVIEW_TEMPLATES, getTemplateById } from './templates';
import { reviewAIService } from '../services/ai';

/**
 * 数据库服务类
 */
class DatabaseService {
  private databases: Map<string, ReviewDatabase> = new Map();

  /**
   * 获取数据库
   */
  async getDatabase(id: string): Promise<ReviewDatabase> {
    const db = this.databases.get(id);
    if (!db) {
      throw new Error(`数据库 ${id} 不存在`);
    }
    return db;
  }

  /**
   * 创建数据库
   */
  async createDatabase(templateId?: string): Promise<ReviewDatabase> {
    const id = this.generateId();
    const now = new Date().toISOString();
    
    let database: ReviewDatabase;
    
    if (templateId) {
      // 基于模板创建
      const template = getTemplateById(templateId);
      if (!template) {
        throw new Error(`模板 ${templateId} 不存在`);
      }
      
      database = {
        id,
        name: template.name + ' - 副本',
        description: template.description,
        icon: template.icon,
        fields: template.fields.map((field, index) => ({
          ...field,
          id: this.generateId(),
          createdAt: now,
          updatedAt: now,
          order: index,
        })),
        views: template.views.map((view, index) => ({
          ...view,
          id: this.generateId(),
          createdAt: now,
          updatedAt: now,
          order: index,
        })),
        records: template.sampleData?.map(record => ({
          id: this.generateId(),
          data: record.data,
          createdAt: now,
          updatedAt: now,
        })) || [],
        settings: {
          enableVersionHistory: true,
          enableComments: true,
          enableNotifications: true,
          autoSave: true,
          backupEnabled: true,
          aiIntegration: true,
        },
        createdAt: now,
        updatedAt: now,
      };
    } else {
      // 创建空数据库
      database = {
        id,
        name: '新建复盘表格',
        description: '多维复盘数据库',
        icon: '📊',
        fields: [
          {
            id: this.generateId(),
            name: '标题',
            type: FieldType.TEXT,
            isPrimary: true,
            config: { required: true, maxLength: 200 },
            order: 0,
            createdAt: now,
            updatedAt: now,
          },
          {
            id: this.generateId(),
            name: '创建时间',
            type: FieldType.CREATED_TIME,
            order: 1,
            createdAt: now,
            updatedAt: now,
          },
        ],
        views: [
          {
            id: this.generateId(),
            name: '表格视图',
            type: ViewType.GRID,
            isDefault: true,
            config: {},
            order: 0,
            createdAt: now,
            updatedAt: now,
          },
        ],
        records: [],
        settings: {
          enableVersionHistory: true,
          enableComments: true,
          enableNotifications: true,
          autoSave: true,
          backupEnabled: true,
          aiIntegration: true,
        },
        createdAt: now,
        updatedAt: now,
      };
    }
    
    this.databases.set(id, database);
    await this.saveToStorage(database);
    return database;
  }

  /**
   * 更新数据库
   */
  async updateDatabase(id: string, updates: Partial<ReviewDatabase>): Promise<boolean> {
    const database = await this.getDatabase(id);
    const updated = {
      ...database,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    this.databases.set(id, updated);
    await this.saveToStorage(updated);
    return true;
  }

  /**
   * 删除数据库
   */
  async deleteDatabase(id: string): Promise<boolean> {
    this.databases.delete(id);
    localStorage.removeItem(`database_${id}`);
    return true;
  }

  /**
   * 添加字段
   */
  async addField(databaseId: string, field: Omit<FieldDefinition, 'id' | 'createdAt' | 'updatedAt'>): Promise<FieldDefinition> {
    const database = await this.getDatabase(databaseId);
    const now = new Date().toISOString();
    
    const newField: FieldDefinition = {
      ...field,
      id: this.generateId(),
      order: Math.max(...database.fields.map(f => f.order), -1) + 1,
      createdAt: now,
      updatedAt: now,
    };
    
    database.fields.push(newField);
    database.updatedAt = now;
    
    this.databases.set(databaseId, database);
    await this.saveToStorage(database);
    return newField;
  }

  /**
   * 更新字段
   */
  async updateField(databaseId: string, fieldId: string, updates: Partial<FieldDefinition>): Promise<boolean> {
    const database = await this.getDatabase(databaseId);
    const fieldIndex = database.fields.findIndex(f => f.id === fieldId);
    
    if (fieldIndex === -1) {
      throw new Error(`字段 ${fieldId} 不存在`);
    }
    
    database.fields[fieldIndex] = {
      ...database.fields[fieldIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    database.updatedAt = new Date().toISOString();
    this.databases.set(databaseId, database);
    await this.saveToStorage(database);
    return true;
  }

  /**
   * 删除字段
   */
  async deleteField(databaseId: string, fieldId: string): Promise<boolean> {
    const database = await this.getDatabase(databaseId);
    
    // 检查是否为主字段
    const field = database.fields.find(f => f.id === fieldId);
    if (field?.isPrimary) {
      throw new Error('不能删除主字段');
    }
    
    database.fields = database.fields.filter(f => f.id !== fieldId);
    database.updatedAt = new Date().toISOString();
    
    this.databases.set(databaseId, database);
    await this.saveToStorage(database);
    return true;
  }

  /**
   * 添加记录
   */
  async addRecord(databaseId: string, data: RecordData): Promise<DatabaseRecord> {
    const database = await this.getDatabase(databaseId);
    const now = new Date().toISOString();
    
    const newRecord: DatabaseRecord = {
      id: this.generateId(),
      data: await this.processRecordData(database, data),
      createdAt: now,
      updatedAt: now,
    };
    
    database.records.push(newRecord);
    database.updatedAt = now;
    
    this.databases.set(databaseId, database);
    await this.saveToStorage(database);
    return newRecord;
  }

  /**
   * 更新记录
   */
  async updateRecord(databaseId: string, recordId: string, data: Partial<RecordData>): Promise<boolean> {
    const database = await this.getDatabase(databaseId);
    const recordIndex = database.records.findIndex(r => r.id === recordId);
    
    if (recordIndex === -1) {
      throw new Error(`记录 ${recordId} 不存在`);
    }
    
    const processedData = await this.processRecordData(database, data as RecordData, true);
    
    database.records[recordIndex] = {
      ...database.records[recordIndex],
      data: {
        ...database.records[recordIndex].data,
        ...processedData,
      },
      updatedAt: new Date().toISOString(),
    };
    
    database.updatedAt = new Date().toISOString();
    this.databases.set(databaseId, database);
    await this.saveToStorage(database);
    return true;
  }

  /**
   * 删除记录
   */
  async deleteRecord(databaseId: string, recordId: string): Promise<boolean> {
    const database = await this.getDatabase(databaseId);
    database.records = database.records.filter(r => r.id !== recordId);
    database.updatedAt = new Date().toISOString();
    
    this.databases.set(databaseId, database);
    await this.saveToStorage(database);
    return true;
  }

  /**
   * 添加视图
   */
  async addView(databaseId: string, view: Omit<ViewDefinition, 'id' | 'createdAt' | 'updatedAt'>): Promise<ViewDefinition> {
    const database = await this.getDatabase(databaseId);
    const now = new Date().toISOString();
    
    const newView: ViewDefinition = {
      ...view,
      id: this.generateId(),
      order: Math.max(...database.views.map(v => v.order), -1) + 1,
      createdAt: now,
      updatedAt: now,
    };
    
    database.views.push(newView);
    database.updatedAt = now;
    
    this.databases.set(databaseId, database);
    await this.saveToStorage(database);
    return newView;
  }

  /**
   * 更新视图
   */
  async updateView(databaseId: string, viewId: string, updates: Partial<ViewDefinition>): Promise<boolean> {
    const database = await this.getDatabase(databaseId);
    const viewIndex = database.views.findIndex(v => v.id === viewId);
    
    if (viewIndex === -1) {
      throw new Error(`视图 ${viewId} 不存在`);
    }
    
    database.views[viewIndex] = {
      ...database.views[viewIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    database.updatedAt = new Date().toISOString();
    this.databases.set(databaseId, database);
    await this.saveToStorage(database);
    return true;
  }

  /**
   * 删除视图
   */
  async deleteView(databaseId: string, viewId: string): Promise<boolean> {
    const database = await this.getDatabase(databaseId);
    
    // 检查是否为默认视图
    const view = database.views.find(v => v.id === viewId);
    if (view?.isDefault && database.views.length === 1) {
      throw new Error('不能删除唯一的默认视图');
    }
    
    database.views = database.views.filter(v => v.id !== viewId);
    database.updatedAt = new Date().toISOString();
    
    this.databases.set(databaseId, database);
    await this.saveToStorage(database);
    return true;
  }

  /**
   * 生成AI字段
   */
  async generateAIField(databaseId: string, fieldId: string, recordId: string): Promise<any> {
    const database = await this.getDatabase(databaseId);
    const field = database.fields.find(f => f.id === fieldId);
    const record = database.records.find(r => r.id === recordId);
    
    if (!field || !record) {
      throw new Error('字段或记录不存在');
    }
    
    if (field.type !== FieldType.AI_GENERATED) {
      throw new Error('该字段不是AI生成字段');
    }
    
    try {
      // 准备上下文数据
      const context = {
        databaseName: database.name,
        fieldName: field.name,
        recordData: record.data,
        fieldConfig: field.config,
      };
      
      // 调用AI服务生成内容
      const result = await reviewAIService.generateFieldContent({
        prompt: field.config?.aiPrompt || '生成字段内容',
        context,
        fieldType: field.type,
      });
      
      return {
        value: result.content,
        confidence: result.confidence || 0.8,
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('AI字段生成失败:', error);
      throw new Error('AI字段生成失败');
    }
  }

  /**
   * 获取AI建议
   */
  async getAISuggestions(databaseId: string): Promise<AISuggestion[]> {
    const database = await this.getDatabase(databaseId);
    
    try {
      // 基于数据库结构和数据生成AI建议
      const suggestions = await reviewAIService.generateDatabaseSuggestions({
        database,
        analysisType: 'structure_optimization',
      });
      
      return suggestions.map(suggestion => ({
        id: this.generateId(),
        type: suggestion.type,
        title: suggestion.title,
        description: suggestion.description,
        action: suggestion.action,
        confidence: suggestion.confidence || 0.7,
        generatedAt: new Date().toISOString(),
      }));
    } catch (error) {
      console.error('获取AI建议失败:', error);
      return [];
    }
  }

  /**
   * 导出数据库
   */
  async exportDatabase(databaseId: string, config: ExportConfig): Promise<Blob> {
    const database = await this.getDatabase(databaseId);
    
    switch (config.format) {
      case 'json':
        return this.exportAsJSON(database, config);
      case 'csv':
        return this.exportAsCSV(database, config);
      case 'excel':
        return this.exportAsExcel(database, config);
      default:
        throw new Error('不支持的导出格式');
    }
  }

  /**
   * 导入数据
   */
  async importData(databaseId: string, file: File, mapping: Record<string, string>): Promise<boolean> {
    const database = await this.getDatabase(databaseId);
    
    try {
      const text = await file.text();
      let data: any[];
      
      if (file.name.endsWith('.json')) {
        data = JSON.parse(text);
      } else if (file.name.endsWith('.csv')) {
        data = this.parseCSV(text);
      } else {
        throw new Error('不支持的文件格式');
      }
      
      // 根据映射转换数据
      const transformedData = data.map(row => {
        const recordData: RecordData = {};
        for (const [sourceKey, targetFieldId] of Object.entries(mapping)) {
          if (row[sourceKey] !== undefined) {
            recordData[targetFieldId] = row[sourceKey];
          }
        }
        return recordData;
      });
      
      // 批量添加记录
      for (const recordData of transformedData) {
        await this.addRecord(databaseId, recordData);
      }
      
      return true;
    } catch (error) {
      console.error('导入数据失败:', error);
      throw new Error('导入数据失败');
    }
  }

  /**
   * 获取所有模板
   */
  getTemplates(): DatabaseTemplate[] {
    return REVIEW_TEMPLATES;
  }

  // ==================== 私有方法 ====================

  private generateId(): string {
    return 'db_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  private async saveToStorage(database: ReviewDatabase): Promise<void> {
    localStorage.setItem(`database_${database.id}`, JSON.stringify(database));
  }

  private async loadFromStorage(id: string): Promise<ReviewDatabase | null> {
    const data = localStorage.getItem(`database_${id}`);
    return data ? JSON.parse(data) : null;
  }

  private async processRecordData(database: ReviewDatabase, data: RecordData, isUpdate = false): Promise<RecordData> {
    const processed: RecordData = { ...data };
    const now = new Date().toISOString();
    
    for (const field of database.fields) {
      // 处理自动字段
      if (field.type === FieldType.CREATED_TIME && !isUpdate) {
        processed[field.id] = now;
      } else if (field.type === FieldType.LAST_MODIFIED_TIME) {
        processed[field.id] = now;
      } else if (field.type === FieldType.AUTO_NUMBER && !isUpdate) {
        processed[field.id] = database.records.length + 1;
      }
      
      // 验证必填字段
      if (field.config?.required && !processed[field.id] && !isUpdate) {
        throw new Error(`字段 ${field.name} 是必填的`);
      }
      
      // 类型验证和转换
      if (processed[field.id] !== undefined) {
        processed[field.id] = this.validateAndConvertValue(processed[field.id], field);
      }
    }
    
    return processed;
  }

  private validateAndConvertValue(value: any, field: FieldDefinition): any {
    switch (field.type) {
      case FieldType.NUMBER:
      case FieldType.CURRENCY:
      case FieldType.PERCENT:
        return typeof value === 'number' ? value : Number(value);
      
      case FieldType.DATE:
      case FieldType.DATETIME:
        return typeof value === 'string' ? value : new Date(value).toISOString();
      
      case FieldType.CHECKBOX:
        return Boolean(value);
      
      case FieldType.MULTI_SELECT:
        return Array.isArray(value) ? value : [value];
      
      default:
        return value;
    }
  }

  private exportAsJSON(database: ReviewDatabase, config: ExportConfig): Blob {
    const data = {
      database: {
        ...database,
        records: config.includeFields 
          ? database.records.map(record => ({
              ...record,
              data: Object.fromEntries(
                Object.entries(record.data).filter(([key]) => 
                  config.includeFields!.includes(key)
                )
              )
            }))
          : database.records
      }
    };
    
    return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  }

  private exportAsCSV(database: ReviewDatabase, config: ExportConfig): Blob {
    const fields = config.includeFields 
      ? database.fields.filter(f => config.includeFields!.includes(f.id))
      : database.fields;
    
    const headers = fields.map(f => f.name);
    const rows = database.records.map(record => 
      fields.map(field => {
        const value = record.data[field.id];
        return typeof value === 'object' ? JSON.stringify(value) : String(value || '');
      })
    );
    
    const csv = [headers, ...rows].map(row => 
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    
    return new Blob([csv], { type: 'text/csv;charset=utf-8' });
  }

  private exportAsExcel(database: ReviewDatabase, config: ExportConfig): Blob {
    // 简化版Excel导出，实际项目中可以使用专门的Excel库
    return this.exportAsCSV(database, config);
  }

  private parseCSV(text: string): any[] {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const data = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      return row;
    });
    
    return data;
  }
}

export const databaseService = new DatabaseService();