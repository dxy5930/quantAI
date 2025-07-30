import React, { useState, useEffect } from 'react';
import { Heart, Bookmark, Share2, Check } from 'lucide-react';
import { useStore } from '../../hooks';
import { Strategy, SharedStrategy } from '../../types';
import { shareStrategyWithCallback } from '../../utils';
import { strategyApi } from '../../services/api/strategyApi';

interface StrategyInteractionButtonsProps {
  strategy: Strategy | SharedStrategy | null;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  layout?: 'horizontal' | 'vertical';
  userEngagement?: {
    isLiked: boolean;
    isFavorited: boolean;
  } | null;
  onEngagementChange?: (engagement: { isLiked: boolean; isFavorited: boolean }) => void;
}

export const StrategyInteractionButtons: React.FC<StrategyInteractionButtonsProps> = ({
  strategy,
  className = '',
  size = 'md',
  layout = 'horizontal',
  userEngagement,
  onEngagementChange,
}) => {
  const { strategy: strategyStore, app, user } = useStore();
  const [isLiked, setIsLiked] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [shareClicked, setShareClicked] = useState(false);

  // 初始化状态
  useEffect(() => {
    if (userEngagement) {
      setIsLiked(userEngagement.isLiked || false);
      setIsFavorited(userEngagement.isFavorited || false);
    } else {
      setIsLiked(false);
      setIsFavorited(false);
    }
  }, [userEngagement]);

  // 如果没有策略数据，不渲染组件
  if (!strategy) {
    return null;
  }

  // 尺寸配置
  const sizeConfig = {
    sm: { button: 'px-3 py-1.5', icon: 'w-4 h-4', text: 'text-xs' },
    md: { button: 'px-3 py-2', icon: 'w-4 h-4', text: 'text-sm' },
    lg: { button: 'px-4 py-2.5', icon: 'w-5 h-5', text: 'text-base' },
  };

  const currentSize = sizeConfig[size];

  // 点赞处理
  const handleLike = async () => {
    if (!user.isAuthenticated) {
      app.showInfo('请先登录');
      return;
    }

    if (!strategy.id || actionLoading) return;

    try {
      setActionLoading(true);

      const result = await strategyStore.likeStrategy(strategy.id);
      setIsLiked(result || false);

      // 更新策略数据
      if (result) {
        strategy.likes = (strategy.likes || 0) + 1;
        app.showSuccess('点赞成功');
      } else {
        strategy.likes = Math.max(0, (strategy.likes || 0) - 1);
        app.showSuccess('取消点赞');
      }

      // 通知父组件状态变化
      onEngagementChange?.({
        isLiked: result || false,
        isFavorited: isFavorited || false,
      });
    } catch (error: any) {
      console.error('点赞操作失败:', error);
      app.showError(error.message || '操作失败，请重试');
    } finally {
      setActionLoading(false);
    }
  };

  // 收藏处理
  const handleFavorite = async () => {
    if (!user.isAuthenticated) {
      app.showInfo('请先登录');
      return;
    }

    if (!strategy.id || actionLoading) return;

    try {
      setActionLoading(true);

      const result = await strategyStore.addToFavorites(strategy.id);
      setIsFavorited(result || false);

      // 更新策略数据
      if (result) {
        strategy.favorites = (strategy.favorites || 0) + 1;
        app.showSuccess('收藏成功');
      } else {
        strategy.favorites = Math.max(0, (strategy.favorites || 0) - 1);
        app.showSuccess('取消收藏');
      }

      // 通知父组件状态变化
      onEngagementChange?.({
        isLiked: isLiked || false,
        isFavorited: result || false,
      });
    } catch (error: any) {
      console.error('收藏操作失败:', error);
      app.showError(error.message || '操作失败，请重试');
    } finally {
      setActionLoading(false);
    }
  };

  // 分享处理
  const handleShare = async () => {
    if (!strategy.id) return;

    setShareClicked(true);

    await shareStrategyWithCallback(strategy.id, {
      strategyName: strategy.name,
      generateShareLink: strategyApi.generateShareLink,
      onSuccess: () => {
        app.showSuccess('分享链接已复制到剪贴板');
      },
      onError: (error) => {
        app.showError(error);
        setShareClicked(false);
      }
    });

    // 2秒后重置状态
    setTimeout(() => {
      setShareClicked(false);
    }, 2000);
  };

  const containerClasses = `
    ${layout === 'vertical' ? 'flex flex-col space-y-2' : 'flex items-center space-x-2'}
    ${className}
  `.trim();

  const buttonBaseClasses = `
    ${currentSize.button}
    flex items-center justify-center space-x-1 
    rounded-lg border transition-all duration-300
    disabled:opacity-50 disabled:cursor-not-allowed
  `.trim();

  return (
    <div className={containerClasses}>
      {/* 点赞按钮 */}
      <button
        onClick={handleLike}
        disabled={actionLoading || !user.isAuthenticated}
        className={`${buttonBaseClasses} ${
          isLiked
            ? 'bg-red-50 border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'
            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-600'
        }`}
        title={isLiked ? '取消点赞' : '点赞'}
      >
        <Heart className={`${currentSize.icon} ${isLiked ? 'fill-current' : ''}`} />
        <span className={currentSize.text}>{strategy.likes || 0}</span>
      </button>

      {/* 收藏按钮 */}
      <button
        onClick={handleFavorite}
        disabled={actionLoading || !user.isAuthenticated}
        className={`${buttonBaseClasses} ${
          isFavorited
            ? 'bg-yellow-50 border-yellow-200 text-yellow-600 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-400'
            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-600'
        }`}
        title={isFavorited ? '取消收藏' : '收藏'}
      >
        <Bookmark className={`${currentSize.icon} ${isFavorited ? 'fill-current' : ''}`} />
        <span className={currentSize.text}>{strategy.favorites || 0}</span>
      </button>

      {/* 分享按钮 */}
      <button
        onClick={handleShare}
        className={`${buttonBaseClasses} ${
          shareClicked
            ? 'bg-green-50 border-green-200 text-green-600 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400'
            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-600'
        }`}
        title="分享策略"
      >
        {shareClicked ? (
          <>
            <Check className={currentSize.icon} />
            <span className={currentSize.text}>已复制</span>
          </>
        ) : (
          <>
            <Share2 className={currentSize.icon} />
            <span className={currentSize.text}>分享</span>
          </>
        )}
      </button>
    </div>
  );
}; 