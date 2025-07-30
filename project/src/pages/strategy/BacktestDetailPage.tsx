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
  TrendingUp,
  Target,
  Calendar,
  User,
  Award,
  BarChart3,
  Play,
  Settings,
  Lightbulb,
  BookOpen,
  CheckCircle,
  AlertCircle,
  Info,
  DollarSign,
  Percent,
  Activity,
} from "lucide-react";
import { SharedStrategy, StrategyConfig, BacktestResult } from "../../types";
import { safeToPercent, safeToFixed } from "../../utils/formatters";
import { useShare } from "../../hooks";
import {
  StrategyType,
  StrategyDifficulty,
  STRATEGY_DIFFICULTY_CONFIG,
  FORMAT_CONSTANTS,
} from "../../constants/strategyTypes";
import { StrategyConfig as StrategyConfigComponent } from "../../components/strategy/StrategyConfig";
import { backtestService } from "../../services/backtestService";
import StrategyMultiChart from "../../components/strategy/StrategyMultiChart";
import { TermTooltip } from "../../components/common/TermTooltip";
import { BackButton, StickyNavigationBar } from "../../components";

const BacktestDetailPage: React.FC = observer(() => {
  const { app, user, strategy } = useStore();
  const navigate = useNavigate();
  const { id, shareId } = useParams<{ id?: string; shareId?: string }>();
  const [isLiked, setIsLiked] = useState<any>(false);
  const [isFavorited, setIsFavorited] = useState<any>(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [showConfig, setShowConfig] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

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

  // 不再需要handleBack函数，使用BackButton组件自带的智能返回逻辑

  const handleOneClickBacktest = () => {
    // 检查是否已登录
    if (!user.isAuthenticated) {
      app.showInfo("请先登录以使用回测功能");
      // 保存当前页面URL，登录后返回
      localStorage.setItem("returnUrl", window.location.pathname);
      navigate(ROUTES.LOGIN);
      return;
    }

    // 跳转到回测配置页 - 始终使用策略的实际ID
    const strategyId = sharedStrategy?.id;
    if (!strategyId) {
      app.showError("策略信息加载失败，请刷新页面重试");
      return;
    }
    console.log('跳转到回测配置页', `/strategy/${strategyId}/backtest-config`);
    navigate(`/strategy/${strategyId}/backtest-config`);
  };

  const handleRunBacktest = async (config: StrategyConfig) => {
    strategy.setIsBacktesting(true);
    try {
      const symbols = config.symbols?.map((pos) => pos.symbol) || [];
      const apiResult = await backtestService.runBacktest({
        strategy_id: config.strategyId,
        start_date: config.startDate,
        end_date: config.endDate,
        initial_capital: config.initialCapital,
        symbols: symbols,
      });

      // 转换API结果为应用期望的格式
      const results = {
        totalReturn: apiResult.performance.total_return,
        annualReturn: apiResult.performance.annual_return,
        sharpeRatio: apiResult.performance.sharpe_ratio,
        maxDrawdown: apiResult.performance.max_drawdown,
        winRate: apiResult.performance.win_rate,
        totalTrades: apiResult.trades.length,
        backtestType: config.backtestType,
        equity: apiResult.equity_curve.map((point) => ({
          date: point.date,
          value: point.value,
        })),
        trades: apiResult.trades.map((trade) => ({
          date: trade.timestamp,
          type: trade.side,
          price: trade.price,
          quantity: trade.quantity,
          profit: trade.pnl,
        })),
      } as any;

      strategy.setBacktestResults(results);
      app.showSuccess("回测完成");
      navigate(ROUTES.BACKTEST_RESULTS);
    } catch (error) {
      console.error("回测失败:", error);
      app.showError("回测失败，请重试");
    } finally {
      strategy.setIsBacktesting(false);
    }
  };

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatPercentage = (value: number, decimals: number = 1): string => {
    return safeToPercent(value, decimals);
  };

  const formatNumber = (value: number, decimals: number = 2): string => {
    return safeToFixed(value, decimals);
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("zh-CN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
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

  if (showConfig) {
    return (
      <StrategyConfigComponent
        strategy={sharedStrategy}
        onBack={() => setShowConfig(false)}
        onRunBacktest={handleRunBacktest}
        isBacktesting={strategy.isBacktesting}
      />
    );
  }

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
          {/* 左侧：策略基本信息 */}
          <div className="flex-1">
            <div className="flex items-start space-x-4 mb-4">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-xl">
                <BarChart3 className="h-8 w-8 text-white" />
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
                  <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm">
                    回测策略
                  </span>
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm">
                    {sharedStrategy.category}
                  </span>
                  {sharedStrategy.tags.map((tag, index) => (
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

            {/* 作者信息 */}
            <div className="flex items-center space-x-4 mb-6">
              <img
                src={sharedStrategy.author.avatar}
                alt={sharedStrategy.author.username}
                className="w-12 h-12 rounded-full"
              />
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {sharedStrategy.author.username}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {formatDate(sharedStrategy.updatedAt)}
                </div>
              </div>
            </div>

            {/* 引用说明 */}
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                💡 点击"引用回测"将基于此策略创建您的专属副本，您可以自由修改配置而不影响原策略
              </p>
            </div>

            {/* 一键回测按钮 */}
            <div className="flex items-center space-x-4">
              <button
                onClick={handleOneClickBacktest}
                className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 shadow-sm hover:shadow-glow"
              >
                <Settings className="w-5 h-5" />
                <span>引用回测</span>
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
                <span className="text-sm">{sharedStrategy.likes}</span>
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
                <span className="text-sm">{sharedStrategy.favorites}</span>
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
                      {sharedStrategy.rating}
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
                      {sharedStrategy.usageCount}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">热度</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {sharedStrategy.popularity}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 回测股票 */}

      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          <Target className="inline h-5 w-5 mr-2" />
          回测股票
        </h2>

        {sharedStrategy.backtestStocks &&
        sharedStrategy.backtestStocks.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {sharedStrategy.backtestStocks?.map((stock, index) => (
                <div
                  key={stock.symbol || index}
                  className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                >
                  <div className="text-center">
                    <div className="font-semibold text-gray-900 dark:text-white text-lg mb-1">
                      {stock.symbol || `股票${index + 1}`}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {stock.name || "未知名称"}
                    </div>
                    {stock.weight && (
                      <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                        权重: {(Number(stock.weight) * 100).toFixed(1)}%
                      </div>
                    )}
                    {stock.sector && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {stock.sector}
                      </div>
                    )}
                    {stock.performance !== undefined && (
                      <div
                        className={`text-xs font-medium mt-2 ${
                          stock.performance > 0
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {Number(stock.performance || 0) > 0 ? "+" : ""}
                        {Number(stock.performance || 0).toFixed(2)}%
                      </div>
                    )}
                  </div>
                </div>
              )) || []}
            </div>

            {/* 股票集合 */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-600">
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {sharedStrategy.backtestStocks?.length || 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  股票数量
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {sharedStrategy.backtestStocks
                    ?.filter((s) => s.sector)
                    ?.map((s) => s.sector)
                    ?.filter((v, i, a) => a.indexOf(v) === i)?.length || "0"}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  涉及行业
                </div>
              </div>
              <div className="text-center">
                <div
                  className={`text-lg font-semibold ${
                    sharedStrategy.backtestStocks?.some(
                      (s) => s.performance !== undefined && s.performance > 0
                    )
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {
                    sharedStrategy.backtestStocks?.filter(
                      (s) => s.performance !== undefined && s.performance > 0
                    )?.length || 0
                  }
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  盈利股票
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {(sharedStrategy.backtestStocks
                    ? sharedStrategy.backtestStocks.reduce((sum, s) => {
                        const weight = Number(s.weight) || 0;
                        return sum + weight;
                      }, 0)
                    : 0
                  ).toFixed(1)}
                  %
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  总权重
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-6 mb-4">
              <Target className="w-12 h-12 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              暂无股票数据
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
              该回测策略暂未配置股票集合，或数据正在加载中
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

      {/* 回测结果概览 */}
      {sharedStrategy.backtestResults && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            <TrendingUp className="inline h-5 w-5 mr-2" />
            回测结果概览
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                {formatPercentage(sharedStrategy.backtestResults.totalReturn)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center justify-center space-x-1">
                <span>总收益率</span>
                <TermTooltip metric="totalReturn" />
              </div>
            </div>

            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                {formatPercentage(sharedStrategy.backtestResults.annualReturn)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center justify-center space-x-1">
                <span>年化收益</span>
                <TermTooltip metric="annualReturn" />
              </div>
            </div>

            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                {formatNumber(sharedStrategy.backtestResults.sharpeRatio)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center justify-center space-x-1">
                <span>夏普比率</span>
                <TermTooltip metric="sharpeRatio" />
              </div>
            </div>

            <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400 mb-1">
                {formatPercentage(sharedStrategy.backtestResults.maxDrawdown)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center justify-center space-x-1">
                <span>最大回撤</span>
                <TermTooltip metric="maxDrawdown" />
              </div>
            </div>

            <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mb-1">
                {formatPercentage(sharedStrategy.backtestResults.winRate)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center justify-center space-x-1">
                <span>胜率</span>
                <TermTooltip metric="winRate" />
              </div>
            </div>

            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="text-2xl font-bold text-gray-600 dark:text-gray-400 mb-1">
                {sharedStrategy.backtestResults.totalTrades}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center justify-center space-x-1">
                <span>交易次数</span>
                <TermTooltip metric="totalTrades" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">
                回测期间:
              </span>
              <span className="font-medium text-gray-900 dark:text-white">
                {sharedStrategy.backtestPeriod?.startDate} 至{" "}
                {sharedStrategy.backtestPeriod?.endDate}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">
                初始资金:
              </span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatCurrency(
                  sharedStrategy.backtestPeriod?.initialCapital || 0
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">
                最后回测
              </span>
              <span className="font-medium text-gray-900 dark:text-white">
                {sharedStrategy.lastBacktestDate
                  ? formatDate(sharedStrategy.lastBacktestDate)
                  : "未知"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 策略多维图表 */}
      <StrategyMultiChart
        strategyId={sharedStrategy.id}
        strategyType={StrategyType.BACKTEST}
        period="1y"
      />

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
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          <Lightbulb className="inline h-5 w-5 mr-2 text-yellow-500" />
          新手交易建议
        </h2>

        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-medium text-gray-900 dark:text-white mb-1">
                理解回测结果
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                历史回测结果仅供参考，不代表未来表现。重点关注夏普比率和最大回撤等风险指标
              </div>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-medium text-gray-900 dark:text-white mb-1">
                控制风险
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                建议设置合理的止损点，不要投入超过承受能力的资金。初学者建议从小额资金开始
              </div>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-medium text-gray-900 dark:text-white mb-1">
                参数调整
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                可以通过"一键回测"功能调整策略参数，测试不同设置下的表现，找到最适合的配置
              </div>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <BookOpen className="h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-medium text-gray-900 dark:text-white mb-1">
                学习技术分析
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                了解移动平均线、支撑阻力等技术指标原理，有助于更好地理解策略逻辑
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 使用说明 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          使用说明
        </h2>
        <div className="prose dark:prose-invert max-w-none">
          <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
            <li>点击"一键回测"按钮开始使用此策略</li>
            <li>系统会自动配置策略参数，您也可以根据需要调整</li>
            <li>选择回测的时间范围和初始资金</li>
            <li>点击"开始回测"查看策略在您设定条件下的表现</li>
            <li>分析回测结果，包括收益率、风险指标等</li>
            <li>根据回测结果决定是否在实盘中使用该策略</li>
          </ol>
        </div>
      </div>
    </div>
    
    {/* 粘性导航条 */}
    <StickyNavigationBar
      title={sharedStrategy?.name || '策略详情'}
      backButton={{
        shareId,
        strategyId: id,
        fallbackPath: "/strategy-square"
      }}
    />
  </>
  );
});

export default BacktestDetailPage;
