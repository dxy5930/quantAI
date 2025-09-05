/**
 * 复盘表格主页面 - 类似飞书多维表格界面
 */

import React, { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useTable } from '../hooks/useTable';
import { ViewType, CreateFieldParams, CreateRecordParams, FieldType, Sort } from '../types';
import GridView from './GridView';
import TuiGridView from './TuiGridView';
import AddFieldModal from './AddFieldModal';
import EditFieldModal from './EditFieldModal';
import FieldManagerPanel from './FieldManagerPanel';
import { reviewTableAPI } from '../services/api';
import { message } from '../../../utils/message';
import AnalyticsTab from './AnalyticsTab';

const ReviewTablePage: React.FC = () => {
  const { tableId } = useParams<{ tableId: string }>();
  const [showAddFieldModal, setShowAddFieldModal] = useState(false);
  const [showAddRecordModal, setShowAddRecordModal] = useState(false);
  const [showFieldManager, setShowFieldManager] = useState(false);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [aiFilling, setAiFilling] = useState(false);
  const [aiFillingRowId, setAiFillingRowId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'table' | 'analytics'>('table');

  const {
    table,
    fields,
    records,
    views,
    currentView,
    loading,
    error,
    refreshTable,
    updateTableInfo,
    createField,
    updateField,
    deleteField,
    createRecord,
    updateRecord,
    deleteRecord,
    setCurrentView,
    createView,
    updateView,
    deleteView,
    loadRecords,
  } = useTable({ 
    tableId: tableId || '',
    autoRefresh: false
  });

  const updateRecordWithAI = useCallback(async (recordId: string, data: Partial<Record<string, any>>) => {
    if (!tableId) return;
    await updateRecord(recordId, data);
    try {
      if (aiFilling) return; // 避免并发重复
      setAiFilling(true);
      setAiFillingRowId(recordId);
      const changedFieldId = Object.keys(data)[0];
      if (!changedFieldId) return;
      const changedValue = (data as any)[changedFieldId];
      const currentRow = records.find(r => r.id === recordId)?.data || {};
      const fieldMetas = fields.map(f => ({ id: f.id, name: f.name, type: f.type, isPreset: !!f.isPreset }));
      const hint = { changedFieldId, changedValue, currentRow, fields: fieldMetas } as const;
      const suggested = await reviewTableAPI.aiCompleteRow(tableId, recordId, changedFieldId, hint as any);
      if (suggested && Object.keys(suggested).length > 0) {
        // 判断是否为“股票代码”字段
        const f = fields.find(x => x.id === changedFieldId);
        const name = (f?.name || '').toLowerCase();
        const isCodeField = f?.id === 'preset_symbol' || ['code','symbol','stock_code'].includes((f?.id || '').toLowerCase()) || name.includes('代码');
        if (isCodeField) {
          // 代码变更：直接应用全部建议（覆盖）
          await updateRecord(recordId, suggested);
          message.success('已根据新代码重新补全本行');
        } else {
          // 非代码变更：仅填充空值，不覆盖已有
          const onlyEmpty: Record<string, any> = {};
          for (const [k, v] of Object.entries(suggested)) {
            const curr = (currentRow as any)[k];
            if (curr === undefined || curr === null || curr === '') {
              onlyEmpty[k] = v;
            }
          }
          if (Object.keys(onlyEmpty).length > 0) {
            await updateRecord(recordId, onlyEmpty);
            message.success('已填充空白字段');
          } else {
            message.info('无空白字段可填充');
          }
        }
      } else {
        message.info('AI没有可补全的内容');
      }
    } catch (e) {
      console.warn('AI补全失败或无建议', e);
      message.warning('AI补全失败或无建议');
    } finally {
      setAiFilling(false);
      setAiFillingRowId(null);
    }
  }, [tableId, updateRecord, aiFilling, records, fields]);

  // 处理添加字段
  const handleAddField = useCallback(() => {
    setShowAddFieldModal(true);
  }, []);

  const handleSubmitNewField = useCallback(async (params: CreateFieldParams) => {
    const newField = await createField(params);
    try {
      // 为现有每行补全新字段（仅填充空值）
      const fieldId = newField.id;
      for (const r of records) {
        const hasVal = r.data && r.data[fieldId] !== undefined && r.data[fieldId] !== '';
        if (hasVal) continue;
        // 触发一次“无值编辑”以复用 AI 补全逻辑：直接调用后端 AI 接口
        const suggested = await reviewTableAPI.aiCompleteRow(tableId!, r.id, fieldId, {
          changedFieldId: fieldId,
          currentRow: r.data,
        } as any);
        if (suggested && suggested[fieldId] !== undefined) {
          await updateRecord(r.id, { [fieldId]: suggested[fieldId] });
        }
      }
      message.success('已为新指标尝试自动补全现有记录');
    } catch (e) {
      console.warn('新增字段自动补全失败', e);
    }
  }, [createField, records, tableId, updateRecord]);

  // 字段管理逻辑
  const handleToggleHide = useCallback((fieldId: string, hide: boolean) => {
    if (!currentView) return;
    const hidden = new Set(currentView.config?.hiddenFields || []);
    if (hide) hidden.add(fieldId); else hidden.delete(fieldId);
    updateView(currentView.id, { config: { ...(currentView.config || {}), hiddenFields: Array.from(hidden) } as any });
  }, [currentView, updateView]);

  const handleMove = useCallback((fieldId: string, direction: 'up' | 'down') => {
    const sorted = [...fields].sort((a, b) => a.order - b.order);
    const index = sorted.findIndex(f => f.id === fieldId);
    if (index === -1) return;
    const swapWith = direction === 'up' ? index - 1 : index + 1;
    if (swapWith < 0 || swapWith >= sorted.length) return;
    const tmpOrder = sorted[index].order;
    sorted[index].order = sorted[swapWith].order;
    sorted[swapWith].order = tmpOrder;
    // 批量更新顺序（简单顺序重写）
    sorted.forEach((f, i) => updateField(f.id, { order: i } as any));
  }, [fields, updateField]);

  const handleReorder = useCallback((orderedIds: string[]) => {
    const idToOrder: Record<string, number> = {};
    orderedIds.forEach((id, idx) => { idToOrder[id] = idx; });
    fields.forEach(f => {
      const newOrder = idToOrder[f.id];
      if (typeof newOrder === 'number' && newOrder !== f.order) {
        updateField(f.id, { order: newOrder } as any);
      }
    });
  }, [fields, updateField]);

  const handleCreateFieldFromImport = useCallback((params: CreateFieldParams) => {
    createField(params);
  }, [createField]);

  const handleRename = useCallback((fieldId: string, name: string) => {
    updateField(fieldId, { name });
  }, [updateField]);

  const handleEdit = useCallback((fieldId: string) => {
    setEditingFieldId(fieldId);
  }, []);

  const handleDelete = useCallback((fieldId: string) => {
    deleteField(fieldId);
  }, [deleteField]);

  const currentEditingField = editingFieldId ? fields.find(f => f.id === editingFieldId) || null : null;

  const handleSubmitEditField = useCallback((updates: Partial<any>) => {
    if (!editingFieldId) return;
    updateField(editingFieldId, updates);
    setEditingFieldId(null);
  }, [editingFieldId, updateField]);

  // 处理添加记录
  const handleAddRecord = useCallback(() => {
    const emptyData: Record<string, any> = {};
    const toLocalDateString = () => {
      const d = new Date();
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };
    fields.forEach(field => {
      const cfg: any = (field as any).config;
      const typeStr = String((field as any).type).toLowerCase();
      if (field.type === FieldType.CREATED_TIME || typeStr === 'created_time') {
        emptyData[field.id] = new Date().toISOString();
      } else if (field.type === FieldType.DATE || typeStr === 'date') {
        emptyData[field.id] = toLocalDateString();
      } else if (field.type === FieldType.AUTO_NUMBER || typeStr === 'auto_number') {
        emptyData[field.id] = records.length + 1;
      } else if (cfg && cfg.defaultValue !== undefined) {
        emptyData[field.id] = cfg.defaultValue;
      } else {
        emptyData[field.id] = '';
      }
    });

    createRecord({ data: emptyData });
  }, [fields, records, createRecord]);

  // 处理视图切换
  const handleViewSwitch = useCallback((viewId: string) => {
    setCurrentView(viewId);
  }, [setCurrentView]);

  // 渲染视图内容
  const renderViewContent = useCallback(() => {
    if (!currentView) {
      return <div className="flex-1 flex items-center justify-center text-gray-500">请选择视图</div>;
    }

    switch (currentView.type) {
      case ViewType.GRID:
        return (
          <GridView
            fields={fields}
            records={records}
            viewConfig={currentView.config}
            onRecordUpdate={updateRecordWithAI}
            onRecordDelete={deleteRecord}
            onFieldUpdate={updateField}
            onAddRecord={handleAddRecord}
            onAddField={handleAddField}
            onSortChange={(sort?: Sort) => {
              // 触发后端排序加载
              if (sort) {
                // 只传一个主排序
                loadRecords({ sorts: [sort] } as any);
              } else {
                loadRecords({} as any);
              }
            }}
            aiLoading={aiFilling}
            aiLoadingRowId={aiFillingRowId || undefined}
          />
        );
      
      case ViewType.KANBAN:
        return <div className="flex-1 flex items-center justify-center text-gray-500">看板视图开发中</div>;
      
      case ViewType.CALENDAR:
        return <div className="flex-1 flex items-center justify-center text-gray-500">日历视图开发中</div>;
      
      default:
        return <div className="flex-1 flex items-center justify-center text-gray-500">不支持的视图类型</div>;
    }
  }, [currentView, fields, records, updateRecordWithAI, deleteRecord, updateField, handleAddRecord, handleAddField, loadRecords, aiFilling, aiFillingRowId]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
          <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse animation-delay-200"></div>
          <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse animation-delay-400"></div>
          <span className="ml-2 text-gray-600">加载中...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-2">加载失败</div>
          <div className="text-gray-600 mb-4">{error}</div>
          <button
            onClick={refreshTable}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  if (!table) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-gray-500">表格不存在</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 min-h-0 overflow-hidden">
      {/* 顶部工具栏 */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          {/* 左侧：表格信息 */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">{table.icon || '📊'}</span>
              <h1 className="text-xl font-semibold text-gray-900">{table.name}</h1>
            </div>
            {table.description && (
              <span className="text-sm text-gray-500">{table.description}</span>
            )}
          </div>

          {/* 右侧：操作按钮 */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleAddRecord}
              className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 flex items-center space-x-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>新增记录</span>
            </button>

            <button
              onClick={() => setShowAddFieldModal(true)}
              className="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50"
            >
              新增指标
            </button>

            <button
              onClick={() => setShowFieldManager(true)}
              className="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50"
            >
              指标管理
            </button>
            
            <button
              onClick={() => {/* TODO: 实现导入功能 */}}
              className="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50"
            >
              导入
            </button>
            
            <button
              onClick={() => {/* TODO: 实现导出功能 */}}
              className="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50"
            >
              导出
            </button>

            <button
              onClick={refreshTable}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
              title="刷新"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* 视图切换栏 */}
      <div className="bg-white border-b border-gray-200 px-6 py-2">
        <div className="flex items-center justify-between space-x-1">
          <div className="flex items-center space-x-1">
            {views.map(view => (
              <button
                key={view.id}
                onClick={() => { setActiveTab('table'); handleViewSwitch(view.id); }}
                className={`px-3 py-1.5 text-sm rounded flex items-center space-x-1 ${
                  currentView?.id === view.id && activeTab === 'table'
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className="text-xs">
                  {view.type === ViewType.GRID && '📋'}
                  {view.type === ViewType.KANBAN && '📌'}
                  {view.type === ViewType.CALENDAR && '📅'}
                  {view.type === ViewType.GALLERY && '🖼️'}
                </span>
                <span>{view.name}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => setActiveTab('table')}
              className={`px-3 py-1.5 text-sm rounded ${activeTab === 'table' ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'text-gray-600 hover:bg-gray-100'}`}
              title="表格视图"
            >
              表格视图
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-3 py-1.5 text-sm rounded ${activeTab === 'analytics' ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'text-gray-600 hover:bg-gray-100'}`}
              title="基于当前表格数据的可视化分析"
            >
              可视化分析
            </button>
          </div>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="flex-1 flex min-h-0">
        {/* 视图内容 */}
        <div className="flex-1 flex flex-col min-h-0">
          {activeTab === 'analytics' ? (
            <AnalyticsTab fields={fields} records={records} />
          ) : (
            renderViewContent()
          )}
        </div>
      </div>

      {/* 状态栏 */}
      <div className="bg-white border-t border-gray-200 px-6 py-2">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-4">
            <span>共 {records.length} 条记录</span>
            <span>{fields.length} 个指标</span>
            <span>当前视图：{currentView?.name || '无'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>更新时间：{table.updatedAt ? new Date(table.updatedAt).toLocaleString() : '未知'}</span>
          </div>
        </div>
      </div>

      <AddFieldModal
        open={showAddFieldModal}
        onClose={() => setShowAddFieldModal(false)}
        onSubmit={handleSubmitNewField}
      />

      <EditFieldModal
        open={!!editingFieldId}
        field={currentEditingField}
        onClose={() => setEditingFieldId(null)}
        onSubmit={handleSubmitEditField}
      />

      <FieldManagerPanel
        open={showFieldManager}
        fields={fields}
        hiddenFieldIds={currentView?.config?.hiddenFields || []}
        onClose={() => setShowFieldManager(false)}
        onToggleHide={handleToggleHide}
        onMove={handleMove}
        onRename={handleRename}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onReorder={handleReorder}
        onCreateField={handleCreateFieldFromImport}
      />
    </div>
  );
};

export default ReviewTablePage; 