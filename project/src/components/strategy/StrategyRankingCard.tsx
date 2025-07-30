import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../constants/routes";
import {
  Share2,
  TrendingUp,
  Star,
  Eye,
  ArrowRight,
  Trophy,
  Users,
  ThumbsUp,
  Activity,
} from "lucide-react";
import { Strategy } from "../../types";
import { strategyApi } from "../../services/api/strategyApi";
import { SkeletonLoader } from "../common/SkeletonLoader";
import {
  RankingSortType,
  RANKING_CONFIG,
  RANKING_SORT_OPTIONS,
  getRankingSortLabel,
  getRankingSortIcon,
  getRankColor
} from "../../constants/strategyTypes";

interface StrategyRankingCardProps {
  className?: string;
}

const StrategyRankingCard: React.FC<StrategyRankingCardProps> = ({
  className = "",
}) => {
  const navigate = useNavigate();
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<RankingSortType>(RANKING_CONFIG.DEFAULT_SORT);

  // 加载排行榜数据
  const loadRankingData = async (sortField: RankingSortType = RANKING_CONFIG.DEFAULT_SORT) => {
    try {
      setLoading(true);
      const response = await strategyApi.getPopularStrategies({
        type: sortField as "popularity" | "likes" | "usageCount" | "rating",
        limit: RANKING_CONFIG.DEFAULT_LIMIT,
      });

      if (response.success && response.data) {
        setStrategies(response.data as unknown as Strategy[]);
      }
    } catch (error) {
      console.error("加载排行榜数据失败:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRankingData(sortBy);
  }, [sortBy]);

  const handleViewAll = () => {
    navigate(ROUTES.STRATEGY_SQUARE);
  };

  const handleStrategyClick = (strategyId: string) => {
    navigate(ROUTES.STRATEGY_DETAIL.replace(":id", strategyId));
  };

  const handleSortChange = (newSortBy: RankingSortType) => {
    setSortBy(newSortBy);
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="w-4 h-4 text-yellow-500" />;
    if (index === 1) return <Trophy className="w-4 h-4 text-gray-400" />;
    if (index === 2) return <Trophy className="w-4 h-4 text-orange-400" />;
    return (
      <div className="w-4 h-4 rounded-full bg-gray-300 dark:bg-gray-600" />
    );
  };

  const getSortIcon = (sortField: RankingSortType) => {
    const iconName = getRankingSortIcon(sortField);
    switch (iconName) {
      case "Activity":
        return <Activity className="w-4 h-4" />;
      case "ThumbsUp":
        return <ThumbsUp className="w-4 h-4" />;
      case "Users":
        return <Users className="w-4 h-4" />;
      case "Star":
        return <Star className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getSortLabel = (sortField: RankingSortType) => {
    return getRankingSortLabel(sortField);
  };

  const getMetricValue = (strategy: Strategy, metric: RankingSortType) => {
    switch (metric) {
      case RankingSortType.POPULARITY:
        return strategy.popularity || 0;
      case RankingSortType.LIKES:
        return strategy.likes || 0;
      case RankingSortType.USAGE_COUNT:
        return strategy.usageCount || 0;
      case RankingSortType.RATING:
        return strategy.rating ? Number(strategy.rating).toFixed(1) : "0.0";
      default:
        return 0;
    }
  };

  const getMetricColor = (index: number) => {
    return getRankColor(index);
  };

  if (loading) {
    return <SkeletonLoader variant="ranking" className={className} />;
  }

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm ${className}`}
    >
      {/* 头部 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-2 rounded-lg">
            <Share2 className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            策略广场
          </h2>
        </div>
        <button
          onClick={handleViewAll}
          className="flex items-center space-x-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
        >
          <span className="text-sm">查看全部</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* 排序选择 */}
      <div className="flex items-center space-x-2 mb-4">
        <span className="text-sm text-gray-600 dark:text-gray-400">排序:</span>
        <div className="flex space-x-1">
          {RANKING_SORT_OPTIONS.map(
            (sort) => (
              <button
                key={sort}
                onClick={() => handleSortChange(sort)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  sortBy === sort
                    ? "bg-blue-500 text-white shadow-md"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                <div className="flex items-center space-x-1">
                  {getSortIcon(sort)}
                  <span>{getSortLabel(sort)}</span>
                </div>
              </button>
            )
          )}
        </div>
      </div>

      {/* 策略列表 */}
      <div className="space-y-3">
        {strategies.map((strategy, index) => (
          <div
            key={strategy.id}
            onClick={() => handleStrategyClick(strategy.id)}
            className="flex items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 cursor-pointer group border border-gray-200 dark:border-gray-600"
          >
            {/* 排名图标 */}
            <div className="flex-shrink-0 mr-3">{getRankIcon(index)}</div>

            {/* 策略信息 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors truncate">
                    {strategy.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    by {strategy.author?.username || "未知作者"}
                  </p>
                </div>

                {/* 指标值 */}
                <div className="flex items-center space-x-3 ml-2">
                  <div className="flex items-center space-x-1">
                    {getSortIcon(sortBy)}
                    <span
                      className={`text-sm font-medium ${getMetricColor(index)}`}
                    >
                      {getMetricValue(strategy, sortBy)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 查看按钮 */}
            <div className="flex-shrink-0 ml-2">
              <Eye className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
            </div>
          </div>
        ))}
      </div>

      {/* 底部查看全部按钮 */}
      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
        <button
          onClick={handleViewAll}
          className="w-full flex items-center justify-center space-x-2 py-2 px-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-200 shadow-md hover:shadow-lg"
        >
          <span className="text-sm font-medium">查看更多策略</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default StrategyRankingCard;
