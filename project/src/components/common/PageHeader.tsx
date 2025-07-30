import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useResponsive } from '../../hooks/useResponsive';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  backText?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  onBack,
  backText = '返回',
  icon,
  actions,
  className = '',
}) => {
  const { isMobile, isTablet } = useResponsive();

  return (
    <div className={`${className}`}>
      {/* 标题区域 */}
      <div className={`${isMobile ? 'flex-col space-y-4' : 'flex items-start justify-between'} mb-4`}>
        <div className="flex items-center space-x-4">
          {onBack && (
            <>
              <button
                onClick={onBack}
                className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className={isMobile ? 'text-sm' : 'text-base'}>{backText}</span>
              </button>
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
            </>
          )}
          
          <div className="flex items-center space-x-3">
            {icon && (
              <div className="p-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600">
                {icon}
              </div>
            )}
            <div>
              <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-gray-900 dark:text-white`}>
                {title}
              </h1>
              {subtitle && (
                <p className="text-gray-600 dark:text-gray-400 mt-1">{subtitle}</p>
              )}
            </div>
          </div>
        </div>
        
        {/* 操作按钮区域 */}
        {actions && (
          <div className={`${isMobile ? 'w-full mt-4' : isTablet ? 'mt-2' : 'flex-shrink-0'}`}>
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

// 简化版页面标题组件
export const SimplePageHeader: React.FC<{
  title: string;
  onBack?: () => void;
  className?: string;
}> = ({ title, onBack, className = '' }) => {
  const { isMobile } = useResponsive();

  return (
    <div className={`flex items-center space-x-4 ${className}`}>
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className={isMobile ? 'text-sm' : 'text-base'}>返回</span>
        </button>
      )}
      <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-gray-900 dark:text-white`}>
        {title}
      </h1>
    </div>
  );
};