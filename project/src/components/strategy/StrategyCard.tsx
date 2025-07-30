import React from 'react';
import { Strategy } from '../../types';
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
  Target,
  Building2
} from 'lucide-react';
import { 
  StrategyType,
  getStrategyTypeLabel,
  getStrategyTypeColor
} from '../../constants/strategyTypes';

interface StrategyCardProps {
  strategy: Strategy;
  onSelect: (strategy: Strategy) => void;
}

const iconMap = {
  TrendingUp,
  Activity,
  BarChart3,
  LineChart,
  Grid3x3,
  Zap
};

const difficultyColors = {
  easy: 'text-green-400',
  medium: 'text-yellow-400',
  hard: 'text-red-400'
};

const difficultyLabels = {
  easy: '简单',
  medium: '中等',
  hard: '困难'
};

// 删除硬编码的映射，使用常量文件中的映射

export const StrategyCard: React.FC<StrategyCardProps> = ({ strategy, onSelect }) => {
  const IconComponent = iconMap[strategy.icon as keyof typeof iconMap];

  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:border-blue-500 transition-all duration-300 cursor-pointer group hover:shadow-xl hover:shadow-blue-500/20 hover:scale-105 animate-fade-in"
      onClick={() => onSelect(strategy)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-lg group-hover:shadow-glow transition-all duration-300">
            <IconComponent className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors">
              {strategy.name}
            </h3>
            <div className="flex items-center space-x-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">{strategy.category}</p>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStrategyTypeColor(strategy.strategyType as StrategyType)}`}>
                {getStrategyTypeLabel(strategy.strategyType as StrategyType)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Star className="w-4 h-4 text-yellow-500 fill-current" />
          <span className="text-sm text-gray-600 dark:text-gray-400">{strategy.popularity}</span>
        </div>
      </div>
      
      <p className="text-gray-700 dark:text-gray-300 text-sm mb-4 line-clamp-2">
        {strategy.description}
      </p>

      {/* 选股策略推荐股票预览 */}
      {strategy.strategyType === StrategyType.STOCK_SELECTION && strategy.stockRecommendations && strategy.stockRecommendations.length > 0 && (
        <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Target className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-800 dark:text-purple-200">
              推荐股票 ({strategy.stockRecommendations.length}只)
            </span>
          </div>
          <div className="flex flex-wrap gap-1">
            {strategy.stockRecommendations.slice(0, 3).map((stock, index) => (
              <div
                key={stock.symbol}
                className="flex items-center space-x-1 bg-white dark:bg-gray-800 px-2 py-1 rounded text-xs"
              >
                <Building2 className="w-3 h-3 text-gray-500" />
                <span className="font-medium text-gray-900 dark:text-white">
                  {stock.symbol}
                </span>
                <span className="text-green-600 dark:text-green-400">
                  {stock.score}分
                </span>
              </div>
            ))}
            {strategy.stockRecommendations.length > 3 && (
              <div className="text-xs text-purple-600 dark:text-purple-400">
                +{strategy.stockRecommendations.length - 3}只
              </div>
            )}
          </div>
        </div>
      )}

      {/* 回测结果 */}
      {strategy.strategyType === StrategyType.BACKTEST && strategy.backtestResults && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-center">
              <div className="font-bold text-green-600 dark:text-green-400">
                +{((strategy.backtestResults.annualReturn || 0) * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">年化收益</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-blue-600 dark:text-blue-400">
                {(strategy.backtestResults.sharpeRatio || 0).toFixed(2)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">夏普比率</div>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <span className={`text-sm ${difficultyColors[strategy.difficulty]}`}>
              {difficultyLabels[strategy.difficulty]}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <Users className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">{Math.floor(strategy.popularity * 10)}+</span>
          </div>
        </div>
        <div className="text-blue-600 dark:text-blue-400 text-sm group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors font-medium">
          配置策略 →
        </div>
      </div>
    </div>
  );
};