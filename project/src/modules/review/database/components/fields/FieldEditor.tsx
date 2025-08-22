/**
 * 字段编辑器组件
 * Field Editor Component - 编辑不同类型的字段值
 */

import React, { useState, useEffect, useRef } from 'react';
import { Check, X, Calendar, Star, Upload } from 'lucide-react';
import { FieldDefinition, FieldType, FieldValue, FieldOption } from '../../types';

interface FieldEditorProps {
  field: FieldDefinition;
  value: FieldValue;
  onSave?: (value: FieldValue) => void;
  onCancel?: () => void;
  onChange?: (value: FieldValue) => void;
  autoFocus?: boolean;
  placeholder?: string;
  className?: string;
}

export const FieldEditor: React.FC<FieldEditorProps> = ({
  field,
  value,
  onSave,
  onCancel,
  onChange,
  autoFocus = false,
  placeholder,
  className = '',
}) => {
  const [editValue, setEditValue] = useState<FieldValue>(value);
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
      setIsEditing(true);
    }
  }, [autoFocus]);

  const handleSave = () => {
    onSave?.(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    onCancel?.();
    setIsEditing(false);
  };

  const handleChange = (newValue: FieldValue) => {
    setEditValue(newValue);
    onChange?.(newValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  const renderEditor = () => {
    switch (field.type) {
      case FieldType.TEXT:
        return field.config?.multiline ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={String(editValue || '')}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || `输入${field.name}...`}
            rows={3}
            maxLength={field.config?.maxLength}
            className={`w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={String(editValue || '')}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || `输入${field.name}...`}
            maxLength={field.config?.maxLength}
            className={`w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
          />
        );

      case FieldType.NUMBER:
      case FieldType.CURRENCY:
      case FieldType.PERCENT:
        return (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="number"
            value={String(editValue || '')}
            onChange={(e) => handleChange(e.target.value ? Number(e.target.value) : null)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || `输入${field.name}...`}
            min={field.config?.min}
            max={field.config?.max}
            step={field.config?.precision ? Math.pow(10, -field.config.precision) : 'any'}
            className={`w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
          />
        );

      case FieldType.DATE:
        return (
          <div className="relative">
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type="date"
              value={editValue ? new Date(String(editValue)).toISOString().split('T')[0] : ''}
              onChange={(e) => handleChange(e.target.value)}
              onKeyDown={handleKeyDown}
              className={`w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
            />
            <Calendar className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        );

      case FieldType.DATETIME:
        return (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="datetime-local"
            value={editValue ? new Date(String(editValue)).toISOString().slice(0, 16) : ''}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className={`w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
          />
        );

      case FieldType.SELECT:
        return (
          <select
            value={String(editValue || '')}
            onChange={(e) => handleChange(e.target.value)}
            className={`w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
          >
            <option value="">{placeholder || `选择${field.name}...`}</option>
            {field.config?.options?.map(option => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        );

      case FieldType.MULTI_SELECT:
        const selectedValues: string[] = Array.isArray(editValue) ? editValue as string[] : [];
        return (
          <div className={`space-y-2 ${className}`}>
            {field.config?.options?.map((option: FieldOption) => (
              <label key={option.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      handleChange([...selectedValues, option.id]);
                    } else {
                      handleChange(selectedValues.filter(v => v !== option.id));
                    }
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {option.name}
                </span>
              </label>
            ))}
          </div>
        );

      case FieldType.CHECKBOX:
        return (
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={Boolean(editValue)}
              onChange={(e) => handleChange(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {field.name}
            </span>
          </label>
        );

      case FieldType.URL:
        return (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="url"
            value={String(editValue || '')}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || 'https://...'}
            className={`w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
          />
        );

      case FieldType.EMAIL:
        return (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="email"
            value={String(editValue || '')}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || 'email@example.com'}
            className={`w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
          />
        );

      case FieldType.PHONE:
        return (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="tel"
            value={String(editValue || '')}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || '+86 138...'}
            className={`w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
          />
        );

      case FieldType.RATING:
        const rating = Number(editValue || 0);
        const maxRating = field.config?.maxRating || 5;
        const icon = field.config?.icon || '⭐';
        
        return (
          <div className={`flex items-center space-x-1 ${className}`}>
            {Array.from({ length: maxRating }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleChange(i + 1)}
                className={`text-2xl hover:scale-110 transition-transform ${
                  i < rating ? 'text-yellow-500' : 'text-gray-300'
                }`}
              >
                {icon}
              </button>
            ))}
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
              {rating}/{maxRating}
            </span>
          </div>
        );

      case FieldType.PROGRESS:
        return (
          <div className={`space-y-2 ${className}`}>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={Number(editValue || 0)}
              onChange={(e) => handleChange(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>0%</span>
              <span className="font-medium">{Number(editValue || 0)}%</span>
              <span>100%</span>
            </div>
          </div>
        );

      case FieldType.ATTACHMENT:
        return (
          <div className={`space-y-2 ${className}`}>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                点击或拖拽文件到此处
              </p>
              <input
                type="file"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  // 这里需要处理文件上传逻辑
                  console.log('Files:', files);
                }}
                className="hidden"
              />
            </div>
          </div>
        );

      default:
        return (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={String(editValue || '')}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || `输入${field.name}...`}
            className={`w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
          />
        );
    }
  };

  if (autoFocus || isEditing) {
    return (
      <div className="w-full">
        {renderEditor()}
        {(onSave || onCancel) && (
          <div className="flex items-center justify-end space-x-1 mt-2">
            {onSave && (
              <button
                onClick={handleSave}
                className="p-1 text-green-600 hover:text-green-700 rounded"
                title="保存"
              >
                <Check className="w-4 h-4" />
              </button>
            )}
            {onCancel && (
              <button
                onClick={handleCancel}
                className="p-1 text-red-600 hover:text-red-700 rounded"
                title="取消"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      className="w-full cursor-pointer" 
      onClick={() => setIsEditing(true)}
    >
      {renderEditor()}
    </div>
  );
};

export default FieldEditor;