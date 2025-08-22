/**
 * 复盘页面 - 模块化版本
 * Review Page Component - Modular Version
 */

import React from 'react';
import { useReviewData } from '../hooks';
import { ReviewList } from './ReviewList';
import { ReviewEditor } from './ReviewEditor';

export const ReviewPage: React.FC = () => {
  const {
    reviews,
    selectedReview,
    loading,
    error,
    createReview,
    updateReview,
    deleteReview,
    selectReview,
  } = useReviewData();

  const handleCreateReview = async () => {
    await createReview();
  };

  const handleUpdateReview = async (reviewId: string, updates: any) => {
    await updateReview(reviewId, updates);
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (window.confirm('确定要删除这篇复盘吗？')) {
      await deleteReview(reviewId);
    }
  };

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="text-red-500 mb-4">加载失败</div>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-900">
      {/* 左侧复盘列表 */}
      <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <ReviewList
          reviews={reviews}
          selectedReview={selectedReview}
          onSelectReview={selectReview}
          onCreateReview={handleCreateReview}
          onDeleteReview={handleDeleteReview}
        />
        
        {/* 加载指示器 */}
        {loading && (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
            加载中...
          </div>
        )}
      </div>

      {/* 右侧编辑区域 */}
      <div className="flex-1 overflow-hidden">
        <ReviewEditor 
          review={selectedReview} 
          onUpdateReview={handleUpdateReview} 
        />
      </div>
    </div>
  );
};

export default ReviewPage;