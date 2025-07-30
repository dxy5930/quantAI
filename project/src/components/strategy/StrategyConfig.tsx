import React, { useState } from "react";
import {
  Strategy,
  Parameter,
  StrategyConfig as StrategyConfigType,
  StockPosition,
} from "../../types";
import {
  ArrowLeft,
  Play,
  Share2,
  Settings,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { EnhancedStockSelector } from "../common/EnhancedStockSelector";
import { WeightAllocation } from "../common/WeightAllocation";
import { AnimatedLogoWithText } from "../common/AnimatedLogo";
import { ActionButtons } from "../common/ActionButtons";
import { StrategyType } from "../../constants/strategyTypes";
import { TermTooltip } from "../common/TermTooltip";
import { ErrorMessage, ResponsiveContainer, PageHeader } from "../common";
import { TERM_DEFINITIONS } from "../../constants/termDefinitions";
import { useErrorHandler } from "../../hooks/useErrorHandler";
import { shareStrategy } from "../../utils";
import { useResponsive } from "../../hooks/useResponsive";

interface StrategyConfigProps {
  strategy: Strategy;
  onBack: () => void;
  onRunBacktest: (config: StrategyConfigType) => void;
  isBacktesting?: boolean;
}

export const StrategyConfig: React.FC<StrategyConfigProps> = ({
  strategy,
  onBack,
  onRunBacktest,
  isBacktesting = false,
}) => {
  const [parameters, setParameters] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    strategy.parameters.forEach((param) => {
      initial[param.key] = param.default;
    });
    return initial;
  });

  const [backtestType, setBacktestType] = useState<"single" | "portfolio">(
    "single"
  );
  const [selectedStocks, setSelectedStocks] = useState<StockPosition[]>([]);
  const [config, setConfig] = useState({
    symbol: "AAPL",
    startDate: "2023-01-01",
    endDate: "2024-01-01",
    initialCapital: 100000,
    rebalanceFrequency: "monthly" as const,
  });

  // 新增状态
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // 错误处理和响应式
  const { error, isError, setError, clearError, retry } = useErrorHandler();
  // const { isMobile, isTablet } = useResponsive();

  const handleParameterChange = (key: string, value: any) => {
    setParameters((prev) => ({ ...prev, [key]: value }));
  };

  const handleRunBacktest = () => {
    const strategyConfig: StrategyConfigType = {
      strategyId: strategy.id,
      parameters,
      backtestType,
      ...config,
      ...(backtestType === "single"
        ? { symbol: config.symbol }
        : { symbols: selectedStocks }),
    };
    onRunBacktest(strategyConfig);
  };

  // 新增处理函数
  const handleSave = async () => {
    await retry(async () => {
      setIsSaving(true);
      try {
        // 模拟保存API调用
        await new Promise((resolve, reject) => {
          setTimeout(() => {
            // 模拟随机失败
            if (Math.random() > 0.7) {
              reject(new Error("网络连接失败，请重试"));
            } else {
              resolve(undefined);
            }
          }, 1500);
        });
        console.log("策略已保存");
      } finally {
        setIsSaving(false);
      }
    });
  };

  const handlePublish = async () => {
    await retry(async () => {
      setIsPublishing(true);
      try {
        // 模拟发布API调用
        await new Promise((resolve, reject) => {
          setTimeout(() => {
            // 模拟随机失败
            if (Math.random() > 0.8) {
              reject(new Error("发布服务暂时不可用，请稍后重试"));
            } else {
              resolve(undefined);
            }
          }, 2000);
        });
        console.log("策略已发布");
      } finally {
        setIsPublishing(false);
      }
    });
  };

  const handleShare = async () => {
    clearError();
    const success = await shareStrategy(strategy.id, strategy.name);
    if (!success) {
      setError("分享链接复制失败，请重试");
    }
  };

  const renderParameter = (param: Parameter) => {
    const value = parameters[param.key];

    switch (param.type) {
      case "number":
        return (
          <input
            type="number"
            value={value}
            onChange={(e) =>
              handleParameterChange(param.key, parseFloat(e.target.value))
            }
            min={param.min}
            max={param.max}
            step={param.step}
            className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
          />
        );
      case "select":
        return (
          <select
            value={value}
            onChange={(e) => handleParameterChange(param.key, e.target.value)}
            className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
          >
            {param.options?.map((option) => (
              <option
                key={option.value}
                value={option.value}
                className="bg-white dark:bg-gray-700"
              >
                {option.label}
              </option>
            ))}
          </select>
        );
      case "boolean":
        return (
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value}
              onChange={(e) =>
                handleParameterChange(param.key, e.target.checked)
              }
              className="w-5 h-5 text-blue-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
            />
            <span className="text-gray-700 dark:text-gray-300">启用</span>
          </label>
        );
      default:
        return null;
    }
  };

  return (
    <ResponsiveContainer
      className="max-w-4xl mx-auto animate-fade-in"
      mobileClassName="px-4"
      tabletClassName="px-6"
      desktopClassName="px-8"
    >
      {/* 错误提示 */}
      {isError && (
        <ErrorMessage
          error={error instanceof Error ? error : typeof error === 'string' ? error : error?.message || '未知错误'}
          onRetry={() => retry(() => Promise.resolve())}
          onDismiss={clearError}
          className="mb-6"
          variant="inline"
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center space-x-2 mb-6">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                策略参数
              </h2>
              <TermTooltip
                term="策略参数"
                explanation={TERM_DEFINITIONS["策略参数"]}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {strategy.parameters.map((param) => (
                <div key={param.key} className="space-y-2">
                  <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                    {param.label}
                    <TermTooltip metric={param.key} />
                  </label>
                  {renderParameter(param)}
                </div>
              ))}
            </div>
          </div>

          {/* 组合股票选择和权重分配 */}
          {backtestType === "portfolio" && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-center space-x-2 mb-6">
                  <div className="bg-gradient-to-r from-green-600 to-blue-600 p-2 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    股票选择
                  </h2>
                </div>
                <EnhancedStockSelector
                  selectedStocks={selectedStocks}
                  onStocksChange={setSelectedStocks}
                  disabled={isBacktesting}
                />
              </div>

              {selectedStocks.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                  <div className="flex items-center space-x-2 mb-6">
                    <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-2 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      权重分配
                    </h2>
                  </div>
                  <WeightAllocation
                    stocks={selectedStocks}
                    onWeightsChange={setSelectedStocks}
                    disabled={isBacktesting}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center space-x-2 mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                回测配置
              </h2>
              <TermTooltip
                term="回测配置"
                explanation="设置回测的基本参数，包括时间范围、资金规模等，这些参数会影响回测结果的准确性。"
              />
            </div>
            <div className="space-y-4">
              {/* 回测类型选择 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  回测类型
                </label>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setBacktestType("single")}
                    disabled={isBacktesting}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-all ${
                      backtestType === "single"
                        ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300"
                        : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                    }`}
                  >
                    <TrendingUp className="w-4 h-4" />
                    <span>单股票</span>
                  </button>
                  <button
                    onClick={() => setBacktestType("portfolio")}
                    disabled={isBacktesting}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-all ${
                      backtestType === "portfolio"
                        ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300"
                        : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                    }`}
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>组合</span>
                  </button>
                </div>
              </div>

              {/* 单股票选择 */}
              {backtestType === "single" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    交易标的
                  </label>
                  <select
                    value={config.symbol}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, symbol: e.target.value }))
                    }
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                    disabled={isBacktesting}
                  >
                    <option value="AAPL" className="bg-white dark:bg-gray-700">
                      苹果 (AAPL)
                    </option>
                    <option value="TSLA" className="bg-white dark:bg-gray-700">
                      特斯拉 (TSLA)
                    </option>
                    <option value="MSFT" className="bg-white dark:bg-gray-700">
                      微软 (MSFT)
                    </option>
                    <option value="NVDA" className="bg-white dark:bg-gray-700">
                      英伟达 (NVDA)
                    </option>
                    <option value="AMZN" className="bg-white dark:bg-gray-700">
                      亚马逊 (AMZN)
                    </option>
                  </select>
                </div>
              )}

              {/* 组合回测配置 */}
              {backtestType === "portfolio" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    再平衡频率
                  </label>
                  <select
                    value={config.rebalanceFrequency}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        rebalanceFrequency: e.target.value as any,
                      }))
                    }
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                    disabled={isBacktesting}
                  >
                    <option value="daily">每日</option>
                    <option value="weekly">每周</option>
                    <option value="monthly">每月</option>
                    <option value="quarterly">每季度</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  开始日期
                </label>
                <input
                  type="date"
                  value={config.startDate}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      startDate: e.target.value,
                    }))
                  }
                  className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                  disabled={isBacktesting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  结束日期
                </label>
                <input
                  type="date"
                  value={config.endDate}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, endDate: e.target.value }))
                  }
                  className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                  disabled={isBacktesting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  初始资金
                </label>
                <input
                  type="number"
                  value={config.initialCapital}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      initialCapital: parseFloat(e.target.value),
                    }))
                  }
                  className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                  disabled={isBacktesting}
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleRunBacktest}
            disabled={
              isBacktesting ||
              (backtestType === "portfolio" && selectedStocks.length === 0)
            }
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-gray-600 disabled:to-gray-600 text-white font-medium py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2"
          >
            {isBacktesting ? (
              <AnimatedLogoWithText
                isAnimating={true}
                type={StrategyType.BACKTEST}
                text="回测中..."
                size="sm"
              />
            ) : (
              <>
                <Play className="w-5 h-5" />
                <span>开始回测</span>
              </>
            )}
          </button>
        </div>
      </div>
    </ResponsiveContainer>
  );
};
