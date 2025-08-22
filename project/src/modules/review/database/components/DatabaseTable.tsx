/**
 * 多维表格主组件
 * Main Database Component - Multi-dimensional Table System
 */

import React, { useState } from 'react';
import { Plus, Settings, Share2, Download, Upload, Bot, Eye, Layout, Search } from 'lucide-react';
import { useDatabase, useViewData } from '../hooks';
import { ReviewDatabase, ViewType } from '../types';
import { DatabaseToolbar } from './DatabaseToolbar';
import { ViewSwitcher } from './ViewSwitcher';
import { GridView } from './views/GridView';
import { KanbanView } from './views/KanbanView';
import { CalendarView } from './views/CalendarView';
import { DatabaseModal } from './modals/DatabaseModal';
import { FieldEditorModal } from './modals/FieldEditorModal';
import { ViewEditorModal, ImportModal, ExportModal } from './modals';

interface DatabaseTableProps {
  databaseId?: string;
  template?: string;
  onDatabaseSelect?: (database: ReviewDatabase) => void;
  readOnly?: boolean;
  showHeader?: boolean;
  maxHeight?: number;
}

export const DatabaseTable: React.FC<DatabaseTableProps> = ({
  databaseId,
  template,
  onDatabaseSelect,
  readOnly = false,
  showHeader = true,
  maxHeight = 800,
}) => {
  // 数据库状态
  const {
    database,
    loading,
    error,
    createDatabase,
    updateDatabase,
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
  } = useDatabase(databaseId);

  // 当前视图状态
  const [currentViewId, setCurrentViewId] = useState<string | undefined>();
  const { view, records, fields } = useViewData(database, currentViewId);

  // 模态框状态
  const [showDatabaseModal, setShowDatabaseModal] = useState(false);
  const [showFieldEditor, setShowFieldEditor] = useState(false);
  const [showViewEditor, setShowViewEditor] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // 搜索状态
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // 初始化数据库
  const handleCreateDatabase = async () => {
    const newDb = await createDatabase(template);
    if (newDb && onDatabaseSelect) {
      onDatabaseSelect(newDb);
    }
  };

  // 处理记录操作
  const handleRecordUpdate = async (recordId: string, data: any) => {
    await updateRecord(recordId, data);
  };

  const handleRecordAdd = async (data: any) => {
    const newRecord = await addRecord(data);
    return newRecord;
  };

  const handleRecordDelete = async (recordId: string) => {
    await deleteRecord(recordId);
  };

  // 处理字段操作
  const handleFieldUpdate = async (fieldId: string, updates: any) => {
    await updateField(fieldId, updates);
  };

  // 处理AI功能
  const handleAIGenerate = async (fieldId: string, recordId: string) => {
    try {
      const result = await generateAIField(fieldId, recordId);
      return result;
    } catch (error) {
      console.error('AI生成失败:', error);
      throw error;
    }
  };

  // 渲染视图组件
  const renderView = () => {
    if (!database || !view) return null;

    const commonProps = {
      database,
      view,
      records,
      onRecordSelect: (record: any) => console.log('Record selected:', record),
      onRecordUpdate: handleRecordUpdate,
      readOnly,
    };

    switch (view.type) {
      case ViewType.GRID:
        return (
          <GridView
            {...commonProps}
            onFieldUpdate={handleFieldUpdate}
            onRecordAdd={handleRecordAdd}
            onRecordDelete={handleRecordDelete}
            onAIGenerate={handleAIGenerate}
            searchQuery={searchQuery}
          />
        );
      
      case ViewType.KANBAN:
        return (
          <KanbanView
            {...commonProps}
            onRecordAdd={handleRecordAdd}
            onRecordDelete={handleRecordDelete}
          />
        );
      
      case ViewType.CALENDAR:
        return (
          <CalendarView
            {...commonProps}
            onRecordAdd={handleRecordAdd}
            onRecordDelete={handleRecordDelete}
          />
        );
      
      default:
        return (
          <div className="flex items-center justify-center h-64 text-gray-500">
            不支持的视图类型: {view.type}
          </div>
        );
    }
  };

  // 加载状态
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">加载中...</span>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="text-red-500 mb-4">❌ {error}</div>
        <button
          onClick={handleCreateDatabase}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          创建新数据库
        </button>
      </div>
    );
  }

  // 无数据库状态
  if (!database) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          创建您的第一个复盘表格
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6 text-center max-w-md">
          使用多维表格记录和分析您的交易复盘，支持多种视图和AI智能分析
        </p>
        <div className="flex space-x-3">
          <button
            onClick={handleCreateDatabase}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>创建空白表格</span>
          </button>
          <button
            onClick={() => setShowDatabaseModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 flex items-center space-x-2"
          >
            <Layout className="w-5 h-5" />
            <span>使用模板</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* 顶部工具栏 */}
      {showHeader && (
        <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            {/* 左侧：数据库信息和视图切换 */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{database.icon}</span>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {database.name}
                  </h2>
                  {database.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {database.description}
                    </p>
                  )}
                </div>
              </div>
              
              <ViewSwitcher
                views={database.views}
                currentViewId={currentViewId}
                onViewChange={setCurrentViewId}
                onAddView={() => setShowViewEditor(true)}
                readOnly={readOnly}
              />
            </div>

            {/* 右侧：操作按钮 */}
            <div className="flex items-center space-x-2">
              {/* 搜索按钮 */}
              <button
                onClick={() => setShowSearch(!showSearch)}
                className={`p-2 rounded-lg transition-colors ${
                  showSearch
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                title="搜索"
              >
                <Search className="w-5 h-5" />
              </button>

              {!readOnly && (
                <>
                  {/* AI建议 */}
                  <button
                    onClick={async () => {
                      const suggestions = await getAISuggestions();
                      console.log('AI建议:', suggestions);
                    }}
                    className="p-2 text-purple-600 hover:text-purple-700 hover:bg-purple-100 dark:hover:bg-purple-900 rounded-lg transition-colors"
                    title="AI建议"
                  >
                    <Bot className="w-5 h-5" />
                  </button>

                  {/* 添加字段 */}
                  <button
                    onClick={() => setShowFieldEditor(true)}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="添加字段"
                  >
                    <Plus className="w-5 h-5" />
                  </button>

                  {/* 导入 */}
                  <button
                    onClick={() => setShowImportModal(true)}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="导入数据"
                  >
                    <Upload className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* 导出 */}
              <button
                onClick={() => setShowExportModal(true)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="导出数据"
              >
                <Download className="w-5 h-5" />
              </button>

              {!readOnly && (
                <>
                  {/* 分享 */}
                  <button
                    onClick={() => console.log('分享数据库')}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="分享"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>

                  {/* 设置 */}
                  <button
                    onClick={() => console.log('数据库设置')}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="设置"
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* 搜索栏 */}
          {showSearch && (
            <div className="mt-3 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索记录..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* 数据库工具栏 */}
      {!readOnly && (
        <DatabaseToolbar
          database={database}
          view={view}
          selectedRecords={[]}
          onBulkAction={(action: string, recordIds: string[]) => console.log('批量操作:', action, recordIds)}
          onFilterChange={(filters: any) => console.log('过滤器变化:', filters)}
          onSortChange={(sorts: any) => console.log('排序变化:', sorts)}
        />
      )}

      {/* 主要内容区域 */}
      <div 
        className="flex-1 overflow-hidden"
        style={{ maxHeight: `${maxHeight}px` }}
      >
        {renderView()}
      </div>

      {/* 模态框 */}
      <DatabaseModal
        isOpen={showDatabaseModal}
        onClose={() => setShowDatabaseModal(false)}
        onCreate={async (templateId) => {
          const db = await createDatabase(templateId);
          if (db && onDatabaseSelect) {
            onDatabaseSelect(db);
          }
          setShowDatabaseModal(false);
        }}
      />

      <FieldEditorModal
        isOpen={showFieldEditor}
        onClose={() => setShowFieldEditor(false)}
        database={database}
        onSave={async (field: any) => {
          await addField(field);
          setShowFieldEditor(false);
        }}
      />

      <ViewEditorModal
        isOpen={showViewEditor}
        onClose={() => setShowViewEditor(false)}
        database={database}
        onSave={async (view: any) => {
          await addView(view);
          setShowViewEditor(false);
        }}
      />

      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        database={database}
        onImport={async (file: File, mapping: Record<string, string>) => {
          await importData(file, mapping);
          setShowImportModal(false);
        }}
      />

      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        database={database}
        onExport={async (config: any) => {
          const blob = await exportDatabase(config);
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${database.name}.${config.format}`;
          a.click();
          URL.revokeObjectURL(url);
          setShowExportModal(false);
        }}
      />
    </div>
  );
};

export default DatabaseTable;