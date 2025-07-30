import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, X, Search, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { StockPosition } from '../../types';

interface StockOption {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: string;
  sector: string;
}

interface EnhancedStockSelectorProps {
  selectedStocks: StockPosition[];
  onStocksChange: (stocks: StockPosition[]) => void;
  disabled?: boolean;
  maxSelections?: number;
}

// 模拟股票数据
const MOCK_STOCKS: StockOption[] = [
  { symbol: 'AAPL', name: '苹果公司', price: 175.43, change: 2.15, changePercent: 1.24, volume: 45234567, marketCap: '2.8T', sector: '科技' },
  { symbol: 'TSLA', name: '特斯拉', price: 248.50, change: -5.23, changePercent: -2.06, volume: 89234567, marketCap: '789B', sector: '汽车' },
  { symbol: 'MSFT', name: '微软', price: 378.85, change: 4.67, changePercent: 1.25, volume: 23456789, marketCap: '2.9T', sector: '科技' },
  { symbol: 'NVDA', name: '英伟达', price: 875.28, change: 15.42, changePercent: 1.79, volume: 67890123, marketCap: '2.1T', sector: '科技' },
  { symbol: 'AMZN', name: '亚马逊', price: 145.86, change: -1.23, changePercent: -0.84, volume: 34567890, marketCap: '1.5T', sector: '消费' },
  { symbol: 'GOOGL', name: '谷歌', price: 138.21, change: 2.89, changePercent: 2.13, volume: 28901234, marketCap: '1.7T', sector: '科技' },
  { symbol: 'META', name: 'Meta', price: 484.20, change: 8.45, changePercent: 1.78, volume: 19876543, marketCap: '1.2T', sector: '科技' },
  { symbol: 'BRK.B', name: '伯克希尔', price: 421.35, change: 1.25, changePercent: 0.30, volume: 3456789, marketCap: '900B', sector: '金融' },
  { symbol: 'JNJ', name: '强生', price: 156.78, change: -0.45, changePercent: -0.29, volume: 8765432, marketCap: '420B', sector: '医疗' },
  { symbol: 'V', name: 'Visa', price: 267.89, change: 3.21, changePercent: 1.21, volume: 5432109, marketCap: '580B', sector: '金融' }
];

interface DropdownSelectorProps {
  onSelect: (stock: StockOption) => void;
  excludeSymbols: string[];
  placeholder?: string;
  onBlur?: (event: React.FocusEvent<HTMLButtonElement>) => void;
}

