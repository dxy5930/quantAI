import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Target,
  Filter,
  Calendar,
  RefreshCw,
  Eye,
  EyeOff,
} from "lucide-react";
import { strategyDetailApi } from "../../services/api/strategyDetailApi";
import { TermTooltip } from "../common/TermTooltip";
import { StrategyType } from "../../constants/strategyTypes";

interface StrategyMultiChartProps {
  strategyId: string;
  strategyType: "stock_selection" | "backtest";
  period?: string;
  className?: string;
}

interface ChartData {
  strategyId: string;
  strategyType: string;
  period: string;
  charts: any;
  summary: any;
  updatedAt: string;
}

type ChartType =
  | "equity"
  | "drawdown"
  | "returns"
  | "performance"
  | "stock_performance"
  | "sector_analysis"
  | "risk_metrics"
  | "selection_history";

// 摘要指标映射配置
const SUMMARY_METRICS_MAP = {
  totalReturn: "总收益率",
  annualReturn: "年化收益率",
  maxDrawdown: "最大回撤",
  sharpeRatio: "夏普比率",
  winRate: "胜率",
  totalTrades: "交易次数",
  totalStocks: "股票数量",
  avgScore: "平均评分",
  buyRecommendations: "买入推荐",
  holdRecommendations: "持有推荐",
  sellRecommendations: "卖出推荐",
  riskLevel: "风险等级",
  stockCount: "股票数量",
  avgReturn: "平均收益",
  profitFactor: "盈利因子",
  calmarRatio: "卡尔马比",
  volatility: "波动",
  beta: "Beta系数",
  alpha: "Alpha系数",
  informationRatio: "信息比率",
};

// 图表配置
const CHART_CONFIGS = {
  equity: {
    title: "资金曲线",
    icon: TrendingUp,
    color: "#3B82F6",
    description: "策略净值变化趋势",
  },
  drawdown: {
    title: "回撤分析",
    icon: TrendingDown,
    color: "#EF4444",
    description: "最大回撤和回撤恢复",
  },
  returns: {
    title: "收益分析",
    icon: BarChart3,
    color: "#10B981",
    description: "日收益率分布",
  },
  performance: {
    title: "性能指标",
    icon: Activity,
    color: "#8B5CF6",
    description: "关键性能指标变化",
  },
  stock_performance: {
    title: "股票表现",
    icon: Target,
    color: "#F59E0B",
    description: "推荐股票价格走势",
  },
  sector_analysis: {
    title: "行业分析",
    icon: PieChartIcon,
    color: "#06B6D4",
    description: "行业分布和表现",
  },
  risk_metrics: {
    title: "风险指标",
    icon: Filter,
    color: "#EF4444",
    description: "组合风险评估",
  },
  selection_history: {
    title: "选股历史",
    icon: Calendar,
    color: "#84CC16",
    description: "选股成功率趋势",
  },
};

