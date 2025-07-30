import React, { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useNavigate, useParams } from "react-router-dom";
import { ROUTES } from "../../constants/routes";
import { useStore, useStrategyDetail, useAsyncAction } from "../../hooks";
import { backtestService } from "../../services/backtestService";
import { strategyApi } from "../../services/api";
import type { BacktestResult as ApiBacktestResult } from "../../services/api";
import { safeToPercent, safeToFixed } from "../../utils/formatters";
import {
  BarChart3,
  Settings,
  Loader2,
  Calendar,
  DollarSign,
  TrendingUp,
  X,
  Play,
  Target,
  Activity,
  Percent,
  LineChart,
  PieChart as PieChartIcon,
  Info,
} from "lucide-react";
import {
  BackButton,
  DynamicStockSelector,
  WeightAllocation,
  AIAnalysisDisplay,
} from "../../components";
import { AIAnalysisLoader } from "../../components/common";
import { StrategyInteractionButtons } from "../../components/strategy";
import { EquityChart } from "../../components/charts";
import { TermTooltip } from "../../components/common/TermTooltip";
import { useShare } from "../../hooks";
import TradingRulesConfig from "../../components/TradingRulesConfig";

interface StockPosition {
  symbol: string;
  name: string;
  weight: number;
  sector?: string;
}

// 交易规则类型定义
interface TradingCondition {
  type: "price" | "technical" | "fundamental" | "time";
  operator: ">" | "<" | ">=" | "<=" | "=" | "cross_above" | "cross_below";
  value: number | string;
  indicator?: string;
  period?: number;
  description?: string;
}

interface TradingRule {
  buyConditions: TradingCondition[];
  buyAmount: number;
  buyAmountType: "fixed" | "percentage";
  sellConditions: TradingCondition[];
  sellAmount: number;
  sellAmountType: "fixed" | "percentage";
  stopLoss?: number;
  takeProfit?: number;
  maxPositionSize?: number;
  minHoldingPeriod?: number;
  maxHoldingPeriod?: number;
}

interface BacktestConfig {
  startDate: string;
  endDate: string;
  initialCapital: number;
  positions: StockPosition[];
  rebalanceFrequency: "daily" | "weekly" | "monthly" | "quarterly";
  commission: number;
  tradingRules?: TradingRule;
  slippage?: number;
  minTradeAmount?: number;
}

