/**
 * 数据库创建模态框
 * Database Creation Modal
 */

import React from 'react';
import { X, Layout, FileText } from 'lucide-react';
import { DatabaseTemplate } from '../../types';
import { REVIEW_TEMPLATES } from '../../templates';

interface DatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (templateId?: string) => void;
}

export const DatabaseModal: React.FC<DatabaseModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  if (!isOpen) return null;

  const handleCreateFromTemplate = (templateId: string) => {
    onCreate(templateId);
  };

  const handleCreateBlank = () => {
    onCreate();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            创建新的复盘表格
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 空白表格选项 */}
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
            从头开始
          </h4>
          <div
            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 hover:border-blue-500 dark:hover:border-blue-400 cursor-pointer transition-colors"
            onClick={handleCreateBlank}
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-gray-500" />
              </div>
              <div>
                <h5 className="font-medium text-gray-900 dark:text-white">
                  空白表格
                </h5>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  从一个基础的表格开始，自定义所有字段和视图
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 模板选项 */}
        <div>
          <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
            选择模板
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {REVIEW_TEMPLATES.map((template: DatabaseTemplate) => (
              <div
                key={template.id}
                className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:border-blue-500 dark:hover:border-blue-400 cursor-pointer transition-colors"
                onClick={() => handleCreateFromTemplate(template.id)}
              >
                <div className="flex items-start space-x-3 mb-3">
                  <span className="text-2xl">{template.icon}</span>
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900 dark:text-white mb-1">
                      {template.name}
                    </h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {template.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-1 mb-2">
                      {template.tags?.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-xs rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {template.fields.length} 个字段 • {template.views.length} 个视图
                  {template.sampleData && ` • ${template.sampleData.length} 条示例数据`}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
};

export default DatabaseModal;