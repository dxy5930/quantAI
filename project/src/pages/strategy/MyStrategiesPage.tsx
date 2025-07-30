import React, { useState, useEffect, useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate, useParams } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import { useStore, useMetaData, useSearchFilter, useShare } from '../../hooks';
import { 
  Plus, 
  Edit3, 
  Share2, 
  Trash2, 
  Play, 
  Eye, 
  Heart, 
  Bookmark,
  Settings,
  Copy,
  Globe,
  Lock,
  Star,
  TrendingUp,
  Calendar,
  Search,
  Filter,
  Target,
  BarChart3
} from 'lucide-react';
import { BackButton } from '../../components';
import { MyStrategy, StrategyFormData, StockRecommendation, StockPosition, Strategy, SharedStrategy } from '../../types';
import { 
  StrategyType,
  getStrategyTypeLabel,
  getStrategyTypeColor,
  STRATEGY_TYPE_OPTIONS,
  STRATEGY_FILTER_VALUES
} from '../../constants/strategyTypes';
import { SearchFilterContainer } from '../../components/common/SearchFilterContainer';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { AdvancedMasonryGrid } from '../../components/common/AdvancedMasonryGrid';
import { EnhancedStrategyCard } from '../../components/strategy/EnhancedStrategyCard';
import { IntelligentStockRecommender } from '../../components/strategy/IntelligentStockRecommender';

import { StockSelector } from '../../components/common/StockSelector';
import { CategoryDropdown } from '../../components/common/CategoryDropdown';
import { StrategyTypeDropdown } from '../../components/common/StrategyTypeDropdown';
import { SearchFilterState } from '../../hooks/useSearchFilter';

