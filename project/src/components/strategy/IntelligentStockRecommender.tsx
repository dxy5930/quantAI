import React, { useState, useEffect } from "react";
import {
  Target,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Star,
  Building2,
  DollarSign,
  BarChart3,
} from "lucide-react";
import {
  StrategyDescriptionParser,
  ParsedStrategy,
} from "../../utils/strategyDescriptionParser";
import { StockRecommendation } from "../../types";
import { stockSelectionApi } from "../../services/api/stockSelectionApi";

interface IntelligentStockRecommenderProps {
  strategyDescription: string;
  onRecommendationsChange?: (recommendations: StockRecommendation[]) => void;
  maxRecommendations?: number;
}

export const IntelligentStockRecommender: React.FC<
  IntelligentStockRecommenderProps
> = ({
  strategyDescription,
  onRecommendationsChange,
  maxRecommendations = 6,
}) => {
  const [parsedStrategy, setParsedStrategy] = useState<ParsedStrategy | null>(
    null
  );
  const [recommendations, setRecommendations] = useState<StockRecommendation[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);

  // 解析策略描述并生成推荐
  useEffect(() => {
    if (strategyDescription.trim().length < 5) {
      setParsedStrategy(null);
      // 不使用模拟数据，显示空状态
      setRecommendations([]);
      onRecommendationsChange?.([]);
      return;
    }

    setIsLoading(true);

    // 调用后端API进行智能分析
    fetchIntelligentRecommendations(strategyDescription);
  }, [strategyDescription, maxRecommendations, onRecommendationsChange]);

  // 调用后端API获取智能推荐
  const fetchIntelligentRecommendations = async (description: string) => {
    try {
      console.log("调用后端API进行策略分析:", description);

      // 使用封装的API调用
      const result = await stockSelectionApi.analyzeStrategy({
        input: description,
      });

      if (result.success && result.data) {
        // 解析关键词和结构化条件
        const keywords = result.data.keywords || [];
        const apiRecommendations = result.data.recommendations || [];

        // 直接使用后端返回的结构化条件
        const structuredConditions = result.data.structured_conditions || [];
        
        // 添加调试信息
        console.log("后端返回的原始数据:", result.data);
        console.log("提取的关键词:", keywords);
        console.log("提取的结构化条件:", structuredConditions);

        // 构建解析策略对象 - 只使用后端数据
        const parsed = {
          strategyType: inferStrategyType(keywords),
          riskLevel: inferRiskLevel(keywords),
          timeframe: inferTimeframe(keywords),
          sectors: extractSectors(keywords),
          conditions: keywords.map((k: any) => ({
            type: 'fundamental' as const,
            description: k.text,
            confidence: k.confidence || 0.8,
          })),
          structuredConditions: structuredConditions,
        };

        console.log("构建的解析策略对象:", parsed);
        setParsedStrategy(parsed);

        // 转换API返回的推荐数据为前端格式
        const convertedRecommendations = apiRecommendations
          .slice(0, maxRecommendations)
          .map((stock: any) => ({
            symbol: stock.symbol,
            name: stock.name,
            score: Math.round(stock.matchScore || stock.score || 80),
            reason: Array.isArray(stock.matchReasons)
              ? stock.matchReasons.join("；")
              : stock.reason || "基于AI分析推荐",
            targetPrice: stock.price || stock.targetPrice || 0,
            riskLevel: stock.riskLevel || "medium",
            sector: stock.sector || "未知",
            marketCap: parseMarketCap(stock.marketCap),
            updatedAt: new Date().toISOString(),
          }));

        setRecommendations(convertedRecommendations);
        onRecommendationsChange?.(convertedRecommendations);

        console.log(`API返回${convertedRecommendations.length}个推荐`);
      } else {
        console.warn("API返回数据格式异常，使用降级方案");
        useFallbackRecommendations(description);
      }
    } catch (error) {
      console.error("调用后端API失败:", error);
      useFallbackRecommendations(description);
    } finally {
      setIsLoading(false);
    }
  };

  // 降级方案：显示API调用失败信息，不使用模拟数据
  const useFallbackRecommendations = (description: string) => {
    console.log("API调用失败，不使用模拟数据");

    // 创建一个基本的解析策略对象，但不包含推荐
    const parsed = {
      strategyType: "mixed" as const,
      riskLevel: "medium" as const,
      timeframe: "medium_term" as const,
      sectors: [],
      conditions: [],
      structuredConditions: [],
    };

    setParsedStrategy(parsed);
    setRecommendations([]); // 不使用模拟数据，返回空数组
    onRecommendationsChange?.([]);
  };

  // 辅助函数：推断策略类型
  const inferStrategyType = (
    keywords: any[]
  ):
    | "mean_reversion"
    | "momentum"
    | "trend_following"
    | "value"
    | "growth"
    | "mixed" => {
    const keywordTexts = keywords.map((k) => k.text.toLowerCase());

    if (
      keywordTexts.some(
        (k) => k.includes("rsi") || k.includes("超卖") || k.includes("均值回归")
      )
    ) {
      return "mean_reversion";
    }
    if (
      keywordTexts.some(
        (k) => k.includes("macd") || k.includes("金叉") || k.includes("动量")
      )
    ) {
      return "momentum";
    }
    if (
      keywordTexts.some(
        (k) => k.includes("均线") || k.includes("突破") || k.includes("趋势")
      )
    ) {
      return "trend_following";
    }
    if (
      keywordTexts.some(
        (k) => k.includes("价值") || k.includes("低估值") || k.includes("pe")
      )
    ) {
      return "value";
    }
    if (
      keywordTexts.some(
        (k) => k.includes("成长") || k.includes("高成长") || k.includes("增长")
      )
    ) {
      return "growth";
    }

    return "mixed";
  };

  // 辅助函数：推断风险等级
  const inferRiskLevel = (keywords: any[]): "low" | "medium" | "high" => {
    const keywordTexts = keywords.map((k) => k.text.toLowerCase());

    if (
      keywordTexts.some(
        (k) => k.includes("稳健") || k.includes("低风险") || k.includes("蓝筹")
      )
    ) {
      return "low";
    }
    if (
      keywordTexts.some(
        (k) => k.includes("高风险") || k.includes("激进") || k.includes("小盘")
      )
    ) {
      return "high";
    }

    return "medium";
  };

  // 辅助函数：推断时间框架
  const inferTimeframe = (
    keywords: any[]
  ): "short_term" | "medium_term" | "long_term" => {
    const keywordTexts = keywords.map((k) => k.text.toLowerCase());

    if (
      keywordTexts.some(
        (k) => k.includes("短期") || k.includes("日内") || k.includes("快速")
      )
    ) {
      return "short_term";
    }
    if (
      keywordTexts.some(
        (k) =>
          k.includes("长期") || k.includes("价值投资") || k.includes("持有")
      )
    ) {
      return "long_term";
    }

    return "medium_term";
  };

  // 辅助函数：提取行业信息
  const extractSectors = (keywords: any[]) => {
    const sectors: string[] = [];
    const keywordTexts = keywords.map((k) => k.text.toLowerCase());

    const sectorMappings = {
      科技: ["科技", "技术", "软件", "互联网"],
      金融: ["金融", "银行", "保险"],
      医药: ["医药", "医疗", "生物"],
      消费: ["消费", "零售", "食品"],
      能源: ["能源", "石油", "新能源"],
    };

    for (const [sector, keywords_list] of Object.entries(sectorMappings)) {
      if (
        keywords_list.some((k) => keywordTexts.some((kt) => kt.includes(k)))
      ) {
        sectors.push(sector);
      }
    }

    return sectors;
  };

  // 辅助函数：解析市值
  const parseMarketCap = (marketCap: any): number => {
    if (typeof marketCap === "number") {
      return marketCap;
    }
    if (typeof marketCap === "string") {
      // 简单解析，实际可能需要更复杂的逻辑
      if (marketCap.includes("万亿")) {
        return parseFloat(marketCap) * 1000000000000;
      }
      if (marketCap.includes("亿")) {
        return parseFloat(marketCap) * 100000000;
      }
    }
    return 0;
  };


  // 根据风险偏好调整评分
  const adjustScoreByRisk = (
    score: number,
    stockRisk: string,
    strategyRisk: string
  ): number => {
    if (stockRisk === strategyRisk) return score;

    if (strategyRisk === "low" && stockRisk === "high") return score - 10;
    if (strategyRisk === "high" && stockRisk === "low") return score - 5;
    if (strategyRisk === "medium") return score - 2;

    return score;
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "low":
        return "text-green-600 bg-green-100 dark:bg-green-900/30";
      case "medium":
        return "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30";
      case "high":
        return "text-red-600 bg-red-100 dark:bg-red-900/30";
      default:
        return "text-gray-600 bg-gray-100 dark:bg-gray-900/30";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 80) return "text-blue-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const formatMarketCap = (marketCap: number) => {
    if (!marketCap || marketCap === 0) {
      return "未知";
    }
    if (marketCap >= 1000000000000) {
      return `${(marketCap / 1000000000000).toFixed(1)}万亿`;
    } else if (marketCap >= 1000000000) {
      return `${(marketCap / 1000000000).toFixed(0)}亿`;
    }
    return `${marketCap}`;
  };

  // 格式化结构化条件显示 - 将period拆开
  const formatStructuredCondition = (condition: any) => {
    const { field, operator, value, period } = condition;

    // 操作符映射
    const operatorMap: { [key: string]: string } = {
      ">": " > ",
      "<": " < ",
      ">=": " ≥ ",
      "<=": " ≤ ",
      "=": " = ",
      "!=": " ≠ ",
      between: " 介于 ",
      in: " 属于 ",
    };

    const operatorText = operatorMap[operator] || ` ${operator} `;

    // 格式化数值（如果是百分比相关的字段，添加%符号）
    const formatValue = (val: any, fieldName: string) => {
      if (typeof val === "number") {
        const percentFields = [
          "收益率",
          "回撤",
          "最大回撤",
          "毛利率",
          "股息率",
          "ROE",
        ];
        if (percentFields.some((f) => fieldName.includes(f))) {
          return `${val}%`;
        }
        return val.toString();
      }
      return val;
    };

    // 基础条件（不包含时间周期）
    const baseCondition = `${field}${operatorText}${formatValue(value, field)}`;

    // 时间周期（如果存在）
    let periodText = "";
    if (period) {
      const periodMap: { [key: string]: string } = {
        "1y": "近一年",
        "2y": "近两年",
        "3y": "近三年",
        "6m": "近6个月",
        "1m": "近一个月",
      };
      periodText = periodMap[period] || period;
    }

    return {
      baseCondition,
      periodText,
      hasTimePeriod: !!period,
    };
  };

  if (!strategyDescription.trim()) {
    return (
      <div className="text-center py-6">
        <Target className="w-10 h-10 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          输入策略描述可获取更精准的推荐
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 策略分析结果 */}
      {parsedStrategy && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              策略分析结果
            </h3>
            <button
              onClick={() => setShowAnalysis(!showAnalysis)}
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 text-sm"
            >
              {showAnalysis ? "收起" : "展开"}详情
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
            <div className="text-center">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                策略类型
              </div>
              <div className="font-medium text-gray-900 dark:text-white">
                {parsedStrategy.strategyType === "trend_following" &&
                  "趋势跟踪"}
                {parsedStrategy.strategyType === "mean_reversion" && "均值回归"}
                {parsedStrategy.strategyType === "momentum" && "动量策略"}
                {parsedStrategy.strategyType === "value" && "价值投资"}
                {parsedStrategy.strategyType === "growth" && "成长投资"}
                {parsedStrategy.strategyType === "mixed" && "混合策略"}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                风险等级
              </div>
              <div
                className={`font-medium ${getRiskColor(
                  parsedStrategy.riskLevel
                )} px-2 py-1 rounded text-xs`}
              >
                {parsedStrategy.riskLevel === "low" && "低风险"}
                {parsedStrategy.riskLevel === "medium" && "中风险"}
                {parsedStrategy.riskLevel === "high" && "高风险"}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                时间框架
              </div>
              <div className="font-medium text-gray-900 dark:text-white">
                {parsedStrategy.timeframe === "short_term" && "短期"}
                {parsedStrategy.timeframe === "medium_term" && "中期"}
                {parsedStrategy.timeframe === "long_term" && "长期"}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                识别条件
              </div>
              <div className="font-medium text-gray-900 dark:text-white">
                {parsedStrategy.structuredConditions?.length ||
                  parsedStrategy.conditions.length}
                个
              </div>
            </div>
          </div>

          {/* 主要区域显示结构化条件 */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              结构化条件
            </h4>
            {parsedStrategy.structuredConditions &&
            Array.isArray(parsedStrategy.structuredConditions) &&
            parsedStrategy.structuredConditions.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {parsedStrategy.structuredConditions.map(
                  (condition: any, index: number) => {
                    const formatted = formatStructuredCondition(condition);
                    return (
                      <div key={index} className="flex items-center gap-1">
                        {/* 时间周期标签（如果存在） */}
                        {formatted.hasTimePeriod && (
                          <div className="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-xs font-medium">
                            {formatted.periodText}
                          </div>
                        )}
                        {/* 基础条件标签 */}
                        <div className="inline-flex items-center px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-full text-sm font-medium">
                          {formatted.baseCondition}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            ) : (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                暂无结构化条件（后端可能未返回数据或解析失败）
              </div>
            )}
          </div>
        </div>
      )}

      {/* 加载状态 */}
      {isLoading && (
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            正在分析策略并生成推荐...
          </p>
        </div>
      )}

      {/* 推荐结果 */}
      {!isLoading && recommendations.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <Star className="w-5 h-5 mr-2 text-yellow-500" />
              {parsedStrategy ? "智能推荐" : "热门推荐"} (
              {recommendations.length}只)
            </h3>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {parsedStrategy
                ? "基于策略条件匹配生成"
                : "当前最受关注的优质股票"}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.map((stock, index) => (
              <div
                key={stock.symbol}
                className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                      <Building2 className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {stock.symbol}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {stock.name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-lg font-bold ${getScoreColor(
                        stock.score
                      )}`}
                    >
                      {stock.score}
                    </div>
                    <div className="text-xs text-gray-500">匹配度</div>
                  </div>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      目标价格
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      ${stock.targetPrice}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      风险等级
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-xs ${getRiskColor(
                        stock.riskLevel
                      )}`}
                    >
                      {stock.riskLevel === "low" && "低风险"}
                      {stock.riskLevel === "medium" && "中风险"}
                      {stock.riskLevel === "high" && "高风险"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      行业
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {stock.sector}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      市值
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatMarketCap(stock.marketCap)}
                    </span>
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {stock.reason}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 无推荐结果 */}
      {!isLoading && recommendations.length === 0 && parsedStrategy && (
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            暂未找到符合条件的股票推荐
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
            请尝试调整策略描述或降低筛选条件
          </p>
        </div>
      )}
    </div>
  );
};
