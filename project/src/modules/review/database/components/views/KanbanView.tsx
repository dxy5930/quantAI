/**
 * 看板视图组件
 * Kanban View Component - 模仿飞书多维表格的看板视图
 */

import React, { useState, useMemo } from 'react';
import { Plus, MoreHorizontal, Edit, Trash2, Copy } from 'lucide-react';
import { 
  ReviewDatabase, 
  ViewDefinition, 
  DatabaseRecord, 
  FieldDefinition, 
  FieldType, 
  RecordData,
  ViewComponentProps 
} from '../../types';
import { FieldRenderer } from '../fields/FieldRenderer';

interface KanbanViewProps extends ViewComponentProps {
  onRecordAdd?: (data: RecordData) => Promise<DatabaseRecord | null>;
  onRecordDelete?: (recordId: string) => void;
}

interface KanbanColumn {
  id: string;
  title: string;
  records: DatabaseRecord[];
  color?: string;
}

export const KanbanView: React.FC<KanbanViewProps> = ({
  database,
  view,
  records,
  onRecordSelect,
  onRecordUpdate,
  onRecordAdd,
  onRecordDelete,
  readOnly = false,
}) => {
  const [draggedRecord, setDraggedRecord] = useState<DatabaseRecord | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [recordMenuOpen, setRecordMenuOpen] = useState<string | null>(null);

  // 获取看板分组字段
  const groupByField = useMemo(() => {
    const fieldId = view.config.groupByField;
    return database.fields.find(f => f.id === fieldId);
  }, [database.fields, view.config.groupByField]);

  // 获取卡片显示字段
  const cardFields = useMemo(() => {
    const fieldIds = view.config.cardFields || database.fields.slice(0, 3).map(f => f.id);
    return database.fields.filter(f => fieldIds.includes(f.id));
  }, [database.fields, view.config.cardFields]);

  // 生成看板列
  const kanbanColumns = useMemo((): KanbanColumn[] => {
    if (!groupByField) {
      return [{
        id: 'all',
        title: '所有记录',
        records,
        color: '#6b7280'
      }];
    }

    // 根据字段选项生成列
    const options = groupByField.config?.options || [];
    const columnMap = new Map<string, KanbanColumn>();
    
    // 初始化选项列
    options.forEach(option => {
      columnMap.set(option.id, {
        id: option.id,
        title: option.name,
        records: [],
        color: option.color
      });
    });

    // 添加未分组列
    columnMap.set('ungrouped', {
      id: 'ungrouped',
      title: '未分组',
      records: [],
      color: '#94a3b8'
    });

    // 分配记录到对应列
    records.forEach(record => {
      const value = record.data[groupByField.id];
      const columnId = value ? String(value) : 'ungrouped';
      
      if (columnMap.has(columnId)) {
        columnMap.get(columnId)!.records.push(record);
      } else {
        columnMap.get('ungrouped')!.records.push(record);
      }
    });

    return Array.from(columnMap.values());
  }, [groupByField, records]);

  // 处理拖拽
  const handleDragStart = (e: React.DragEvent, record: DatabaseRecord) => {
    setDraggedRecord(record);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setDragOverColumn(null);
    
    if (!draggedRecord || !groupByField || readOnly) return;

    // 更新记录的分组字段值
    const newValue = columnId === 'ungrouped' ? null : columnId;
    try {
      await onRecordUpdate?.(draggedRecord.id, { [groupByField.id]: newValue });
    } catch (error) {
      console.error('更新记录失败:', error);
    }
    
    setDraggedRecord(null);
  };

  const handleDragEnd = () => {
    setDraggedRecord(null);
    setDragOverColumn(null);
  };

  // 处理记录操作
  const handleRecordAction = (action: string, record: DatabaseRecord) => {
    setRecordMenuOpen(null);
    
    switch (action) {
      case 'edit':
        onRecordSelect?.(record);
        break;
      case 'copy':
        if (onRecordAdd) {
          onRecordAdd({ ...record.data });
        }
        break;
      case 'delete':
        if (window.confirm('确定要删除这条记录吗？')) {
          onRecordDelete?.(record.id);
        }
        break;
    }
  };

  // 添加新记录到指定列
  const handleAddRecord = async (columnId: string) => {
    if (!onRecordAdd || !groupByField) return;
    
    const newData: RecordData = {};
    
    // 设置分组字段值
    if (columnId !== 'ungrouped') {
      newData[groupByField.id] = columnId;
    }
    
    try {
      await onRecordAdd(newData);
    } catch (error) {
      console.error('添加记录失败:', error);
    }
  };

  // 渲染记录卡片
  const renderRecordCard = (record: DatabaseRecord) => (
    <div
      key={record.id}
      draggable={!readOnly}
      onDragStart={(e) => handleDragStart(e, record)}
      onDragEnd={handleDragEnd}
      className={`bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3 mb-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer group ${
        draggedRecord?.id === record.id ? 'opacity-50' : ''
      }`}
      onClick={() => onRecordSelect?.(record)}
    >
      <div className="space-y-2">
        {cardFields.map(field => {
          const value = record.data[field.id];
          if (!value && value !== 0) return null;
          
          return (
            <div key={field.id}>
              {field.isPrimary ? (
                <div className="font-medium text-gray-900 dark:text-white">
                  <FieldRenderer field={field} value={value} database={database} />
                </div>
              ) : (
                <div className="text-sm">
                  <div className="text-gray-500 dark:text-gray-400 text-xs mb-1">
                    {field.name}
                  </div>
                  <FieldRenderer field={field} value={value} database={database} />
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* 卡片操作菜单 */}
      {!readOnly && (
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setRecordMenuOpen(recordMenuOpen === record.id ? null : record.id);
            }}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded transition-all"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          
          {recordMenuOpen === record.id && (
            <div className="absolute top-8 right-2 w-32 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-20">
              <div className="p-1">
                <button
                  onClick={() => handleRecordAction('edit', record)}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <Edit className="w-4 h-4" />
                  <span>编辑</span>
                </button>
                <button
                  onClick={() => handleRecordAction('copy', record)}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <Copy className="w-4 h-4" />
                  <span>复制</span>
                </button>
                <button
                  onClick={() => handleRecordAction('delete', record)}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>删除</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // 渲染看板列
  const renderKanbanColumn = (column: KanbanColumn) => (
    <div
      key={column.id}
      className={`flex-shrink-0 w-80 bg-gray-50 dark:bg-gray-800 rounded-lg p-4 ${
        dragOverColumn === column.id ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
      }`}
      onDragOver={(e) => handleDragOver(e, column.id)}
      onDragLeave={handleDragLeave}
      onDrop={(e) => handleDrop(e, column.id)}
    >
      {/* 列标题 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: column.color || '#6b7280' }}
          />
          <h3 className="font-medium text-gray-900 dark:text-white">
            {column.title}
          </h3>
          <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full">
            {column.records.length}
          </span>
        </div>
        
        {!readOnly && (
          <button
            onClick={() => handleAddRecord(column.id)}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded transition-colors"
            title="添加记录"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>
      
      {/* 记录列表 */}
      <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
        {column.records.map(record => renderRecordCard(record))}
        
        {/* 拖拽占位符 */}
        {dragOverColumn === column.id && draggedRecord && (
          <div className="h-20 border-2 border-dashed border-blue-400 rounded-lg bg-blue-50 dark:bg-blue-900/20" />
        )}
      </div>
    </div>
  );

  // 如果没有设置分组字段，显示提示
  if (!groupByField) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            配置看板视图
          </h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-md">
            请在视图设置中选择一个单选字段作为看板的分组依据，然后就可以使用拖拽方式管理数据了。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-100 dark:bg-gray-900 p-4">
      <div className="h-full overflow-x-auto overflow-y-hidden">
        <div className="flex space-x-4 h-full min-w-max">
          {kanbanColumns.map(column => renderKanbanColumn(column))}
        </div>
      </div>
      
      {/* 点击外部关闭菜单 */}
      {recordMenuOpen && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setRecordMenuOpen(null)}
        />
      )}
    </div>
  );
};

export default KanbanView;