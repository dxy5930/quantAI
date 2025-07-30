import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X, Building2, Loader2 } from 'lucide-react';
import { StockPosition } from '../../types';
import { StockOption } from '../../services/api/stocksApi';
import { useStockSearch } from '../../hooks/useStockSearch';
import { useCompositionInput } from '../../hooks/useCompositionInput';

interface DynamicStockSelectorProps {
  selectedStocks: StockPosition[];
  onStocksChange: (stocks: StockPosition[]) => void;
  maxSelections?: number;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export const DynamicStockSelector: React.FC<DynamicStockSelectorProps> = ({
  selectedStocks,
  onStocksChange,
  maxSelections = 10,
  disabled = false,
  placeholder = "搜索股票代码或名称...",
  className = ""
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [inputValue, setInputValue] = useState(''); // 本地输入值，立即更新显示
  const [position, setPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 使用股票搜索hook
  const {
    searchTerm,
    setSearchTerm,
    searchResults,
    isLoading,
    error,
    clearSearch
  } = useStockSearch({
    debounceMs: 300,
    minSearchLength: 1
  });

  // 使用中文输入法优化hook
  const {
    isComposing,
    handleInputChange: handleCompositionInputChange,
    handleCompositionStart,
    handleCompositionEnd
  } = useCompositionInput({
    onChange: setSearchTerm,
    debounceMs: 300
  });

  // 同步searchTerm到inputValue
  useEffect(() => {
    setInputValue(searchTerm);
  }, [searchTerm]);

  // 过滤已选择的股票
  const filteredResults = searchResults.filter(stock => 
    !selectedStocks.some(selected => selected.symbol === stock.symbol)
  );

  // 处理添加股票
  const handleAddStock = (stock: StockOption) => {
    if (selectedStocks.length >= maxSelections) {
      // 显示提示信息但不阻止输入
      return;
    }
    
    const newStock: StockPosition = {
      symbol: stock.symbol,
      name: stock.name,
      weight: 0,
      sector: stock.sector || '',
      marketCap: stock.marketCap || 0
    };
    
    onStocksChange([...selectedStocks, newStock]);
    setShowDropdown(false);
    clearSearch();
    setInputValue(''); // 同时清空本地输入值
    // 清空输入框但保持焦点
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // 处理移除股票
  const handleRemoveStock = (symbol: string) => {
    onStocksChange(selectedStocks.filter(s => s.symbol !== symbol));
  };

  // 处理输入框焦点
  const handleInputFocus = () => {
    if (!disabled) {
      setShowDropdown(true);
    }
  };

  // 处理输入框失焦
  const handleInputBlur = () => {
    setTimeout(() => {
      if (containerRef.current && !containerRef.current.contains(document.activeElement)) {
        setShowDropdown(false);
      }
    }, 150);
  };

  // 处理输入框变化，参考StrategySearchInput的实现
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // 立即更新显示值
    setInputValue(newValue);
    
    // 调用中文输入法优化处理（用于防抖搜索）
    handleCompositionInputChange(e);
    
    // 控制下拉框显示
    if (newValue.length > 0 && !disabled) {
      setShowDropdown(true);
    } else if (newValue.length === 0) {
      setShowDropdown(false);
    }
  };

  // 更新下拉框位置的函数
  const updateDropdownPosition = useCallback(() => {
    if (showDropdown && inputRef.current && dropdownRef.current) {
      const inputRect = inputRef.current.getBoundingClientRect();
      const dropdownRect = dropdownRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const spacing = 4;

      let top = inputRect.bottom + spacing;
      let left = inputRect.left;
      const width = inputRect.width;

      // 如果下方空间不足，显示在上方
      if (top + dropdownRect.height > viewportHeight - 16) {
        top = inputRect.top - dropdownRect.height - spacing;
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
  }, [showDropdown]);

  // 初始位置更新
  useEffect(() => {
    updateDropdownPosition();
  }, [updateDropdownPosition]);

  // 监听滚动和窗口大小变化，实时更新下拉框位置
  useEffect(() => {
    if (!showDropdown) return;

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
  }, [showDropdown, updateDropdownPosition]);

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDropdown]);

  // 格式化市值
  const formatMarketCap = (marketCap: number) => {
    if (!marketCap || marketCap === 0) return '';
    if (marketCap >= 1000000000000) {
      return `${(marketCap / 1000000000000).toFixed(1)}万亿`;
    } else if (marketCap >= 1000000000) {
      return `${(marketCap / 1000000000).toFixed(0)}亿`;
    }
    return `${marketCap}`;
  };

  return (
    <div className={`space-y-4 ${className}`} ref={containerRef}>
      {/* 已选择的股票 */}
      {selectedStocks.length > 0 && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            已选择股票 ({selectedStocks.length}/{maxSelections})
          </label>
          <div className="flex flex-wrap gap-2">
            {selectedStocks.map((stock) => (
              <div
                key={stock.symbol}
                className="flex items-center space-x-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2"
              >
                <Building2 className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  {stock.symbol}
                </span>
                <span className="text-sm text-blue-700 dark:text-blue-300">
                  {stock.name}
                </span>
                {!disabled && (
                  <button
                    onClick={() => handleRemoveStock(stock.symbol)}
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 直接显示的搜索输入框 */}
      {!disabled && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            股票组合
          </label>
          
          <div className="relative">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onCompositionStart={handleCompositionStart}
                onCompositionEnd={handleCompositionEnd}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                placeholder={placeholder}
                disabled={disabled}
                className={`w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${
                  isComposing ? 'border-yellow-400 dark:border-yellow-500' : ''
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                autoComplete="off"
              />
              
              {/* 搜索图标 */}
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <Search className="w-4 h-4 text-gray-400" />
              </div>
              
              {/* 加载图标或清空按钮 */}
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {isLoading ? (
                  <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                ) : inputValue && (
                  <button
                    onClick={() => {
                      clearSearch();
                      setInputValue('');
                      setShowDropdown(false);
                      inputRef.current?.focus();
                    }}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* 搜索结果下拉框 */}
            {showDropdown && (
              <div 
                ref={dropdownRef}
                className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-64 overflow-y-auto"
                style={position ? { 
                  top: position.top, 
                  left: position.left, 
                  width: position.width 
                } : { opacity: 0 }}
              >
                {error ? (
                  <div className="px-4 py-3 text-red-500 dark:text-red-400 text-center">
                    {error}
                  </div>
                ) : filteredResults.length > 0 ? (
                  filteredResults.map((stock) => (
                    <button
                      key={stock.symbol}
                      onClick={() => handleAddStock(stock)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors duration-150"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Building2 className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {stock.symbol}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {stock.name}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {stock.sector}
                          </div>
                                                      <div className="text-xs text-gray-500 dark:text-gray-400">
                              {formatMarketCap(stock.marketCap || 0)}
                            </div>
                        </div>
                      </div>
                    </button>
                  ))
                ) : inputValue && !isLoading ? (
                  <div className="px-4 py-3 text-gray-500 dark:text-gray-400 text-center">
                    没有找到匹配的股票
                  </div>
                ) : null}
              </div>
            )}
            
            {/* 提示文本 */}
            {inputValue && !showDropdown && !isLoading && (
              <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                关于股票查询的基本信息: PE、PB、ROE等
              </div>
            )}
          </div>
        </div>
      )}

      {/* 已达到最大选择数的提示 */}
      {selectedStocks.length >= maxSelections && (
        <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
          已达到最大选择数量 ({maxSelections})
        </div>
      )}
    </div>
  );
}; 