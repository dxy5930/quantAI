import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Search, X, Building2 } from 'lucide-react';
import { StockPosition } from '../../types';
import { StrategySearchInput } from './StrategySearchInput';

interface StockOption {
  symbol: string;
  name: string;
  sector: string;
  marketCap: number;
  price: number;
}

interface StockSelectorProps {
  selectedStocks: StockPosition[];
  onStocksChange: (stocks: StockPosition[]) => void;
  maxSelections?: number;
  disabled?: boolean;
  onBlur?: (event: React.FocusEvent<HTMLSelectElement>) => void;
}

// 模拟股票数据
const STOCK_OPTIONS: StockOption[] = [
  { symbol: 'AAPL', name: '苹果公司', sector: '科技', marketCap: 3000000000000, price: 185.50 },
  { symbol: 'MSFT', name: '微软公司', sector: '科技', marketCap: 2800000000000, price: 420.00 },
  { symbol: 'GOOGL', name: '谷歌A类', sector: '科技', marketCap: 1800000000000, price: 145.00 },
  { symbol: 'AMZN', name: '亚马逊', sector: '电商', marketCap: 1500000000000, price: 155.00 },
  { symbol: 'TSLA', name: '特斯拉', sector: '汽车', marketCap: 700000000000, price: 220.00 },
  { symbol: 'NVDA', name: '英伟达', sector: '半导体', marketCap: 1200000000000, price: 550.00 },
  { symbol: 'META', name: 'Meta平台', sector: '科技', marketCap: 950000000000, price: 380.00 },
  { symbol: 'NFLX', name: '奈飞', sector: '媒体', marketCap: 230000000000, price: 520.00 },
  { symbol: 'CRM', name: 'Salesforce', sector: '软件', marketCap: 270000000000, price: 280.00 },
  { symbol: 'AMD', name: '超微半导体', sector: '半导体', marketCap: 250000000000, price: 160.00 },
  { symbol: 'BABA', name: '阿里巴巴', sector: '电商', marketCap: 200000000000, price: 85.00 },
  { symbol: 'JD', name: '京东', sector: '电商', marketCap: 60000000000, price: 42.00 },
  { symbol: 'BIDU', name: '百度', sector: '科技', marketCap: 45000000000, price: 130.00 },
  { symbol: 'PDD', name: '拼多多', sector: '电商', marketCap: 180000000000, price: 150.00 },
  { symbol: 'NIO', name: '蔚来', sector: '汽车', marketCap: 15000000000, price: 9.50 },
];

const SECTORS = ['全部', '科技', '半导体', '汽车', '电商', '媒体', '软件'];

export const StockSelector: React.FC<StockSelectorProps> = ({
  selectedStocks,
  onStocksChange,
  maxSelections = 10,
  disabled = false,
  onBlur
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState('全部');
  const [showDropdown, setShowDropdown] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 当搜索词变化时，显示下拉框
  useEffect(() => {
    if (searchTerm.length > 0 && !disabled && selectedStocks.length < maxSelections) {
      setShowDropdown(true);
    } else if (searchTerm.length === 0) {
      setShowDropdown(false);
    }
  }, [searchTerm, disabled, selectedStocks.length, maxSelections]);

  const filteredStocks = useMemo(() => {
    return STOCK_OPTIONS.filter(stock => {
      const matchesSearch = stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           stock.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSector = selectedSector === '全部' || stock.sector === selectedSector;
      const notSelected = !selectedStocks.some(s => s.symbol === stock.symbol);
      return matchesSearch && matchesSector && notSelected;
    });
  }, [searchTerm, selectedSector, selectedStocks]);

  const handleAddStock = (stock: StockOption) => {
    if (selectedStocks.length >= maxSelections) return;
    
    const newStock: StockPosition = {
      symbol: stock.symbol,
      name: stock.name,
      weight: 0, // 权重将在权重分配组件中设置
      sector: stock.sector,
      marketCap: stock.marketCap
    };
    
    onStocksChange([...selectedStocks, newStock]);
    setShowDropdown(false);
  };

  const handleRemoveStock = (symbol: string) => {
    onStocksChange(selectedStocks.filter(s => s.symbol !== symbol));
  };

  const handleSearchFocus = () => {
    if (searchTerm.length > 0 && !disabled && selectedStocks.length < maxSelections) {
      setShowDropdown(true);
    }
  };

  const handleSearchBlur = () => {
    // 检查失焦后的焦点是否还在容器内
    setTimeout(() => {
      if (containerRef.current && !containerRef.current.contains(document.activeElement)) {
        setShowDropdown(false);
        // 失焦时清空搜索内容
        setSearchTerm('');
      }
    }, 150);
  };

  const handleSectorBlur = (event: React.FocusEvent<HTMLSelectElement>) => {
    // 调用外部传入的onBlur回调
    if (onBlur) {
      onBlur(event);
    }
  };

  // 更新下拉框位置的函数
  const updateDropdownPosition = useCallback(() => {
    if (showDropdown && containerRef.current && dropdownRef.current) {
      // 查找输入框元素
      const inputElement = containerRef.current.querySelector('input');
      if (!inputElement) return;

      const inputRect = inputElement.getBoundingClientRect();
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

  return (
    <div className="space-y-4" ref={containerRef}>
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

      {/* 添加股票 */}
      {!disabled && selectedStocks.length < maxSelections && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            添加股票
          </label>
          <div className="relative">
            <div className="flex space-x-2">
              <div className="flex-1">
                <StrategySearchInput
                  value={searchTerm}
                  onChange={setSearchTerm}
                  onFocus={handleSearchFocus}
                  onBlur={handleSearchBlur}
                  placeholder="搜索股票代码或名称..."
                  className="min-w-0"
                />
              </div>
              <select
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                onBlur={handleSectorBlur}
                className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
              >
                {SECTORS.map(sector => (
                  <option key={sector} value={sector}>{sector}</option>
                ))}
              </select>
            </div>

            {/* 下拉选项 */}
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
                {filteredStocks.length > 0 ? (
                  filteredStocks.map((stock) => (
                    <button
                      key={stock.symbol}
                      onClick={() => handleAddStock(stock)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
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
                            ${stock.price}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {stock.sector} • {formatMarketCap(stock.marketCap)}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-gray-500 dark:text-gray-400 text-center">
                    没有找到匹配的股票
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}; 