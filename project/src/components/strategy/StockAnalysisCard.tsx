import React, { useState } from "react";
import {
  BarChart3,
  Activity,
  Info,
  ChevronRight,
  Calendar,
  Zap,
} from "lucide-react";
import { StockRecommendation } from "../../types";
import { TermTooltip } from "../common";
import { TERM_DEFINITIONS } from "../../constants/termDefinitions";
import {
  getRecommendationConfig,
  getRiskConfig,
  getTrendConfig,
  getVolatilityConfig,
  getMomentumConfig,
} from "../../constants/stockAnalysisConfig";

interface StockAnalysisCardProps {
  stock: StockRecommendation;
  showDetailedAnalysis?: boolean;
  showTrendChart?: boolean;
  onViewDetails?: (symbol: string) => void;
  className?: string;
}

export const StockAnalysisCard: React.FC<StockAnalysisCardProps> = ({
  stock,
  showDetailedAnalysis = false,
  showTrendChart = false,
  onViewDetails,
  className = "",
}) => {
  const [showDetails, setShowDetails] = useState(false);

  // 每个卡片使用自己的内部状态
  const isExpanded = showDetails;
  const toggleExpand = () => setShowDetails(!showDetails);

  const formatMarketCap = (marketCap: number) => {
    const numValue = Number(marketCap);
    if (!numValue || numValue === 0) {
      return "未知";
    }
    if (numValue >= 1000000000000) {
      return `${(numValue / 1000000000000).toFixed(1)}万亿`;
    } else if (numValue >= 1000000000) {
      return `${(numValue / 1000000000).toFixed(0)}亿`;
    } else if (numValue >= 1000000) {
      return `${(numValue / 1000000).toFixed(0)}百万`;
    }
    return numValue.toString();
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "今日";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "今日";

    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "今日";
    if (diffDays === 1) return "昨日";
    if (diffDays <= 7) return `${diffDays}天前`;

    return date.toLocaleDateString("zh-CN", {
      month: "short",
      day: "numeric",
    });
  };

  const safeToFixed = (
    value: number | undefined | null,
    decimals: number = 2
  ): string => {
    if (value === undefined || value === null || isNaN(value)) {
      return "0";
    }
    return value.toFixed(decimals);
  };

  const parsePercentage = (percentStr: string | number): number => {
    if (typeof percentStr === "number") {
      return percentStr;
    }
    if (typeof percentStr === "string") {
      // 移除%符号并转换为数字
      const cleaned = percentStr.replace("%", "");
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-300 relative break-inside-avoid ${className}`}
    >
      {/* 股票基本信息 */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
              {stock.symbol.slice(0, 2)}
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">
                {stock.name}
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {stock.symbol} • {stock.sector}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-green-600 dark:text-green-400">
              {stock.score}分
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              推荐评分
            </div>
          </div>
        </div>

        {/* 基本信息展示 */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center space-x-2">
            {/* <DollarSign className="w-4 h-4 text-gray-500" /> */}
            <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
              目标价格
              <TermTooltip
                term="目标价格"
                explanation={TERM_DEFINITIONS["目标价格"]}
                className="relative z-10"
              />
              :
            </span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {stock.targetPrice ? `${stock.targetPrice.toFixed(2)}` : "-"}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {/* <Building2 className="w-4 h-4 text-gray-500" /> */}
            <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
              市值
              <TermTooltip
                term="市值"
                explanation={TERM_DEFINITIONS["市值"]}
                className="relative z-10"
              />
              :
            </span>
            <span className="font-medium text-gray-900 dark:text-white">
              {formatMarketCap(stock.marketCap)}
            </span>
          </div>
        </div>

        {/* 投资建议和风险评级 - 移到主要显示区域 */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center space-x-2">
            {(() => {
              const riskConfig = getRiskConfig(stock.riskLevel);
              const IconComponent = riskConfig.icon;
              return IconComponent ? <IconComponent className={riskConfig.iconClassName} /> : null;
            })()}
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskConfig(stock.riskLevel).className}`}
            >
              {getRiskConfig(stock.riskLevel).label}
            </span>
          </div>
          
          {/* 投资建议显示 - 移到主区域 */}
          {stock.recommendation?.rating && (
            <div className="flex items-center space-x-2">
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${
                  getRecommendationConfig(stock.recommendation.rating).className
                }`}
              >
                {getRecommendationConfig(stock.recommendation.rating).label}
              </span>
            </div>
          )}
        </div>

        {/* 时间信息 */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatDate(stock.updatedAt)}
            </span>
          </div>
        </div>
      </div>

      {/* 推荐理由 */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-start space-x-2">
          <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>推荐理由:</strong> {stock.reason}
          </p>
        </div>
      </div>

      {/* 技术分析 */}
      {stock.technicalAnalysis && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h5 className="font-medium text-gray-900 dark:text-white flex items-center">
              <BarChart3 className="w-4 h-4 mr-2" />
              技术分析
            </h5>
            <div className="flex items-center space-x-2">
              {(() => {
                const trendConfig = getTrendConfig(stock.technicalAnalysis.trend);
                const IconComponent = trendConfig.icon;
                return IconComponent ? <IconComponent className={trendConfig.className} /> : null;
              })()}
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {getTrendConfig(stock.technicalAnalysis.trend).label}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400 flex items-center">
                RSI
                <TermTooltip term="RSI" explanation={TERM_DEFINITIONS["RSI"]} />
                :
              </span>
              <span className="font-medium text-gray-900 dark:text-white">
                {safeToFixed(stock.technicalAnalysis.rsi, 1)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400 flex items-center">
                MA20
                <TermTooltip
                  term="MA20"
                  explanation={TERM_DEFINITIONS["MA20"]}
                />
                :
              </span>
              <span className="font-medium text-gray-900 dark:text-white">
                ${safeToFixed(stock.technicalAnalysis.movingAverages.ma20)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400 flex items-center">
                支撑位
                <TermTooltip
                  term="支撑位"
                  explanation={TERM_DEFINITIONS["支撑位"]}
                />
                :
              </span>
              <span className="font-medium text-gray-900 dark:text-white">
                ${safeToFixed(stock.technicalAnalysis.support)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400 flex items-center">
                阻力位
                <TermTooltip
                  term="阻力位"
                  explanation={TERM_DEFINITIONS["阻力位"]}
                />
                :
              </span>
              <span className="font-medium text-gray-900 dark:text-white">
                ${safeToFixed(stock.technicalAnalysis.resistance)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 趋势图表 */}
      {stock.trendData && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h5 className="font-medium text-gray-900 dark:text-white flex items-center">
              <Activity className="w-4 h-4 mr-2" />
              价格趋势 ({stock.trendData.period})
            </h5>
            <div className="flex items-center space-x-2">
              {(() => {
                const trendConfig = getTrendConfig(stock.trendData.summary.trend);
                const IconComponent = trendConfig.icon;
                return IconComponent ? <IconComponent className={trendConfig.className} /> : null;
              })()}
              <span
                className={`text-sm font-medium ${
                  parsePercentage(stock.trendData.summary.priceChangePercent) >
                  0
                    ? "text-green-600"
                    : parsePercentage(
                        stock.trendData.summary.priceChangePercent
                      ) < 0
                    ? "text-red-600"
                    : "text-gray-600"
                }`}
              >
                {stock.trendData.summary.priceChangePercent}
              </span>
            </div>
          </div>

          {/* 趋势指示器 */}
          <div className="h-16 bg-gray-50 dark:bg-gray-700 rounded-lg p-2 flex items-center justify-center">
            <div className="text-center">
              <div
                className={`text-2xl font-bold ${
                  parsePercentage(stock.trendData.summary.priceChangePercent) >
                  0
                    ? "text-green-500"
                    : "text-red-500"
                }`}
              >
                {parsePercentage(stock.trendData.summary.priceChangePercent) > 0
                  ? "↗"
                  : "↘"}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {stock.trendData.summary.trend === "upward"
                  ? "上升"
                  : stock.trendData.summary.trend === "downward"
                  ? "下降"
                  : "震荡"}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
            <div className="text-center">
              <div className="text-gray-600 dark:text-gray-400 flex items-center justify-center space-x-1">
                <span>波动性</span>
                <TermTooltip
                  term="波动性"
                  explanation={TERM_DEFINITIONS["波动性"]}
                />
              </div>
              <div className="font-medium text-gray-900 dark:text-white">
                {stock.trendData.summary.volatility === "high"
                  ? "高"
                  : stock.trendData.summary.volatility === "medium"
                  ? "中"
                  : "低"}
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-600 dark:text-gray-400 flex items-center justify-center space-x-1">
                <span>动量</span>
                <TermTooltip
                  term="动量"
                  explanation={TERM_DEFINITIONS["动量"]}
                />
              </div>
              <div className="font-medium text-gray-900 dark:text-white">
                {stock.trendData.summary.momentum === "positive"
                  ? "正向"
                  : stock.trendData.summary.momentum === "negative"
                  ? "负向"
                  : "中性"}
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-600 dark:text-gray-400 flex items-center justify-center space-x-1">
                <span>平均成交量</span>
                <TermTooltip
                  term="成交量"
                  explanation={TERM_DEFINITIONS["成交量"]}
                />
              </div>
              <div className="font-medium text-gray-900 dark:text-white">
                {(
                  Number(stock.trendData.summary.avgVolume || 0) / 1000000
                ).toFixed(1)}
                M
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={toggleExpand}
            className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors px-2 py-1 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20"
          >
            <span className="text-sm font-medium">
              {isExpanded ? "收起分析" : "查看分析"}
            </span>
            <ChevronRight
              className={`w-4 h-4 transition-transform ${
                isExpanded ? "rotate-90" : ""
              }`}
            />
          </button>
        </div>

        {/* 展开的详细信息 */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            {stock.fundamentalAnalysis ||
            stock.recommendation ||
            stock.technicalAnalysis ||
            stock.trendData ? (
              <div className="space-y-3">
                {/* 基本面分析 */}
                {stock.fundamentalAnalysis && (
                  <div>
                    <h6 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                      基本面分析
                    </h6>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400 flex items-center">
                          PE比率
                          <TermTooltip
                            term="PE比率"
                            explanation={TERM_DEFINITIONS["PE比率"]}
                          />
                          :
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {safeToFixed(stock.fundamentalAnalysis.peRatio, 1)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400 flex items-center">
                          PB比率
                          <TermTooltip
                            term="PB比率"
                            explanation={TERM_DEFINITIONS["PB比率"]}
                          />
                          :
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {safeToFixed(stock.fundamentalAnalysis.pbRatio, 1)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400 flex items-center">
                          ROE
                          <TermTooltip
                            term="ROE"
                            explanation={TERM_DEFINITIONS["ROE"]}
                          />
                          :
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {safeToFixed(stock.fundamentalAnalysis.roe, 1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400 flex items-center">
                          ROA
                          <TermTooltip
                            term="ROA"
                            explanation={TERM_DEFINITIONS["ROA"]}
                          />
                          :
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {safeToFixed(stock.fundamentalAnalysis.roa, 1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 技术分析 */}
                {stock.technicalAnalysis && (
                  <div>
                    <h6 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                      技术分析
                    </h6>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400 flex items-center">
                          RSI
                          <TermTooltip
                            term="RSI"
                            explanation={TERM_DEFINITIONS["RSI"]}
                          />
                          :
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {safeToFixed(stock.technicalAnalysis.rsi, 1)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400 flex items-center">
                          趋势
                          <TermTooltip
                            term="看涨"
                            explanation={TERM_DEFINITIONS["看涨"]}
                          />
                          :
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {stock.technicalAnalysis.trend === "bullish"
                            ? "看涨"
                            : stock.technicalAnalysis.trend === "bearish"
                            ? "看跌"
                            : "中性"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400 flex items-center">
                          支撑位
                          <TermTooltip
                            term="支撑位"
                            explanation={TERM_DEFINITIONS["支撑位"]}
                          />
                          :
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          ${safeToFixed(stock.technicalAnalysis.support, 2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400 flex items-center">
                          阻力位
                          <TermTooltip
                            term="阻力位"
                            explanation={TERM_DEFINITIONS["阻力位"]}
                          />
                          :
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          ${safeToFixed(stock.technicalAnalysis.resistance, 2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 推荐理由 */}
                {stock.recommendation &&
                  Array.isArray(stock.recommendation.reasons) && (
                    <div>
                      <h6 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                        详细分析
                      </h6>
                      <ul className="space-y-1">
                        {stock.recommendation.reasons.map((reason, index) => (
                          <li
                            key={index}
                            className="flex items-start space-x-2 text-xs"
                          >
                            <Zap className="w-3 h-3 text-blue-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700 dark:text-gray-300">
                              {reason}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                {/* 如果没有推荐理由但有基础推荐评级，显示评级 */}
                {stock.recommendation &&
                  !Array.isArray(stock.recommendation.reasons) &&
                  stock.recommendation.rating && (
                    <div>
                      <h6 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                        投资建议
                      </h6>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            getRecommendationConfig(stock.recommendation.rating).className
                          }`}
                        >
                          {getRecommendationConfig(stock.recommendation.rating).label}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          评分: {stock.recommendation.score || stock.score}
                        </span>
                      </div>
                    </div>
                  )}

                {/* 如果只有基础的reason字段，也显示出来 */}
                {stock.reason && !stock.recommendation?.reasons && (
                  <div>
                    <h6 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                      推荐理由
                    </h6>
                    <p className="text-xs text-gray-700 dark:text-gray-300">
                      {stock.reason}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-500 dark:text-gray-400 mb-2">
                  <div className="space-y-2">
                    <div className="text-sm">
                      详细分析数据将在后续版本中提供
                    </div>
                    <div className="text-xs text-gray-400">
                      当前显示基于推荐算法生成的基础信息
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
