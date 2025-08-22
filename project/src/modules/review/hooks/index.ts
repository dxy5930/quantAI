/**
 * 复盘模块自定义Hooks
 * Review Module Custom Hooks
 */

import { useState, useEffect, useCallback } from 'react';
import { reviewApiService } from '../services/api';
import { reviewAIService } from '../services/ai';
import { Review, StockPosition, ReviewContext, AIAnalysisResult } from '../types';

/**
 * 复盘数据管理Hook
 */
export const useReviewData = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 加载复盘列表
  const loadReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await reviewApiService.list();
      if (res.success) {
        const items = res.data.items.map((r) => ({
          id: r.reviewId || r.id,
          title: r.title,
          date: r.reviewDate,
          status: r.status,
          summary: r.summary,
          content: r.content,
          reviewId: r.reviewId,
        }));
        setReviews(items);
        if (items.length && !selectedReview) {
          setSelectedReview(items[0]);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载复盘列表失败');
    } finally {
      setLoading(false);
    }
  }, [selectedReview]);

  // 创建新复盘
  const createReview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await reviewApiService.create();
      if (res.success) {
        const r = res.data;
        const newReview: Review = {
          id: r.reviewId || r.id,
          reviewId: r.reviewId,
          title: r.title,
          date: r.reviewDate,
          status: r.status,
          summary: r.summary,
          content: r.content,
        };
        setReviews((prev) => [newReview, ...prev]);
        setSelectedReview(newReview);
        return newReview;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建复盘失败');
    } finally {
      setLoading(false);
    }
    return null;
  }, []);

  // 更新复盘
  const updateReview = useCallback(async (reviewId: string, updates: Partial<Review>) => {
    setLoading(true);
    setError(null);
    try {
      const res = await reviewApiService.update(reviewId, {
        title: updates.title,
        summary: updates.summary,
        status: updates.status,
        content: updates.content,
        reviewDate: updates.date,
      } as any);
      
      if (res.success) {
        setReviews((prev) => prev.map((r) => (r.id === reviewId ? { ...r, ...updates } : r)));
        if (selectedReview?.id === reviewId) {
          setSelectedReview((prev) => (prev ? { ...prev, ...updates } : prev));
        }
        return true;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新复盘失败');
    } finally {
      setLoading(false);
    }
    return false;
  }, [selectedReview]);

  // 删除复盘
  const deleteReview = useCallback(async (reviewId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await reviewApiService.remove(reviewId);
      if (res.success) {
        setReviews((prev) => prev.filter((r) => r.id !== reviewId));
        if (selectedReview?.id === reviewId) {
          setSelectedReview(null);
        }
        return true;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除复盘失败');
    } finally {
      setLoading(false);
    }
    return false;
  }, [selectedReview]);

  // 选择复盘
  const selectReview = useCallback((review: Review) => {
    setSelectedReview(review);
  }, []);

  // 初始化加载
  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  return {
    reviews,
    selectedReview,
    loading,
    error,
    loadReviews,
    createReview,
    updateReview,
    deleteReview,
    selectReview,
  };
};

/**
 * AI功能管理Hook
 */
export const useReviewAI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 生成完整复盘
  const generateFullReview = useCallback(async (context: ReviewContext): Promise<AIAnalysisResult | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await reviewAIService.generateFullReview(context);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成完整复盘失败');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // 股票表现分析
  const analyzeStockPerformance = useCallback(async (positions: StockPosition[]): Promise<AIAnalysisResult | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await reviewAIService.analyzeStockPerformance(positions);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : '股票分析失败');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // 市场环境分析
  const analyzeMarketCondition = useCallback(async (date: string): Promise<AIAnalysisResult | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await reviewAIService.analyzeMarketCondition(date);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : '市场分析失败');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // 生成投资建议
  const generateInvestmentSuggestions = useCallback(async (context: ReviewContext): Promise<AIAnalysisResult | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await reviewAIService.generateInvestmentSuggestions(context);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成建议失败');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    generateFullReview,
    analyzeStockPerformance,
    analyzeMarketCondition,
    generateInvestmentSuggestions,
  };
};

/**
 * 编辑器状态管理Hook
 */
export const useReviewEditor = (review: Review | null, onUpdateReview: (reviewId: string, updates: Partial<Review>) => void) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [summary, setSummary] = useState('');

  // 同步review数据
  useEffect(() => {
    if (review) {
      setTitle(review.title);
      setSummary(review.summary || '');
      setContent(review.content || `# ${review.title}`);
      setIsEditing(false);
    } else {
      setTitle('');
      setContent('');
      setSummary('');
    }
  }, [review]);

  // 保存复盘
  const save = useCallback(() => {
    if (!review) return;
    
    onUpdateReview(review.id, {
      title,
      summary,
      status: 'completed',
      content,
    });
    setIsEditing(false);
  }, [review, title, summary, content, onUpdateReview]);

  // 开始编辑
  const startEdit = useCallback(() => {
    setIsEditing(true);
  }, []);

  // 取消编辑
  const cancelEdit = useCallback(() => {
    if (review) {
      setTitle(review.title);
      setSummary(review.summary || '');
      setContent(review.content || `# ${review.title}`);
    }
    setIsEditing(false);
  }, [review]);

  // 添加内容
  const appendContent = useCallback((newContent: string) => {
    setContent(prev => prev + '\n\n' + newContent);
  }, []);

  return {
    isEditing,
    title,
    content,
    summary,
    setTitle,
    setContent,
    setSummary,
    save,
    startEdit,
    cancelEdit,
    appendContent,
  };
};

/**
 * 模态框状态管理Hook
 */
export const useReviewModals = () => {
  const [showStockModal, setShowStockModal] = useState(false);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [showStreamingAI, setShowStreamingAI] = useState(false);
  const [showAIOptions, setShowAIOptions] = useState(false);

  const openStockModal = useCallback(() => setShowStockModal(true), []);
  const closeStockModal = useCallback(() => setShowStockModal(false), []);
  
  const openAISuggestions = useCallback(() => setShowAISuggestions(true), []);
  const closeAISuggestions = useCallback(() => setShowAISuggestions(false), []);
  
  const openStreamingAI = useCallback(() => setShowStreamingAI(true), []);
  const closeStreamingAI = useCallback(() => setShowStreamingAI(false), []);
  
  const toggleAIOptions = useCallback(() => setShowAIOptions(prev => !prev), []);
  const closeAIOptions = useCallback(() => setShowAIOptions(false), []);

  return {
    showStockModal,
    showAISuggestions,
    showStreamingAI,
    showAIOptions,
    openStockModal,
    closeStockModal,
    openAISuggestions,
    closeAISuggestions,
    openStreamingAI,
    closeStreamingAI,
    toggleAIOptions,
    closeAIOptions,
  };
};