const DropdownSelector: React.FC<DropdownSelectorProps> = ({
  onSelect,
  excludeSymbols,
  placeholder = "选择股票...",
  onBlur
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStock, setSelectedStock] = useState<StockOption | null>(null);
  const [position, setPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const filteredStocks = MOCK_STOCKS.filter(stock => 
    !excludeSymbols.includes(stock.symbol) &&
    (stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
     stock.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSelect = (stock: StockOption) => {
    setSelectedStock(stock);
    onSelect(stock);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  // 处理搜索框失焦
  const handleSearchBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    // 检查失焦后的焦点是否还在下拉框内
    setTimeout(() => {
      if (dropdownRef.current && !dropdownRef.current.contains(document.activeElement)) {
        setIsOpen(false);
        // 失焦时清空搜索内容
        setSearchTerm('');
      }
    }, 150);
  };

  // 处理按钮失焦
  const handleButtonBlur = (event: React.FocusEvent<HTMLButtonElement>) => {
    // 检查失焦后的焦点是否还在下拉框内
    setTimeout(() => {
      if (dropdownRef.current && !dropdownRef.current.contains(document.activeElement)) {
        setIsOpen(false);
      }
    }, 150);
    
    // 调用外部传入的onBlur回调
    if (onBlur) {
      onBlur(event);
    }
  };

  // 更新下拉框位置的函数
  const updateDropdownPosition = useCallback(() => {
    if (isOpen && triggerRef.current && menuRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const menuRect = menuRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const spacing = 4;

      let top = triggerRect.bottom + spacing;
      let left = triggerRect.left;
      const width = triggerRect.width;

      // 如果下方空间不足，显示在上方
      if (top + menuRect.height > viewportHeight - 16) {
        top = triggerRect.top - menuRect.height - spacing;
      }

      // 如果上方空间也不足，调整到视窗内
      if (top < 16) {
        top = 16;
      }

      // 水平边界检查
      if (left + width > window.innerWidth - 16) {
        left = window.innerWidth - width - 16;
      }
      if (left < 16) {
        left = 16;
      }

      setPosition({ top, left, width });
    }
  }, [isOpen]);

  // 初始位置更新
  useEffect(() => {
    updateDropdownPosition();
  }, [updateDropdownPosition]);

  // 监听滚动和窗口大小变化，实时更新下拉框位置
  useEffect(() => {
    if (!isOpen) return;

    const handlePositionUpdate = () => {
      updateDropdownPosition();
    };

    // 添加事件监听器
    window.addEventListener('scroll', handlePositionUpdate, true);
    window.addEventListener('resize', handlePositionUpdate);

    // 清理函数
    return () => {
      window.removeEventListener('scroll', handlePositionUpdate, true);
      window.removeEventListener('resize', handlePositionUpdate);
    };
  }, [isOpen, updateDropdownPosition]);

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        ref={triggerRef}
        onClick={handleToggle}
        onBlur={handleButtonBlur}
        className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-left text-gray-900 dark:text-white hover:border-blue-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
      >
        {selectedStock ? (
          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium">{selectedStock.symbol}</span>
              <span className="text-gray-500 dark:text-gray-400 ml-2">{selectedStock.name}</span>
            </div>
            <div className="text-right">
              <div className="font-medium">${selectedStock.price}</div>
              <div className={`text-sm flex items-center ${
                selectedStock.change >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {selectedStock.change >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                {selectedStock.changePercent.toFixed(2)}%
              </div>
            </div>
          </div>
        ) : (
          <span className="text-gray-500 dark:text-gray-400">{placeholder}</span>
        )}
      </button>

      {isOpen && (
        <div 
          ref={menuRef}
          className="fixed bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50 max-h-80 overflow-hidden"
          style={position ? { 
            top: position.top, 
            left: position.left, 
            width: position.width 
          } : { opacity: 0 }}
        >
          <div className="p-3 border-b border-gray-200 dark:border-gray-600">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索股票..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onCompositionStart={() => {}}
                onCompositionEnd={(e) => setSearchTerm((e.target as HTMLInputElement).value)}
                onBlur={handleSearchBlur}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filteredStocks.map((stock) => (
              <button
                key={stock.symbol}
                onClick={() => handleSelect(stock)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900 dark:text-white">{stock.symbol}</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">{stock.name}</span>
                      <span className="text-xs bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 px-2 py-1 rounded">
                        {stock.sector}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                市值: {stock.marketCap} | 成交量: {(Number(stock.volume) / 1000000).toFixed(1)}M
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900 dark:text-white">${stock.price}</div>
                    <div className={`text-sm flex items-center justify-end ${
                      stock.change >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stock.change >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                      {stock.changePercent.toFixed(2)}%
                    </div>
                  </div>
                </div>
              </button>
            ))}
            {filteredStocks.length === 0 && (
              <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                没有找到匹配的股票
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const EnhancedStockSelector: React.FC<EnhancedStockSelectorProps> = ({
  selectedStocks,
  onStocksChange,
  disabled = false,
  maxSelections = 10
}) => {
  const [dropdowns, setDropdowns] = useState<number[]>([0]);

  const handleStockSelect = (dropdownIndex: number, stock: StockOption) => {
    const newStock: StockPosition = {
      symbol: stock.symbol,
      name: stock.name,
      weight: 0,
      quantity: 0
    };

    const newSelectedStocks = [...selectedStocks];
    
    // 如果是新的选择，添加股票
    if (dropdownIndex >= newSelectedStocks.length) {
      newSelectedStocks.push(newStock);
    } else {
      // 替换现有选择
      newSelectedStocks[dropdownIndex] = newStock;
    }

    onStocksChange(newSelectedStocks);

    // 如果这是最后一个下拉框且还没达到最大选择数，添加新的下拉框
    if (dropdownIndex === dropdowns.length - 1 && selectedStocks.length < maxSelections - 1) {
      setDropdowns(prev => [...prev, prev.length]);
    }
  };

  const handleRemoveStock = (index: number) => {
    const newSelectedStocks = selectedStocks.filter((_, i) => i !== index);
    onStocksChange(newSelectedStocks);

    // 重新调整下拉框数量
    if (newSelectedStocks.length === 0) {
      setDropdowns([0]);
    } else if (dropdowns.length > newSelectedStocks.length + 1) {
      setDropdowns(prev => prev.slice(0, newSelectedStocks.length + 1));
    }
  };

  const getExcludedSymbols = () => {
    return selectedStocks.map(stock => stock.symbol);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          选择股票 ({selectedStocks.length}/{maxSelections})
        </h3>
        {selectedStocks.length > 0 && (
          <button
            onClick={() => {
              onStocksChange([]);
              setDropdowns([0]);
            }}
            className="text-sm text-red-600 hover:text-red-500 transition-colors"
            disabled={disabled}
          >
            清空所有
          </button>
        )}
      </div>

      {/* 动态下拉框 */}
      <div className="space-y-3">
        {dropdowns.map((dropdownId, index) => (
          <div key={dropdownId} className="flex items-center space-x-3">
            <div className="flex-1">
              <DropdownSelector
                onSelect={(stock) => handleStockSelect(index, stock)}
                excludeSymbols={getExcludedSymbols()}
                placeholder={index === 0 ? "选择股票..." : `选择股票...`}
              />
            </div>
            {selectedStocks[index] && (
              <button
                onClick={() => handleRemoveStock(index)}
                className="p-2 text-red-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                disabled={disabled}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* 已选股票卡片 */}
      {selectedStocks.length > 0 && (
        <div className="mt-6">
          <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
            已选择的股票
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {selectedStocks.map((stock, index) => {
              const stockData = MOCK_STOCKS.find(s => s.symbol === stock.symbol);
              return (
                <div
                  key={stock.symbol}
                  className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {stock.symbol}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {stock.name}
                      </div>
                      {stockData && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          ${stockData.price} | {stockData.sector}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveStock(index)}
                      className="p-1 text-red-600 hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                      disabled={disabled}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedStocks.length >= maxSelections && (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            已达到最大选择数量 ({maxSelections})
          </p>
        </div>
      )}
    </div>
  );
};