/**
 * 表格状态管理Hook
 */

import { useState, useEffect, useCallback } from 'react';
import { Table, Field, TableRecord, View, CreateFieldParams, CreateRecordParams, QueryParams } from '../types';
import { reviewTableAPI } from '../services/api';

export interface UseTableOptions {
  tableId: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export interface UseTableReturn {
  // 状态
  table: Table | null;
  fields: Field[];
  records: TableRecord[];
  views: View[];
  currentView: View | null;
  
  // 加载状态
  loading: boolean;
  error: string | null;
  
  // 表格操作
  refreshTable: () => Promise<void>;
  updateTableInfo: (updates: Partial<Pick<Table, 'name' | 'description' | 'icon'>>) => Promise<void>;
  
  // 字段操作
  createField: (params: CreateFieldParams) => Promise<Field>;
  updateField: (fieldId: string, updates: Partial<Field>) => Promise<void>;
  deleteField: (fieldId: string) => Promise<void>;
  
  // 记录操作
  loadRecords: (params?: QueryParams) => Promise<void>;
  createRecord: (params: CreateRecordParams) => Promise<void>;
  updateRecord: (recordId: string, data: Partial<Record<string, any>>) => Promise<void>;
  deleteRecord: (recordId: string) => Promise<void>;
  
  // 视图操作
  setCurrentView: (viewId: string) => void;
  createView: (view: Omit<View, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => Promise<void>;
  updateView: (viewId: string, updates: Partial<View>) => Promise<void>;
  deleteView: (viewId: string) => Promise<void>;
}

export function useTable({ tableId, autoRefresh = false, refreshInterval = 30000 }: UseTableOptions): UseTableReturn {
  // 状态管理
  const [table, setTable] = useState<Table | null>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [records, setRecords] = useState<TableRecord[]>([]);
  const [views, setViews] = useState<View[]>([]);
  const [currentView, setCurrentViewState] = useState<View | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 加载表格数据
  const refreshTable = useCallback(async () => {
    if (!tableId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const tableData = await reviewTableAPI.getTable(tableId);
      setTable(tableData);
      setFields(tableData.fields || []);
      setRecords(tableData.records || []);
      setViews(tableData.views || []);
      
      // 设置默认视图
      if (tableData.views && tableData.views.length > 0 && !currentView) {
        const defaultView = tableData.views.find(v => v.isDefault) || tableData.views[0];
        setCurrentViewState(defaultView);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载表格失败');
    } finally {
      setLoading(false);
    }
  }, [tableId, currentView]);

  // 更新表格基本信息
  const updateTableInfo = useCallback(async (updates: Partial<Pick<Table, 'name' | 'description' | 'icon'>>) => {
    if (!tableId) return;
    
    try {
      const updatedTable = await reviewTableAPI.updateTable(tableId, updates);
      setTable(updatedTable);
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新表格失败');
    }
  }, [tableId]);

  // 字段操作
  const createField = useCallback(async (params: CreateFieldParams) => {
    if (!tableId) throw new Error('tableId is required');
    
    try {
      const newField = await reviewTableAPI.createField(tableId, params);
      setFields(prev => [...prev, newField]);
      return newField as Field;
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建字段失败');
      throw err instanceof Error ? err : new Error('创建字段失败');
    }
  }, [tableId]);

  const updateField = useCallback(async (fieldId: string, updates: Partial<Field>) => {
    if (!tableId) return;
    
    try {
      const updatedField = await reviewTableAPI.updateField(tableId, fieldId, updates);
      setFields(prev => prev.map(f => f.id === fieldId ? updatedField : f));
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新字段失败');
    }
  }, [tableId]);

  const deleteField = useCallback(async (fieldId: string) => {
    if (!tableId) return;
    
    try {
      await reviewTableAPI.deleteField(tableId, fieldId);
      setFields(prev => prev.filter(f => f.id !== fieldId));
      
      // 清理记录中的该字段数据
      setRecords(prev => prev.map(record => {
        const newData = { ...record.data };
        delete newData[fieldId];
        return { ...record, data: newData };
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除字段失败');
    }
  }, [tableId]);

  // 记录操作
  const loadRecords = useCallback(async (params?: QueryParams) => {
    if (!tableId) return;
    
    try {
      const result = await reviewTableAPI.getRecords(tableId, params);
      setRecords(result.records);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载记录失败');
    }
  }, [tableId]);

  const createRecord = useCallback(async (params: CreateRecordParams) => {
    if (!tableId) return;
    
    try {
      const newRecord = await reviewTableAPI.createRecord(tableId, params);
      setRecords(prev => [...prev, newRecord]);
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建记录失败');
    }
  }, [tableId]);

  const updateRecord = useCallback(async (recordId: string, data: Partial<Record<string, any>>) => {
    if (!tableId) return;
    
    try {
      const updatedRecord = await reviewTableAPI.updateRecord(tableId, recordId, data);
      setRecords(prev => prev.map(r => r.id === recordId ? updatedRecord : r));
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新记录失败');
    }
  }, [tableId]);

  const deleteRecord = useCallback(async (recordId: string) => {
    if (!tableId) return;
    
    try {
      await reviewTableAPI.deleteRecord(tableId, recordId);
      setRecords(prev => prev.filter(r => r.id !== recordId));
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除记录失败');
    }
  }, [tableId]);

  // 视图操作
  const setCurrentView = useCallback((viewId: string) => {
    const view = views.find(v => v.id === viewId);
    if (view) {
      setCurrentViewState(view);
    }
  }, [views]);

  const createView = useCallback(async (view: Omit<View, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => {
    if (!tableId) return;
    
    try {
      const newView = await reviewTableAPI.createView(tableId, view);
      setViews(prev => [...prev, newView]);
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建视图失败');
    }
  }, [tableId]);

  const updateView = useCallback(async (viewId: string, updates: Partial<View>) => {
    if (!tableId) return;
    
    try {
      const updatedView = await reviewTableAPI.updateView(tableId, viewId, updates);
      setViews(prev => prev.map(v => v.id === viewId ? updatedView : v));
      
      // 如果更新的是当前视图，也更新当前视图状态
      if (currentView?.id === viewId) {
        setCurrentViewState(updatedView);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新视图失败');
    }
  }, [tableId, currentView]);

  const deleteView = useCallback(async (viewId: string) => {
    if (!tableId) return;
    
    try {
      await reviewTableAPI.deleteView(tableId, viewId);
      setViews(prev => prev.filter(v => v.id !== viewId));
      
      // 如果删除的是当前视图，切换到第一个视图
      if (currentView?.id === viewId) {
        const remainingViews = views.filter(v => v.id !== viewId);
        setCurrentViewState(remainingViews.length > 0 ? remainingViews[0] : null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除视图失败');
    }
  }, [tableId, currentView, views]);

  // 初始加载
  useEffect(() => {
    if (tableId) {
      refreshTable();
    }
  }, [tableId, refreshTable]);

  // 自动刷新
  useEffect(() => {
    if (!autoRefresh || !tableId) return;
    
    const interval = setInterval(refreshTable, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, tableId, refreshInterval, refreshTable]);

  return {
    // 状态
    table,
    fields,
    records,
    views,
    currentView,
    
    // 加载状态
    loading,
    error,
    
    // 表格操作
    refreshTable,
    updateTableInfo,
    
    // 字段操作
    createField,
    updateField,
    deleteField,
    
    // 记录操作
    loadRecords,
    createRecord,
    updateRecord,
    deleteRecord,
    
    // 视图操作
    setCurrentView,
    createView,
    updateView,
    deleteView,
  };
} 