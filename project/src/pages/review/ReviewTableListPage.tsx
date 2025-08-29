/**
 * 复盘表格列表页面
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { reviewTableAPI } from '../../modules/review/services/api';
import { Table, Field, View, ViewType, FieldType } from '../../modules/review/types';
import SmartTableBuilder, { SmartTableBlueprint } from '../../modules/review/components/SmartTableBuilder';

const ReviewTableListPage: React.FC = () => {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSmartBuilder, setShowSmartBuilder] = useState(false);
  const navigate = useNavigate();

  // 加载表格列表
  const loadTables = async () => {
    setLoading(true);
    setError(null);
    try {
      const tableList = await reviewTableAPI.getTables();
      setTables(tableList);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  };

  // 智能构建器保存
  const handleSaveBlueprint = async (bp: SmartTableBlueprint) => {
    try {
      // 1) 创建空表
      const created = await reviewTableAPI.createTable({
        name: bp.name,
        description: bp.description,
        icon: bp.icon
      });

      // 2) 生成字段与默认视图
      const now = new Date().toISOString();
      const fields: Field[] = bp.fields.map((f, idx) => ({
        id: f.id,
        name: f.name,
        type: f.type,
        config: f.config,
        width: f.width,
        order: idx,
        createdAt: now,
        updatedAt: now,
        isPreset: (f as any).isPreset === true,
      } as unknown as Field));

      const defaultView: View = {
        id: `view_${Math.random().toString(36).slice(2, 10)}`,
        name: '表格视图',
        type: ViewType.GRID,
        config: {
          hiddenFields: bp.hiddenFieldIds && bp.hiddenFieldIds.length ? bp.hiddenFieldIds : [],
        } as any,
        isDefault: true,
        order: 0,
        createdAt: now,
        updatedAt: now,
      } as View;

      // 3) 更新表的字段与视图
      const updated = await reviewTableAPI.updateTable(created.id, { fields, views: [defaultView] } as any);

      // 4) 创建初始记录
      const rows = Math.max(0, Math.min(100, bp.initialRows || 0));
      for (let i = 0; i < rows; i++) {
        const data: Record<string, any> = {};
        fields.forEach((field) => {
          const cfg: any = (field as any).config;
          const typeStr = String((field as any).type).toLowerCase();
          if (field.type === FieldType.CREATED_TIME || typeStr === 'created_time') {
            data[field.id] = new Date().toISOString();
          } else if (field.type === FieldType.AUTO_NUMBER || typeStr === 'auto_number') {
            data[field.id] = i + 1;
          } else if (cfg && cfg.defaultValue !== undefined) {
            data[field.id] = cfg.defaultValue;
          } else {
            data[field.id] = '';
          }
        });
        await reviewTableAPI.createRecord(created.id, { data });
      }

      // 刷新列表并跳转
      setShowSmartBuilder(false);
      await loadTables();
      navigate(`/review/${created.id}`);
    } catch (e) {
      alert(e instanceof Error ? e.message : '创建失败');
    }
  };

  // 删除表格（软删除）
  const handleDeleteTable = async (e: React.MouseEvent, tableId: string, tableName?: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`确定要删除复盘「${tableName || tableId}」吗？`)) return;
    if (!confirm('再次确认：删除后将从列表中移除。是否继续？')) return;
    try {
      const ok = await reviewTableAPI.deleteTable(tableId);
      if (ok) {
        await loadTables();
      } else {
        alert('删除失败');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : '删除失败');
    }
  };

  useEffect(() => {
    loadTables();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">复盘表格</h1>
              <p className="mt-2 text-gray-600">管理和查看您的交易复盘数据</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSmartBuilder(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>智能新建</span>
              </button>
            </div>
          </div>
        </div>

        {/* 加载状态 */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
              <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse animation-delay-200"></div>
              <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse animation-delay-400"></div>
              <span className="ml-2 text-gray-600">加载中...</span>
            </div>
          </div>
        )}

        {/* 错误状态 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">加载错误</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
                <div className="mt-3">
                  <button
                    onClick={loadTables}
                    className="text-sm bg-red-100 text-red-800 px-3 py-1 rounded-md hover:bg-red-200"
                  >
                    重试
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 表格列表 */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tables.map(table => (
              <Link
                key={table.id}
                to={`/review/${table.id}`}
                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 border border-gray-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{table.icon || '📊'}</span>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {table.name}
                      </h3>
                      {table.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {table.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDeleteTable(e, table.id, table.name)}
                    className="ml-3 shrink-0 px-2 py-1 text-sm text-red-600 hover:text-white hover:bg-red-600 border border-red-200 rounded"
                    title="删除"
                  >
                    删除
                  </button>
                </div>
                
                <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center space-x-4">
                    <span>{table.records?.length || 0} 条记录</span>
                    <span>{table.fields?.length || 0} 个指标</span>
                  </div>
                  <span>{table.updatedAt ? new Date(table.updatedAt).toLocaleDateString() : '未知'}</span>
                </div>
              </Link>
            ))}

            {/* 空状态 */}
            {tables.length === 0 && (
              <div className="col-span-full">
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">暂无表格</h3>
                  <p className="mt-1 text-sm text-gray-500">开始创建您的第一个复盘表格</p>
                  <div className="mt-6 flex items-center justify-center gap-2">
                    <button
                      onClick={() => setShowSmartBuilder(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      智能新建
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 智能构建器 */}
      {showSmartBuilder && (
        <SmartTableBuilder
          onCancel={() => setShowSmartBuilder(false)}
          onSave={handleSaveBlueprint}
        />
      )}
    </div>
  );
};

export default ReviewTableListPage; 