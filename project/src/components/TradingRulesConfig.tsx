import React, { useState } from 'react';
import { Plus, Trash2, Info, AlertTriangle } from 'lucide-react';

// 交易条件类型
interface TradingCondition {
  type: 'price' | 'technical' | 'fundamental' | 'time';
  operator: '>' | '<' | '>=' | '<=' | '=' | 'cross_above' | 'cross_below';
  value: number | string;
  indicator?: string;
  period?: number;
  description?: string;
}

// 交易规则类型
interface TradingRule {
  buyConditions: TradingCondition[];
  buyAmount: number;
  buyAmountType: 'fixed' | 'percentage';
  sellConditions: TradingCondition[];
  sellAmount: number;
  sellAmountType: 'fixed' | 'percentage';
  stopLoss?: number;
  takeProfit?: number;
  maxPositionSize?: number;
  minHoldingPeriod?: number;
  maxHoldingPeriod?: number;
}

interface TradingRulesConfigProps {
  tradingRules?: TradingRule;
  onChange: (rules: TradingRule) => void;
  className?: string;
}

const TradingRulesConfig: React.FC<TradingRulesConfigProps> = ({
  tradingRules,
  onChange,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'buy' | 'sell' | 'risk'>('buy');

  // 默认交易规则
  const defaultRules: TradingRule = {
    buyConditions: [],
    buyAmount: 10000,
    buyAmountType: 'fixed',
    sellConditions: [],
    sellAmount: 1.0,
    sellAmountType: 'percentage',
    stopLoss: -0.1,
    takeProfit: 0.2,
    maxPositionSize: 0.3,
    minHoldingPeriod: 1,
    maxHoldingPeriod: 30
  };

  const rules = tradingRules || defaultRules;

  // 更新规则
  const updateRules = (updates: Partial<TradingRule>) => {
    onChange({ ...rules, ...updates });
  };

  // 添加买入条件
  const addBuyCondition = () => {
    const newCondition: TradingCondition = {
      type: 'price',
      operator: '<',
      value: 50,
      description: '股价低于50元时买入'
    };
    updateRules({
      buyConditions: [...rules.buyConditions, newCondition]
    });
  };

  // 添加卖出条件
  const addSellCondition = () => {
    const newCondition: TradingCondition = {
      type: 'price',
      operator: '>',
      value: 60,
      description: '股价高于60元时卖出'
    };
    updateRules({
      sellConditions: [...rules.sellConditions, newCondition]
    });
  };

  // 更新买入条件
  const updateBuyCondition = (index: number, updates: Partial<TradingCondition>) => {
    const newConditions = [...rules.buyConditions];
    newConditions[index] = { ...newConditions[index], ...updates };
    updateRules({ buyConditions: newConditions });
  };

  // 更新卖出条件
  const updateSellCondition = (index: number, updates: Partial<TradingCondition>) => {
    const newConditions = [...rules.sellConditions];
    newConditions[index] = { ...newConditions[index], ...updates };
    updateRules({ sellConditions: newConditions });
  };

  // 删除买入条件
  const removeBuyCondition = (index: number) => {
    const newConditions = rules.buyConditions.filter((_, i) => i !== index);
    updateRules({ buyConditions: newConditions });
  };

  // 删除卖出条件
  const removeSellCondition = (index: number) => {
    const newConditions = rules.sellConditions.filter((_, i) => i !== index);
    updateRules({ sellConditions: newConditions });
  };

  // 条件类型选项
  const conditionTypes = [
    { value: 'price', label: '价格条件' },
    { value: 'technical', label: '技术指标' },
    { value: 'fundamental', label: '基本面' },
    { value: 'time', label: '时间条件' }
  ];

  // 操作符选项
  const operators = [
    { value: '>', label: '大于 (>)' },
    { value: '<', label: '小于 (<)' },
    { value: '>=', label: '大于等于 (>=)' },
    { value: '<=', label: '小于等于 (<=)' },
    { value: '=', label: '等于 (=)' },
    { value: 'cross_above', label: '向上突破' },
    { value: 'cross_below', label: '向下跌破' }
  ];

  // 技术指标选项
  const indicators = [
    { value: 'MA', label: '移动平均线 (MA)' },
    { value: 'RSI', label: '相对强弱指数 (RSI)' },
    { value: 'MACD', label: 'MACD指标' },
    { value: 'KDJ', label: 'KDJ指标' },
    { value: 'BOLL', label: '布林带 (BOLL)' }
  ];

  // 渲染条件配置
  const renderCondition = (
    condition: TradingCondition,
    index: number,
    type: 'buy' | 'sell'
  ) => {
    const updateCondition = type === 'buy' ? updateBuyCondition : updateSellCondition;
    const removeCondition = type === 'buy' ? removeBuyCondition : removeSellCondition;

    return (
      <div key={index} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
            {type === 'buy' ? '买入' : '卖出'}条件 {index + 1}
          </h4>
          <button
            onClick={() => removeCondition(index)}
            className="text-red-500 hover:text-red-700 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 条件类型 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              条件类型
            </label>
            <select
              value={condition.type}
              onChange={(e) => updateCondition(index, { type: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              {conditionTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          {/* 技术指标（仅当类型为technical时显示） */}
          {condition.type === 'technical' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                技术指标
              </label>
              <select
                value={condition.indicator || ''}
                onChange={(e) => updateCondition(index, { indicator: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="">请选择指标</option>
                {indicators.map(indicator => (
                  <option key={indicator.value} value={indicator.value}>{indicator.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* 操作符 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              操作符
            </label>
            <select
              value={condition.operator}
              onChange={(e) => updateCondition(index, { operator: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              {operators.map(op => (
                <option key={op.value} value={op.value}>{op.label}</option>
              ))}
            </select>
          </div>

          {/* 条件值 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              条件值
            </label>
            <input
              type="number"
              value={condition.value}
              onChange={(e) => updateCondition(index, { value: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="输入数值"
            />
          </div>

          {/* 指标周期（仅当类型为technical时显示） */}
          {condition.type === 'technical' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                指标周期
              </label>
              <input
                type="number"
                value={condition.period || 20}
                onChange={(e) => updateCondition(index, { period: parseInt(e.target.value) || 20 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="20"
                min="1"
                max="250"
              />
            </div>
          )}

          {/* 条件描述 */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              条件描述
            </label>
            <input
              type="text"
              value={condition.description || ''}
              onChange={(e) => updateCondition(index, { description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="描述这个条件的作用"
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-6">
          <AlertTriangle className="w-5 h-5 text-orange-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            交易规则配置
          </h3>
          <div className="group relative">
            <Info className="w-4 h-4 text-gray-400 cursor-help" />
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
              配置股票买卖的具体条件和规则
            </div>
          </div>
        </div>

        {/* 标签页 */}
        <div className="flex space-x-1 mb-6 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          {[
            { key: 'buy', label: '买入条件', icon: '📈' },
            { key: 'sell', label: '卖出条件', icon: '📉' },
            { key: 'risk', label: '风险控制', icon: '🛡️' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* 买入条件配置 */}
        {activeTab === 'buy' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-md font-medium text-gray-900 dark:text-white">
                买入条件设置
              </h4>
              <button
                onClick={addBuyCondition}
                className="flex items-center space-x-2 px-3 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>添加条件</span>
              </button>
            </div>

            {rules.buyConditions.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p>暂无买入条件，点击"添加条件"开始配置</p>
              </div>
            ) : (
              <div className="space-y-4">
                {rules.buyConditions.map((condition, index) =>
                  renderCondition(condition, index, 'buy')
                )}
              </div>
            )}

            {/* 买入金额设置 */}
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                买入金额设置
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    买入类型
                  </label>
                  <select
                    value={rules.buyAmountType}
                    onChange={(e) => updateRules({ buyAmountType: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="fixed">固定金额</option>
                    <option value="percentage">按比例</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {rules.buyAmountType === 'fixed' ? '买入金额 (元)' : '买入比例 (0-1)'}
                  </label>
                  <input
                    type="number"
                    value={rules.buyAmount}
                    onChange={(e) => updateRules({ buyAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder={rules.buyAmountType === 'fixed' ? '10000' : '0.2'}
                    min="0"
                    max={rules.buyAmountType === 'percentage' ? '1' : undefined}
                    step={rules.buyAmountType === 'percentage' ? '0.01' : '100'}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 卖出条件配置 */}
        {activeTab === 'sell' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-md font-medium text-gray-900 dark:text-white">
                卖出条件设置
              </h4>
              <button
                onClick={addSellCondition}
                className="flex items-center space-x-2 px-3 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>添加条件</span>
              </button>
            </div>

            {rules.sellConditions.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p>暂无卖出条件，点击"添加条件"开始配置</p>
              </div>
            ) : (
              <div className="space-y-4">
                {rules.sellConditions.map((condition, index) =>
                  renderCondition(condition, index, 'sell')
                )}
              </div>
            )}

            {/* 卖出数量设置 */}
            <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                卖出数量设置
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    卖出类型
                  </label>
                  <select
                    value={rules.sellAmountType}
                    onChange={(e) => updateRules({ sellAmountType: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="fixed">固定数量</option>
                    <option value="percentage">按比例</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {rules.sellAmountType === 'fixed' ? '卖出数量 (股)' : '卖出比例 (0-1)'}
                  </label>
                  <input
                    type="number"
                    value={rules.sellAmount}
                    onChange={(e) => updateRules({ sellAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder={rules.sellAmountType === 'fixed' ? '1000' : '1.0'}
                    min="0"
                    max={rules.sellAmountType === 'percentage' ? '1' : undefined}
                    step={rules.sellAmountType === 'percentage' ? '0.01' : '100'}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 风险控制配置 */}
        {activeTab === 'risk' && (
          <div className="space-y-6">
            <h4 className="text-md font-medium text-gray-900 dark:text-white">
              风险控制设置
            </h4>

            {/* 止损止盈 */}
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                止损止盈设置
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    止损比例 (负数)
                  </label>
                  <input
                    type="number"
                    value={rules.stopLoss || ''}
                    onChange={(e) => updateRules({ stopLoss: parseFloat(e.target.value) || undefined })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="-0.1 (表示-10%)"
                    max="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    止盈比例 (正数)
                  </label>
                  <input
                    type="number"
                    value={rules.takeProfit || ''}
                    onChange={(e) => updateRules({ takeProfit: parseFloat(e.target.value) || undefined })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="0.2 (表示+20%)"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>

            {/* 持仓控制 */}
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                持仓控制设置
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    最大持仓比例 (0-1)
                  </label>
                  <input
                    type="number"
                    value={rules.maxPositionSize || ''}
                    onChange={(e) => updateRules({ maxPositionSize: parseFloat(e.target.value) || undefined })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="0.3 (表示30%)"
                    min="0"
                    max="1"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    最小持有天数
                  </label>
                  <input
                    type="number"
                    value={rules.minHoldingPeriod || ''}
                    onChange={(e) => updateRules({ minHoldingPeriod: parseInt(e.target.value) || undefined })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="1"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    最大持有天数
                  </label>
                  <input
                    type="number"
                    value={rules.maxHoldingPeriod || ''}
                    onChange={(e) => updateRules({ maxHoldingPeriod: parseInt(e.target.value) || undefined })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="30"
                    min="1"
                  />
                </div>
              </div>
            </div>

            {/* 风险提示 */}
            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5" />
                <div>
                  <h6 className="text-sm font-medium text-orange-800 dark:text-orange-200 mb-2">
                    风险提示
                  </h6>
                  <ul className="text-xs text-orange-700 dark:text-orange-300 space-y-1">
                    <li>• 交易规则基于历史数据回测，实际效果可能有差异</li>
                    <li>• 建议设置合理的止损比例，控制单笔损失</li>
                    <li>• 最大持仓比例建议不超过50%，保持资金分散</li>
                    <li>• 技术指标存在滞后性，需结合市场环境判断</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TradingRulesConfig;