export const StrategyMultiChart: React.FC<StrategyMultiChartProps> = ({
  strategyId,
  strategyType,
  period = "1y",
  className = "",
}) => {
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(false);
  const [visibleCharts, setVisibleCharts] = useState<ChartType[]>(
    strategyType === StrategyType.BACKTEST
      ? ["equity", "drawdown", "returns", "performance"]
      : [
          "stock_performance",
          "sector_analysis",
          "risk_metrics",
          "selection_history",
        ]
  );
  const [chartPeriod, setChartPeriod] = useState(period);
  useEffect(() => {
    loadChartData();
  }, [strategyId, chartPeriod]);

  const loadChartData = async () => {
    setLoading(true);
    try {
      const response = await strategyDetailApi.getStrategyCharts(
        strategyId,
        chartPeriod
      );

      console.log("=== API 响应详情 ===");
      console.log("完整响应:", response);
      console.log("response.success:", response?.success);
      console.log("response.data:", response?.data);

      if (response && response.success && response.data) {
        console.log("=== 设置图表数据 ===");
        console.log("策略ID:", response.data.strategyId);
        console.log("策略类型:", response.data.strategyType);
        console.log("charts对象:", response.data.charts);
        console.log(
          "charts",
          response.data.charts ? Object.keys(response.data.charts) : []
        );
        console.log("summary:", response.data.summary);

        setChartData(response.data);
      } else {
        console.log("=== API响应无效，设置为null ===");
        console.log("response存在:", !!response);
        console.log("success:", response?.success);
        console.log("data存在:", !!response?.data);
        setChartData(null);
      }
    } catch (error) {
      console.error("=== API调用失败 ===", error);
      setChartData(null);
    } finally {
      setLoading(false);
    }
  };

  const toggleChartVisibility = (chart: ChartType) => {
    setVisibleCharts((prev) =>
      prev.includes(chart) ? prev.filter((c) => c !== chart) : [...prev, chart]
    );
  };
  const renderChartContent = (chartType: ChartType, data: any) => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return (
        <div className="flex items-center justify-center h-full text-gray-500">
          暂无数据
        </div>
      );
    }

    console.log(`渲染图表内容 ${chartType}:`, data.slice(0, 2)); // 只打印前2条数据

    switch (chartType) {
      case "equity":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#374151"
                opacity={0.3}
              />
              <XAxis dataKey="date" stroke="#6B7280" fontSize={12} />
              <YAxis stroke="#6B7280" fontSize={12} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="strategyEquity"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={false}
                name="策略净值"
              />
              <Line
                type="monotone"
                dataKey="benchmarkEquity"
                stroke="#6B7280"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name="基准"
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case "drawdown":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#374151"
                opacity={0.3}
              />
              <XAxis dataKey="date" stroke="#6B7280" fontSize={12} />
              <YAxis stroke="#6B7280" fontSize={12} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="drawdown"
                stroke="#EF4444"
                fill="#EF4444"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case "returns":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#374151"
                opacity={0.3}
              />
              <XAxis dataKey="date" stroke="#6B7280" fontSize={12} />
              <YAxis stroke="#6B7280" fontSize={12} />
              <Tooltip />
              <Bar dataKey="dailyReturn" fill="#10B981" name="日收益率(%)" />
            </BarChart>
          </ResponsiveContainer>
        );

      case "performance":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#374151"
                opacity={0.3}
              />
              <XAxis dataKey="date" stroke="#6B7280" fontSize={12} />
              <YAxis stroke="#6B7280" fontSize={12} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="sharpeRatio"
                stroke="#8B5CF6"
                strokeWidth={2}
                dot={false}
                name="夏普比率"
              />
              <Line
                type="monotone"
                dataKey="winRate"
                stroke="#10B981"
                strokeWidth={2}
                dot={false}
                name="胜率"
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case "sector_analysis":
        // 对于行业分析，我们需要从最新的数据点获取行业数据
        const latestData = data[data.length - 1];
        const sectorData = latestData?.sectors || [];

        if (!Array.isArray(sectorData) || sectorData.length === 0) {
          return (
            <div className="flex items-center justify-center h-full text-gray-500">
              暂无行业分析数据
            </div>
          );
        }

        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={sectorData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="weight"
                label={({ name, weight }) => `${name} ${weight}%`}
              >
                {sectorData.map((entry: any, index: number) => (
                  <Cell
                    key={`sector-cell-${entry.name || index}`}
                    fill={`hsl(${index * 72}, 70%, 50%)`}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );

      case "stock_performance":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#374151"
                opacity={0.3}
              />
              <XAxis dataKey="date" stroke="#6B7280" fontSize={12} />
              <YAxis stroke="#6B7280" fontSize={12} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="avgReturn"
                stroke="#F59E0B"
                strokeWidth={2}
                dot={false}
                name="平均收益"
              />
              <Line
                type="monotone"
                dataKey="avgScore"
                stroke="#06B6D4"
                strokeWidth={2}
                dot={false}
                name="平均评分"
                yAxisId="right"
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#6B7280"
                fontSize={12}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case "risk_metrics":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#374151"
                opacity={0.3}
              />
              <XAxis dataKey="date" stroke="#6B7280" fontSize={12} />
              <YAxis stroke="#6B7280" fontSize={12} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="volatility"
                stroke="#EF4444"
                strokeWidth={2}
                dot={false}
                name="波动"
              />
              <Line
                type="monotone"
                dataKey="beta"
                stroke="#8B5CF6"
                strokeWidth={2}
                dot={false}
                name="Beta系数"
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case "selection_history":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#374151"
                opacity={0.3}
              />
              <XAxis dataKey="date" stroke="#6B7280" fontSize={12} />
              <YAxis stroke="#6B7280" fontSize={12} />
              <Tooltip />
              <Legend />
              <Bar dataKey="selectedStocks" fill="#84CC16" name="选股数量" />
              <Line
                type="monotone"
                dataKey="successRate"
                stroke="#10B981"
                strokeWidth={2}
                dot={false}
                name="成功"
                yAxisId="right"
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#6B7280"
                fontSize={12}
              />
            </ComposedChart>
          </ResponsiveContainer>
        );

      default:
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#374151"
                opacity={0.3}
              />
              <XAxis dataKey="date" stroke="#6B7280" fontSize={12} />
              <YAxis stroke="#6B7280" fontSize={12} />
              <Tooltip />
              <Bar dataKey="value" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        );
    }
  };

  const renderChart = (chartType: ChartType) => {
    console.log(`=== 渲染图表 ${chartType} ===`);
    console.log("chartData存在:", !!chartData);
    console.log("在可见列表中:", visibleCharts.includes(chartType));
    console.log("可见图表列表:", visibleCharts);

    if (!chartData || !visibleCharts.includes(chartType)) {
      console.log(
        `图表 ${chartType} 不渲染 chartData=${!!chartData}, visible=${visibleCharts.includes(
          chartType
        )}`
      );
      return null;
    }

    const config = CHART_CONFIGS[chartType];
    const data = chartData.charts[chartType];

    console.log(`图表 ${chartType} 数据:`, data);
    console.log(`图表 ${chartType} 数据类型:`, typeof data);
    console.log(`图表 ${chartType} 是否为数组?`, Array.isArray(data));

    if (!data) {
      console.log(`图表 ${chartType} 无数据，跳过渲染`);
      return null;
    }

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <config.icon className="w-5 h-5" style={{ color: config.color }} />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {config.title}
            </h3>
          </div>
          <button
            onClick={() => toggleChartVisibility(chartType)}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <EyeOff className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {config.description}
        </p>
        <div className="h-64">{renderChartContent(chartType, data)}</div>
      </div>
    );
  };
  if (loading) {
    return (
      <div
        className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 ${className}`}
      >
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  // 数据状态检查
  console.log("=== 检查数据状态===");
  console.log("chartData存在:", !!chartData);
  console.log("chartData内容:", chartData);
  console.log("chartData.charts存在:", !!(chartData && chartData.charts));
  console.log(
    "charts键数组?",
    chartData && chartData.charts ? Object.keys(chartData.charts).length : 0
  );
  console.log(
    "charts键列表?",
    chartData && chartData.charts ? Object.keys(chartData.charts) : []
  );

  // 只有在完全没有数据时才显示空状态
  if (!chartData) {
    console.log("显示空状态：chartData为null或undefined");

    return (
      <div
        className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 ${className}`}
      >
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-6 mb-4">
            <BarChart3 className="w-12 h-12 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            暂无图表数据
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
            该策略暂未生成图表数据，请稍后再试或联系管理员
          </p>
          <button
            onClick={loadChartData}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            重新加载
          </button>
        </div>
      </div>
    );
  }

  // 确保charts对象存在（即使为空）
  if (!chartData.charts) {
    chartData.charts = {};
  }
  return (
    <div className={`space-y-6 ${className}`}>
      {/* 控制面板 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            策略图表分析
          </h2>
          <div className="flex items-center space-x-4">
            <select
              value={chartPeriod}
              onChange={(e) => setChartPeriod(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="1m">1个月</option>
              <option value="3m">3个月</option>
              <option value="6m">6个月</option>
              <option value="1y">1年</option>
            </select>
            <button
              onClick={loadChartData}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 图表切换按钮 */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(CHART_CONFIGS).map(([key, config]) => {
            const chartType = key as ChartType;
            const isVisible = visibleCharts.includes(chartType);
            const isAvailable =
              strategyType === StrategyType.BACKTEST
                ? ["equity", "drawdown", "returns", "performance"].includes(
                    chartType
                  )
                : [
                    "stock_performance",
                    "sector_analysis",
                    "risk_metrics",
                    "selection_history",
                  ].includes(chartType);

            if (!isAvailable) return null;

            return (
              <button
                key={chartType}
                onClick={() => toggleChartVisibility(chartType)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isVisible
                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                <config.icon className="w-4 h-4" />
                <span>{config.title}</span>
                {isVisible ? (
                  <Eye className="w-4 h-4" />
                ) : (
                  <EyeOff className="w-4 h-4" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 图表网格 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.keys(CHART_CONFIGS).map((chartType) => {
          const chart = renderChart(chartType as ChartType);
          console.log(`渲染图表 ${chartType}:`, chart ? "有内容" : "无内容");
          return <React.Fragment key={chartType}>{chart}</React.Fragment>;
        })}
      </div>

      {/* 无图表时的提示*/}
      {chartData.charts && Object.keys(chartData.charts).length === 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-6">
          <div className="flex items-center space-x-2 text-yellow-800 dark:text-yellow-200">
            <BarChart3 className="w-5 h-5" />
            <span className="font-medium">图表数据生成中</span>
          </div>
          <p className="text-yellow-700 dark:text-yellow-300 mt-2">
            该策略的图表数据正在生成中，请稍后刷新页面查看。摘要数据如下所示
          </p>
        </div>
      )}
      {/* 摘要信息 */}
      {chartData && chartData.summary && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            策略摘要
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(chartData.summary).map(([key, value]: any) => (
              <div key={key} className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {value}
                </div>
                <div className="flex items-center justify-center space-x-1 text-sm text-gray-600 dark:text-gray-400">
                  <span>
                    {SUMMARY_METRICS_MAP[
                      key as keyof typeof SUMMARY_METRICS_MAP
                    ] || key}
                  </span>
                  <TermTooltip metric={key} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StrategyMultiChart;
