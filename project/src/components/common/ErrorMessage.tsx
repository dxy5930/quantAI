import React from 'react';
import { AlertCircle, RefreshCw, X } from 'lucide-react';
import { HttpError } from '../../utils/httpClient';

interface ErrorMessageProps {
  error: Error | HttpError | string | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
  variant?: 'inline' | 'toast' | 'banner';
  showRetry?: boolean;
  showDismiss?: boolean;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  error,
  onRetry,
  onDismiss,
  className = '',
  variant = 'inline',
  showRetry = true,
  showDismiss = true,
}) => {
  if (!error) return null;

  // 解析错误信息
  const getErrorMessage = (error: Error | HttpError | string): string => {
    if (typeof error === 'string') {
      return error;
    }
    
    if (error instanceof HttpError) {
      // 根据HTTP状态码提供更友好的错误信息
      if (error.isNetworkError()) {
        return '网络连接失败，请检查网络连接后重试';
      }
      if (error.isTimeoutError()) {
        return '请求超时，请稍后重试';
      }
      if (error.isAuthError()) {
        return '登录已过期，请重新登录';
      }
      if (error.isServerError()) {
        return '服务器暂时无法响应，请稍后重试';
      }
      return error.message || '请求失败，请重试';
    }
    
    return error.message || '发生未知错误';
  };

  // 判断是否可以重试
  const canRetry = (error: Error | HttpError | string): boolean => {
    if (typeof error === 'string') return true;
    if (error instanceof HttpError) {
      return !error.isAuthError(); // 认证错误不显示重试按钮
    }
    return true;
  };

  const errorMessage = getErrorMessage(error);
  const showRetryButton = showRetry && canRetry(error) && onRetry;

  // 内联样式
  if (variant === 'inline') {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-red-800">{errorMessage}</p>
            {showRetryButton && (
              <button
                onClick={onRetry}
                className="mt-2 inline-flex items-center px-3 py-1.5 border border-red-300 text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50 transition-colors"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                重试
              </button>
            )}
          </div>
          {showDismiss && onDismiss && (
            <button
              onClick={onDismiss}
              className="ml-3 text-red-400 hover:text-red-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Toast样式
  if (variant === 'toast') {
    return (
      <div className={`fixed top-4 right-4 z-50 bg-white border border-red-200 rounded-lg shadow-lg p-4 max-w-sm ${className}`}>
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-gray-900">{errorMessage}</p>
            {showRetryButton && (
              <button
                onClick={onRetry}
                className="mt-2 inline-flex items-center px-2 py-1 text-xs font-medium text-red-600 hover:text-red-800 transition-colors"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                重试
              </button>
            )}
          </div>
          {showDismiss && onDismiss && (
            <button
              onClick={onDismiss}
              className="ml-3 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Banner样式
  if (variant === 'banner') {
    return (
      <div className={`bg-red-600 text-white ${className}`}>
        <div className="max-w-7xl mx-auto py-3 px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between flex-wrap">
            <div className="w-0 flex-1 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              <p className="text-sm font-medium">{errorMessage}</p>
            </div>
            <div className="flex items-center space-x-2">
              {showRetryButton && (
                <button
                  onClick={onRetry}
                  className="inline-flex items-center px-3 py-1 border border-white/20 text-xs font-medium rounded text-white hover:bg-white/10 transition-colors"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  重试
                </button>
              )}
              {showDismiss && onDismiss && (
                <button
                  onClick={onDismiss}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

// 简化的错误提示组件
export const SimpleError: React.FC<{ message: string; onRetry?: () => void }> = ({
  message,
  onRetry,
}) => (
  <ErrorMessage
    error={message}
    onRetry={onRetry}
    variant="inline"
    showDismiss={false}
  />
);

// 网络错误组件
export const NetworkError: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => (
  <ErrorMessage
    error="网络连接失败，请检查网络连接"
    onRetry={onRetry}
    variant="inline"
    showDismiss={false}
  />
);