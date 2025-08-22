/**
 * 视图切换器组件
 * View Switcher Component
 */

import React, { useState } from 'react';
import { Grid3X3, Calendar, Columns, Plus, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { ViewDefinition, ViewType } from '../types';

interface ViewSwitcherProps {
  views: ViewDefinition[];
  currentViewId?: string;
  onViewChange: (viewId: string) => void;
  onAddView: () => void;
  onEditView?: (view: ViewDefinition) => void;
  onDeleteView?: (viewId: string) => void;
  readOnly?: boolean;
}

const VIEW_ICONS = {
  [ViewType.GRID]: Grid3X3,
  [ViewType.KANBAN]: Columns,
  [ViewType.CALENDAR]: Calendar,
  [ViewType.GALLERY]: Grid3X3,
  [ViewType.FORM]: Grid3X3,
  [ViewType.GANTT]: Grid3X3,
  [ViewType.TIMELINE]: Grid3X3,
};

export const ViewSwitcher: React.FC<ViewSwitcherProps> = ({
  views,
  currentViewId,
  onViewChange,
  onAddView,
  onEditView,
  onDeleteView,
  readOnly = false,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showViewActions, setShowViewActions] = useState<string | null>(null);

  const currentView = views.find(v => v.id === currentViewId) || views.find(v => v.isDefault) || views[0];

  const handleViewChange = (viewId: string) => {
    onViewChange(viewId);
    setShowDropdown(false);
  };

  const handleViewAction = (action: 'edit' | 'delete', view: ViewDefinition) => {
    setShowViewActions(null);
    if (action === 'edit' && onEditView) {
      onEditView(view);
    } else if (action === 'delete' && onDeleteView) {
      onDeleteView(view.id);
    }
  };

  const renderViewIcon = (type: ViewType) => {
    const IconComponent = VIEW_ICONS[type];
    return IconComponent ? <IconComponent className="w-4 h-4" /> : <Grid3X3 className="w-4 h-4" />;
  };

  return (
    <div className="relative">
      {/* 当前视图显示 */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
      >
        {currentView && renderViewIcon(currentView.type)}
        <span>{currentView?.name || '选择视图'}</span>
        <svg
          className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* 视图下拉菜单 */}
      {showDropdown && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50">
          <div className="p-2">
            {/* 视图列表 */}
            <div className="space-y-1 mb-2">
              {views.map((view) => (
                <div key={view.id} className="group relative">
                  <button
                    onClick={() => handleViewChange(view.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${
                      view.id === currentView?.id
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      {renderViewIcon(view.type)}
                      <div className="text-left">
                        <div className="font-medium">{view.name}</div>
                        {view.description && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {view.description}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {view.isDefault && (
                      <span className="px-2 py-0.5 text-xs bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 rounded">
                        默认
                      </span>
                    )}
                  </button>
                  
                  {/* 视图操作按钮 */}
                  {!readOnly && !view.isDefault && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowViewActions(showViewActions === view.id ? null : view.id);
                      }}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded transition-all"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  )}

                  {/* 视图操作菜单 */}
                  {showViewActions === view.id && (
                    <div className="absolute right-0 top-0 mt-8 w-32 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-60">
                      <div className="p-1">
                        {onEditView && (
                          <button
                            onClick={() => handleViewAction('edit', view)}
                            className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                          >
                            <Edit className="w-4 h-4" />
                            <span>编辑</span>
                          </button>
                        )}
                        {onDeleteView && (
                          <button
                            onClick={() => handleViewAction('delete', view)}
                            className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>删除</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* 添加视图按钮 */}
            {!readOnly && (
              <>
                <div className="border-t border-gray-200 dark:border-gray-600 my-2"></div>
                <button
                  onClick={() => {
                    onAddView();
                    setShowDropdown(false);
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>添加视图</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* 点击外部关闭下拉菜单 */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowDropdown(false);
            setShowViewActions(null);
          }}
        />
      )}
    </div>
  );
};

export default ViewSwitcher;