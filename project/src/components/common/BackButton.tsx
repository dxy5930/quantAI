import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useResponsive } from '../../hooks/useResponsive';
import { smartGoBack } from '../../utils/navigationUtils';

interface BackButtonProps {
  /** 返回按钮文本，默认"返回" */
  text?: string;
  /** 自定义返回逻辑 */
  onBack?: () => void;
  /** 分享ID，用于智能返回逻辑 */
  shareId?: string;
  /** 策略ID，用于智能返回逻辑 */
  strategyId?: string;
  /** 回退路径，默认"/" */
  fallbackPath?: string;
  /** 样式类名 */
  className?: string;
  /** 按钮大小 */
  size?: 'sm' | 'md' | 'lg';
  /** 是否显示图标 */
  showIcon?: boolean;
  /** 按钮变体 */
  variant?: 'default' | 'minimal' | 'outlined';
}

export const BackButton: React.FC<BackButtonProps> = ({
  text = '返回',
  onBack,
  shareId,
  strategyId,
  fallbackPath = '/',
  className = '',
  size = 'md',
  showIcon = true,
  variant = 'default',
}) => {
  const navigate = useNavigate();
  const { isMobile } = useResponsive();

  const handleClick = () => {
    if (onBack) {
      onBack();
    } else {
      // 使用原始的智能返回逻辑
      smartGoBack(navigate, {
        shareId,
        strategyId,
        fallbackPath,
      });
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-1 text-sm';
      case 'lg':
        return 'px-4 py-3 text-lg';
      default:
        return 'px-3 py-2 text-base';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 'w-4 h-4';
      case 'lg':
        return 'w-6 h-6';
      default:
        return 'w-5 h-5';
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'minimal':
        return 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white';
      case 'outlined':
        return 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 rounded-lg';
      default:
        return 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg';
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`
        flex items-center space-x-2 transition-all duration-300
        ${getSizeClasses()}
        ${getVariantClasses()}
        ${className}
      `}
      aria-label={text}
    >
      {showIcon && <ArrowLeft className={getIconSize()} />}
      <span className={isMobile && size === 'sm' ? 'text-xs' : ''}>{text}</span>
    </button>
  );
};

export default BackButton; 