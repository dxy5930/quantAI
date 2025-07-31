import React, { useCallback, useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { useNavigate } from "react-router-dom";
import { useStore } from "../../hooks";
import { StatsGrid } from "../../components";
import {
  formatAnalysisText,
  formatTextArray,
} from "../../utils/analysisHelpers";
import {
  RECOMMENDATION_MAP,
  RISK_TEXT_MAP,
  RISK_COLOR_MAP,
  RecommendationType,
  RiskLevelType,
} from "../../constants/stockAnalysis";
import {
  Brain,
  TrendingUp,
  BarChart3,
  Target,
  Zap,
  ArrowRight,
  Play,
  Search,
  Activity,
} from "lucide-react";

const HomePage: React.FC = observer(() => {
  const { app, user, home } = useStore();
  const navigate = useNavigate();
  const [testStock, setTestStock] = useState("");

  // 页面初始化加载数据
  useEffect(() => {
    // 加载系统统计数据
    app.loadSystemStats();

    // 加载首页数据
    home.loadAllData();

    // AI实时分析状态轮播
    const interval = setInterval(() => {
      home.nextAnalysisState();
    }, 3000);

    return () => clearInterval(interval);
  }, [app, home]);

  const handleTestAI = useCallback(async () => {
    if (!testStock.trim()) return;

    // 重置之前的分析结果
    home.resetStockAnalysis();

    // 调用AI分析
    await home.analyzeStock(testStock);
  }, [testStock, home]);

  const handleGoToStrategies = useCallback(() => {
    navigate("/strategy-square");
  }, [navigate]);

  const handleRegister = useCallback(() => {
    navigate("/register");
  }, [navigate]);

  return (
    <div className="space-y-12">
      {/* 英雄区域 */}
      <div className="text-center space-y-8 animate-fade-in">
        <div className="flex items-center justify-center space-x-3 mb-6">
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-3 rounded-xl">
            <Brain className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            AI驱动的智能投资决策
          </h1>
        </div>

        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
          让人工智能为您分析市场，发现投资机会，优化策略配置
        </p>

        {/* 实时AI状态 */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 max-w-2xl mx-auto">
          <div className="flex items-center justify-center space-x-3">
            <div className="animate-spin">
              <Activity className="h-5 w-5 text-blue-500" />
            </div>
            <span className="text-blue-600 dark:text-blue-400 font-medium">
              {home.currentAnalysisState}
            </span>
          </div>
        </div>
      </div>

      {/* 统计数据 */}
      <StatsGrid stats={app.stats} loading={app.statsLoading} />

      {/* 核心功能展示区 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 实时AI解盘 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3 mb-4">
            <TrendingUp className="h-6 w-6 text-green-500" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              实时AI解盘
            </h3>
          </div>
          {home.sentimentLoading ? (
            <div className="space-y-4 animate-pulse">
              <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-20"></div>
              <div className="space-y-2">
                <div className="bg-gray-200 dark:bg-gray-700 rounded h-4"></div>
                <div className="bg-gray-200 dark:bg-gray-700 rounded h-4 w-3/4"></div>
              </div>
            </div>
          ) : home.marketSentiment ? (
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  市场情绪指数
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        home.marketSentiment.level === "bullish"
                          ? "bg-green-500"
                          : home.marketSentiment.level === "bearish"
                          ? "bg-red-500"
                          : "bg-yellow-500"
                      }`}
                      style={{ width: `${home.marketSentiment.index}%` }}
                    ></div>
                  </div>
                  <span
                    className={`font-semibold ${
                      home.marketSentiment.level === "bullish"
                        ? "text-green-500"
                        : home.marketSentiment.level === "bearish"
                        ? "text-red-500"
                        : "text-yellow-500"
                    }`}
                  >
                    {home.marketSentiment.index}%
                  </span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {home.marketSentiment.description}
                </div>
              </div>
              {home.marketAnalysis && (
                <div className="text-gray-700 dark:text-gray-300 space-y-1">
                  {Array.isArray(home.marketAnalysis.insights) ? (
                    home.marketAnalysis.insights.map((insight, index) => (
                      <p key={index}>• {String(insight)}</p>
                    ))
                  ) : (
                    <p>• 暂无分析洞察</p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  市场情绪指数
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div
                      className="bg-gray-400 h-2 rounded-full"
                      style={{ width: "50%" }}
                    ></div>
                  </div>
                  <span className="text-gray-400 font-semibold">--</span>
                </div>
              </div>
              <div className="text-gray-500 dark:text-gray-400 text-center py-4">
                {home.sentimentError || "暂无市场分析数据"}
              </div>
            </div>
          )}
        </div>

        {/* AI选股体验 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3 mb-4">
            <Target className="h-6 w-6 text-blue-500" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              试试AI选股
            </h3>
          </div>
          <div className="space-y-4">
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="输入股票代码，如：000001"
                value={testStock}
                onChange={(e) => setTestStock(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <button
                onClick={handleTestAI}
                disabled={home.stockAnalysisLoading}
                className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-all duration-200 ${
                  home.stockAnalysisLoading
                    ? "bg-gray-400 cursor-not-allowed text-gray-200"
                    : "bg-blue-500 hover:bg-blue-600 text-white"
                }`}
              >
                <Zap className="h-4 w-4" />
                <span>{home.stockAnalysisLoading ? "分析中..." : "分析"}</span>
              </button>
            </div>
            {home.stockAnalysisLoading && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <p className="text-blue-800 dark:text-blue-200">AI分析中...</p>
              </div>
            )}
            {home.stockAnalysis && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 space-y-4">
                {/* 股票基本信息 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                      {home.stockAnalysis.symbol?.slice(0, 2) || "ST"}
                    </div>
                    <div>
                      <h4 className="font-semibold text-blue-800 dark:text-blue-200">
                        {home.stockAnalysis.name}
                      </h4>
                      <p className="text-sm text-blue-600 dark:text-blue-300">
                        {home.stockAnalysis.symbol}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        home.stockAnalysis.rating?.startsWith("A")
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                          : home.stockAnalysis.rating?.startsWith("B")
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                      }`}
                    >
                      {home.stockAnalysis.rating}
                    </span>
                  </div>
                </div>

                {/* AI分析内容 */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Brain className="h-5 w-5 text-blue-500" />
                    <h5 className="font-medium text-gray-900 dark:text-white">
                      AI分析
                    </h5>
                  </div>
                  <div className="space-y-3">
                    <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                      {home.stockAnalysis.analysis}
                    </p>
                  </div>
                </div>

                {/* 评分指标 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        技术面评分
                      </span>
                      <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                        {home.stockAnalysis.technical_score}/100
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(0, home.stockAnalysis.technical_score)
                          )}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        基本面评分
                      </span>
                      <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                        {home.stockAnalysis.fundamental_score}/100
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(0, home.stockAnalysis.fundamental_score)
                          )}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* 投资建议和风险等级 */}
                <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5 text-emerald-500" />
                      <div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          投资建议
                        </span>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {RECOMMENDATION_MAP[
                            home.stockAnalysis
                              .recommendation as RecommendationType
                          ] || "持有"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        风险等级
                      </span>
                      <p
                        className={`font-medium ${
                          RISK_COLOR_MAP[
                            home.stockAnalysis.risk_level as RiskLevelType
                          ] || "text-yellow-600 dark:text-yellow-400"
                        }`}
                      >
                        {RISK_TEXT_MAP[
                          home.stockAnalysis.risk_level as RiskLevelType
                        ] || "中风险"}
                      </p>
                    </div>
                    {home.stockAnalysis.target_price && (
                      <div className="text-right">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          目标价格
                        </span>
                        <p className="font-medium text-emerald-600 dark:text-emerald-400">
                          ¥{home.stockAnalysis.target_price.toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 关键要点 */}
                {home.stockAnalysis.key_points &&
                  home.stockAnalysis.key_points.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-3">
                        <Target className="h-5 w-5 text-green-500" />
                        <h5 className="font-medium text-gray-900 dark:text-white">
                          关键要点
                        </h5>
                      </div>
                      <div className="space-y-2">
                        {home.stockAnalysis.key_points.map(
                          (point: string, index: number) => (
                            <div
                              key={index}
                              className="flex items-start space-x-2"
                            >
                              <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0"></div>
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                {point}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                {/* 风险提示 */}
                {home.stockAnalysis.warnings &&
                  home.stockAnalysis.warnings.length > 0 && (
                    <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-3">
                        <Zap className="h-5 w-5 text-orange-500" />
                        <h5 className="font-medium text-orange-800 dark:text-orange-200">
                          风险提示
                        </h5>
                      </div>
                      <div className="space-y-2">
                        {home.stockAnalysis.warnings.map(
                          (warning: string, index: number) => (
                            <div
                              key={index}
                              className="flex items-start space-x-2"
                            >
                              <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2 flex-shrink-0"></div>
                              <span className="text-sm text-orange-700 dark:text-orange-300">
                                {warning}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                {/* 分析时间 */}
                <div className="text-center pt-2 border-t border-blue-200 dark:border-blue-700">
                  <span className="text-xs text-blue-600 dark:text-blue-400">
                    分析时间：
                    {new Date(home.stockAnalysis.generatedAt).toLocaleString()}
                  </span>
                </div>
              </div>
            )}
            {home.stockAnalysisError && (
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                <p className="text-red-800 dark:text-red-200">
                  {home.stockAnalysisError}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 策略收益展示 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <BarChart3 className="h-6 w-6 text-purple-500" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              AI策略收益
            </h3>
          </div>
          <button
            onClick={handleGoToStrategies}
            className="text-blue-500 hover:text-blue-600 flex items-center space-x-1"
          >
            <span>查看更多</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {home.strategiesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg animate-pulse"
              >
                <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded mb-1"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-2/3 mx-auto"></div>
              </div>
            ))}
          </div>
        ) : home.topStrategies.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {home.topStrategies.map((strategy, index) => {
              const colors = [
                {
                  bg: "bg-green-50 dark:bg-green-900/20",
                  text: "text-green-600 dark:text-green-400",
                },
                {
                  bg: "bg-blue-50 dark:bg-blue-900/20",
                  text: "text-blue-600 dark:text-blue-400",
                },
                {
                  bg: "bg-purple-50 dark:bg-purple-900/20",
                  text: "text-purple-600 dark:text-purple-400",
                },
              ];
              const color = colors[index] || colors[0];

              return (
                <div
                  key={strategy.id}
                  className={`text-center p-4 ${color.bg} rounded-lg`}
                >
                  <div className={`text-2xl font-bold ${color.text}`}>
                    {strategy.return30d > 0 ? "+" : ""}
                    {(strategy.return30d * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {strategy.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500">
                    近30天收益
                  </div>
                  <div className="space-y-1 mt-2">
                    <div className="text-xs text-gray-400 dark:text-gray-500">
                      夏普比率: {strategy.sharpeRatio.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500">
                      最大回撤: {(strategy.maxDrawdown * 100).toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500">
                      胜率: {strategy.winRate.toFixed(1)}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {home.strategiesError || "暂无策略数据"}
          </div>
        )}
      </div>

      {/* 快速体验区 - 仅对未登录用户显示 */}
      {!user.isAuthenticated && (
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-4">解锁完整AI投资工具</h3>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            注册后可使用完整策略库、个人回测、AI投资顾问等高级功能
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={handleRegister}
              className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 flex items-center space-x-2"
            >
              <Play className="h-5 w-5" />
              <span>立即体验</span>
            </button>
            <button
              onClick={handleGoToStrategies}
              className="border border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/10 flex items-center space-x-2"
            >
              <Search className="h-5 w-5" />
              <span>浏览策略</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

export default HomePage;
