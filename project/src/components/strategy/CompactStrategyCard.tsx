import React, { memo } from 'react';
import { Strategy, SharedStrategy, MyStrategy } from '../../types';
import { 
  TrendingUp, 
  Activity, 
  BarChart3, 
  LineChart, 
  Grid3x3, 
  Zap,
  Star,
  Users,
  Clock,
  Globe,
  Lock,
  Eye,
  Heart,
  Calendar
} from 'lucide-react';
import { 
  StrategyType,
  getStrategyTypeLabel,
  getStrategyTypeColor
} from '../../constants/strategyTypes';

// 图标映射
const iconMap = {
  TrendingUp,
  Activity,
  BarChart3,
  LineChart,
  Grid3x3,
  Zap
};

// 难度配置
const difficultyConfig = {
  easy: { color: 'text-green-400', label: '简单' },
  medium: { color: 'text-yellow-400', label: '中等' },
  hard: { color: 'text-red-400', label: '困难' }
};

interface CompactStrategyCardProps {
  strategy: Strategy | SharedStrategy | MyStrategy;
  onSelect?: (strategy: Strategy | SharedStrategy | MyStrategy) => void;
  showMetrics?: boolean;
  className?: string;
}

export const CompactStrategyCard: React.FC<CompactStrategyCardProps> = memo(({
  strategy,
  onSelect,
  showMetrics = true,
  className = '',
}) => {
  const IconComponent = iconMap[strategy.icon as keyof typeof iconMap];
  const difficultyInfo = difficultyConfig[strategy.difficulty];
  
  const isClickable = !!onSelect;
  const isMyStrategy = 'isShared' in strategy;
  const isSharedStrategy = 'author' in strategy && 'shareId' in strategy;

  const handleClick = () => {
    if (onSelect) {
      onSelect(strategy);
    }
  };

  return (
    <div 
      className={`
        flex items-center justify-between 
        p-4 
        bg-gray-50 dark:bg-gray-700/50 
        rounded-lg 
        border border-gray-200 dark:border-gray-600
        transition-all duration-300 
        ${isClickable ? 'hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer group' : ''}
        ${className}
      `}
      onClick={handleClick}
    >
      <div className="flex items-center space-x-4 flex-1">
        {/* 图标 */}
        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-r from-blue-600 to-purple-600 shadow-sm flex-shrink-0">
          <IconComponent className="w-5 h-5 text-white" />
        </div>
        
        {/* 策略信息 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <p className="text-gray-900 dark:text-white font-medium group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors truncate">
              {strategy.name}
            </p>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStrategyTypeColor(strategy.strategyType as StrategyType)} flex-shrink-0`}>
              {getStrategyTypeLabel(strategy.strategyType as StrategyType)}
            </span>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <span className="truncate">{strategy.category}</span>
            <span className="text-gray-400">•</span>
            <span className={difficultyInfo.color}>{difficultyInfo.label}</span>
            
            {/* 作者信息（仅共享策略） */}
            {isSharedStrategy && (
              <>
                <span className="text-gray-400">•</span>
                <span className="truncate">by {(strategy as SharedStrategy).author.username}</span>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* 右侧指标 */}
      {showMetrics && (
        <div className="flex items-center space-x-6 flex-shrink-0">
          {/* 回测收益率 */}
          {strategy.strategyType === StrategyType.BACKTEST && 'backtestResults' in strategy && strategy.backtestResults && (
            <div className="flex items-center space-x-1">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-green-500 font-medium text-sm">
                {((strategy.backtestResults.annualReturn || 0) * 100).toFixed(1)}%
              </span>
            </div>
          )}
          
          {/* 评分/热度 */}
          <div className="flex items-center space-x-1">
            <Star className="w-4 h-4 text-yellow-500 fill-current" />
            <span className="text-gray-600 dark:text-gray-400 text-sm">
              {isSharedStrategy ? (strategy as SharedStrategy).rating : strategy.popularity}
            </span>
          </div>
          
          {/* 使用次数 */}
          <div className="flex items-center space-x-1">
            <Users className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <span className="text-gray-600 dark:text-gray-400 text-sm">
              {isSharedStrategy ? (strategy as SharedStrategy).usageCount || 0 : Math.floor(strategy.popularity * 10)}
            </span>
          </div>
          
          {/* 状态图标 */}
          <div className="flex items-center">
            {isMyStrategy ? (
              (strategy as MyStrategy).isShared ? (
                <div title="已分享">
                  <Globe className="w-4 h-4 text-green-500" />
                </div>
              ) : (
                <div title="私有">
                  <Lock className="w-4 h-4 text-gray-400" />
                </div>
              )
            ) : (
              <Eye className="w-4 h-4 text-gray-400" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}); 