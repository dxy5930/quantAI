import React from 'react';
import { TrendingUp, BarChart3, Target, Zap } from 'lucide-react';

interface AnimatedLogoProps {
  isAnimating?: boolean;
  size?: 'sm' | 'md' | 'lg';
  type?: 'backtest' | 'analysis' | 'selection' | 'default';
  className?: string;
}

export const AnimatedLogo: React.FC<AnimatedLogoProps> = ({
  isAnimating = false,
  size = 'md',
  type = 'default',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const getIcon = () => {
    switch (type) {
      case 'backtest':
        return BarChart3;
      case 'analysis':
        return TrendingUp;
      case 'selection':
        return Target;
      default:
        return Zap;
    }
  };

  const Icon = getIcon();

  const getGradient = () => {
    switch (type) {
      case 'backtest':
        return 'from-blue-500 to-purple-600';
      case 'analysis':
        return 'from-green-500 to-blue-600';
      case 'selection':
        return 'from-purple-500 to-pink-600';
      default:
        return 'from-blue-500 to-purple-600';
    }
  };

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* 外圈光环效果 */}
      <div 
        className={`
          absolute inset-0 rounded-full bg-gradient-to-r ${getGradient()} opacity-20
          ${isAnimating ? 'animate-ping' : ''}
        `}
        style={{
          animationDuration: isAnimating ? '2s' : undefined,
          animationIterationCount: isAnimating ? 'infinite' : undefined
        }}
      />
      
      {/* 中圈旋转效果 */}
      <div 
        className={`
          absolute inset-1 rounded-full border-2 border-dashed border-current opacity-30
          ${isAnimating ? 'animate-spin' : ''}
        `}
        style={{
          animationDuration: isAnimating ? '3s' : undefined,
          animationIterationCount: isAnimating ? 'infinite' : undefined
        }}
      />
      
      {/* 主体Logo */}
      <div 
        className={`
          relative ${sizeClasses[size]} rounded-full bg-gradient-to-r ${getGradient()} 
          flex items-center justify-center text-white shadow-lg
          ${isAnimating ? 'animate-bounce' : ''}
        `}
        style={{
          animationDuration: isAnimating ? '1s' : undefined,
          animationIterationCount: isAnimating ? 'infinite' : undefined
        }}
      >
        <Icon className={`${size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-6 h-6' : 'w-8 h-8'}`} />
      </div>
      
      {/* 底部阴影 */}
      <div 
        className={`
          absolute -bottom-1 left-1/2 transform -translate-x-1/2 
          w-8 h-2 bg-black/10 rounded-full blur-sm
          ${isAnimating ? 'animate-pulse' : ''}
        `}
        style={{
          animationDuration: isAnimating ? '1s' : undefined,
          animationIterationCount: isAnimating ? 'infinite' : undefined
        }}
      />
    </div>
  );
};

// 带文字的加载组件
interface AnimatedLogoWithTextProps extends AnimatedLogoProps {
  text?: string;
  subText?: string;
}

export const AnimatedLogoWithText: React.FC<AnimatedLogoWithTextProps> = ({
  text = '正在处理...',
  subText,
  ...logoProps
}) => {
  return (
    <div className="flex flex-col items-center space-y-4">
      <AnimatedLogo {...logoProps} />
      <div className="text-center">
        <p className="text-lg font-medium text-gray-900 dark:text-white">
          {text}
        </p>
        {subText && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {subText}
          </p>
        )}
      </div>
    </div>
  );
};