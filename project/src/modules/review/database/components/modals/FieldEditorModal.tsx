/**
 * 字段编辑器模态框
 * Field Editor Modal
 */

import React from 'react';
import { X } from 'lucide-react';
import { ReviewDatabase, FieldDefinition } from '../../types';

interface FieldEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  database: ReviewDatabase | null;
  field?: FieldDefinition;
  onSave: (field: Omit<FieldDefinition, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

export const FieldEditorModal: React.FC<FieldEditorModalProps> = ({
  isOpen,
  onClose,
  database,
  field,
  onSave,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {field ? '编辑字段' : '添加字段'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            字段编辑功能正在开发中...
          </p>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              取消
            </button>
            <button
              onClick={() => {
                // 示例字段创建
                onSave({
                  name: '新字段',
                  type: 'text' as any,
                  order: (database?.fields.length || 0) + 1,
                });
                onClose();
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FieldEditorModal;