/**
 * 多维表格数据库 Hooks
 * Database Hooks for Multi-dimensional Table System
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ReviewDatabase,
  DatabaseRecord,
  FieldDefinition,
  ViewDefinition,
  RecordData,
  FilterCondition,
  SortConfig,
  ViewType,
  ExportConfig,
  AISuggestion,
  UseDatabaseReturn,
} from './types';
import { databaseService } from './services';

/**
 * 数据库主Hook
 */
export const useDatabase = (databaseId?: string): UseDatabaseReturn => {
  const [database, setDatabase] = useState<ReviewDatabase | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 加载数据库
  const loadDatabase = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const db = await databaseService.getDatabase(id);
      setDatabase(db);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载数据库失败');
    } finally {
      setLoading(false);
    }
  }, []);

  // 创建数据库
  const createDatabase = useCallback(async (template?: string): Promise<ReviewDatabase | null> => {
    setLoading(true);
    setError(null);
    try {
      const db = await databaseService.createDatabase(template);
      setDatabase(db);
      return db;
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建数据库失败');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // 更新数据库
  const updateDatabase = useCallback(async (updates: Partial<ReviewDatabase>): Promise<boolean> => {
    if (!database) return false;
    
    setLoading(true);
    setError(null);
    try {
      const updated = await databaseService.updateDatabase(database.id, updates);
      setDatabase(prev => prev ? { ...prev, ...updates } : null);
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新数据库失败');
      return false;
    } finally {
      setLoading(false);
    }
  }, [database]);

  // 删除数据库
  const deleteDatabase = useCallback(async (): Promise<boolean> => {
    if (!database) return false;
    
    setLoading(true);
    setError(null);
    try {
      const deleted = await databaseService.deleteDatabase(database.id);
      if (deleted) {
        setDatabase(null);
      }
      return deleted;
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除数据库失败');
      return false;
    } finally {
      setLoading(false);
    }
  }, [database]);

  // 字段操作
  const addField = useCallback(async (field: Omit<FieldDefinition, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    if (!database) return false;
    
    try {
      const newField = await databaseService.addField(database.id, field);
      setDatabase(prev => prev ? {
        ...prev,
        fields: [...prev.fields, newField],
      } : null);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : '添加字段失败');
      return false;
    }
  }, [database]);

  const updateField = useCallback(async (fieldId: string, updates: Partial<FieldDefinition>): Promise<boolean> => {
    if (!database) return false;
    
    try {
      const updated = await databaseService.updateField(database.id, fieldId, updates);
      if (updated) {
        setDatabase(prev => prev ? {
          ...prev,
          fields: prev.fields.map(f => f.id === fieldId ? { ...f, ...updates } : f),
        } : null);
      }
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新字段失败');
      return false;
    }
  }, [database]);

  const deleteField = useCallback(async (fieldId: string): Promise<boolean> => {
    if (!database) return false;
    
    try {
      const deleted = await databaseService.deleteField(database.id, fieldId);
      if (deleted) {
        setDatabase(prev => prev ? {
          ...prev,
          fields: prev.fields.filter(f => f.id !== fieldId),
          records: prev.records.map(record => ({
            ...record,
            data: Object.fromEntries(
              Object.entries(record.data).filter(([key]) => key !== fieldId)
            ),
          })),
        } : null);
      }
      return deleted;
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除字段失败');
      return false;
    }
  }, [database]);

  // 记录操作
  const addRecord = useCallback(async (data: RecordData): Promise<DatabaseRecord | null> => {
    if (!database) return null;
    
    try {
      const newRecord = await databaseService.addRecord(database.id, data);
      setDatabase(prev => prev ? {
        ...prev,
        records: [...prev.records, newRecord],
      } : null);
      return newRecord;
    } catch (err) {
      setError(err instanceof Error ? err.message : '添加记录失败');
      return null;
    }
  }, [database]);

  const updateRecord = useCallback(async (recordId: string, data: Partial<RecordData>): Promise<boolean> => {
    if (!database) return false;
    
    try {
      const updated = await databaseService.updateRecord(database.id, recordId, data);
      if (updated) {
        setDatabase((prev:any) => prev ? {
          ...prev,
          records: prev.records.map((r:any) => 
            r.id === recordId 
              ? { 
                  ...r, 
                  data: { ...r.data, ...data }, 
                  updatedAt: new Date().toISOString() 
                }
              : r
          ),
        } : null);
      }
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新记录失败');
      return false;
    }
  }, [database]);

  const deleteRecord = useCallback(async (recordId: string): Promise<boolean> => {
    if (!database) return false;
    
    try {
      const deleted = await databaseService.deleteRecord(database.id, recordId);
      if (deleted) {
        setDatabase(prev => prev ? {
          ...prev,
          records: prev.records.filter(r => r.id !== recordId),
        } : null);
      }
      return deleted;
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除记录失败');
      return false;
    }
  }, [database]);

  // 视图操作
  const addView = useCallback(async (view: Omit<ViewDefinition, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    if (!database) return false;
    
    try {
      const newView = await databaseService.addView(database.id, view);
      setDatabase(prev => prev ? {
        ...prev,
        views: [...prev.views, newView],
      } : null);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : '添加视图失败');
      return false;
    }
  }, [database]);

  const updateView = useCallback(async (viewId: string, updates: Partial<ViewDefinition>): Promise<boolean> => {
    if (!database) return false;
    
    try {
      const updated = await databaseService.updateView(database.id, viewId, updates);
      if (updated) {
        setDatabase(prev => prev ? {
          ...prev,
          views: prev.views.map(v => v.id === viewId ? { ...v, ...updates } : v),
        } : null);
      }
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新视图失败');
      return false;
    }
  }, [database]);

  const deleteView = useCallback(async (viewId: string): Promise<boolean> => {
    if (!database) return false;
    
    try {
      const deleted = await databaseService.deleteView(database.id, viewId);
      if (deleted) {
        setDatabase(prev => prev ? {
          ...prev,
          views: prev.views.filter(v => v.id !== viewId),
        } : null);
      }
      return deleted;
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除视图失败');
      return false;
    }
  }, [database]);

  // AI功能
  const generateAIField = useCallback(async (fieldId: string, recordId: string): Promise<any> => {
    if (!database) return null;
    
    try {
      const result = await databaseService.generateAIField(database.id, fieldId, recordId);
      // 更新记录中的AI字段值
      if (result) {
        await updateRecord(recordId, { [fieldId]: result.value });
      }
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI生成失败');
      return null;
    }
  }, [database, updateRecord]);

  const getAISuggestions = useCallback(async (): Promise<AISuggestion[]> => {
    if (!database) return [];
    
    try {
      return await databaseService.getAISuggestions(database.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取AI建议失败');
      return [];
    }
  }, [database]);

  // 导入导出
  const exportDatabase = useCallback(async (config: ExportConfig): Promise<Blob> => {
    if (!database) throw new Error('没有数据库可导出');
    
    try {
      return await databaseService.exportDatabase(database.id, config);
    } catch (err) {
      setError(err instanceof Error ? err.message : '导出失败');
      throw err;
    }
  }, [database]);

  const importData = useCallback(async (file: File, mapping: Record<string, string>): Promise<boolean> => {
    if (!database) return false;
    
    try {
      const imported = await databaseService.importData(database.id, file, mapping);
      if (imported) {
        // 重新加载数据库以获取最新数据
        await loadDatabase(database.id);
      }
      return imported;
    } catch (err) {
      setError(err instanceof Error ? err.message : '导入失败');
      return false;
    }
  }, [database, loadDatabase]);

  // 初始化加载
  useEffect(() => {
    if (databaseId) {
      loadDatabase(databaseId);
    }
  }, [databaseId, loadDatabase]);

  return {
    database,
    loading,
    error,
    createDatabase,
    updateDatabase,
    deleteDatabase,
    addField,
    updateField,
    deleteField,
    addRecord,
    updateRecord,
    deleteRecord,
    addView,
    updateView,
    deleteView,
    generateAIField,
    getAISuggestions,
    exportDatabase,
    importData,
  };
};

/**
 * 视图数据处理Hook
 */
export const useViewData = (
  database: ReviewDatabase | null,
  viewId?: string
) => {
  const view = useMemo(() => {
    if (!database || !viewId) return database?.views.find(v => v.isDefault) || database?.views[0];
    return database.views.find(v => v.id === viewId);
  }, [database, viewId]);

  const processedRecords = useMemo(() => {
    if (!database || !view) return [];

    let records = [...database.records];

    // 应用过滤器
    if (view.config.filters?.length) {
      records = records.filter(record => {
        return view.config.filters!.every(filter => {
          const value = record.data[filter.fieldId];
          return applyFilter(value, filter);
        });
      });
    }

    // 应用排序
    if (view.config.sorts?.length) {
      records.sort((a, b) => {
        for (const sort of view.config.sorts!) {
          const aValue = a.data[sort.fieldId];
          const bValue = b.data[sort.fieldId];
          const comparison = compareValues(aValue, bValue);
          
          if (comparison !== 0) {
            return sort.direction === 'asc' ? comparison : -comparison;
          }
        }
        return 0;
      });
    }

    return records;
  }, [database, view]);

  const visibleFields = useMemo(() => {
    if (!database || !view) return [];
    
    const fieldIds = view.config.visibleFields || database.fields.map(f => f.id);
    return database.fields
      .filter(field => fieldIds.includes(field.id) && !field.isHidden)
      .sort((a, b) => {
        const aIndex = view.config.fieldOrder?.indexOf(a.id) ?? a.order;
        const bIndex = view.config.fieldOrder?.indexOf(b.id) ?? b.order;
        return aIndex - bIndex;
      });
  }, [database, view]);

  return {
    view,
    records: processedRecords,
    fields: visibleFields,
  };
};

/**
 * 字段编辑Hook
 */
export const useFieldEditor = () => {
  const [editingField, setEditingField] = useState<FieldDefinition | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const startEdit = useCallback((field: FieldDefinition) => {
    setEditingField(field);
    setIsEditing(true);
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingField(null);
    setIsEditing(false);
  }, []);

  const saveField = useCallback(async (
    field: FieldDefinition,
    onSave: (fieldId: string, updates: Partial<FieldDefinition>) => Promise<boolean>
  ) => {
    if (!editingField) return false;
    
    const success = await onSave(editingField.id, field);
    if (success) {
      cancelEdit();
    }
    return success;
  }, [editingField, cancelEdit]);

  return {
    editingField,
    isEditing,
    startEdit,
    cancelEdit,
    saveField,
  };
};

/**
 * 记录选择Hook
 */
export const useRecordSelection = () => {
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set());
  const [lastSelected, setLastSelected] = useState<string | null>(null);

  const selectRecord = useCallback((recordId: string, isSelected: boolean) => {
    setSelectedRecords(prev => {
      const newSet = new Set(prev);
      if (isSelected) {
        newSet.add(recordId);
        setLastSelected(recordId);
      } else {
        newSet.delete(recordId);
        if (lastSelected === recordId) {
          setLastSelected(null);
        }
      }
      return newSet;
    });
  }, [lastSelected]);

  const selectAll = useCallback((recordIds: string[]) => {
    setSelectedRecords(new Set(recordIds));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedRecords(new Set());
    setLastSelected(null);
  }, []);

  const toggleRecord = useCallback((recordId: string) => {
    const isSelected = selectedRecords.has(recordId);
    selectRecord(recordId, !isSelected);
  }, [selectedRecords, selectRecord]);

  return {
    selectedRecords,
    lastSelected,
    selectRecord,
    selectAll,
    clearSelection,
    toggleRecord,
    selectedCount: selectedRecords.size,
  };
};

