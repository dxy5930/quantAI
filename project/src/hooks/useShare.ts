import { useState, useCallback } from 'react';
import { useStore } from './useStore';
import { shareService, ShareResult } from '../services/shareService';

/**
 * 分享Hook的返回类型
 */
export interface UseShareReturn {
  /** 是否正在分享 */
  isSharing: boolean;
  /** 分享策略 */
  shareStrategy: (strategyId: string, strategyName?: string) => Promise<ShareResult>;
  /** 分享状态（成功后短暂显示） */
  shareSuccess: boolean;
}

/**
 * 统一的分享Hook
 * 
 * @example
 * ```tsx
 * const { isSharing, shareStrategy, shareSuccess } = useShare();
 * 
 * const handleShare = async () => {
 *   await shareStrategy(strategy.id, strategy.name);
 * };
 * ```
 */
export const useShare = (): UseShareReturn => {
  const { app } = useStore();
  const [isSharing, setIsSharing] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  const shareStrategy = useCallback(async (
    strategyId: string, 
    strategyName?: string
  ): Promise<ShareResult> => {
    if (isSharing) {
      return { success: false, error: '正在分享中，请稍候...' };
    }

    setIsSharing(true);
    setShareSuccess(false);

    try {
      // 获取当前域名并拼接详情页路径
      const currentDomain = window.location.origin;
      const shareUrl = `${currentDomain}/strategy/${strategyId}`;
      
      // 直接复制分享链接到剪贴板
      try {
        await navigator.clipboard.writeText(shareUrl);
        app.showSuccess('分享链接已复制到剪贴板');
        setShareSuccess(true);
        // 2秒后重置成功状态
        setTimeout(() => setShareSuccess(false), 2000);
        
        const result = { 
          success: true, 
          shareUrl,
          shareId: strategyId 
        };
        return result;
      } catch (clipboardError) {
        // 如果剪贴板复制失败，降级处理
        app.showError('复制到剪贴板失败，请手动复制链接');
        const result = { 
          success: false, 
          error: '复制到剪贴板失败',
          shareUrl 
        };
        return result;
      }
    } finally {
      setIsSharing(false);
    }
  }, [isSharing, app]);

  return {
    isSharing,
    shareStrategy,
    shareSuccess,
  };
}; 