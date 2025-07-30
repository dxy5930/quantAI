import React from 'react';

interface EmptyStateProps {
  title?: string;
  description?: string;
}

interface LoadingStateProps {
  message?: string;
}

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryText?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  title = "未找到匹配的策略", 
  description = "尝试调整搜索条件或选择不同的分类" 
}) => (
  <div className="text-center py-12">
    <div className="text-gray-600 dark:text-gray-400 text-lg">{title}</div>
    <div className="text-gray-500 dark:text-gray-500 mt-2">{description}</div>
  </div>
);

export const LoadingState: React.FC<LoadingStateProps> = ({ 
  message = "加载中..." 
}) => (
  <div className="text-center py-12">
    <div className="text-gray-600 dark:text-gray-400 text-lg">{message}</div>
  </div>
);

export const ErrorState: React.FC<ErrorStateProps> = ({ 
  title = "加载失败", 
  message, 
  onRetry, 
  retryText = "重试" 
}) => (
  <div className="text-center py-12">
    <div className="text-red-600 dark:text-red-400 text-lg">{title}</div>
    {message && (
      <div className="text-gray-500 dark:text-gray-500 mt-2">{message}</div>
    )}
    {onRetry && (
      <button
        onClick={onRetry}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        {retryText}
      </button>
    )}
  </div>
); 