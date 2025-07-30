import React, { memo } from "react";
import { Strategy, SharedStrategy, MyStrategy } from "../../types";
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
  Building2,
  Globe,
  Lock,
  Eye,
  Heart,
  Bookmark,
  Calendar,
  Award,
  Play,
  Edit3,
  Share2,
  Trash2,
} from "lucide-react";
import {
  StrategyType,
  getStrategyTypeLabel,
  getStrategyTypeColor,
} from "../../constants/strategyTypes";
import {
  BaseCard,
  CardHeader,
  CardContent,
  CardFooter,
} from "../common/BaseCard";

// 图标映射
const iconMap = {
  TrendingUp,
  Activity,
  BarChart3,
  LineChart,
  Grid3x3,
  Zap,
};

// 难度配置
const difficultyConfig = {
  easy: { color: "text-green-400", label: "简单" },
  medium: { color: "text-yellow-400", label: "中等" },
  hard: { color: "text-red-400", label: "困难" },
};

// 卡片变体类型
export type CardVariant =
  | "default"
  | "compact"
  | "detailed"
  | "shared"
  | "my-strategy";

interface EnhancedStrategyCardProps {
  strategy: Strategy | SharedStrategy | MyStrategy;
  variant?: CardVariant;
  onSelect?: (strategy: Strategy | SharedStrategy | MyStrategy) => void;
  onEdit?: (strategy: MyStrategy) => void;
  onShare?: (strategy: MyStrategy) => void;
  onDelete?: (strategy: MyStrategy) => void;
  onToggleFavorite?: (strategy: SharedStrategy) => void;
  showActions?: boolean;
  className?: string;
}

