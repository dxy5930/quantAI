import React from "react";
import { BacktestResult, BacktestPeriod, TradeRecord } from "../../types";
import { safeToPercent, safeToFixed } from "../../utils/formatters";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  DollarSign,
  Calendar,
  Activity,
  Target,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Percent,
} from "lucide-react";

interface DetailedBacktestResultsProps {
  results: BacktestResult;
  period?: BacktestPeriod;
  title?: string;
  className?: string;
}

const DetailedBacktestResults: React.FC<DetailedBacktestResultsProps> = ({
  results,
  period,
  title = "回测结果",
  className = "",
}) => {
  const formatPercent = (value: number) => {
    return safeToPercent(value, 2);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("zh-CN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getTradeIcon = (type: "buy" | "sell") => {
    return type === "buy" ? (
      <TrendingUp className="w-4 h-4 text-green-500" />
    ) : (
      <TrendingDown className="w-4 h-4 text-red-500" />
    );
  };

  const getTradeColor = (type: "buy" | "sell") => {
    return type === "buy"
      ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200"
      : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200";
  };

  const getProfitColor = (profit: number) => {
    if (profit > 0) return "text-green-600 dark:text-green-400";
    if (profit < 0) return "text-red-600 dark:text-red-400";
    return "text-gray-600 dark:text-gray-400";
  };

  const getProfitIcon = (profit: number) => {
    if (profit > 0) return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (profit < 0) return <XCircle className="w-4 h-4 text-red-500" />;
    return <Activity className="w-4 h-4 text-gray-500" />;
  };

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 ${className}`}
    >
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center space-x-2">
        <BarChart3 className="w-5 h-5 text-green-600" />
        <span>{title}</span>
      </h3>

      {/* 回测期间信息 */}
      {period && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            回测配置
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-blue-700 dark:text-blue-300">标的:</span>
              <span className="ml-2 font-medium text-blue-900 dark:text-blue-100">
                {period.symbol}
              </span>
            </div>
            <div>
              <span className="text-blue-700 dark:text-blue-300">
                初始资金:
              </span>
              <span className="ml-2 font-medium text-blue-900 dark:text-blue-100">
                {formatCurrency(period.initialCapital)}
              </span>
            </div>
            <div>
              <span className="text-blue-700 dark:text-blue-300">
                开始日期:
              </span>
              <span className="ml-2 font-medium text-blue-900 dark:text-blue-100">
                {formatDate(period.startDate)}
              </span>
            </div>
            <div>
              <span className="text-blue-700 dark:text-blue-300">
                结束日期:
              </span>
              <span className="ml-2 font-medium text-blue-900 dark:text-blue-100">
                {formatDate(period.endDate)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 核心指标 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-800 dark:text-green-200">
              总收益率
            </span>
          </div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {formatPercent(results.totalReturn)}
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
              年化收益
            </span>
          </div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {formatPercent(results.annualReturn)}
          </div>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Target className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-800 dark:text-purple-200">
              夏普比率
            </span>
          </div>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {safeToFixed(results.sharpeRatio, 2)}
          </div>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span className="text-sm font-medium text-red-800 dark:text-red-200">
              最大回撤
            </span>
          </div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {formatPercent(results.maxDrawdown)}
          </div>
        </div>
      </div>

      {/* 详细统计 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 dark:text-white">
            交易统计
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">
                总交易次数:
              </span>
              <span className="font-medium text-gray-900 dark:text-white">
                {results.totalTrades || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">胜率:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatPercent(results.winRate)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">
                平均收益:
              </span>
              <span className="font-medium text-gray-900 dark:text-white">
                {results.avgTradeReturn
                  ? formatPercent(results.avgTradeReturn)
                  : "-"}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 dark:text-white">
            风险指标
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">盈亏比:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {safeToFixed(results.profitFactor, 2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">
                卡玛比率:
              </span>
              <span className="font-medium text-gray-900 dark:text-white">
                {safeToFixed(results.calmarRatio, 2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 资金曲线 */}
      {results.equity && results.equity.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">
            资金曲线
          </h4>
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <div className="h-40 flex items-end space-x-1">
              {results.equity.map((point, index) => {
                const height =
                  ((point.value - (period?.initialCapital || 100000)) /
                    (period?.initialCapital || 100000)) *
                  100;
                const normalizedHeight = Math.max(5, Math.min(95, height + 50));
                return (
                  <div
                    key={index}
                    className="flex-1 bg-gradient-to-t from-green-500 to-green-300 rounded-t opacity-80 hover:opacity-100 transition-opacity"
                    style={{ height: `${normalizedHeight}%` }}
                    title={`${formatDate(point.date)}: ${formatCurrency(
                      point.value
                    )}`}
                  />
                );
              })}
            </div>
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
              <span>
                {results.equity[0] && formatDate(results.equity[0].date)}
              </span>
              <span>
                {results.equity[results.equity.length - 1] &&
                  formatDate(results.equity[results.equity.length - 1].date)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 交易记录 */}
      {results.trades && results.trades.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">
            最近交易记录
          </h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {results.trades.slice(0, 10).map((trade, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  {getTradeIcon(trade.type)}
                  <div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getTradeColor(
                          trade.type
                        )}`}
                      >
                        {trade.type === "buy" ? "买入" : "卖出"}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(trade.date)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-900 dark:text-white">
                      {trade.price.toFixed(2)} × {trade.quantity}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {trade.profit !== undefined && trade.profit !== 0 && (
                    <>
                      {getProfitIcon(trade.profit)}
                      <span
                        className={`font-medium ${getProfitColor(
                          trade.profit
                        )}`}
                      >
                        {trade.profit > 0 ? "+" : ""}
                        {trade.profit.toFixed(0)}
                      </span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
          {results.trades.length > 10 && (
            <div className="text-center mt-3">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                显示最近 10 条交易，共 {results.trades.length} 条
              </span>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
        <p className="text-xs text-yellow-800 dark:text-yellow-200">
          <strong>免责声明:</strong>{" "}
          回测结果基于历史数据，不代表未来表现，投资有风险，请谨慎决策。
        </p>
      </div>
    </div>
  );
};

export default DetailedBacktestResults;
