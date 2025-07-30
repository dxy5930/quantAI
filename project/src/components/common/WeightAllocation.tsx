import React, { useState, useEffect } from 'react';
import { StockPosition } from '../../types';
import { BarChart3, Percent, RefreshCw, AlertCircle, TrendingUp } from 'lucide-react';

interface WeightAllocationProps {
  stocks: StockPosition[];
  onWeightsChange: (stocks: StockPosition[]) => void;
  disabled?: boolean;
}

export const WeightAllocation: React.FC<WeightAllocationProps> = ({
  stocks,
  onWeightsChange,
  disabled = false
}) => {
  const [allocationMethod, setAllocationMethod] = useState<'equal' | 'custom' | 'market_cap'>('equal');
  const [customWeights, setCustomWeights] = useState<Record<string, number>>({});

  // 初始化自定义权重
  useEffect(() => {
    const weights: Record<string, number> = {};
    stocks.forEach(stock => {
      weights[stock.symbol] = stock.weight || 0;
    });
    setCustomWeights(weights);
  }, [stocks]);

  // 计算总权重
  const totalWeight = stocks.reduce((sum, stock) => sum + stock.weight, 0);

  // 等权重分配
  const handleEqualWeights = () => {
    if (stocks.length === 0) return;
    
    const equalWeight = 1 / stocks.length;
    const updatedStocks = stocks.map(stock => ({
      ...stock,
      weight: equalWeight
    }));
    
    onWeightsChange(updatedStocks);
    setAllocationMethod('equal');
  };

  // 市值加权分配
  const handleMarketCapWeights = () => {
    if (stocks.length === 0) return;
    
    const totalMarketCap = stocks.reduce((sum, stock) => sum + (stock.marketCap || 0), 0);
    if (totalMarketCap === 0) return;
    
    const updatedStocks = stocks.map(stock => ({
      ...stock,
      weight: (stock.marketCap || 0) / totalMarketCap
    }));
    
    onWeightsChange(updatedStocks);
    setAllocationMethod('market_cap');
  };

  // 自定义权重变化
  const handleCustomWeightChange = (symbol: string, weight: number) => {
    const newWeights = { ...customWeights, [symbol]: weight };
    setCustomWeights(newWeights);
    
    const updatedStocks = stocks.map(stock => ({
      ...stock,
      weight: newWeights[stock.symbol] || 0
    }));
    
    onWeightsChange(updatedStocks);
    setAllocationMethod('custom');
  };

  // 标准化权重（使总和为1）
  const normalizeWeights = () => {
    if (totalWeight === 0) return;
    
    const updatedStocks = stocks.map(stock => ({
      ...stock,
      weight: stock.weight / totalWeight
    }));
    
    onWeightsChange(updatedStocks);
  };

  // 格式化百分比
  const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;

  // 格式化市值
  const formatMarketCap = (marketCap: number) => {
    if (!marketCap || marketCap === 0) {
      return '未知';
    }
    if (marketCap >= 1000000000000) {
      return `${(marketCap / 1000000000000).toFixed(1)}万亿`;
    } else if (marketCap >= 1000000000) {
      return `${(marketCap / 1000000000).toFixed(0)}亿`;
    }
    return `${marketCap}`;
  };

  if (stocks.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>请先选择股票以配置权重</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 分配方法选择 */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          权重分配方法
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleEqualWeights}
            disabled={disabled}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-all ${
              allocationMethod === 'equal'
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
                : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
            }`}
          >
            <Percent className="w-4 h-4" />
            <span>等权重</span>
          </button>
          <button
            onClick={handleMarketCapWeights}
            disabled={disabled}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-all ${
              allocationMethod === 'market_cap'
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
                : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>市值加权</span>
          </button>
          <button
            onClick={() => setAllocationMethod('custom')}
            disabled={disabled}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-all ${
              allocationMethod === 'custom'
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
                : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>自定义</span>
          </button>
        </div>
      </div>

      {/* 权重总和提示 */}
      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center space-x-2">
          <AlertCircle className={`w-4 h-4 ${
            Math.abs(totalWeight - 1) < 0.001 
              ? 'text-green-500' 
              : 'text-orange-500'
          }`} />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            权重总和: {formatPercent(totalWeight)}
          </span>
        </div>
        {Math.abs(totalWeight - 1) > 0.001 && !disabled && (
          <button
            onClick={normalizeWeights}
            className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
          >
            <RefreshCw className="w-3 h-3" />
            <span>标准化</span>
          </button>
        )}
      </div>

      {/* 权重配置表格 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">权重配置</h3>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {stocks.map((stock) => (
            <div key={stock.symbol} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      {stock.symbol.slice(0, 2)}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {stock.symbol}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {stock.name}
                    </div>
                    {stock.marketCap && (
                      <div className="text-xs text-gray-400 dark:text-gray-500">
                        市值: {formatMarketCap(stock.marketCap)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  {/* 权重输入 */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="0"
                      max="1"
                      step="0.01"
                      value={stock.weight}
                      onChange={(e) => handleCustomWeightChange(stock.symbol, parseFloat(e.target.value) || 0)}
                      disabled={disabled || allocationMethod !== 'custom'}
                      className="w-20 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
                    />
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      ({formatPercent(stock.weight)})
                    </span>
                  </div>
                  {/* 权重条 */}
                  <div className="w-24 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(stock.weight * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 权重分布图表 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">权重分布</h3>
        <div className="space-y-2">
          {stocks.map((stock) => (
            <div key={stock.symbol} className="flex items-center space-x-3">
              <div className="w-12 text-xs text-gray-500 dark:text-gray-400">
                {stock.symbol}
              </div>
              <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-6 relative">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-6 rounded-full flex items-center justify-center transition-all duration-300"
                  style={{ width: `${Math.min(stock.weight * 100, 100)}%` }}
                >
                  {stock.weight > 0.05 && (
                    <span className="text-xs text-white font-medium">
                      {formatPercent(stock.weight)}
                    </span>
                  )}
                </div>
              </div>
              {stock.weight <= 0.05 && (
                <div className="w-12 text-xs text-gray-500 dark:text-gray-400">
                  {formatPercent(stock.weight)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}; 