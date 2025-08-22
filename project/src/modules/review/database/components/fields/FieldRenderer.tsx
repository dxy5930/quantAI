/**
 * 字段渲染器组件
 * Field Renderer Component - 渲染不同类型的字段值
 */

import React from 'react';
import { 
  Calendar, 
  Link, 
  Mail, 
  Phone, 
  Star, 
  CheckCircle, 
  XCircle,
  Paperclip,
  TrendingUp,
  TrendingDown,
  Bot
} from 'lucide-react';
import { FieldDefinition, FieldType, FieldValue, ReviewDatabase, FieldOption } from '../../types';

interface FieldRendererProps {
  field: FieldDefinition;
  value: FieldValue;
  database: ReviewDatabase;
  className?: string;
}

export const FieldRenderer: React.FC<FieldRendererProps> = ({
  field,
  value,
  database,
  className = '',
}) => {
  if (value === null || value === undefined || value === '') {
    return (
      <span className={`text-gray-400 italic ${className}`}>
        -
      </span>
    );
  }

  const renderValue = () => {
    switch (field.type) {
      case FieldType.TEXT:
        return (
          <span className={`text-gray-900 dark:text-white ${className}`}>
            {field.config?.multiline ? (
              <div className="whitespace-pre-wrap max-h-20 overflow-y-auto">
                {String(value)}
              </div>
            ) : (
              String(value)
            )}
          </span>
        );

      case FieldType.NUMBER:
        return (
          <span className={`text-gray-900 dark:text-white font-mono ${className}`}>
            {Number(value).toLocaleString(undefined, {
              minimumFractionDigits: field.config?.precision || 0,
              maximumFractionDigits: field.config?.precision || 2,
            })}
          </span>
        );

      case FieldType.CURRENCY:
        return (
          <span className={`text-gray-900 dark:text-white font-mono ${className}`}>
            {Number(value).toLocaleString(undefined, {
              style: 'currency',
              currency: field.config?.currency || 'CNY',
              minimumFractionDigits: field.config?.precision || 2,
            })}
          </span>
        );

      case FieldType.PERCENT:
        const percentValue = Number(value);
        return (
          <div className={`flex items-center space-x-1 ${className}`}>
            <span className={`font-mono ${
              percentValue > 0 ? 'text-green-600' : percentValue < 0 ? 'text-red-600' : 'text-gray-600'
            }`}>
              {percentValue.toFixed(field.config?.precision || 2)}%
            </span>
            {percentValue > 0 && <TrendingUp className="w-3 h-3 text-green-500" />}
            {percentValue < 0 && <TrendingDown className="w-3 h-3 text-red-500" />}
          </div>
        );

      case FieldType.DATE:
      case FieldType.DATETIME:
        const date = new Date(String(value));
        return (
          <div className={`flex items-center space-x-2 text-gray-700 dark:text-gray-300 ${className}`}>
            <Calendar className="w-4 h-4" />
            <span>
              {field.type === FieldType.DATETIME 
                ? date.toLocaleString()
                : date.toLocaleDateString()
              }
            </span>
          </div>
        );

      case FieldType.SELECT:
        const selectedOption = field.config?.options?.find(opt => opt.id === value);
        return selectedOption ? (
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${className}`}
            style={{
              backgroundColor: selectedOption.color ? `${selectedOption.color}20` : '#f3f4f6',
              color: selectedOption.color || '#374151',
            }}
          >
            {selectedOption.name}
          </span>
        ) : (
          <span className={`text-gray-500 ${className}`}>{String(value)}</span>
        );

      case FieldType.MULTI_SELECT:
        const selectedOptions = Array.isArray(value) 
          ? value.map(v => field.config?.options?.find(opt => opt.id === v)).filter(Boolean) as FieldOption[]
          : [];
        
        return (
          <div className={`flex flex-wrap gap-1 ${className}`}>
            {selectedOptions.map(option => (
              <span
                key={option.id}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: option.color ? `${option.color}20` : '#f3f4f6',
                  color: option.color || '#374151',
                }}
              >
                {option.name}
              </span>
            ))}
          </div>
        );

      case FieldType.CHECKBOX:
        return (
          <div className={`flex items-center ${className}`}>
            {value ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <XCircle className="w-5 h-5 text-gray-400" />
            )}
          </div>
        );

      case FieldType.URL:
        return (
          <a
            href={String(value)}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center space-x-1 text-blue-600 dark:text-blue-400 hover:underline ${className}`}
          >
            <Link className="w-4 h-4" />
            <span className="truncate max-w-48">{String(value)}</span>
          </a>
        );

      case FieldType.EMAIL:
        return (
          <a
            href={`mailto:${value}`}
            className={`flex items-center space-x-1 text-blue-600 dark:text-blue-400 hover:underline ${className}`}
          >
            <Mail className="w-4 h-4" />
            <span>{String(value)}</span>
          </a>
        );

      case FieldType.PHONE:
        return (
          <a
            href={`tel:${value}`}
            className={`flex items-center space-x-1 text-blue-600 dark:text-blue-400 hover:underline ${className}`}
          >
            <Phone className="w-4 h-4" />
            <span>{String(value)}</span>
          </a>
        );

      case FieldType.ATTACHMENT:
        const attachments = Array.isArray(value) ? value : [];
        return (
          <div className={`flex items-center space-x-2 ${className}`}>
            <Paperclip className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {attachments.length} 个文件
            </span>
          </div>
        );

      case FieldType.RATING:
        const rating = Number(value);
        const maxRating = field.config?.maxRating || 5;
        const icon = field.config?.icon || '⭐';
        
        return (
          <div className={`flex items-center space-x-1 ${className}`}>
            {Array.from({ length: maxRating }, (_, i) => (
              <span key={i} className={i < rating ? 'text-yellow-500' : 'text-gray-300'}>
                {icon}
              </span>
            ))}
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
              {rating}/{maxRating}
            </span>
          </div>
        );

      case FieldType.PROGRESS:
        const progress = Math.min(Math.max(Number(value), 0), 100);
        return (
          <div className={`flex items-center space-x-2 ${className}`}>
            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            {field.config?.showPercent && (
              <span className="text-sm text-gray-600 dark:text-gray-400 min-w-12">
                {progress}%
              </span>
            )}
          </div>
        );

      case FieldType.FORMULA:
        return (
          <span className={`text-gray-900 dark:text-white font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded ${className}`}>
            {String(value)}
          </span>
        );

      case FieldType.AI_GENERATED:
        return (
          <div className={`flex items-start space-x-2 ${className}`}>
            <Bot className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              {field.config?.multiline ? (
                <div className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 max-h-20 overflow-y-auto">
                  {String(value)}
                </div>
              ) : (
                <span className="text-gray-700 dark:text-gray-300">
                  {String(value)}
                </span>
              )}
            </div>
          </div>
        );

      case FieldType.CREATED_TIME:
      case FieldType.LAST_MODIFIED_TIME:
        const timestamp = new Date(String(value));
        return (
          <span className={`text-sm text-gray-500 dark:text-gray-400 ${className}`}>
            {timestamp.toLocaleString()}
          </span>
        );

      case FieldType.AUTO_NUMBER:
        return (
          <span className={`text-gray-600 dark:text-gray-400 font-mono ${className}`}>
            #{String(value)}
          </span>
        );

      case FieldType.CREATED_BY:
      case FieldType.LAST_MODIFIED_BY:
        return (
          <span className={`text-sm text-gray-600 dark:text-gray-400 ${className}`}>
            {String(value)}
          </span>
        );

      case FieldType.LOOKUP:
      case FieldType.ROLLUP:
        return (
          <span className={`text-gray-700 dark:text-gray-300 italic ${className}`}>
            {String(value)}
          </span>
        );

      case FieldType.BARCODE:
        return (
          <span className={`font-mono text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded ${className}`}>
            {String(value)}
          </span>
        );

      case FieldType.BUTTON:
        return (
          <button className={`px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors ${className}`}>
            {String(value) || '按钮'}
          </button>
        );

      default:
        return (
          <span className={`text-gray-900 dark:text-white ${className}`}>
            {String(value)}
          </span>
        );
    }
  };

  return (
    <div className="flex items-center min-h-8">
      {renderValue()}
    </div>
  );
};

export default FieldRenderer;