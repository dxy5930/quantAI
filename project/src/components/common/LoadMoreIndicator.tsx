import React from 'react';
import { Loader2, CheckCircle } from 'lucide-react';

interface LoadMoreIndicatorProps {
  /** 是否正在加载 */
  isLoading: boolean;
  /** 是否已加载完毕 */
  isEnd: boolean;
  /** 当前项目数量 */
  itemCount: number;
  /** 加载中的文本 */
  loadingText?: string;
  /** 加载完毕的文本 */
  endText?: string;
  /** 自定义样式类名 */
  className?: string;
}

export const LoadMoreIndicator: React.FC<LoadMoreIndicatorProps> = ({
  isLoading,
  isEnd,
  itemCount,
  loadingText = '加载更多中...',
  endText = '已加载全部内容',
  className = '',
}) => {
  // 如果没有任何项目，不显示指示器
  if (itemCount === 0) {
    return null;
  }

  return (
    <div className={`text-center py-8 transition-all duration-300 ${className}`}>
      {isLoading && (
        <div className="inline-flex items-center space-x-2 animate-fade-in">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          <span className="text-gray-600 dark:text-gray-400">{loadingText}</span>
        </div>
      )}
      
      {isEnd && !isLoading && (
        <div className="inline-flex items-center space-x-2 animate-fade-in">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span className="text-gray-500 dark:text-gray-500">{endText}</span>
        </div>
      )}
      
      {/* 当既不在加载也未结束时，显示空状态以保持布局稳定 */}
      {!isLoading && !isEnd && (
        <div className="h-6 opacity-0" aria-hidden="true" />
      )}
    </div>
  );
}; 