export const EnhancedStrategyCard: React.FC<EnhancedStrategyCardProps> = memo(
  ({
    strategy,
    variant = "default",
    onSelect,
    onEdit,
    onShare,
    onDelete,
    onToggleFavorite,
    showActions = true,
    className = "",
  }) => {
    const IconComponent = iconMap[strategy.icon as keyof typeof iconMap];
    const difficultyInfo = difficultyConfig[strategy.difficulty];

    // 根据变体决定卡片行为
    const isClickable = !!onSelect;
    const isMyStrategy = "isShared" in strategy;
    const isSharedStrategy = "author" in strategy && "shareId" in strategy;

    // 策略类型标签
    const strategyTypeBadge = (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${getStrategyTypeColor(
          strategy.strategyType as StrategyType
        )}`}
      >
        {getStrategyTypeLabel(strategy.strategyType as StrategyType)}
      </span>
    );

    // 操作按钮
    const renderActions = () => {
      if (!showActions) return null;

      if (isMyStrategy) {
        const myStrategy = strategy as MyStrategy;
        return (
          <div className="flex items-center space-x-1">
            {myStrategy.isShared ? (
              <div title="已分享">
                <Globe className="w-4 h-4 text-green-500" />
              </div>
            ) : (
              <div title="私有">
                <Lock className="w-4 h-4 text-gray-400" />
              </div>
            )}
          </div>
        );
      }

      if (isSharedStrategy) {
        const sharedStrategy = strategy as SharedStrategy;
        return (
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {sharedStrategy.rating}
              </span>
            </div>
          </div>
        );
      }

      return (
        <div className="flex items-center space-x-2">
          <Star className="w-4 h-4 text-yellow-500 fill-current" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {strategy.popularity}
          </span>
        </div>
      );
    };

    // 业务特定内容
    const renderBusinessContent = () => {
      // 选股策略推荐股票预览
      if (
        strategy.strategyType === StrategyType.STOCK_SELECTION &&
        "stockRecommendations" in strategy &&
        strategy.stockRecommendations &&
        strategy.stockRecommendations.length > 0
      ) {
        return (
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
        );
      }

      // 回测结果
      if (
        strategy.strategyType === StrategyType.BACKTEST &&
        "backtestResults" in strategy &&
        strategy.backtestResults
      ) {
        return (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center">
                <div className="font-bold text-green-600 dark:text-green-400">
                  +
                  {((strategy.backtestResults.annualReturn || 0) * 100).toFixed(
                    1
                  )}
                  %
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  年化收益
                </div>
              </div>
              <div className="text-center">
                <div className="font-bold text-blue-600 dark:text-blue-400">
                  {(strategy.backtestResults.sharpeRatio || 0).toFixed(2)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  夏普比率
                </div>
              </div>
            </div>
          </div>
        );
      }

      return null;
    };

    // 作者信息（仅共享策略）
    const renderAuthorInfo = () => {
      if (isSharedStrategy) {
        const sharedStrategy = strategy as SharedStrategy;
        return (
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <div className="flex items-center space-x-2">
              <span>by {sharedStrategy.author.username}</span>
              {sharedStrategy.sharedAt && (
                <>
                  <Calendar className="w-3 h-3" />
                  <span>
                    {new Date(sharedStrategy.sharedAt).toLocaleDateString(
                      "zh-CN"
                    )}
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <Eye className="w-3 h-3" />
                <span>{sharedStrategy.usageCount || 0}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Heart className="w-3 h-3" />
                <span>{sharedStrategy.likes || 0}</span>
              </div>
            </div>
          </div>
        );
      }
      return null;
    };

    // 操作按钮（我的策略专用）
    const renderMyStrategyActions = () => {
      if (!isMyStrategy || variant !== "my-strategy") return null;

      const myStrategy = strategy as MyStrategy;

      return (
        <div className="flex items-center space-x-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.(myStrategy);
            }}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center justify-center space-x-1"
          >
            <Edit3 className="w-4 h-4" />
            <span>编辑</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onShare?.(myStrategy);
            }}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title={myStrategy.isShared ? "复制分享链接" : "开启分享"}
          >
            <Share2 className="w-4 h-4" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(myStrategy);
            }}
            className="px-3 py-2 border border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            title="删除"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      );
    };

    // 底部信息
    const renderFooterInfo = () => {
      if (variant === "my-strategy") {
        return (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className={`text-sm ${difficultyInfo.color}`}>
                  {difficultyInfo.label}
                </span>
              </div>
              {isMyStrategy && (strategy as MyStrategy).isShared && (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1">
                    <Heart className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {(strategy as MyStrategy).likes || 0}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Eye className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {(strategy as MyStrategy).usageCount || 0}
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {isMyStrategy &&
                (strategy as MyStrategy).updatedAt &&
                new Date(
                  (strategy as MyStrategy).updatedAt!
                ).toLocaleDateString("zh-CN")}
            </div>
          </div>
        );
      }

      return (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <span className={`text-sm ${difficultyInfo.color}`}>
                {difficultyInfo.label}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <Users className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {isSharedStrategy
                  ? (strategy as SharedStrategy).usageCount || 0
                  : Math.floor(strategy.popularity * 10)}
                +
              </span>
            </div>
          </div>
          {/* <div className="text-blue-600 dark:text-blue-400 text-sm group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors font-medium">
          {isMyStrategy ? '编辑策略' : '配置策略'} →
        </div> */}
        </div>
      );
    };

    return (
      <BaseCard
        className={`group animate-fade-in ${className}`}
        onClick={() => onSelect?.(strategy)}
        hoverable={isClickable}
      >
        <CardHeader
          icon={IconComponent}
          title={strategy.name}
          subtitle={strategy.category}
          badge={strategyTypeBadge}
          actions={renderActions()}
        />

        <CardContent>
          <p className="text-gray-700 dark:text-gray-300 text-sm mb-4 line-clamp-2">
            {strategy.description}
          </p>

          {renderAuthorInfo()}
          {renderBusinessContent()}
        </CardContent>

        <CardFooter>
          {renderFooterInfo()}
          {renderMyStrategyActions()}
        </CardFooter>
      </BaseCard>
    );
  }
);
