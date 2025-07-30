import React, { useEffect, useState } from 'react';
import { Settings, X, Loader2 } from 'lucide-react';
import { nodeConfigApi, NodeTypeConfig, NodeConfigField } from '../../services/api/nodeConfigApi';

interface NodeConfig {
  [key: string]: any;
}

interface NodeConfigPanelProps {
  nodeId: string;
  nodeType: string;
  nodeName: string;
  config: NodeConfig;
  onConfigChange: (nodeId: string, config: NodeConfig) => void;
  onClose: () => void;
}

const NodeConfigPanel: React.FC<NodeConfigPanelProps> = ({
  nodeId,
  nodeType,
  nodeName,
  config,
  onConfigChange,
  onClose
}) => {
  const [nodeTypeConfig, setNodeTypeConfig] = useState<NodeTypeConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 加载节点类型配置
  useEffect(() => {
    const loadNodeConfig = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await nodeConfigApi.getNodeConfigByType(nodeType);
        
        if (response.success && response.data) {
          setNodeTypeConfig(response.data);
        } else {
          setError(response.message || '获取节点配置失败');
        }
      } catch (err) {
        console.error('加载节点配置失败:', err);
        setError('加载节点配置失败');
      } finally {
        setLoading(false);
      }
    };

    if (nodeType) {
      loadNodeConfig();
    }
  }, [nodeType]);

  const handleConfigUpdate = (key: string, value: any) => {
    const newConfig = { ...config, [key]: value };
    onConfigChange(nodeId, newConfig);
  };

  const parseValue = (field: NodeConfigField, value: string): any => {
    switch (field.fieldType) {
      case 'number':
        return parseFloat(value) || 0;
      case 'boolean':
        return value === 'true';
      case 'multiselect':
        if (typeof value === 'string') {
          try {
            return JSON.parse(value);
          } catch {
            return value.split(',').map(v => v.trim()).filter(v => v);
          }
        }
        return Array.isArray(value) ? value : [];
      default:
        return value;
    }
  };

  const formatValue = (field: NodeConfigField, value: any): string => {
    switch (field.fieldType) {
      case 'multiselect':
        return Array.isArray(value) ? JSON.stringify(value) : '';
      case 'boolean':
        return value ? 'true' : 'false';
      default:
        return String(value || '');
    }
  };

  const renderConfigField = (field: NodeConfigField) => {
    const currentValue = config[field.fieldKey];
    
    switch (field.fieldType) {
      case 'boolean':
        return (
          <div key={field.fieldKey} className="mb-4">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={currentValue || false}
                onChange={(e) => handleConfigUpdate(field.fieldKey, e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {field.fieldName}
                {field.isRequired && <span className="text-red-500 ml-1">*</span>}
              </span>
            </label>
            {field.description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {field.description}
              </p>
            )}
          </div>
        );

      case 'select':
        return (
          <div key={field.fieldKey} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {field.fieldName}
              {field.isRequired && <span className="text-red-500 ml-1">*</span>}
            </label>
            <select
              value={currentValue || field.defaultValue || ''}
              onChange={(e) => handleConfigUpdate(field.fieldKey, e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              required={field.isRequired}
            >
              {!field.isRequired && (
                <option value="">请选择...</option>
              )}
              {field.options?.map((option) => (
                <option key={option.id} value={option.optionValue}>
                  {option.optionLabel}
                </option>
              ))}
            </select>
            {field.description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {field.description}
              </p>
            )}
          </div>
        );

      case 'multiselect':
        const selectedValues = Array.isArray(currentValue) ? currentValue : 
                              (currentValue ? JSON.parse(currentValue) : []);
        return (
          <div key={field.fieldKey} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {field.fieldName}
              {field.isRequired && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-2">
              {field.options?.map((option) => (
                <label key={option.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedValues.includes(option.optionValue)}
                    onChange={(e) => {
                      const newValues = e.target.checked
                        ? [...selectedValues, option.optionValue]
                        : selectedValues.filter((v: string) => v !== option.optionValue);
                      handleConfigUpdate(field.fieldKey, newValues);
                    }}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {option.optionLabel}
                  </span>
                </label>
              ))}
            </div>
            {field.description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {field.description}
              </p>
            )}
          </div>
        );

      case 'number':
        return (
          <div key={field.fieldKey} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {field.fieldName}
              {field.isRequired && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="number"
              value={currentValue || field.defaultValue || ''}
              onChange={(e) => handleConfigUpdate(field.fieldKey, parseFloat(e.target.value) || 0)}
              placeholder={field.placeholder}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              required={field.isRequired}
            />
            {field.description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {field.description}
              </p>
            )}
          </div>
        );

      case 'text':
      default:
        return (
          <div key={field.fieldKey} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {field.fieldName}
              {field.isRequired && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="text"
              value={currentValue || field.defaultValue || ''}
              onChange={(e) => handleConfigUpdate(field.fieldKey, e.target.value)}
              placeholder={field.placeholder}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              required={field.isRequired}
            />
            {field.description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {field.description}
              </p>
            )}
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            节点配置
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600 dark:text-gray-400">加载配置中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            节点配置
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col">
      {/* 头部 */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <Settings className="w-5 h-5 mr-2" />
          节点配置
        </h3>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 节点信息 */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
        <h4 className="font-medium text-gray-900 dark:text-white mb-1">{nodeName}</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {nodeTypeConfig?.description || `类型: ${nodeType}`}
        </p>
      </div>

             {/* 配置表单 */}
       <div className="flex-1 overflow-y-auto p-4">
         {nodeTypeConfig?.configFields && nodeTypeConfig.configFields.length > 0 ? (
           <div className="space-y-4">
             {nodeTypeConfig.configFields
               .sort((a, b) => a.sortOrder - b.sortOrder)
               .map(field => renderConfigField(field))}
           </div>
         ) : (
           <div className="text-center py-8">
             <p className="text-sm text-gray-500 dark:text-gray-400">
               该节点类型暂无可配置项
             </p>
           </div>
         )}
       </div>
    </div>
  );
};

export default NodeConfigPanel;