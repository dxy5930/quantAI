/**
 * 表格视图组件
 * Grid View Component - 模仿飞书多维表格的表格视图
 */

import React, { useState, useRef, useCallback } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  MoreHorizontal, 
  ChevronRight, 
  ChevronDown,
  Bot,
  Sparkles,
  Check,
  X
} from 'lucide-react';
import { 
  ReviewDatabase, 
  ViewDefinition, 
  DatabaseRecord, 
  FieldDefinition, 
  FieldType, 
  RecordData,
  ViewComponentProps 
} from '../../types';
import { useRecordSelection } from '../../hooks';
import { FieldRenderer } from '../fields/FieldRenderer';
import { FieldEditor } from '../fields/FieldEditor';

interface GridViewProps extends ViewComponentProps {
  onFieldUpdate?: (fieldId: string, updates: Partial<FieldDefinition>) => void;
  onRecordAdd?: (data: RecordData) => Promise<DatabaseRecord | null>;
  onRecordDelete?: (recordId: string) => void;
  onAIGenerate?: (fieldId: string, recordId: string) => Promise<any>;
  searchQuery?: string;
}

export const GridView: React.FC<GridViewProps> = ({
  database,
  view,
  records,
  onRecordSelect,
  onRecordUpdate,
  onFieldUpdate,
  onRecordAdd,
  onRecordDelete,
  onAIGenerate,
  readOnly = false,
  searchQuery = '',
}) => {
  const {
    selectedRecords,
    selectRecord,
    selectAll,
    clearSelection,
    toggleRecord,
    selectedCount,
  } = useRecordSelection();

  const [editingCell, setEditingCell] = useState<{ recordId: string; fieldId: string } | null>(null);
  const [newRecord, setNewRecord] = useState<RecordData>({});
  const [showNewRecord, setShowNewRecord] = useState(false);
  const [rowMenuOpen, setRowMenuOpen] = useState<string | null>(null);
  const [groupExpanded, setGroupExpanded] = useState<Record<string, boolean>>({});

  const tableRef = useRef<HTMLDivElement>(null);

  // 获取可见字段
  const visibleFields = database.fields
    .filter(field => {
      if (field.isHidden) return false;
      if (view.config.visibleFields?.length) {
        return view.config.visibleFields.includes(field.id);
      }
      return true;
    })
    .sort((a, b) => {
      const aOrder = view.config.fieldOrder?.indexOf(a.id) ?? a.order;
      const bOrder = view.config.fieldOrder?.indexOf(b.id) ?? b.order;
      return aOrder - bOrder;
    });

  // 过滤和搜索记录
  const filteredRecords = records.filter(record => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    return visibleFields.some(field => {
      const value = record.data[field.id];
      return String(value || '').toLowerCase().includes(searchLower);
    });
  });

  // 分组记录
  const groupedRecords = () => {
    const groupField = view.config.groups?.[0];
    if (!groupField) {
      return [{ key: 'all', title: '所有记录', records: filteredRecords, expanded: true }];
    }

    const groups: Record<string, DatabaseRecord[]> = {};
    filteredRecords.forEach(record => {
      const groupValue = record.data[groupField.fieldId] || '未分组';
      const groupKey = String(groupValue);
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(record);
    });

    return Object.entries(groups).map(([key, records]) => ({
      key,
      title: key,
      records,
      expanded: groupExpanded[key] ?? true,
    }));
  };

  // 处理单元格编辑
  const handleCellEdit = (recordId: string, fieldId: string) => {
    if (readOnly) return;
    setEditingCell({ recordId, fieldId });
  };

  const handleCellSave = async (value: any) => {
    if (!editingCell) return;
    
    try {
      await onRecordUpdate?.(editingCell.recordId, { [editingCell.fieldId]: value });
      setEditingCell(null);
    } catch (error) {
      console.error('保存失败:', error);
    }
  };

  const handleCellCancel = () => {
    setEditingCell(null);
  };

  // 处理新记录
  const handleNewRecordSave = async () => {
    if (!onRecordAdd) return;
    
    try {
      const record = await onRecordAdd(newRecord);
      if (record) {
        setNewRecord({});
        setShowNewRecord(false);
      }
    } catch (error) {
      console.error('添加记录失败:', error);
    }
  };

  const handleNewRecordCancel = () => {
    setNewRecord({});
    setShowNewRecord(false);
  };

  // 处理记录菜单
  const handleRecordAction = (action: string, recordId: string) => {
    setRowMenuOpen(null);
    
    switch (action) {
      case 'edit':
        onRecordSelect?.(records.find(r => r.id === recordId)!);
        break;
      case 'copy':
        const record = records.find(r => r.id === recordId);
        if (record && onRecordAdd) {
          onRecordAdd({ ...record.data });
        }
        break;
      case 'delete':
        if (window.confirm('确定要删除这条记录吗？')) {
          onRecordDelete?.(recordId);
        }
        break;
    }
  };

  // 处理AI生成
  const handleAIGenerate = async (fieldId: string, recordId: string) => {
    if (!onAIGenerate) return;
    
    try {
      await onAIGenerate(fieldId, recordId);
    } catch (error) {
      console.error('AI生成失败:', error);
    }
  };

  // 全选处理
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      selectAll(filteredRecords.map(r => r.id));
    } else {
      clearSelection();
    }
  };

  // 分组展开/折叠
  const toggleGroup = (groupKey: string) => {
    setGroupExpanded(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  };

  // 渲染表头
  const renderTableHeader = () => (
    <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
      <tr>
        {/* 选择列 */}
        <th className="w-12 px-3 py-2 text-left">
          <input
            type="checkbox"
            checked={selectedCount > 0 && selectedCount === filteredRecords.length}
            onChange={(e) => handleSelectAll(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        </th>
        
        {/* 字段列 */}
        {visibleFields.map(field => (
          <th
            key={field.id}
            className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600 min-w-32"
            style={{ width: field.width ? `${field.width}px` : 'auto' }}
          >
            <div className="flex items-center space-x-2">
              <span>{field.name}</span>
              {field.type === FieldType.AI_GENERATED && (
                <Bot className="w-3 h-3 text-purple-500" />
              )}
              {field.config?.required && (
                <span className="text-red-500">*</span>
              )}
            </div>
          </th>
        ))}
        
        {/* 操作列 */}
        {!readOnly && (
          <th className="w-12 px-3 py-2 text-left"></th>
        )}
      </tr>
    </thead>
  );

  // 渲染记录行
  const renderRecordRow = (record: DatabaseRecord, index: number) => (
    <tr
      key={record.id}
      className={`border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 ${
        selectedRecords.has(record.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
      }`}
    >
      {/* 选择列 */}
      <td className="px-3 py-2">
        <input
          type="checkbox"
          checked={selectedRecords.has(record.id)}
          onChange={(e) => selectRecord(record.id, e.target.checked)}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      </td>
      
      {/* 字段列 */}
      {visibleFields.map(field => {
        const isEditing = editingCell?.recordId === record.id && editingCell?.fieldId === field.id;
        const value = record.data[field.id];
        
        return (
          <td
            key={field.id}
            className="px-4 py-2 border-r border-gray-200 dark:border-gray-600 cursor-pointer group"
            onClick={() => handleCellEdit(record.id, field.id)}
          >
            <div className="flex items-center space-x-2">
              {isEditing ? (
                <FieldEditor
                  field={field}
                  value={value}
                  onSave={handleCellSave}
                  onCancel={handleCellCancel}
                  autoFocus
                />
              ) : (
                <>
                  <FieldRenderer
                    field={field}
                    value={value}
                    database={database}
                  />
                  
                  {/* AI生成按钮 */}
                  {field.type === FieldType.AI_GENERATED && !value && onAIGenerate && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAIGenerate(field.id, record.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-purple-500 hover:text-purple-700 rounded transition-all"
                      title="AI生成"
                    >
                      <Sparkles className="w-3 h-3" />
                    </button>
                  )}
                </>
              )}
            </div>
          </td>
        );
      })}
      
      {/* 操作列 */}
      {!readOnly && (
        <td className="px-3 py-2">
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setRowMenuOpen(rowMenuOpen === record.id ? null : record.id);
              }}
              className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded transition-all"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            
            {/* 行菜单 */}
            {rowMenuOpen === record.id && (
              <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-20">
                <div className="p-1">
                  <button
                    onClick={() => handleRecordAction('edit', record.id)}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    <Edit className="w-4 h-4" />
                    <span>编辑</span>
                  </button>
                  <button
                    onClick={() => handleRecordAction('copy', record.id)}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    <Copy className="w-4 h-4" />
                    <span>复制</span>
                  </button>
                  <button
                    onClick={() => handleRecordAction('delete', record.id)}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>删除</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </td>
      )}
    </tr>
  );

  // 渲染新记录行
  const renderNewRecordRow = () => (
    <tr className="border-b border-gray-200 dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20">
      {/* 选择列 */}
      <td className="px-3 py-2">
        <div className="w-4 h-4"></div>
      </td>
      
      {/* 字段列 */}
      {visibleFields.map(field => (
        <td key={field.id} className="px-4 py-2 border-r border-gray-200 dark:border-gray-600">
          <FieldEditor
            field={field}
            value={newRecord[field.id]}
            onSave={(value: any) => setNewRecord(prev => ({ ...prev, [field.id]: value }))}
            onChange={(value: any) => setNewRecord(prev => ({ ...prev, [field.id]: value }))}
            placeholder={`输入${field.name}...`}
          />
        </td>
      ))}
      
      {/* 操作列 */}
      {!readOnly && (
        <td className="px-3 py-2">
          <div className="flex items-center space-x-1">
            <button
              onClick={handleNewRecordSave}
              className="p-1 text-green-600 hover:text-green-700 rounded"
              title="保存"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={handleNewRecordCancel}
              className="p-1 text-red-600 hover:text-red-700 rounded"
              title="取消"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </td>
      )}
    </tr>
  );

  const groups = groupedRecords();

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800">
      {/* 表格容器 */}
      <div
        ref={tableRef}
        className="flex-1 overflow-auto border border-gray-200 dark:border-gray-600 rounded-lg"
      >
        <table className="w-full table-fixed">
          {renderTableHeader()}
          <tbody>
            {groups.map(group => (
              <React.Fragment key={group.key}>
                {/* 分组标题 */}
                {group.key !== 'all' && (
                  <tr>
                    <td colSpan={visibleFields.length + (readOnly ? 1 : 2)} className="px-4 py-2 bg-gray-100 dark:bg-gray-700">
                      <button
                        onClick={() => toggleGroup(group.key)}
                        className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                      >
                        {group.expanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                        <span>{group.title} ({group.records.length})</span>
                      </button>
                    </td>
                  </tr>
                )}
                
                {/* 分组记录 */}
                {(group.key === 'all' || group.expanded) &&
                  group.records.map((record, index) => renderRecordRow(record, index))
                }
              </React.Fragment>
            ))}
            
            {/* 新记录行 */}
            {showNewRecord && renderNewRecordRow()}
          </tbody>
        </table>
      </div>

      {/* 底部工具栏 */}
      {!readOnly && (
        <div className="flex-shrink-0 px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowNewRecord(true)}
                disabled={showNewRecord}
                className="flex items-center space-x-2 px-3 py-1.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                <span>添加记录</span>
              </button>
              
              {selectedCount > 0 && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  已选择 {selectedCount} 条记录
                </span>
              )}
            </div>
            
            <div className="text-sm text-gray-500 dark:text-gray-400">
              共 {filteredRecords.length} 条记录
            </div>
          </div>
        </div>
      )}

      {/* 点击外部关闭菜单 */}
      {rowMenuOpen && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setRowMenuOpen(null)}
        />
      )}
    </div>
  );
};

export default GridView;