// ==================== 辅助函数 ====================

/**
 * 应用过滤器
 */
function applyFilter(value: any, filter: FilterCondition): boolean {
  switch (filter.operator) {
    case 'eq':
      return value === filter.value;
    case 'ne':
      return value !== filter.value;
    case 'gt':
      return value > filter.value;
    case 'gte':
      return value >= filter.value;
    case 'lt':
      return value < filter.value;
    case 'lte':
      return value <= filter.value;
    case 'contains':
      return String(value).toLowerCase().includes(String(filter.value).toLowerCase());
    case 'notContains':
      return !String(value).toLowerCase().includes(String(filter.value).toLowerCase());
    case 'isEmpty':
      return value === null || value === undefined || value === '';
    case 'isNotEmpty':
      return value !== null && value !== undefined && value !== '';
    case 'in':
      return Array.isArray(filter.value) && filter.value.includes(value);
    case 'notIn':
      return Array.isArray(filter.value) && !filter.value.includes(value);
    default:
      return true;
  }
}

/**
 * 比较值用于排序
 */
function compareValues(a: any, b: any): number {
  if (a === null || a === undefined) return b === null || b === undefined ? 0 : -1;
  if (b === null || b === undefined) return 1;
  
  if (typeof a === 'number' && typeof b === 'number') {
    return a - b;
  }
  
  if (typeof a === 'string' && typeof b === 'string') {
    return a.localeCompare(b);
  }
  
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() - b.getTime();
  }
  
  return String(a).localeCompare(String(b));
}