/**
 * 股票持仓输入组件 - 模块化版本
 * Stock Input Modal Component - Modular Version
 */

import React, { useState } from 'react';
import { Plus, Minus, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { StockInputModalProps, StockPosition } from '../types';

export const StockInputModal: React.FC<StockInputModalProps> = ({
  isOpen,
  onClose,
  onConfirm
}) => {
  const [positions, setPositions] = useState<StockPosition[]>([
    {
      symbol: '',
      name: '',
      buyPrice: 0,
      sellPrice: undefined,
      quantity: 0,
      profit: 0,
      profitRate: 0
    }
  ]);

  const addPosition = () => {
    setPositions([...positions, {
      symbol: '',
      name: '',
      buyPrice: 0,
      sellPrice: undefined,
      quantity: 0,
      profit: 0,
      profitRate: 0
    }]);
  };

  const removePosition = (index: number) => {
    if (positions.length > 1) {
      setPositions(positions.filter((_, i) => i !== index));
    }
  };

  const updatePosition = (index: number, field: keyof StockPosition, value: string | number) => {
    const newPositions = [...positions];
    (newPositions[index] as any)[field] = value;
    
    // 自动计算盈亏
    const pos = newPositions[index];
    if (pos.buyPrice > 0 && pos.sellPrice && pos.quantity > 0) {
      pos.profit = (pos.sellPrice - pos.buyPrice) * pos.quantity;
      pos.profitRate = ((pos.sellPrice - pos.buyPrice) / pos.buyPrice) * 100;
    }
    
    setPositions(newPositions);
  };

  const handleConfirm = () => {
    const validPositions = positions.filter(p => 
      p.symbol.trim() && p.name.trim() && p.buyPrice > 0 && p.quantity > 0
    );
    onConfirm(validPositions);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            输入股票持仓信息
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {positions.map((position:any, index) => (
            <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  持仓 {index + 1}
                </h4>
                <div className="flex items-center space-x-2">
                  {position.profit !== undefined && (
                    <span className={`px-2 py-1 rounded text-sm font-medium ${
                      position.profit >= 0 
                        ? 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30'
                        : 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30'
                    }`}>
                      {position.profit >= 0 ? <TrendingUp className="w-4 h-4 inline mr-1" /> : <TrendingDown className="w-4 h-4 inline mr-1" />}
                      {position.profit >= 0 ? '+' : ''}{position.profit?.toFixed(2)}元
                      ({position.profitRate >= 0 ? '+' : ''}{position.profitRate?.toFixed(2)}%)
                    </span>
                  )}
                  {positions.length > 1 && (
                    <button
                      onClick={() => removePosition(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    股票代码
                  </label>
                  <input
                    type="text"
                    value={position.symbol}
                    onChange={(e) => updatePosition(index, 'symbol', e.target.value)}
                    placeholder="如：000001"
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    股票名称
                  </label>
                  <input
                    type="text"
                    value={position.name}
                    onChange={(e) => updatePosition(index, 'name', e.target.value)}
                    placeholder="如：平安银行"
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    买入价格
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={position.buyPrice || ''}
                    onChange={(e) => updatePosition(index, 'buyPrice', parseFloat(e.target.value) || 0)}
                    placeholder="买入价"
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    卖出价格
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={position.sellPrice || ''}
                    onChange={(e) => updatePosition(index, 'sellPrice', parseFloat(e.target.value))}
                    placeholder="卖出价（可选）"
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    持仓数量
                  </label>
                  <input
                    type="number"
                    value={position.quantity || ''}
                    onChange={(e) => updatePosition(index, 'quantity', parseInt(e.target.value) || 0)}
                    placeholder="股数"
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={addPosition}
            className="w-full py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-blue-500 hover:text-blue-500 transition-colors flex items-center justify-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>添加持仓</span>
          </button>
        </div>

        <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2"
          >
            <DollarSign className="w-4 h-4" />
            <span>开始AI分析</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default StockInputModal;