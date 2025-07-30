import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Settings, Play, BarChart3, AlertCircle } from 'lucide-react';
import TradingRulesConfig from '../components/TradingRulesConfig';

// 交易规则类型（与组件保持一致）
interface TradingRule {
  buyConditions: any[];
  buyAmount: number;
  buyAmountType: 'fixed' | 'percentage';
  sellConditions: any[];
  sellAmount: number;
  sellAmountType: 'fixed' | 'percentage';
  stopLoss?: number;
  takeProfit?: number;
  maxPositionSize?: number;
  minHoldingPeriod?: number;
  maxHoldingPeriod?: number;
}

const TradingRulesTestPage: React.FC = observer(() => {
  const [tradingRules, setTradingRules] = useState<TradingRule>({
    buyConditions: [
      {
        type: 'price',
        operator: '<',
        value: 50,
        description: '股价低于50元时买入'
      },
      {
        type: 'technical',
        operator: '<',
        value: 30,
        indicator: 'RSI',
        period: 14,
        description: 'RSI低于30时买入（超卖）'
      }
    ],
    buyAmount: 10000,
    buyAmountType: 'fixed',
    sellConditions: [
      {
        type: 'price',
        operator: '>',
        value: 60,
        description: '股价高于60元时卖出'
      },
      {
        type: 'technical',
        operator: '>',
        value: 70,
        indicator: 'RSI',
        period: 14,
        description: 'RSI高于70时卖出（超买）'
      }
    ],
    sellAmount: 1.0,
    sellAmountType: 'percentage',
    stopLoss: -0.1,
    takeProfit: 0.2,
    maxPositionSize: 0.3,
    minHoldingPeriod: 5,
    maxHoldingPeriod: 30
  });

  const [backtestConfig, setBacktestConfig] = useState({
    symbols: ['000001', '000002', '600036'],
    weights: [0.4, 0.3, 0.3],
    startDate: '2023-01-01',
    endDate: '2024-01-01',
    initialCapital: 1000000,
    commission: 0.001,
    slippage: 0.001,
    minTradeAmount: 1000
  });

  const [isRunningBacktest, setIsRunningBacktest] = useState(false);
  const [backtestResult, setBacktestResult] = useState<any>(null);

  // 运行回测
  const runBacktest = async () => {
    setIsRunningBacktest(true);
    setBacktestResult(null);

    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 3000));

      // 模拟回测结果
      const mockResult = {
        totalReturn: 0.15,
        annualReturn: 0.12,
        maxDrawdown: 0.08,
        sharpeRatio: 1.2,
        winRate: 0.65,
        totalTrades: 24,
        profitFactor: 1.8,
        trades: [
          {
            symbol: '000001',
            side: 'buy',
            price: 48.5,
            quantity: 2000,
            timestamp: '2023-03-15',
            reason: '价格条件触发'
          },
          {
            symbol: '000001',
            side: 'sell',
            price: 58.2,
            quantity: 2000,
            timestamp: '2023-04-20',
            reason: '止盈条件触发',
            pnl: 19400
          }
        ],
        equityCurve: [
          { date: '2023-01-01', value: 1000000 },
          { date: '2023-06-01', value: 1080000 },
          { date: '2024-01-01', value: 1150000 }
        ]
      };

      setBacktestResult(mockResult);
    } catch (error) {
      console.error('回测失败:', error);
    } finally {
      setIsRunningBacktest(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* 页面标题 */}
        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-2">
            <Settings className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              交易规则配置测试
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            配置股票买卖条件，测试交易规则的回测效果
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* 交易规则配置 */}
          <div className="xl:col-span-2">
            <TradingRulesConfig
              tradingRules={tradingRules}
              onChange={setTradingRules}
            />
          </div>

          {/* 回测配置和结果 */}
          <div className="space-y-6">
            {/* 回测参数 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                回测参数
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    股票代码
                  </label>
                  <input
                    type="text"
                    value={backtestConfig.symbols.join(', ')}
                    onChange={(e) => setBacktestConfig({
                      ...backtestConfig,
                      symbols: e.target.value.split(',').map(s => s.trim())
                    })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="000001, 000002, 600036"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      开始日期
                    </label>
                    <input
                      type="date"
                      value={backtestConfig.startDate}
                      onChange={(e) => setBacktestConfig({
                        ...backtestConfig,
                        startDate: e.target.value
                      })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      结束日期
                    </label>
                    <input
                      type="date"
                      value={backtestConfig.endDate}
                      onChange={(e) => setBacktestConfig({
                        ...backtestConfig,
                        endDate: e.target.value
                      })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    初始资金 (元)
                  </label>
                  <input
                    type="number"
                    value={backtestConfig.initialCapital}
                    onChange={(e) => setBacktestConfig({
                      ...backtestConfig,
                      initialCapital: parseInt(e.target.value) || 1000000
                    })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    min="10000"
                    step="10000"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      手续费率
                    </label>
                    <input
                      type="number"
                      value={backtestConfig.commission}
                      onChange={(e) => setBacktestConfig({
                        ...backtestConfig,
                        commission: parseFloat(e.target.value) || 0.001
                      })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      min="0"
                      max="0.1"
                      step="0.0001"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      滑点
                    </label>
                    <input
                      type="number"
                      value={backtestConfig.slippage}
                      onChange={(e) => setBacktestConfig({
                        ...backtestConfig,
                        slippage: parseFloat(e.target.value) || 0.001
                      })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      min="0"
                      max="0.1"
                      step="0.0001"
                    />
                  </div>
                </div>

                <button
                  onClick={runBacktest}
                  disabled={isRunningBacktest}
                  className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
                >
                  <Play className="w-4 h-4" />
                  <span>{isRunningBacktest ? '运行中...' : '开始回测'}</span>
                </button>
              </div>
            </div>

            {/* 回测结果 */}
            {backtestResult && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  回测结果
                </h3>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="text-green-600 dark:text-green-400 font-medium">总收益率</div>
                      <div className="text-lg font-bold text-green-700 dark:text-green-300">
                        {(backtestResult.totalReturn * 100).toFixed(2)}%
                      </div>
                    </div>
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="text-blue-600 dark:text-blue-400 font-medium">年化收益</div>
                      <div className="text-lg font-bold text-blue-700 dark:text-blue-300">
                        {(backtestResult.annualReturn * 100).toFixed(2)}%
                      </div>
                    </div>
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <div className="text-red-600 dark:text-red-400 font-medium">最大回撤</div>
                      <div className="text-lg font-bold text-red-700 dark:text-red-300">
                        {(backtestResult.maxDrawdown * 100).toFixed(2)}%
                      </div>
                    </div>
                    <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <div className="text-purple-600 dark:text-purple-400 font-medium">夏普比率</div>
                      <div className="text-lg font-bold text-purple-700 dark:text-purple-300">
                        {backtestResult.sharpeRatio.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">胜率:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {(backtestResult.winRate * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">交易次数:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {backtestResult.totalTrades}
                      </span>
                    </div>
                  </div>

                  {/* 最近交易记录 */}
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                      最近交易记录
                    </h4>
                    <div className="space-y-2">
                      {backtestResult.trades.slice(0, 3).map((trade: any, index: number) => (
                        <div key={index} className="p-2 bg-gray-50 dark:bg-gray-700 rounded text-xs">
                          <div className="flex justify-between items-center">
                            <span className={`font-medium ${
                              trade.side === 'buy' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {trade.side === 'buy' ? '买入' : '卖出'} {trade.symbol}
                            </span>
                            <span className="text-gray-600 dark:text-gray-400">
                              {trade.timestamp}
                            </span>
                          </div>
                          <div className="text-gray-700 dark:text-gray-300">
                            {trade.quantity}股 @ ¥{trade.price}
                          </div>
                          {trade.pnl && (
                            <div className={`font-medium ${
                              trade.pnl > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              盈亏: ¥{trade.pnl.toLocaleString()}
                            </div>
                          )}
                          <div className="text-gray-500 dark:text-gray-400 text-xs">
                            {trade.reason}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 使用说明 */}
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800 p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-orange-800 dark:text-orange-200 mb-2">
                    使用说明
                  </h4>
                  <ul className="text-xs text-orange-700 dark:text-orange-300 space-y-1">
                    <li>• 在左侧配置买卖条件和风险控制参数</li>
                    <li>• 设置回测的股票代码、时间范围和初始资金</li>
                    <li>• 点击"开始回测"查看交易规则的历史表现</li>
                    <li>• 根据回测结果调整和优化交易规则</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 当前配置预览 */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            当前交易规则配置预览
          </h3>
          <pre className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg text-sm overflow-x-auto">
            {JSON.stringify(tradingRules, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
});

export default TradingRulesTestPage;