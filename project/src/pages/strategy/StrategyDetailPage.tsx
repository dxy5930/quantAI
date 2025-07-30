import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate, useParams } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import { useStore, useStrategyDetail } from '../../hooks';
import { StrategyType } from '../../constants/strategyTypes';
import StockSelectionDetailPage from './StockSelectionDetailPage';
import BacktestDetailPage from './BacktestDetailPage';
import { Strategy } from '../../types';
import { Settings, Play, Loader2 } from 'lucide-react';
import { BackButton } from '../../components';

const StrategyDetailPage: React.FC = observer(() => {
  const { id, shareId } = useParams<{ id?: string; shareId?: string }>();
  const { app } = useStore();
  const navigate = useNavigate();
  
  // 使用新的策略详情hook
  const { strategy: sharedStrategy, loading, error } = useStrategyDetail(id, shareId);
  
  // 将共享策略转换为本地策略格式
  const currentStrategy = sharedStrategy as Strategy | null;

  // 加载状态
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-gray-600 dark:text-gray-400">加载策略详情中...</span>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 text-lg mb-4">{error}</div>
        <button
          onClick={() => navigate(shareId ? '/strategy-square' : '/')}
          className="text-blue-400 hover:text-blue-300"
        >
          {shareId ? '返回策略广场' : '返回首页'}
        </button>
      </div>
    );
  }

  // 策略未找到的情况
  if (!currentStrategy) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-lg">策略未找到</div>
        <button
          onClick={() => navigate(shareId ? '/strategy-square' : '/')}
          className="mt-4 text-blue-400 hover:text-blue-300"
        >
          {shareId ? '返回策略广场' : '返回首页'}
        </button>
      </div>
    );
  }

  // 根据策略类型显示不同的详情页面
  if (currentStrategy.strategyType === StrategyType.STOCK_SELECTION) {
    return <StockSelectionDetailPage />;
  }

  if (currentStrategy.strategyType === StrategyType.BACKTEST) {
    return <BacktestDetailPage />;
  }

  // 处理返回逻辑
  const handleBack = () => {
    // 如果是共享策略，返回策略广场
    if (shareId) {
      navigate(ROUTES.STRATEGY_SQUARE);
    } else {
      // 尝试返回上一页，如果失败则返回首页
      if (window.history.length > 1) {
        navigate(-1);
      } else {
        navigate(ROUTES.HOME);
      }
    }
  };

  // 如果是普通策略（非共享策略），显示简单的详情页面和操作按钮
  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* 返回按钮 */}
      <BackButton 
        shareId={shareId}
        strategyId={id}
        fallbackPath="/"
        className="mb-6"
      />

      {/* 策略信息 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {currentStrategy.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              {currentStrategy.description}
            </p>
            <div className="flex items-center space-x-4 mt-4">
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm">
                {currentStrategy.category}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                难度: {currentStrategy.difficulty === 'easy' ? '简单' : currentStrategy.difficulty === 'medium' ? '中等' : '困难'}
              </span>
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex space-x-4">
          <button
            onClick={() => navigate(`/strategy/${id}/config`)}
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300"
          >
            <Settings className="w-5 h-5" />
            <span>配置策略</span>
          </button>
          
          {currentStrategy.strategyType === StrategyType.BACKTEST && (
            <button
              onClick={() => navigate(`/strategy/${id}/config`)}
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300"
            >
              <Play className="w-5 h-5" />
              <span>开始回测</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

export default StrategyDetailPage; 