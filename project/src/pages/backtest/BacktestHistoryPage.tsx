import React from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '../../hooks/useStore';
import { History, TrendingUp, TrendingDown, Calendar, BarChart3 } from 'lucide-react';
import { safeToPercent, safeToFixed, safePercentValue } from '../../utils/formatters';

const BacktestHistoryPage: React.FC = observer(() => {
  const { strategy } = useStore();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <History className="h-8 w-8 text-blue-400" />
          <h1 className="text-3xl font-bold text-white">回测历史</h1>
        </div>
      </div>

      {strategy?.backtestHistory?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {strategy.backtestHistory.map((result, index) => (
            <div key={index} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-blue-400" />
                  <span className="text-white font-medium">回测 #{index + 1}</span>
                </div>
                <div className="flex items-center space-x-1 text-gray-400 text-sm">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date().toLocaleDateString()}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">总收益率</span>
                  <div className="flex items-center space-x-1">
                    {result.totalReturn >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-400" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-400" />
                    )}
                    <span className={`font-medium ${result.totalReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {result.totalReturn > 0 ? '+' : ''}{safePercentValue(result.totalReturn, 2)}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-400">年化收益率</span>
                  <span className="text-white font-medium">{safePercentValue(result.annualReturn, 2)}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-400">夏普比率</span>
                  <span className="text-white font-medium">{safeToFixed(result.sharpeRatio, 2)}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-400">最大回撤</span>
                  <span className="text-red-400 font-medium">{safePercentValue(result.maxDrawdown, 2)}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-400">胜率</span>
                  <span className="text-white font-medium">{safePercentValue(result.winRate, 1)}</span>
                </div>
              </div>

              <button className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors">
                查看详情
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <History className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-400 mb-2">暂无回测历史</h3>
          <p className="text-gray-500">开始您的第一次策略回测吧！</p>
        </div>
      )}
    </div>
  );
});

export default BacktestHistoryPage; 