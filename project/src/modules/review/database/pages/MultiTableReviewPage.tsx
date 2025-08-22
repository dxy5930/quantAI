/**
 * 多维表格复盘页面
 * Multi-dimensional Table Review Page
 */

import React, { useState } from 'react';
import { Plus, Layout, FileText, BarChart3, TrendingUp, Bot } from 'lucide-react';
import { DatabaseTable } from '../components/DatabaseTable';
import { ReviewDatabase } from '../types';
import { REVIEW_TEMPLATES } from '../templates';

export const MultiTableReviewPage: React.FC = () => {
  const [currentDatabase, setCurrentDatabase] = useState<ReviewDatabase | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  
  // 演示数据 - 模拟已有的数据库
  const [databases] = useState([
    {
      id: 'demo_1',
      name: '2024年股票交易复盘',
      description: '记录2024年所有股票交易的详细复盘',
      icon: '📈',
      recordCount: 45,
      lastUpdated: '2024-01-20',
    },
    {
      id: 'demo_2', 
      name: '期货交易策略分析',
      description: '分析不同期货交易策略的效果',
      icon: '📊',
      recordCount: 28,
      lastUpdated: '2024-01-18',
    },
    {
      id: 'demo_3',
      name: '投资组合月度复盘',
      description: '每月投资组合表现的深度分析',
      icon: '💼',
      recordCount: 12,
      lastUpdated: '2024-01-15',
    },
  ]);

  const handleCreateFromTemplate = (templateId: string) => {
    // 这里会创建新的数据库
    setShowTemplates(false);
    console.log('Creating database from template:', templateId);
  };

  const handleDatabaseSelect = (database: ReviewDatabase) => {
    setCurrentDatabase(database);
  };

  // 如果有当前数据库，显示数据库界面
  if (currentDatabase) {
    return (
      <div className="h-screen bg-gray-50 dark:bg-gray-900">
        <DatabaseTable
          databaseId={currentDatabase.id}
          onDatabaseSelect={handleDatabaseSelect}
          showHeader={true}
          maxHeight={800}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 页面标题 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                多维表格复盘
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                使用多维表格管理您的交易复盘，支持多种视图和AI智能分析
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowTemplates(true)}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 flex items-center space-x-2 transition-all duration-200"
              >
                <Layout className="w-5 h-5" />
                <span>从模板创建</span>
              </button>
              
              <button
                onClick={() => console.log('创建空白表格')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>新建表格</span>
              </button>
            </div>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">总表格数</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{databases.length}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">总记录数</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {databases.reduce((sum, db) => sum + db.recordCount, 0)}
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">本月新增</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">24</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">AI分析次数</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">156</p>
              </div>
              <Bot className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* 我的表格 */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">我的复盘表格</h2>
          
          {databases.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {databases.map((database) => (
                <div
                  key={database.id}
                  className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => {
                    // 这里模拟选择数据库
                    console.log('选择数据库:', database.id);
                  }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <span className="text-3xl">{database.icon}</span>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {database.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {database.description}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                    <span>{database.recordCount} 条记录</span>
                    <span>更新于 {database.lastUpdated}</span>
                  </div>
                  
                  <div className="mt-4 flex items-center space-x-2">
                    <button className="flex-1 py-2 px-3 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
                      打开表格
                    </button>
                    <button className="py-2 px-3 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
                      更多
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-12 border border-gray-200 dark:border-gray-700 text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                还没有复盘表格
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                创建您的第一个多维表格来开始记录交易复盘
              </p>
              <button
                onClick={() => setShowTemplates(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                开始创建
              </button>
            </div>
          )}
        </div>

        {/* 模板选择模态框 */}
        {showTemplates && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  选择复盘模板
                </h3>
                <button
                  onClick={() => setShowTemplates(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {REVIEW_TEMPLATES.map((template) => (
                  <div
                    key={template.id}
                    className="border border-gray-200 dark:border-gray-600 rounded-lg p-6 hover:border-blue-500 dark:hover:border-blue-400 cursor-pointer transition-colors"
                    onClick={() => handleCreateFromTemplate(template.id)}
                  >
                    <div className="flex items-start space-x-4 mb-4">
                      <span className="text-3xl">{template.icon}</span>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                          {template.name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {template.description}
                        </p>
                        
                        <div className="flex flex-wrap gap-1">
                          {template.tags?.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-xs rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      包含 {template.fields.length} 个字段，{template.views.length} 个视图
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                <button
                  onClick={() => {
                    setShowTemplates(false);
                    console.log('创建空白表格');
                  }}
                  className="w-full py-3 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                >
                  或者创建空白表格
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MultiTableReviewPage;