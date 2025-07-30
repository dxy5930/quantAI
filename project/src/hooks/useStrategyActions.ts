import { useState } from 'react';
import { shareStrategy } from '../utils/shareUtils';

export interface UseStrategyActionsProps {
  strategyId?: string;
  strategyName?: string;
  onSuccess?: (message: string, data?: any) => void;
  onError?: (error: string) => void;
}

export interface StrategyActionsResult {
  // Loading 状态
  isLoading1: boolean;
  isLoading2: boolean;
  isLoading3: boolean;
  
  // 通用操作方法
  executeAction1: (apiFunction?: (id: string) => Promise<any>) => Promise<void>;
  executeAction2: (apiFunction: (id: string) => Promise<any>) => Promise<void>;
  executeAction3: (apiFunction: (id: string) => Promise<any>) => Promise<void>;
  
  // 重置状态
  reset: () => void;
  
  // 便捷别名（保持向后兼容）
  isSharing: boolean;
  isPublishing: boolean;
  handleShare: (generateShareLink?: (id: string) => Promise<any>) => Promise<void>;
  handlePublish: (publishApi: (id: string) => Promise<any>) => Promise<void>;
}

/**
 * 通用策略操作 Hook - 可扩展的操作状态管理
 * @param props 配置参数
 * @returns 操作方法和状态
 */
export const useStrategyActions = ({
  strategyId,
  strategyName,
  onSuccess,
  onError,
}: UseStrategyActionsProps): StrategyActionsResult => {
  const [isLoading1, setIsLoading1] = useState(false);  // 通常用于分享
  const [isLoading2, setIsLoading2] = useState(false);  // 通常用于发布
  const [isLoading3, setIsLoading3] = useState(false);  // 预留扩展

  /**
   * 通用操作执行器
   * @param loadingSetter loading状态设置函数
   * @param apiFunction API函数
   * @param successMessage 成功消息
   */
  const executeGenericAction = async (
    loadingSetter: (loading: boolean) => void,
    apiFunction: (id: string) => Promise<any>,
    successMessage: string
  ) => {
    if (!strategyId) return;

    try {
      loadingSetter(true);
      const result = await apiFunction(strategyId);

      if (result.success) {
        onSuccess?.(successMessage, result.data);
      } else {
        onError?.(result.message || '操作失败，请重试');
      }
    } catch (error: any) {
      onError?.(error.message || '操作失败，请重试');
    } finally {
      loadingSetter(false);
    }
  };

  /**
   * 操作1：通常用于分享功能
   * @param apiFunction 可选的API函数，默认使用内置分享逻辑
   */
  const executeAction1 = async (apiFunction?: (id: string) => Promise<any>) => {
    if (!strategyId || isLoading1) return;

    if (apiFunction) {
      await executeGenericAction(setIsLoading1, apiFunction, '操作成功');
    } else {
      // 默认分享逻辑
      try {
        setIsLoading1(true);
        const result = await shareStrategy(strategyId, strategyName, apiFunction);
        
        if (result.success) {
          onSuccess?.('分享链接已复制到剪贴板', result.shareUrl);
        } else {
          onError?.(result.error || '复制链接失败，请重试');
        }
      } catch (error: any) {
        onError?.(error.message || '分享失败，请重试');
      } finally {
        setIsLoading1(false);
      }
    }
  };

  /**
   * 操作2：通用操作（如发布、保存等）
   * @param apiFunction API函数
   */
  const executeAction2 = async (apiFunction: (id: string) => Promise<any>) => {
    if (!strategyId || isLoading2) return;
    await executeGenericAction(setIsLoading2, apiFunction, '操作成功');
  };

  /**
   * 操作3：预留扩展操作
   * @param apiFunction API函数
   */
  const executeAction3 = async (apiFunction: (id: string) => Promise<any>) => {
    if (!strategyId || isLoading3) return;
    await executeGenericAction(setIsLoading3, apiFunction, '操作成功');
  };

  /**
   * 重置所有状态
   */
  const reset = () => {
    setIsLoading1(false);
    setIsLoading2(false);
    setIsLoading3(false);
  };

  return {
    // 通用状态和方法
    isLoading1,
    isLoading2, 
    isLoading3,
    executeAction1,
    executeAction2,
    executeAction3,
    reset,
    
    // 便捷别名（保持向后兼容）
    isSharing: isLoading1,
    isPublishing: isLoading2,
    handleShare: executeAction1,
    handlePublish: executeAction2,
  };
}; 