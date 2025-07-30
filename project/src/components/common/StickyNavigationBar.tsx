import React from 'react';
import { useScrollDetection } from '../../hooks/useScrollDetection';
import { BackButton } from './BackButton';
import { useResponsive } from '../../hooks/useResponsive';
import { useTheme } from '../../hooks/useTheme';

interface StickyNavigationBarProps {
  /** 标题文本 */
  title: string;
  /** 返回按钮配置 */
  backButton?: {
    text?: string;
    onBack?: () => void;
    shareId?: string;
    strategyId?: string;
    fallbackPath?: string;
  };
  /** 触发显示的滚动阈值，默认120px */
  threshold?: number;
  /** 样式类名 */
  className?: string;
  /** 是否显示返回按钮，默认true */
  showBackButton?: boolean;
  /** 是否启用滚动检测，默认true */
  enabled?: boolean;
}

export const StickyNavigationBar: React.FC<StickyNavigationBarProps> = ({
  title,
  backButton = {},
  threshold = 120,
  className = '',
  showBackButton = true,
  enabled = true,
}) => {
  const { isScrolled } = useScrollDetection({ 
    threshold, 
    enabled,
    debounceMs: 16, // 更快的响应速度
  });
  const { isMobile } = useResponsive();
  const { isDark } = useTheme();

  // 根据主题获取背景样式，与Header保持一致的透明度
  const getBgClasses = () => {
    return isDark 
      ? 'bg-slate-900/80 border-gray-800' 
      : 'bg-white/80 border-gray-200';
  };

  const getTextClasses = () => {
    return isDark ? 'text-white' : 'text-gray-900';
  };

  // 动态计算Header高度（假设Header高度为64px）
  const headerHeight = 64;

  if (!enabled) return null;

  return (
    <div
      className={`
        fixed left-0 right-0 z-40 backdrop-blur-md border-b transition-all duration-300 ease-out
        ${getBgClasses()}
        ${isScrolled 
          ? 'translate-y-0 opacity-100 shadow-sm' 
          : '-translate-y-full opacity-0 pointer-events-none'
        }
        ${className}
      `}
      style={{ 
        top: headerHeight,
        willChange: 'transform, opacity',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-14">
          {/* 左侧：返回按钮和标题 */}
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {showBackButton && (
              <div 
                className={`
                  transition-all duration-500 ease-out
                  ${isScrolled 
                    ? 'translate-x-0 opacity-100' 
                    : '-translate-x-8 opacity-0'
                  }
                `}
                style={{
                  transitionDelay: isScrolled ? '100ms' : '0ms'
                }}
              >
                <BackButton
                  text={backButton.text}
                  onBack={backButton.onBack}
                  shareId={backButton.shareId}
                  strategyId={backButton.strategyId}
                  fallbackPath={backButton.fallbackPath}
                  size={isMobile ? 'sm' : 'md'}
                  variant="default"
                />
              </div>
            )}
            
            {/* 分隔线 */}
            {showBackButton && (
              <div 
                className={`
                  h-4 w-px transition-all duration-500 ease-out
                  ${isDark ? 'bg-gray-600' : 'bg-gray-300'}
                  ${isScrolled 
                    ? 'translate-x-0 opacity-100' 
                    : '-translate-x-6 opacity-0'
                  }
                `}
                style={{
                  transitionDelay: isScrolled ? '200ms' : '0ms'
                }}
              />
            )}
            
            {/* 标题 */}
            <h1 
              className={`
                ${isMobile ? 'text-base' : 'text-lg'} 
                font-semibold truncate transition-all duration-500 ease-out
                ${getTextClasses()}
                ${isScrolled 
                  ? 'translate-x-0 opacity-100' 
                  : '-translate-x-12 opacity-0'
                }
              `}
              style={{
                transitionDelay: isScrolled ? '300ms' : '0ms'
              }}
            >
              {title}
            </h1>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StickyNavigationBar; 