const MyStrategiesPage: React.FC = observer(() => {
  const { strategy, app, user } = useStore();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [editingStrategy, setEditingStrategy] = useState<MyStrategy | null>(null);

  // 使用自定义hook加载meta数据
  const { categories, strategyTypes, sortOptions } = useMetaData();

  // 处理筛选条件变化的回调函数
  const handleFilterChange = useCallback((filters: SearchFilterState) => {
    // 触发重新加载我的策略数据
    strategy.loadMyStrategies({
      search: filters.searchTerm,
      category: filters.selectedCategory === STRATEGY_FILTER_VALUES.ALL ? undefined : filters.selectedCategory,
      strategyType: filters.selectedStrategyType === STRATEGY_FILTER_VALUES.ALL ? undefined : filters.selectedStrategyType,
      sortBy: 'updatedAt',
      sortOrder: 'DESC',
    });
  }, [strategy]);

  // 使用独立的搜索筛选状态
  const searchFilter = useSearchFilter({
    initialSearchTerm: '',
    initialCategory: 'all',
    initialStrategyType: 'all',
    initialSortBy: 'updatedAt',
    debounceMs: 300,
    onFilterChange: handleFilterChange
  });

  // 直接使用API返回的已筛选数据
  const filteredStrategies = strategy.myStrategies;

  // 页面初始化时加载数据
  useEffect(() => {
    // 加载我的策略数据
    strategy.loadMyStrategies({
      sortBy: 'updatedAt',
      sortOrder: 'DESC',
    });
  }, [strategy]);

  const handleCreateStockSelection = () => {
    navigate(ROUTES.CREATE_STOCK_SELECTION);
  };

  const handleCreateBacktest = () => {
    navigate(ROUTES.CREATE_BACKTEST);
  };

  const handleEditStrategy = (strategyId: string) => {
    navigate(`/my-strategies/edit/${strategyId}`);
  };

  const handleStrategyClick = (strategyItem: Strategy | SharedStrategy | MyStrategy) => {
    // 直接进入配置页面
    if (strategyItem.strategyType === StrategyType.BACKTEST) {
      navigate(`/strategy/${strategyItem.id}/backtest-config`);
    } else {
      navigate(`/strategy/${strategyItem.id}/stock-selection-config`);
    }
  };

  const { shareStrategy: handleShareStrategy } = useShare();

  const handleShare = async (strategyItem: MyStrategy) => {
    const result = await handleShareStrategy(strategyItem.id, strategyItem.name);
    
    if (result.success) {
      // 更新本地状态
      strategyItem.isShared = true;
      if (result.shareUrl && result.shareUrl.includes('/strategy-square/')) {
        strategyItem.shareId = result.shareUrl.split('/strategy-square/')[1];
      }
    }
  };

  const handleDeleteStrategy = (strategyId: string) => {
    if (window.confirm('确定要删除这个策略吗？此操作不可恢复。')) {
      app.showSuccess('策略已删除');
    }
  };

  const handleRunBacktest = (strategyItem: MyStrategy) => {
    // 将我的策略添加到全局策略列表中（如果还没有的话）
    const existingStrategy = strategy.getStrategyById(strategyItem.id);
    if (!existingStrategy) {
      strategy.addStrategy(strategyItem);
    }
    
    strategy.setSelectedStrategy(strategyItem);
    navigate(`/strategy/${strategyItem.id}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };



  // 处理路由参数变化
  useEffect(() => {
    if (id) {
      const strategyToEdit = strategy.myStrategies.find(s => s.id === id);
      if (strategyToEdit) {
        setEditingStrategy(strategyToEdit);
      } else {
        // 如果找不到策略，返回列表页面
        navigate(ROUTES.MY_STRATEGIES);
      }
    } else {
      setEditingStrategy(null);
    }
  }, [id, navigate, strategy.myStrategies]);

  // 如果显示编辑表单
  if (editingStrategy) {
    return (
      <EditStrategyForm
        strategy={editingStrategy}
        onBack={() => setEditingStrategy(null)}
        onSave={(updatedStrategy) => {
          // 这里应该调用API更新策略
          app.showSuccess('策略更新成功！');
          setEditingStrategy(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 页面标题和操作区 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">我的策略</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            管理您的个人策略，创建、编辑和分享您的交易策略
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleCreateStockSelection}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all duration-300 shadow-sm hover:shadow-glow"
          >
            <Plus className="w-5 h-5" />
            <span>创建选股策略</span>
          </button>
          <button
            onClick={handleCreateBacktest}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white rounded-lg font-medium transition-all duration-300 shadow-sm hover:shadow-glow"
          >
            <BarChart3 className="w-5 h-5" />
            <span>创建回测策略</span>
          </button>
        </div>
      </div>

      {/* 搜索和筛选区 */}
      <SearchFilterContainer
        searchTerm={searchFilter.searchTerm}
        onSearchChange={searchFilter.setSearchTerm}
        selectedCategory={searchFilter.selectedCategory}
        onCategoryChange={searchFilter.setSelectedCategory}
        selectedStrategyType={searchFilter.selectedStrategyType}
        onStrategyTypeChange={searchFilter.setSelectedStrategyType}
        config={{
          categories: categories,
          strategyTypes: strategyTypes,
          showStrategyTypes: true,
          showSort: false
        }}
      />

      {/* 策略列表 - 瀑布流布局 */}
      {strategy.myStrategiesLoading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" text="加载我的策略中..." />
        </div>
      ) : strategy.myStrategiesError ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="text-red-500 text-lg mb-4">{strategy.myStrategiesError}</div>
          <button
            onClick={() => strategy.loadMyStrategies()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            重新加载
          </button>
        </div>
      ) : filteredStrategies.length > 0 ? (
        <AdvancedMasonryGrid
          columns={{ sm: 1, md: 2, lg: 3, xl: 4 }}
          gap={24}
          className="w-full"
          itemClassName="w-full"
        >
          {filteredStrategies.map((strategyItem) => (
            <div key={strategyItem.id} className="relative group">
              <EnhancedStrategyCard
                strategy={strategyItem}
                onEdit={() => setEditingStrategy(strategyItem)}
                onShare={() => handleShare(strategyItem)}
                onDelete={() => handleDeleteStrategy(strategyItem.id)}
                onSelect={handleStrategyClick}
                showActions={true}
                variant="my-strategy"
              />
            </div>
          ))}
        </AdvancedMasonryGrid>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="text-gray-400 dark:text-gray-600 mb-4">
            <Search className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {searchFilter.hasActiveFilters 
              ? '没有找到匹配的策略' 
              : '还没有创建策略'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {searchFilter.hasActiveFilters
              ? '尝试调整搜索条件或筛选器'
              : '开始创建您的第一个策略'}
          </p>
        </div>
      )}
    </div>
  );
});

// 编辑策略表单组件
const EditStrategyForm: React.FC<{ strategy: MyStrategy; onBack: () => void; onSave: (updatedStrategy: MyStrategy) => void; }> = ({ strategy, onBack, onSave }) => {
  const { app } = useStore();
  const [formData, setFormData] = useState<StrategyFormData>({
    name: strategy.name,
    description: strategy.description,
    icon: strategy.icon,
    category: strategy.category,
    strategyType: strategy.strategyType,
    difficulty: strategy.difficulty,
    parameters: strategy.parameters || [],
    tags: strategy.tags,
    isPublic: strategy.isPublic
  });
  const [stockRecommendations, setStockRecommendations] = useState<StockRecommendation[]>([]);
  const [selectedStocks, setSelectedStocks] = useState<StockPosition[]>([]);
  const [positions, setPositions] = useState<StockPosition[]>([]);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedStrategy: MyStrategy = { ...strategy, ...formData, updatedAt: new Date().toISOString() };
    onSave(updatedStrategy);
  };
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center space-x-4">
        <BackButton 
          onBack={onBack}
          variant="minimal"
        />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">编辑策略</h1>
      </div>
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">策略名称</label>
            <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="输入策略名称" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">策略描述</label>
            <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={4} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="描述您的策略..." required />
          </div>
          {formData.strategyType === StrategyType.STOCK_SELECTION && (
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6 border border-purple-200 dark:border-purple-800">
              <div className="flex items-center mb-4">
                <Target className="w-5 h-5 text-purple-600 mr-2" />
                <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100">选股策略配置</h3>
              </div>
              <div className="mb-6">
                <IntelligentStockRecommender strategyDescription={formData.description} onRecommendationsChange={setStockRecommendations} maxRecommendations={8} />
              </div>
              <div>
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">手动选择股票</h4>
                <StockSelector selectedStocks={selectedStocks} onStocksChange={setSelectedStocks} maxSelections={20} />
              </div>
            </div>
          )}
          {formData.strategyType === StrategyType.BACKTEST && (
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 border border-green-200 dark:border-green-800">
              <div className="flex items-center mb-4">
                <BarChart3 className="w-5 h-5 text-green-600 mr-2" />
                <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">回测策略配置</h3>
              </div>
              <div>
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">选择回测股票</h4>
                <StockSelector selectedStocks={positions} onStocksChange={setPositions} maxSelections={10} />
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">策略类型</label>
            <StrategyTypeDropdown value={formData.strategyType} onChange={val => setFormData({ ...formData, strategyType: val as 'stock_selection' | 'backtest' })} options={STRATEGY_TYPE_OPTIONS.slice(1)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">策略分类</label>
            <CategoryDropdown value={formData.category} onChange={val => setFormData({ ...formData, category: val })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">难度等级</label>
            <select value={formData.difficulty} onChange={e => setFormData({ ...formData, difficulty: e.target.value as 'easy' | 'medium' | 'hard' })} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
              <option value="easy">简单</option>
              <option value="medium">中等</option>
              <option value="hard">困难</option>
            </select>
          </div>
          <div className="flex items-center space-x-3">
            <input type="checkbox" id="isPublic" checked={formData.isPublic} onChange={e => setFormData({ ...formData, isPublic: e.target.checked })} className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" />
            <label htmlFor="isPublic" className="text-sm font-medium text-gray-700 dark:text-gray-300">公开分享此策略</label>
          </div>
          <div className="flex items-center space-x-4">
            <button type="button" onClick={onBack} className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">取消</button>
            <button type="submit" className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all duration-300 shadow-sm hover:shadow-glow">保存修改</button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default MyStrategiesPage; 