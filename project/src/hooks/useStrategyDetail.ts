import { useState, useEffect, useCallback } from 'react';
import { strategyApi } from '../services/api/strategyApi';
import { SharedStrategy } from '../types';

interface UseStrategyDetailReturn {
  strategy: SharedStrategy | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  // 添加用户状态信息
  userEngagement: {
    isLiked: boolean;
    isFavorited: boolean;
  } | null;
}

export const useStrategyDetail = (id?: string, shareId?: string): UseStrategyDetailReturn => {
  const [strategy, setStrategy] = useState<SharedStrategy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userEngagement, setUserEngagement] = useState<{
    isLiked: boolean;
    isFavorited: boolean;
  } | null>(null);

  const strategyId = id || shareId;

  const loadStrategyDetail = useCallback(async () => {
    if (!strategyId) {
      setError('策略ID不能为空');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 直接调用策略详情API
      const response = await strategyApi.getStrategyDetail(strategyId);
      if (response.success && response.data) {
        const strategyData = response.data as any;
        
        // 提取用户状态信息
        if (strategyData.userEngagement) {
          setUserEngagement({
            isLiked: strategyData.userEngagement.isLiked,
            isFavorited: strategyData.userEngagement.isFavorited
          });
          // 从策略数据中移除userEngagement，避免类型错误
          delete strategyData.userEngagement;
        } else {
          setUserEngagement(null);
        }
        
        setStrategy(strategyData as SharedStrategy);
      } else {
        setError('策略未找到');
      }
    } catch (error) {
      console.error('获取策略详情失败:', error);
      setError('获取策略详情失败');
    } finally {
      setLoading(false);
    }
  }, [strategyId]);

  const refetch = useCallback(async () => {
    await loadStrategyDetail();
  }, [loadStrategyDetail]);

  useEffect(() => {
    loadStrategyDetail();
  }, [loadStrategyDetail]);

  return {
    strategy,
    loading,
    error,
    refetch,
    userEngagement
  };
}; 