const BacktestConfigPage: React.FC = observer(() => {
  const { strategy, app, user } = useStore();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // 判断是否为创建新策略
  const isCreating = !id;

  // 使用新的策略详情hook（仅在编辑时使用）
  const { strategy: strategyItem, loading, error } = useStrategyDetail(id);

  // 判断是否为当前用户的策略
  const isOwnStrategy =
    strategyItem &&
    user.currentUser &&
    strategyItem.author?.id === user.currentUser.id;

  // 状态管理
  const [config, setConfig] = useState<BacktestConfig>({
    startDate: "2023-01-01",
    endDate: "2024-01-01",
    initialCapital: 100000,
    positions: [],
    rebalanceFrequency: "monthly",
    commission: 0.001,
    slippage: 0.001,
    minTradeAmount: 1000,
  });

  const [isRunning, setIsRunning] = useState(false);
  const [isApiComplete, setIsApiComplete] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [backtestResult, setBacktestResult] =
    useState<ApiBacktestResult | null>(null);
  const [pendingResults, setPendingResults] =
    useState<ApiBacktestResult | null>(null);

  // AI分析状态
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);

  // 创建策略时的状态
  const [strategyName, setStrategyName] = useState("");
  const [strategyDescription, setStrategyDescription] = useState("");
  const [isCreatingStrategy, setIsCreatingStrategy] = useState(false);

  // 用户交互状态
  const [userEngagement, setUserEngagement] = useState<{
    isLiked: boolean;
    isFavorited: boolean;
  } | null>(null);

  // 使用防抖 hook
  const shareAction = useAsyncAction();
  const publishAction = useAsyncAction();

  // 初始化股票数据和交易规则 - 从策略详情中获取
  useEffect(() => {
    if (strategyItem && !isCreating) {
      console.log("初始化策略数据:", strategyItem);

      const updates: Partial<BacktestConfig> = {};

      // 初始化股票数据
      if (strategyItem.backtestStocks) {
        const positions = strategyItem.backtestStocks.map((stock) => ({
          symbol: stock.symbol,
          name: stock.name,
          weight: (stock.weight || 0) * 100, // 转换为百分比
          sector: stock.sector,
        }));
        updates.positions = positions;
      }

      // 初始化回测参数
      if (strategyItem.backtestPeriod) {
        const period = strategyItem.backtestPeriod;
        if (period.startDate) updates.startDate = period.startDate;
        if (period.endDate) updates.endDate = period.endDate;
        if (period.initialCapital)
          updates.initialCapital = period.initialCapital;
        if (period.rebalanceFrequency)
          updates.rebalanceFrequency = period.rebalanceFrequency;
        if (period.commission) updates.commission = period.commission;
      }

      // 初始化交易规则
      if (strategyItem.defaultTradingRules) {
        console.log("✅ 加载交易规则:", strategyItem.defaultTradingRules);
        updates.tradingRules = strategyItem.defaultTradingRules;
      } else {
        console.log("❌ 策略中没有交易规则数据:", {
          hasDefaultTradingRules: !!strategyItem.defaultTradingRules,
          strategyKeys: Object.keys(strategyItem)
        });
      }

      // 批量更新配置
      if (Object.keys(updates).length > 0) {
        setConfig((prev) => ({
          ...prev,
          ...updates,
        }));
      }
    }
  }, [strategyItem, isCreating]);

  const handleBack = () => {
    navigate(-1);
  };

  // AI分析完成回调
  const handleAiAnalysisComplete = () => {
    setIsAiAnalyzing(false);
    setIsApiComplete(false);

    // 显示暂存的结果
    if (pendingResults) {
      setBacktestResult(pendingResults);
      setShowResults(true);
      app.showSuccess("回测完成");
      setPendingResults(null);
    }
  };

  const handleSaveStrategy = async () => {
    if (!strategyName.trim() || !strategyDescription.trim()) {
      app.showError("策略名称和描述不能为空");
      return;
    }

    setIsCreatingStrategy(true);
    try {
      const createData = {
        name: strategyName.trim(),
        description: strategyDescription.trim(),
        category: "回测策略",
        strategyType: "backtest" as const,
        difficulty: "medium" as const,
        parameters: [],
        isPublic: false,
        // 使用 positions 字段，这是后端期望的字段名
        positions: config.positions.map((p) => ({
          symbol: p.symbol,
          name: p.name,
          weight: p.weight / 100, // 转换为小数
          sector: p.sector,
        })),
        // 回测配置数据
        backtestPeriod: {
          startDate: config.startDate,
          endDate: config.endDate,
          initialCapital: config.initialCapital,
          rebalanceFrequency: config.rebalanceFrequency,
          commission: config.commission,
        },
        // 保存交易规则
        defaultTradingRules: config.tradingRules,
      };

      const result = await strategyApi.createStrategy(createData);
      if (result.success && result.data) {
        app.showSuccess('策略保存成功！您可以在"我的策略"中查看和管理');
        // 不跳转，留在当前页面
      } else {
        throw new Error(result.message || "保存失败");
      }
    } catch (error: any) {
      app.showError(error.message || "保存策略失败");
    } finally {
      setIsCreatingStrategy(false);
    }
  };

  const handlePublishStrategy = async () => {
    if (!strategyName.trim() || !strategyDescription.trim()) {
      app.showError("策略名称和描述不能为空");
      return;
    }

    setIsCreatingStrategy(true);
    try {
      const createData = {
        name: strategyName.trim(),
        description: strategyDescription.trim(),
        category: "回测策略",
        strategyType: "backtest" as const,
        difficulty: "medium" as const,
        parameters: [],
        isPublic: true, // 发布到广场设为公开
        // 使用 positions 字段，这是后端期望的字段名
        positions: config.positions.map((p) => ({
          symbol: p.symbol,
          name: p.name,
          weight: p.weight / 100, // 转换为小数
          sector: p.sector,
        })),
        // 回测配置数据
        backtestPeriod: {
          startDate: config.startDate,
          endDate: config.endDate,
          initialCapital: config.initialCapital,
          rebalanceFrequency: config.rebalanceFrequency,
          commission: config.commission,
        },
        // 保存交易规则
        defaultTradingRules: config.tradingRules,
      };

      const result = await strategyApi.createStrategy(createData);
      if (result.success && result.data) {
        app.showSuccess("策略发布成功！其他用户现在可以在策略广场看到您的策略");
        // 不跳转，留在当前页面
      } else {
        throw new Error(result.message || "发布失败");
      }
    } catch (error: any) {
      app.showError(error.message || "发布策略失败");
    } finally {
      setIsCreatingStrategy(false);
    }
  };

  const handleUpdateStrategy = async () => {
    if (!strategyItem) {
      app.showError("策略信息加载失败");
      return;
    }

    setIsCreatingStrategy(true);
    try {
      const updateData = {
        // 使用 positions 字段更新股票配置
        positions: config.positions.map((p) => ({
          symbol: p.symbol,
          name: p.name,
          weight: p.weight / 100, // 转换为小数
          sector: p.sector,
        })),
        // 更新回测配置数据
        backtestPeriod: {
          startDate: config.startDate,
          endDate: config.endDate,
          initialCapital: config.initialCapital,
          rebalanceFrequency: config.rebalanceFrequency,
          commission: config.commission,
        },
        // 更新交易规则
        defaultTradingRules: config.tradingRules,
      };

      const result = await strategyApi.updateStrategy(
        strategyItem.id,
        updateData
      );
      if (result.success) {
        app.showSuccess("策略配置保存成功！");
      } else {
        throw new Error(result.message || "保存失败");
      }
    } catch (error: any) {
      app.showError(error.message || "保存策略配置失败");
    } finally {
      setIsCreatingStrategy(false);
    }
  };

  const handlePublishExistingStrategy = async () => {
    if (!strategyItem) {
      app.showError("策略信息加载失败");
      return;
    }

    setIsCreatingStrategy(true);
    try {
      const result = await strategyApi.shareStrategy(strategyItem.id);
      if (result.success) {
        app.showSuccess("策略发布成功！现已在策略广场公开展示");
        // 更新本地策略状态
        if (strategyItem) {
          strategyItem.isPublic = true;
        }
      } else {
        throw new Error(result.message || "发布失败");
      }
    } catch (error: any) {
      app.showError(error.message || "发布策略失败");
    } finally {
      setIsCreatingStrategy(false);
    }
  };

  const handleRunBacktest = async () => {
    if (config.positions.length === 0) {
      app.showError("请至少选择一只股票");
      return;
    }

    const totalWeight = config.positions.reduce((sum, p) => sum + p.weight, 0);

    if (Math.abs(totalWeight - 100) > 0.01) {
      app.showError("股票权重总和必须为100%");
      return;
    }

    setIsRunning(true);
    setShowResults(false);

    // 启动AI分析动画
    setIsAiAnalyzing(true);
    setIsApiComplete(false);

    try {
      // 独立回测模式：不创建策略，使用特殊标识
      const backtestRequest = {
        strategy_id: "standalone_backtest", // 使用独立回测标识
        start_date: config.startDate,
        end_date: config.endDate,
        initial_capital: config.initialCapital,
        symbols: config.positions.map((p) => p.symbol),
        positions: config.positions.map((p) => ({
          symbol: p.symbol,
          name: p.name,
          weight: p.weight / 100,
          sector: p.sector,
        })),
        weights: config.positions.map((p) => p.weight / 100),
        rebalance_frequency: config.rebalanceFrequency,
        commission: config.commission,
        // 新增交易规则参数
        trading_rules: config.tradingRules,
        slippage: config.slippage || 0.001,
        min_trade_amount: config.minTradeAmount || 1000,
      };

      const result = await backtestService.runBacktest(backtestRequest);

      // 暂存结果，等待AI分析动画完成
      setPendingResults(result);
      setIsApiComplete(true);
    } catch (error: any) {
      app.showError(error.message || "回测失败，请重试");
      setIsAiAnalyzing(false);
      setIsApiComplete(false);
    } finally {
      setIsRunning(false);
    }
  };

  const formatPercentage = (value: number) => {
    return safeToPercent(value, 2);
  };

  const formatCurrency = (value: number) => {
    if (value == null || isNaN(value)) {
      return "0.00";
    }
    return new Intl.NumberFormat("zh-CN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const totalWeight = config.positions.reduce((sum, p) => sum + p.weight, 0);

  if (loading && !isCreating) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="text-lg text-gray-600 dark:text-gray-400">
            加载回测配置...
          </span>
        </div>
      </div>
    );
  }

  if ((error || !strategyItem) && !isCreating) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-lg">{error || "策略未找到"}</div>
        <button
          onClick={() => navigate(ROUTES.HOME)}
          className="mt-4 text-blue-400 hover:text-blue-300"
        >
          返回首页
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 页面标题 */}
      <BackButton strategyId={id} fallbackPath="/" />

      {/* 策略信息卡片 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {isCreating
                  ? "独立回测"
                  : isOwnStrategy
                  ? "编辑回测策略"
                  : "引用回测策略"}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {isCreating
                  ? "配置您的投资组合进行回测分析，系统将自动创建临时策略记录"
                  : isOwnStrategy
                  ? `编辑您的策略"${strategyItem?.name}"`
                  : `基于"${strategyItem?.name}"创建您的专属策略副本`}
              </p>
            </div>
          </div>

          {/* 独立回测提示 */}
          {isCreating && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    快速回测模式
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    您正在使用快速回测功能，可以直接进行回测分析。如果想要保存策略配置或分享给其他用户，请填写策略信息后点击"保存策略"或"发布广场"。
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 独立回测模式下的策略信息输入 */}
          {isCreating && (
            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  策略名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={strategyName}
                  onChange={(e) => setStrategyName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="请输入策略名称（保存策略时必填）"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  策略描述 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={strategyDescription}
                  onChange={(e) => setStrategyDescription(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                  rows={3}
                  placeholder="请描述您的回测策略思路和目标（保存策略时必填）"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 回测参数配置 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center space-x-2 mb-6">
          <Settings className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            回测参数
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
              开始日期
              <TermTooltip metric="startDate" className="ml-1" />
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="date"
                value={config.startDate}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, startDate: e.target.value }))
                }
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
              结束日期
              <TermTooltip metric="endDate" className="ml-1" />
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="date"
                value={config.endDate}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, endDate: e.target.value }))
                }
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
              初始资金
              <TermTooltip metric="initialCapital" className="ml-1" />
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="number"
                value={config.initialCapital}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    initialCapital: Number(e.target.value),
                  }))
                }
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                min="1000"
                step="1000"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
              再平衡频率
              <TermTooltip metric="rebalanceFrequency" className="ml-1" />
            </label>
            <select
              value={config.rebalanceFrequency}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  rebalanceFrequency: e.target.value as any,
                }))
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="daily">每日</option>
              <option value="weekly">每周</option>
              <option value="monthly">每月</option>
              <option value="quarterly">每季度</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
              手续费率
              <TermTooltip metric="commission" className="ml-1" />
            </label>
            <div className="relative">
              <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="number"
                value={config.commission * 100}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    commission: Number(e.target.value) / 100,
                  }))
                }
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                min="0"
                max="1"
                step="0.001"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 交易规则配置 */}
      <TradingRulesConfig
        tradingRules={config.tradingRules}
        onChange={(rules) =>
          setConfig((prev) => ({ ...prev, tradingRules: rules }))
        }
        className="mb-6"
      />

      {/* 股票组合配置 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              股票组合
            </h3>
          </div>
          <div className="flex items-center space-x-4">
            <span
              className={`text-sm font-medium flex items-center ${
                Math.abs(totalWeight - 100) < 0.01
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              总权重: {totalWeight.toFixed(1)}%
              <TermTooltip metric="totalWeight" className="ml-1" />
            </span>
          </div>
        </div>

        {/* 动态股票选择器 */}
        <DynamicStockSelector
          selectedStocks={config.positions}
          onStocksChange={(stocks) => {
            const updatedPositions = stocks.map((stock) => {
              const existingPosition = config.positions.find(
                (p) => p.symbol === stock.symbol
              );
              return {
                ...stock,
                weight: existingPosition ? existingPosition.weight : 0,
              };
            });
            setConfig((prev) => ({ ...prev, positions: updatedPositions }));
          }}
          maxSelections={10}
          placeholder="搜索股票代码或名称..."
        />
      </div>

      {/* 权重配置 */}
      {config.positions.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center space-x-2 mb-6">
            <Activity className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              权重配置
            </h3>
          </div>

          <WeightAllocation
            stocks={config.positions.map((p) => ({
              ...p,
              weight: p.weight / 100, // 转换为小数形式
            }))}
            onWeightsChange={(stocks) => {
              const updatedPositions = stocks.map((stock) => ({
                ...stock,
                weight: stock.weight * 100, // 转换为百分比形式
              }));
              setConfig((prev) => ({ ...prev, positions: updatedPositions }));
            }}
            disabled={isRunning}
          />
        </div>
      )}

      {/* 操作按钮 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={handleRunBacktest}
            disabled={isRunning || config.positions.length === 0}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-medium transition-all duration-300 shadow-sm hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="w-5 h-5" />
            <span>
              {isRunning
                ? isAiAnalyzing
                  ? "AI分析中..."
                  : "回测中..."
                : "开始回测"}
            </span>
          </button>

          {/* 策略操作按钮 */}
          <>
            {isCreating ? (
              <>
                <button
                  onClick={handleSaveStrategy}
                  disabled={
                    isCreatingStrategy ||
                    !strategyName.trim() ||
                    !strategyDescription.trim() ||
                    config.positions.length === 0
                  }
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all duration-300 shadow-sm hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Settings className="w-5 h-5" />
                  <span>{isCreatingStrategy ? "保存中..." : "保存策略"}</span>
                </button>

                <button
                  onClick={handlePublishStrategy}
                  disabled={
                    isCreatingStrategy ||
                    !strategyName.trim() ||
                    !strategyDescription.trim() ||
                    config.positions.length === 0
                  }
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-medium transition-all duration-300 shadow-sm hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Target className="w-5 h-5" />
                  <span>{isCreatingStrategy ? "发布中..." : "发布广场"}</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleUpdateStrategy}
                  disabled={isCreatingStrategy || config.positions.length === 0}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all duration-300 shadow-sm hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Settings className="w-5 h-5" />
                  <span>{isCreatingStrategy ? "保存中..." : "保存配置"}</span>
                </button>

                <button
                  onClick={handlePublishExistingStrategy}
                  disabled={isCreatingStrategy || config.positions.length === 0}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-medium transition-all duration-300 shadow-sm hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Target className="w-5 h-5" />
                  <span>
                    {isCreatingStrategy
                      ? "发布中..."
                      : strategyItem?.isPublic
                      ? "重新发布"
                      : "发布广场"}
                  </span>
                </button>
              </>
            )}
          </>
        </div>

        {/* 操作提示 */}
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isCreating
              ? config.positions.length > 0
                ? "💡 提示：可以直接回测查看结果，或先保存/发布策略以便后续管理和分享"
                : "💡 提示：请先选择股票并填写策略信息，然后可以保存策略或发布到广场"
              : config.positions.length > 0
              ? "💡 提示：可以直接回测查看结果，修改配置后记得保存"
              : "💡 提示：请先选择股票，然后可以进行回测或保存配置"}
          </p>
        </div>
      </div>

      {/* AI分析动画区域 */}
      {isAiAnalyzing && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <AIAnalysisLoader
            isVisible={isAiAnalyzing}
            onComplete={handleAiAnalysisComplete}
            isApiComplete={isApiComplete}
          />
        </div>
      )}

      {/* 回测结果 */}
      {showResults && backtestResult && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center space-x-2 mb-6">
            <TrendingUp className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              回测结果
            </h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                {formatPercentage(
                  backtestResult.performance?.total_return ||
                    backtestResult.total_return ||
                    0
                )}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center justify-center">
                总收益率
                <TermTooltip metric="totalReturn" className="ml-1" />
              </div>
            </div>

            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                {formatPercentage(
                  backtestResult.performance?.annual_return ||
                    backtestResult.annual_return ||
                    0
                )}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center justify-center">
                年化收益
                <TermTooltip metric="annualReturn" className="ml-1" />
              </div>
            </div>

            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                {(
                  backtestResult.performance?.sharpe_ratio ||
                  backtestResult.sharpe_ratio ||
                  0
                ).toFixed(2)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center justify-center">
                夏普比率
                <TermTooltip metric="sharpeRatio" className="ml-1" />
              </div>
            </div>

            <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400 mb-1">
                {formatPercentage(
                  Math.abs(
                    backtestResult.performance?.max_drawdown ||
                      backtestResult.max_drawdown ||
                      0
                  )
                )}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center justify-center">
                最大回撤
                <TermTooltip metric="maxDrawdown" className="ml-1" />
              </div>
            </div>

            <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mb-1">
                {formatPercentage(
                  backtestResult.performance?.win_rate ||
                    backtestResult.win_rate ||
                    0
                )}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center justify-center">
                胜率
                <TermTooltip metric="winRate" className="ml-1" />
              </div>
            </div>

            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="text-2xl font-bold text-gray-600 dark:text-gray-400 mb-1">
                {backtestResult.trades?.length || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center justify-center">
                交易次数
                <TermTooltip metric="totalTrades" className="ml-1" />
              </div>
            </div>
          </div>

          {/* 回测图表分析 */}
          {backtestResult.equity_curve &&
            backtestResult.equity_curve.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
                <div className="flex items-center space-x-2 mb-4">
                  <LineChart className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                    资金曲线
                  </h4>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <EquityChart
                    data={backtestResult.equity_curve.map((point) => ({
                      date: point.date,
                      value: point.value,
                    }))}
                    height={300}
                  />
                </div>
              </div>
            )}

          {/* 交易详情 */}
          {backtestResult.trades && backtestResult.trades.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                    交易记录
                  </h4>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  共 {backtestResult.trades.length} 笔交易
                </span>
              </div>

              <div className="max-h-60 overflow-y-auto bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 dark:bg-gray-600 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300">
                        时间
                      </th>
                      <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300">
                        股票
                      </th>
                      <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300">
                        操作
                      </th>
                      <th className="px-4 py-2 text-right text-gray-700 dark:text-gray-300">
                        价格
                      </th>
                      <th className="px-4 py-2 text-right text-gray-700 dark:text-gray-300">
                        数量
                      </th>
                      <th className="px-4 py-2 text-right text-gray-700 dark:text-gray-300">
                        盈亏
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {backtestResult.trades.slice(0, 20).map((trade, index) => (
                      <tr
                        key={index}
                        className="border-b border-gray-200 dark:border-gray-600"
                      >
                        <td className="px-4 py-2 text-gray-900 dark:text-white">
                          {new Date(trade.timestamp).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2 text-gray-900 dark:text-white">
                          {trade.symbol}
                        </td>
                        <td className="px-4 py-2">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              trade.side === "buy"
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                            }`}
                          >
                            {trade.side === "buy" ? "买入" : "卖出"}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right text-gray-900 dark:text-white">
                          ¥{trade.price.toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-right text-gray-900 dark:text-white">
                          {trade.quantity}
                        </td>
                        <td
                          className={`px-4 py-2 text-right font-medium ${
                            (trade.pnl || 0) >= 0
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {trade.pnl !== undefined
                            ? `${trade.pnl >= 0 ? "+" : ""}¥${trade.pnl.toFixed(
                                2
                              )}`
                            : "--"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {backtestResult.trades.length > 20 && (
                  <div className="text-center py-2 text-gray-500 dark:text-gray-400 text-xs">
                    仅显示前20笔交易，总计{backtestResult.trades.length}笔
                  </div>
                )}
              </div>
            </div>
          )}

          {/* AI分析显示 */}
          {backtestResult.ai_analysis && (
            <div className="mt-6">
              <AIAnalysisDisplay aiAnalysis={backtestResult.ai_analysis} />
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default BacktestConfigPage;
