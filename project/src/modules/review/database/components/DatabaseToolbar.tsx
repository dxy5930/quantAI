/**
 * 数据库工具栏组件
 * Database Toolbar Component
 */

import React, { useState } from 'react';
import { 
  Filter, 
  SortAsc, 
  SortDesc, 
  Group, 
  MoreHorizontal, 
  Trash2, 
  Copy, 
  Edit,
  X,
  ChevronDown
} from 'lucide-react';
import { ReviewDatabase, ViewDefinition, FilterCondition, SortConfig } from '../types';

interface DatabaseToolbarProps {
  database: ReviewDatabase;
  view?: ViewDefinition;
  selectedRecords: string[];
  onBulkAction: (action: string, recordIds: string[]) => void;
  onFilterChange: (filters: FilterCondition[]) => void;
  onSortChange: (sorts: SortConfig[]) => void;
  onGroupChange?: (groupBy: string | null) => void;
}

export const DatabaseToolbar: React.FC<DatabaseToolbarProps> = ({
  database,
  view,
  selectedRecords,
  onBulkAction,
  onFilterChange,
  onSortChange,
  onGroupChange,
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [showSorts, setShowSorts] = useState(false);
  const [showGroups, setShowGroups] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);

  const currentFilters = view?.config.filters || [];
  const currentSorts = view?.config.sorts || [];
  const currentGroup = view?.config.groups?.[0]?.fieldId;

  const hasSelectedRecords = selectedRecords.length > 0;

  // 添加过滤器
  const addFilter = () => {
    const newFilter: FilterCondition = {
      fieldId: database.fields[0]?.id || '',
      operator: 'eq',
      value: '',
    };
    onFilterChange([...currentFilters, newFilter]);
  };

  // 更新过滤器
  const updateFilter = (index: number, updates: Partial<FilterCondition>) => {
    const newFilters = [...currentFilters];
    newFilters[index] = { ...newFilters[index], ...updates };
    onFilterChange(newFilters);
  };

  // 删除过滤器
  const removeFilter = (index: number) => {
    const newFilters = currentFilters.filter((_, i) => i !== index);
    onFilterChange(newFilters);
  };

  // 添加排序
  const addSort = (fieldId: string, direction: 'asc' | 'desc') => {
    const existingIndex = currentSorts.findIndex(s => s.fieldId === fieldId);
    let newSorts: SortConfig[];
    
    if (existingIndex >= 0) {
      // 更新现有排序
      newSorts = [...currentSorts];
      newSorts[existingIndex] = { fieldId, direction };
    } else {
      // 添加新排序
      newSorts = [...currentSorts, { fieldId, direction }];
    }
    
    onSortChange(newSorts);
  };

  // 删除排序
  const removeSort = (fieldId: string) => {
    const newSorts = currentSorts.filter(s => s.fieldId !== fieldId);
    onSortChange(newSorts);
  };

  // 设置分组
  const setGroup = (fieldId: string | null) => {
    onGroupChange?.(fieldId);
  };

  // 批量操作
  const handleBulkAction = (action: string) => {
    onBulkAction(action, selectedRecords);
    setShowBulkActions(false);
  };

  const getFieldName = (fieldId: string) => {
    return database.fields.find(f => f.id === fieldId)?.name || fieldId;
  };

  return (
    <div className="flex-shrink-0 px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
      <div className="flex items-center justify-between">
        {/* 左侧：过滤、排序、分组 */}
        <div className="flex items-center space-x-2">
          {/* 过滤器 */}
          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                currentFilters.length > 0
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>过滤</span>
              {currentFilters.length > 0 && (
                <span className="px-1.5 py-0.5 bg-blue-600 text-white text-xs rounded">
                  {currentFilters.length}
                </span>
              )}
              <ChevronDown className="w-3 h-3" />
            </button>

            {/* 过滤器下拉菜单 */}
            {showFilters && (
              <div className="absolute top-full left-0 mt-1 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50">
                <div className="p-3">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900 dark:text-white">过滤条件</h4>
                    <button
                      onClick={() => setShowFilters(false)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2 mb-3">
                    {currentFilters.map((filter, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <select
                          value={filter.fieldId}
                          onChange={(e) => updateFilter(index, { fieldId: e.target.value })}
                          className="flex-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          {database.fields.map(field => (
                            <option key={field.id} value={field.id}>
                              {field.name}
                            </option>
                          ))}
                        </select>
                        
                        <select
                          value={filter.operator}
                          onChange={(e) => updateFilter(index, { operator: e.target.value as any })}
                          className="text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="eq">等于</option>
                          <option value="ne">不等于</option>
                          <option value="contains">包含</option>
                          <option value="notContains">不包含</option>
                          <option value="isEmpty">为空</option>
                          <option value="isNotEmpty">不为空</option>
                        </select>
                        
                        <input
                          type="text"
                          value={filter.value}
                          onChange={(e) => updateFilter(index, { value: e.target.value })}
                          placeholder="值"
                          className="flex-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                        
                        <button
                          onClick={() => removeFilter(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={addFilter}
                    className="w-full py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                  >
                    + 添加过滤条件
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 排序 */}
          <div className="relative">
            <button
              onClick={() => setShowSorts(!showSorts)}
              className={`flex items-center space-x-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                currentSorts.length > 0
                  ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <SortAsc className="w-4 h-4" />
              <span>排序</span>
              {currentSorts.length > 0 && (
                <span className="px-1.5 py-0.5 bg-green-600 text-white text-xs rounded">
                  {currentSorts.length}
                </span>
              )}
              <ChevronDown className="w-3 h-3" />
            </button>

            {/* 排序下拉菜单 */}
            {showSorts && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50">
                <div className="p-3">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900 dark:text-white">排序</h4>
                    <button
                      onClick={() => setShowSorts(false)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-1">
                    {database.fields.map(field => {
                      const sort = currentSorts.find(s => s.fieldId === field.id);
                      return (
                        <div key={field.id} className="flex items-center justify-between py-1">
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {field.name}
                          </span>
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => addSort(field.id, 'asc')}
                              className={`p-1 rounded ${
                                sort?.direction === 'asc'
                                  ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
                                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                              }`}
                            >
                              <SortAsc className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => addSort(field.id, 'desc')}
                              className={`p-1 rounded ${
                                sort?.direction === 'desc'
                                  ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
                                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                              }`}
                            >
                              <SortDesc className="w-4 h-4" />
                            </button>
                            {sort && (
                              <button
                                onClick={() => removeSort(field.id)}
                                className="p-1 text-red-500 hover:text-red-700"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 分组 */}
          {onGroupChange && (
            <div className="relative">
              <button
                onClick={() => setShowGroups(!showGroups)}
                className={`flex items-center space-x-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  currentGroup
                    ? 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Group className="w-4 h-4" />
                <span>分组</span>
                {currentGroup && (
                  <span className="text-xs">({getFieldName(currentGroup)})</span>
                )}
                <ChevronDown className="w-3 h-3" />
              </button>

              {/* 分组下拉菜单 */}
              {showGroups && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50">
                  <div className="p-2">
                    <button
                      onClick={() => {
                        setGroup(null);
                        setShowGroups(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                        !currentGroup
                          ? 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      无分组
                    </button>
                    {database.fields.map(field => (
                      <button
                        key={field.id}
                        onClick={() => {
                          setGroup(field.id);
                          setShowGroups(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                          currentGroup === field.id
                            ? 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        {field.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 右侧：批量操作 */}
        {hasSelectedRecords && (
          <div className="relative">
            <button
              onClick={() => setShowBulkActions(!showBulkActions)}
              className="flex items-center space-x-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              <span>{selectedRecords.length} 项已选中</span>
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {/* 批量操作菜单 */}
            {showBulkActions && (
              <div className="absolute top-full right-0 mt-1 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50">
                <div className="p-1">
                  <button
                    onClick={() => handleBulkAction('copy')}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    <Copy className="w-4 h-4" />
                    <span>复制</span>
                  </button>
                  <button
                    onClick={() => handleBulkAction('edit')}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    <Edit className="w-4 h-4" />
                    <span>批量编辑</span>
                  </button>
                  <button
                    onClick={() => handleBulkAction('delete')}
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

      {/* 活动过滤器显示 */}
      {currentFilters.length > 0 && (
        <div className="mt-2 flex items-center space-x-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">活动过滤器:</span>
          {currentFilters.map((filter, index) => (
            <span
              key={index}
              className="inline-flex items-center space-x-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-xs rounded-full"
            >
              <span>{getFieldName(filter.fieldId)} {filter.operator} {filter.value}</span>
              <button
                onClick={() => removeFilter(index)}
                className="text-blue-400 hover:text-blue-600"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* 点击外部关闭下拉菜单 */}
      {(showFilters || showSorts || showGroups || showBulkActions) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowFilters(false);
            setShowSorts(false);
            setShowGroups(false);
            setShowBulkActions(false);
          }}
        />
      )}
    </div>
  );
};

export default DatabaseToolbar;