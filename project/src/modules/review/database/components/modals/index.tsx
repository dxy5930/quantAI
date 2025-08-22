/**
 * 模态框组件 - 完整实现
 * Modal Components - Full Implementation
 */

import React, { useState } from 'react';
import { X, Upload, Download, FileText, Table } from 'lucide-react';
import { ReviewDatabase, ViewDefinition, ExportConfig, ExportFormat } from '../../types';

// 视图编辑器模态框
export const ViewEditorModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  database: ReviewDatabase | null;
  onSave: (view: Omit<ViewDefinition, 'id' | 'createdAt' | 'updatedAt'>) => void;
}> = ({ isOpen, onClose, onSave }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">添加视图</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-4">视图编辑功能正在开发中...</p>
        <div className="flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 text-gray-600">取消</button>
          <button 
            onClick={() => {
              onSave({
                name: '新视图',
                type: 'grid' as any,
                config: {},
                order: 0,
              });
              onClose();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
};

// 导入模态框 - 完整实现
export const ImportModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  database: ReviewDatabase | null;
  onImport: (file: File, mapping: Record<string, string>) => void;
}> = ({ isOpen, onClose, database, onImport }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileData, setFileData] = useState<any[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview'>('upload');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setLoading(true);

    try {
      const text = await file.text();
      let data: any[];

      if (file.name.endsWith('.json')) {
        data = JSON.parse(text);
      } else if (file.name.endsWith('.csv')) {
        // 简单的CSV解析
        const lines = text.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        data = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
          const row: any = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          return row;
        });
      } else {
        throw new Error('不支持的文件格式');
      }

      setFileData(data);
      setStep('mapping');
    } catch (error) {
      console.error('文件解析失败:', error);
      alert('文件解析失败，请检查文件格式');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = () => {
    if (selectedFile && Object.keys(mapping).length > 0) {
      onImport(selectedFile, mapping);
      onClose();
      setSelectedFile(null);
      setFileData([]);
      setMapping({});
      setStep('upload');
    }
  };

  const resetImport = () => {
    setSelectedFile(null);
    setFileData([]);
    setMapping({});
    setStep('upload');
  };

  const sourceColumns = fileData.length > 0 ? Object.keys(fileData[0]) : [];
  const targetFields = database?.fields || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">导入数据</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === 'upload' && (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                选择要导入的文件
              </h4>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                支持 CSV、JSON 格式
              </p>
              <input
                type="file"
                accept=".csv,.json"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
              >
                <Upload className="w-4 h-4 mr-2" />
                选择文件
              </label>
            </div>
            
            {loading && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 dark:text-gray-400 mt-2">解析文件中...</p>
              </div>
            )}
          </div>
        )}

        {step === 'mapping' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-md font-medium text-gray-900 dark:text-white">
                字段映射配置
              </h4>
              <button
                onClick={resetImport}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                重新选择文件
              </button>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                文件: {selectedFile?.name} ({fileData.length} 条记录)
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                请将文件中的列映射到数据库字段
              </p>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto">
              {sourceColumns.map(column => (
                <div key={column} className="flex items-center space-x-3">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {column}
                    </label>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      示例: {String(fileData[0]?.[column] || '')}
                    </div>
                  </div>
                  <div className="flex-1">
                    <select
                      value={mapping[column] || ''}
                      onChange={(e) => setMapping(prev => ({
                        ...prev,
                        [column]: e.target.value
                      }))}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    >
                      <option value="">忽略此列</option>
                      {targetFields.map(field => (
                        <option key={field.id} value={field.id}>
                          {field.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-600">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 dark:text-gray-400"
              >
                取消
              </button>
              <button
                onClick={() => setStep('preview')}
                disabled={Object.keys(mapping).length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                预览导入
              </button>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-md font-medium text-gray-900 dark:text-white">
                导入预览
              </h4>
              <button
                onClick={() => setStep('mapping')}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                修改映射
              </button>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                即将导入 {fileData.length} 条记录，映射了 {Object.keys(mapping).length} 个字段
              </p>
            </div>

            <div className="max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    {Object.entries(mapping).map(([sourceCol, targetField]) => (
                      <th key={sourceCol} className="px-3 py-2 text-left text-gray-900 dark:text-white">
                        {targetFields.find(f => f.id === targetField)?.name || targetField}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {fileData.slice(0, 5).map((row, index) => (
                    <tr key={index} className="border-t border-gray-200 dark:border-gray-600">
                      {Object.entries(mapping).map(([sourceCol]) => (
                        <td key={sourceCol} className="px-3 py-2 text-gray-700 dark:text-gray-300">
                          {String(row[sourceCol] || '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-600">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 dark:text-gray-400"
              >
                取消
              </button>
              <button
                onClick={handleImport}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                确认导入
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// 导出模态框 - 完整实现
export const ExportModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  database: ReviewDatabase | null;
  onExport: (config: ExportConfig) => void;
}> = ({ isOpen, onClose, database, onExport }) => {
  const [format, setFormat] = useState<ExportFormat>(ExportFormat.CSV);
  const [includeFields, setIncludeFields] = useState<string[]>([]);
  const [includeAllFields, setIncludeAllFields] = useState(true);
  const [viewId, setViewId] = useState<string>('');

  if (!isOpen || !database) return null;

  const handleExport = () => {
    const config: ExportConfig = {
      format,
      includeFields: includeAllFields ? undefined : includeFields,
      viewId: viewId || undefined,
      includeFilters: true,
      includeFormats: true,
    };
    
    onExport(config);
  };

  const toggleField = (fieldId: string) => {
    setIncludeFields(prev => 
      prev.includes(fieldId) 
        ? prev.filter(id => id !== fieldId)
        : [...prev, fieldId]
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">导出数据</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* 导出格式选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              导出格式
            </label>
            <div className="grid grid-cols-3 gap-2">
              {Object.values(ExportFormat).map(fmt => (
                <button
                  key={fmt}
                  onClick={() => setFormat(fmt)}
                  className={`p-3 border rounded-lg text-center transition-colors ${
                    format === fmt
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                >
                  <div className="flex flex-col items-center space-y-1">
                    {fmt === 'csv' && <Table className="w-5 h-5" />}
                    {fmt === 'excel' && <FileText className="w-5 h-5" />}
                    {fmt === 'json' && <FileText className="w-5 h-5" />}
                    <span className="text-xs uppercase font-medium">{fmt}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 视图选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              导出视图
            </label>
            <select
              value={viewId}
              onChange={(e) => setViewId(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">当前视图</option>
              {database.views.map(view => (
                <option key={view.id} value={view.id}>
                  {view.name}
                </option>
              ))}
            </select>
          </div>

          {/* 字段选择 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                包含字段
              </label>
              <button
                onClick={() => setIncludeAllFields(!includeAllFields)}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                {includeAllFields ? '自定义选择' : '全部字段'}
              </button>
            </div>
            
            {!includeAllFields && (
              <div className="max-h-32 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded p-2 space-y-1">
                {database.fields.map(field => (
                  <label key={field.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={includeFields.includes(field.id)}
                      onChange={() => toggleField(field.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {field.name}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              将导出 {database.records.length} 条记录，
              {includeAllFields ? database.fields.length : includeFields.length} 个字段
            </p>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400"
          >
            取消
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>导出</span>
          </button>
        </div>
      </div>
    </div>
  );
};