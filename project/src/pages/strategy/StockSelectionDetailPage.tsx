import React, { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useNavigate, useParams } from "react-router-dom";
import { ROUTES } from "../../constants/routes";
import { useStore, useStrategyDetail } from "../../hooks";
import {
  Heart,
  Bookmark,
  Share2,
  Eye,
  Star,
  Target,
  Filter,
  Lightbulb,
  CheckCircle,
  AlertCircle,
  Info,
  Settings,
  Award,
} from "lucide-react";
import {
  StrategyType,
  StrategyDifficulty,
  STRATEGY_DIFFICULTY_CONFIG,
  RISK_LEVEL_LABELS,
  MARKET_CAP_THRESHOLDS,
} from "../../constants/strategyTypes";
import { StockAnalysisCard, StrategyAnalysisDisplay } from "../../components/strategy";
import { useShare } from "../../hooks";
import StrategyMultiChart from "../../components/strategy/StrategyMultiChart";
import { TermTooltip, MasonryGrid, BackButton, StickyNavigationBar } from "../../components/common";

const StockSelectionDetailPage: React.FC = observer(() => {
  const { app, user, strategy } = useStore();
  const navigate = useNavigate();
  const { id, shareId } = useParams<{ id?: string; shareId?: string }>();
  const [isLiked, setIsLiked] = useState<any>(false);
  const [isFavorited, setIsFavorited] = useState<any>(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [enrichedStockRecommendations, setEnrichedStockRecommendations] =
    useState<any[]>([]);

  // 使用新的策略详情hook
  const {
    strategy: sharedStrategy,
    loading,
    error: strategyError,
    userEngagement,
  } = useStrategyDetail(id, shareId);

  // 当用户状态信息加载完成后，初始化点赞和收藏状态
  useEffect(() => {
    if (userEngagement) {
      setIsLiked(userEngagement.isLiked);
      setIsFavorited(userEngagement.isFavorited);
    } else {
      // 未登录或无状态信息时重置状态
      setIsLiked(false);
      setIsFavorited(false);
    }
  }, [userEngagement]);

  // 设置股票推荐数据
  useEffect(() => {
    if (sharedStrategy?.stockRecommendations) {
      setEnrichedStockRecommendations(sharedStrategy.stockRecommendations);
    } else {
      setEnrichedStockRecommendations([]);
    }
  }, [sharedStrategy]);

  // 不再需要handleBack函数，使用BackButton组件自带的智能返回逻辑

  const handleLike = async () => {
    if (!user.isAuthenticated) {
      app.showInfo("请先登录");
      return;
    }

    if (!sharedStrategy?.id || actionLoading) return;

    try {
      setActionLoading(true);

      const result = await strategy.likeStrategy(sharedStrategy.id);
      setIsLiked(result);

      // 立即更新本地策略数据
      if (result) {
        sharedStrategy.likes = (sharedStrategy.likes || 0) + 1;
        app.showSuccess("点赞成功");
      } else {
        sharedStrategy.likes = Math.max(0, (sharedStrategy.likes || 0) - 1);
        app.showSuccess("取消点赞");
      }
    } catch (error: any) {
      console.error("点赞操作失败:", error);
      app.showError(error.message || "操作失败，请重试");
    } finally {
      setActionLoading(false);
    }
  };

  const handleFavorite = async () => {
    if (!user.isAuthenticated) {
      app.showInfo("请先登录");
      return;
    }

    if (!sharedStrategy?.id || actionLoading) return;

    try {
      setActionLoading(true);

      const result = await strategy.addToFavorites(sharedStrategy.id);
      setIsFavorited(result);

      // 立即更新本地策略数据
      if (result) {
        sharedStrategy.favorites = (sharedStrategy.favorites || 0) + 1;
        app.showSuccess("收藏成功");
      } else {
        sharedStrategy.favorites = Math.max(
          0,
          (sharedStrategy.favorites || 0) - 1
        );
        app.showSuccess("取消收藏");
      }
    } catch (error: any) {
      console.error("收藏操作失败:", error);
      app.showError(error.message || "操作失败，请重试");
    } finally {
      setActionLoading(false);
    }
  };

  const { shareStrategy: handleShareStrategy } = useShare();

  const handleShare = async () => {
    if (!sharedStrategy?.id) return;
    await handleShareStrategy(sharedStrategy.id, sharedStrategy.name);
  };

  const handleConfigureStrategy = () => {
    if (!user.isAuthenticated) {
      app.showInfo("请先登录以配置策略");
      navigate(ROUTES.LOGIN);
      return;
    }
    navigate(`/strategy/${sharedStrategy?.id}/config`);
  };

  const handleViewStockDetails = (symbol: string) => {
    // 可以在这里添加跳转到股票详情页面的逻辑
    console.log(`查看股票详情: ${symbol}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatMarketCap = (marketCap: number): string => {
    if (!marketCap || marketCap === 0) {
      return "未知";
    }
    if (marketCap >= MARKET_CAP_THRESHOLDS.TRILLION) {
      return `$${(marketCap / MARKET_CAP_THRESHOLDS.TRILLION).toFixed(1)}T`;
    } else if (marketCap >= MARKET_CAP_THRESHOLDS.BILLION) {
      return `$${(marketCap / MARKET_CAP_THRESHOLDS.BILLION).toFixed(1)}B`;
    } else if (marketCap >= MARKET_CAP_THRESHOLDS.MILLION) {
      return `$${(marketCap / MARKET_CAP_THRESHOLDS.MILLION).toFixed(1)}M`;
    }
    return `$${marketCap.toFixed(0)}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (strategyError || !sharedStrategy) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-lg">
          {strategyError || "策略未找到"}
        </div>
        <BackButton 
          shareId={shareId}
          strategyId={id}
          fallbackPath="/strategy-square"
          className="mt-4 text-blue-400 hover:text-blue-300"
        />
      </div>
    );
  }

  const difficultyConfig =
    STRATEGY_DIFFICULTY_CONFIG[sharedStrategy.difficulty];

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        {/* 返回按钮 */}
        <BackButton 
          shareId={shareId}
          strategyId={id}
          fallbackPath="/strategy-square"
        />

      {/* 策略头部信息 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-start lg:space-x-8">
          {/* 左侧：策略基本信息*/}
          <div className="flex-1">
            <div className="flex items-start space-x-4 mb-4">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 rounded-xl">
                <Target className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {sharedStrategy.name}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-lg mb-4">
                  {sharedStrategy.description}
                </p>

                {/* 策略标签 */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${difficultyConfig.color}`}
                  >
                    <Award className="inline h-4 w-4 mr-1" />
                    {difficultyConfig.label}
                  </span>
                  <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm">
                    选股策略
                  </span>
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm">
                    {sharedStrategy.category}
                  </span>
                  {sharedStrategy.tags?.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* 作者信息*/}
            <div className="flex items-center space-x-4 mb-6">
              <img
                src={
                  sharedStrategy.author?.avatar ||
                  "https://api.dicebear.com/7.x/avataaars/svg?seed=default"
                }
                alt={sharedStrategy.author?.username || "匿名"}
                className="w-12 h-12 rounded-full"
              />
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {sharedStrategy.author?.username || "匿名"}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {sharedStrategy.updatedAt
                    ? formatDate(sharedStrategy.updatedAt)
                    : "未知时间"}
                </div>
              </div>
            </div>

            {/* 引用说明 */}
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                💡 点击"引用策略"将基于此策略创建您的专属副本，您可以自由修改配置而不影响原策略
              </p>
            </div>

            {/* 一键配置按钮*/}
            <div className="flex items-center space-x-4">
              <button
                onClick={handleConfigureStrategy}
                className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 shadow-sm hover:shadow-glow"
              >
                <Settings className="w-5 h-5" />
                <span>引用策略</span>
              </button>
            </div>
          </div>

          {/* 右侧：操作和统计 */}
          <div className="lg:w-80 mt-6 lg:mt-0">
            {/* 操作按钮 */}
            <div className="flex items-center space-x-2 mb-6">
              <button
                onClick={handleLike}
                className={`flex items-center justify-center space-x-1 px-3 py-2 rounded-lg border transition-colors ${
                  isLiked
                    ? "bg-red-50 border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400"
                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-600"
                }`}
              >
                <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
                <span className="text-sm">{sharedStrategy.likes || 0}</span>
              </button>
              <button
                onClick={handleFavorite}
                className={`flex items-center justify-center space-x-1 px-3 py-2 rounded-lg border transition-colors ${
                  isFavorited
                    ? "bg-yellow-50 border-yellow-200 text-yellow-600 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-400"
                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-600"
                }`}
              >
                <Bookmark
                  className={`h-4 w-4 ${isFavorited ? "fill-current" : ""}`}
                />
                <span className="text-sm">{sharedStrategy.favorites || 0}</span>
              </button>
              <button
                onClick={handleShare}
                className="flex items-center justify-center space-x-1 px-3 py-2 rounded-lg border bg-white border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-600 transition-colors"
              >
                <Share2 className="h-4 w-4" />
                <span className="text-sm">分享</span>
              </button>
            </div>

            {/* 策略统计 */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                策略统计
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">评分</span>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="font-medium text-gray-900 dark:text-white">
                      {sharedStrategy.rating || 0}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    使用次数
                  </span>
                  <div className="flex items-center space-x-1">
                    <Eye className="h-4 w-4 text-gray-500" />
                    <span className="font-medium text-gray-900 dark:text-white">
                      {sharedStrategy.usageCount || 0}
                    </span>
                  </div>
                </div>
                {sharedStrategy.lastScreeningDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      筛选日期
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatDate(sharedStrategy.lastScreeningDate)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    推荐股票
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {sharedStrategy.recommendedStocksCount || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 推荐股票 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          <Target className="inline h-5 w-5 mr-2" />
          推荐股票
        </h2>

        {enrichedStockRecommendations.length > 0 ||
        (sharedStrategy.stockRecommendations &&
          sharedStrategy.stockRecommendations.length > 0) ? (
          <MasonryGrid
            columns={{ sm: 1, md: 2, lg: 3, xl: 4 }}
            gap={16}
            className="w-full"
          >
            {(enrichedStockRecommendations.length > 0
              ? enrichedStockRecommendations
              : sharedStrategy.stockRecommendations || []
            ).map((stock, index) => (
              <StockAnalysisCard
                key={`${stock.symbol}-${index}`}
                stock={stock}
                showDetailedAnalysis={index < 3}
                showTrendChart={index < 2}
                onViewDetails={handleViewStockDetails}
              />
            ))}
          </MasonryGrid>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-6 mb-4">
              <Target className="w-12 h-12 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              暂无推荐股票
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
              该选股策略暂未生成股票推荐，或数据正在加载中
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              刷新数据
            </button>
          </div>
        )}
      </div>

      {/* 策略多维图表 */}
      <StrategyMultiChart
        strategyId={sharedStrategy.id}
        strategyType={StrategyType.STOCK_SELECTION}
        period="1y"
      />

      {/* 策略分析 - 原始语句和关键词 */}
      <StrategyAnalysisDisplay
        originalQuery={sharedStrategy.selectionCriteria?.originalQuery}
        keywords={sharedStrategy.selectionCriteria?.keywords}
      />

      {/* 筛选条件*/}
      {sharedStrategy.selectionCriteria && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            <Filter className="inline h-5 w-5 mr-2" />
            筛选条件
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sharedStrategy.selectionCriteria.minMarketCap && (
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  最小市值
                </div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {formatMarketCap(
                    sharedStrategy.selectionCriteria.minMarketCap
                  )}
                </div>
              </div>
            )}

            {sharedStrategy.selectionCriteria.sectors && (
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  目标行业
                </div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {sharedStrategy.selectionCriteria.sectors.join(", ")}
                </div>
              </div>
            )}

            {sharedStrategy.selectionCriteria.minScore && (
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  最低评分
                </div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {sharedStrategy.selectionCriteria.minScore} 
                </div>
              </div>
            )}

            {sharedStrategy.selectionCriteria.maxRisk && (
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  最大风险
                </div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {RISK_LEVEL_LABELS[sharedStrategy.selectionCriteria.maxRisk]}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 策略参数 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          策略参数
        </h2>
        
        {sharedStrategy.parameters && sharedStrategy.parameters.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sharedStrategy.parameters.map((param, index) => (
              <div
                key={index}
                className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <div className="flex items-center space-x-2 mb-2">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {param.label}
                  </span>
                  <TermTooltip metric={param.key} />
                </div>
                <div className="text-blue-600 dark:text-blue-400 font-mono">
                  {param.type === "boolean"
                    ? param.default
                      ? "是"
                      : "否"
                    : param.default}
                </div>
                {param.type === "number" && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    范围: {param.min} - {param.max}
                  </div>
                )}
                {param.type === "select" && param.options && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    选项: {param.options.map((opt) => opt.label).join(", ")}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-6 mb-4">
              <Settings className="w-12 h-12 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              暂无策略参数
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-md">
              该策略使用默认参数配置，无需额外设置
            </p>
          </div>
        )}
      </div>

      {/* 新手友好建议 */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
        <div className="flex items-start space-x-4">
          <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg">
            <Lightbulb className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              新手友好建议
            </h3>
            <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <div className="flex items-start space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>
                  这是一个中等难度的选股策略，适合有一定投资经验的用户
                </span>
              </div>
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                <span>建议在使用前仔细阅读策略参数和筛选条件</span>
              </div>
              <div className="flex items-start space-x-2">
                <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <span>可以根据自己的风险偏好调整参数设置</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    {/* 粘性导航条 */}
    <StickyNavigationBar
      title={sharedStrategy?.name || '选股策略'}
      backButton={{
        shareId,
        strategyId: id,
        fallbackPath: "/strategy-square"
      }}
    />
  </>
  );
});

export default StockSelectionDetailPage;
