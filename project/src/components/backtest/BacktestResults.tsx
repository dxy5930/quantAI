import React, { useState } from 'react';
import { BacktestResult } from '../../types';
import { ArrowLeft, TrendingUp, TrendingDown, Target, Zap, Share2, BarChart3, LineChart, PieChart, Activity } from 'lucide-react';
import { EquityChart, CandlestickChart } from '../charts';
import { AIAnalysisDisplay } from './AIAnalysisDisplay';
import { safeToPercent, safeToFixed, safePercentValue } from '../../utils/formatters';
import { generateMockEquityData, generateMockCandlestickData, generateMockTradeData } from '../../data/mockStockData';

interface BacktestResultsProps {
  results: BacktestResult;
  onBack: () => void;
}

export const BacktestResults: React.FC<BacktestResultsProps> = ({ results, onBack }) => {
  const [activeChart, setActiveChart] = useState<'equity' | 'candlestick'>('equity');
  
  const formatPercent = (value: number) => safeToPercent(value, 2);
  const formatCurrency = (value: number) => `${value.toLocaleString()}`;
  
  // 生成模拟数据
  const equityData = generateMockEquityData(90);
  const candlestickData = generateMockCandlestickData(30);
  const tradeData = generateMockTradeData();

  const metrics = [
    {
      label: '总收益率',
      value: formatPercent(results.totalReturn),
      icon: TrendingUp,
      color: results.totalReturn > 0 ? 'text-green-400' : 'text-red-400',
      bgColor: results.totalReturn > 0 ? 'bg-green-900/20' : 'bg-red-900/20'
    },
    {
      label: '年化收益率',
      value: formatPercent(results.annualReturn),
      icon: Target,
      color: results.annualReturn > 0 ? 'text-green-400' : 'text-red-400',
      bgColor: results.annualReturn > 0 ? 'bg-green-900/20' : 'bg-red-900/20'
    },
    {
      label: '夏普比率',
      value: safeToFixed(results.sharpeRatio, 2),
      icon: Zap,
      color: (results.sharpeRatio || 0) > 1 ? 'text-green-400' : 'text-yellow-400',
      bgColor: (results.sharpeRatio || 0) > 1 ? 'bg-green-900/20' : 'bg-yellow-900/20'
    },
    {
      label: '最大回撤',
      value: formatPercent(results.maxDrawdown),
      icon: TrendingDown,
      color: 'text-red-400',
      bgColor: 'bg-red-900/20'
    }
  ];

  const tradeMetrics = [
    {
      label: '胜率',
      value: formatPercent(results.winRate)
    },
    {
      label: '交易次数',
      value: (results.totalTrades || 0).toString()
    }
  ];

  // 组合特有指标
  const portfolioMetrics = results.backtestType === 'portfolio' ? [
    {
      label: '波动率',
      value: results.volatility ? formatPercent(results.volatility) : '-',
      icon: Activity,
      color: 'text-blue-400',
      bgColor: 'bg-blue-900/20'
    },
    {
      label: '贝塔系数',
      value: safeToFixed(results.beta, 2),
      icon: TrendingUp,
      color: 'text-purple-400',
      bgColor: 'bg-purple-900/20'
    },
    {
      label: '阿尔法',
      value: safePercentValue(results.alpha, 2),
      icon: Target,
      color: 'text-green-400',
      bgColor: 'bg-green-900/20'
    },
    {
      label: '多样化比率',
      value: safeToFixed(results.diversificationRatio, 2),
      icon: PieChart,
      color: 'text-orange-400',
      bgColor: 'bg-orange-900/20'
    }
  ] : [];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>返回</span>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">回测结果</h1>
            <p className="text-gray-400">策略表现分析</p>
          </div>
        </div>
        <button className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 px-4 py-2 rounded-lg transition-all duration-300">
          <Share2 className="w-4 h-4" />
          <span className="text-white">分享结果</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        {metrics.map((metric, index) => (
          <div key={index} className={`bg-gray-800 rounded-xl p-6 border border-gray-700 ${metric.bgColor} hover:scale-105 transition-transform`}>
            <div className="flex items-center justify-between mb-2">
              <metric.icon className={`w-6 h-6 ${metric.color}`} />
              <span className={`text-2xl font-bold ${metric.color}`}>
                {metric.value}
              </span>
            </div>
            <p className="text-gray-400 text-sm">{metric.label}</p>
          </div>
        ))}
      </div>

      {/* 组合特有指标 */}
      {results.backtestType === 'portfolio' && portfolioMetrics.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-white mb-4">组合风险指标</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {portfolioMetrics.map((metric, index) => (
              <div key={index} className={`bg-gray-800 rounded-xl p-6 border border-gray-700 ${metric.bgColor} hover:scale-105 transition-transform`}>
                <div className="flex items-center justify-between mb-2">
                  <metric.icon className={`w-6 h-6 ${metric.color}`} />
                  <span className={`text-2xl font-bold ${metric.color}`}>
                    {metric.value}
                  </span>
                </div>
                <p className="text-gray-400 text-sm">{metric.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 组合构成展示 */}
      {results.backtestType === 'portfolio' && results.portfolioComposition && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-white mb-4">组合构成</h3>
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.portfolioComposition.map((stock, index) => (
                <div key={stock.symbol} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                          {stock.symbol.slice(0, 2)}
                        </span>
                      </div>
                      <div>
                        <div className="text-white font-medium">{stock.symbol}</div>
                        <div className="text-gray-400 text-sm">{stock.name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-medium">{formatPercent(stock.weight)}</div>
                      <div className="text-gray-400 text-sm">权重</div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-600 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${stock.weight * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 个股表现（仅组合回测） */}
      {results.backtestType === 'portfolio' && results.individualResults && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-white mb-4">个股表现</h3>
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-300">股票</th>
                    <th className="text-center py-3 px-4 text-gray-300">权重</th>
                    <th className="text-right py-3 px-4 text-gray-300">总收益</th>
                    <th className="text-right py-3 px-4 text-gray-300">年化收益</th>
                    <th className="text-right py-3 px-4 text-gray-300">夏普比率</th>
                    <th className="text-right py-3 px-4 text-gray-300">最大回撤</th>
                    <th className="text-right py-3 px-4 text-gray-300">贡献度</th>
                  </tr>
                </thead>
                <tbody>
                  {results.individualResults.map((stock, index) => (
                    <tr key={stock.symbol} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/20 rounded flex items-center justify-center">
                            <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                              {stock.symbol.slice(0, 2)}
                            </span>
                          </div>
                          <div>
                            <div className="text-white font-medium">{stock.symbol}</div>
                            <div className="text-gray-400 text-xs">{stock.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center text-gray-300">
                        {formatPercent(stock.weight || 0)}
                      </td>
                      <td className={`py-3 px-4 text-right font-medium ${
                        stock.totalReturn > 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {formatPercent(stock.totalReturn)}
                      </td>
                      <td className={`py-3 px-4 text-right font-medium ${
                        stock.annualReturn > 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {formatPercent(stock.annualReturn)}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-300">
                        {safeToFixed(stock.sharpeRatio, 2)}
                      </td>
                      <td className="py-3 px-4 text-right text-red-400">
                        {formatPercent(stock.maxDrawdown)}
                      </td>
                      <td className={`py-3 px-4 text-right font-medium ${
                        (stock.contribution || 0) > 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {formatPercent(stock.contribution || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">图表分析</h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => setActiveChart('equity')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    activeChart === 'equity'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <LineChart className="w-4 h-4 inline mr-1" />
                  资金曲线
                </button>
                <button
                  onClick={() => setActiveChart('candlestick')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    activeChart === 'candlestick'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <BarChart3 className="w-4 h-4 inline mr-1" />
                  K线图
                </button>
              </div>
            </div>
            
            <div className="h-96">
              {activeChart === 'equity' ? (
                <EquityChart 
                  data={equityData} 
                  title=""
                  height={384}
                  className="!bg-transparent !border-0 !p-0"
                />
              ) : (
                <CandlestickChart 
                  data={candlestickData} 
                  title=""
                  height={384}
                  className="!bg-transparent !border-0 !p-0"
                />
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-lg font-semibold text-white mb-4">交易统计</h2>
            <div className="space-y-4">
              {tradeMetrics.map((metric, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-gray-400">{metric.label}</span>
                  <span className="text-white font-medium">{metric.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-lg font-semibold text-white mb-4">策略评级</h2>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">A</span>
                </div>
                <div>
                  <p className="text-white font-medium">综合评分</p>
                  <p className="text-gray-400 text-sm">基于收益、风险和稳定性</p>
                </div>
              </div>
              <div className="bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-1000"
                  style={{ width: '85%' }}
                />
              </div>
              <p className="text-center text-gray-400 text-sm">85/100</p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6">
            <h3 className="text-white font-semibold mb-2">策略优化建议</h3>
            <p className="text-blue-100 text-sm">
              当前策略表现良好，建议适当调整参数以降低最大回撤。
            </p>
          </div>
        </div>
      </div>

      {/* 交易记录 */}
      <div className="mt-8 bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h2 className="text-xl font-semibold text-white mb-6">交易记录</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-gray-300">日期</th>
                <th className="text-left py-3 px-4 text-gray-300">股票</th>
                <th className="text-left py-3 px-4 text-gray-300">操作</th>
                <th className="text-right py-3 px-4 text-gray-300">价格</th>
                <th className="text-right py-3 px-4 text-gray-300">数量</th>
                <th className="text-right py-3 px-4 text-gray-300">金额</th>
                <th className="text-right py-3 px-4 text-gray-300">盈亏</th>
              </tr>
            </thead>
            <tbody>
              {tradeData.slice(0, 10).map((trade) => (
                <tr key={trade.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                  <td className="py-3 px-4 text-gray-300">{trade.date}</td>
                  <td className="py-3 px-4 text-white font-medium">{trade.symbol}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      trade.type === 'buy' 
                        ? 'bg-green-900/30 text-green-400' 
                        : 'bg-red-900/30 text-red-400'
                    }`}>
                      {trade.type === 'buy' ? '买入' : '卖出'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-gray-300">{trade.price.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right text-gray-300">{trade.quantity}</td>
                  <td className="py-3 px-4 text-right text-gray-300">{trade.amount.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right">
                    {trade.profit !== undefined ? (
                      <span className={`font-medium ${
                        trade.profit > 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {trade.profit > 0 ? '+' : ''}{trade.profit.toFixed(2)}
                        {trade.profitPercent && (
                          <span className="text-xs ml-1">
                            ({trade.profitPercent > 0 ? '+' : ''}{trade.profitPercent.toFixed(1)}%)
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {tradeData.length > 10 && (
          <div className="mt-4 text-center">
            <button className="text-blue-400 hover:text-blue-300 text-sm">
              查看全部 {tradeData.length} 条交易记录
            </button>
          </div>
        )}
      </div>

      {/* AI分析显示 */}
      {results.ai_analysis && (
        <div className="mt-8">
          <AIAnalysisDisplay aiAnalysis={results.ai_analysis} />
        </div>
      )}
    </div>
  );
};