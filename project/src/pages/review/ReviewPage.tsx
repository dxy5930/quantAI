import React, { useState } from 'react';
import { ReviewList } from './components/ReviewList';
import { ReviewEditor } from './components/ReviewEditor';

interface Review {
  id: string;
  title: string;
  date: string;
  status: 'draft' | 'completed';
  summary?: string;
}

export const ReviewPage: React.FC = () => {
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [reviews, setReviews] = useState<Review[]>([
    {
      id: '1',
      title: '2024-01-15 交易复盘',
      date: '2024-01-15',
      status: 'completed',
      summary: '今日持仓股票表现分析...'
    },
    {
      id: '2',
      title: '2024-01-14 交易复盘',
      date: '2024-01-14',
      status: 'draft',
      summary: '市场波动较大，需要重新审视...'
    }
  ]);

  const handleSelectReview = (review: Review) => {
    setSelectedReview(review);
  };

  const handleCreateReview = () => {
    const newReview: Review = {
      id: Date.now().toString(),
      title: `${new Date().toISOString().split('T')[0]} 交易复盘`,
      date: new Date().toISOString().split('T')[0],
      status: 'draft'
    };
    setReviews(prev => [newReview, ...prev]);
    setSelectedReview(newReview);
  };

  const handleUpdateReview = (reviewId: string, updates: Partial<Review>) => {
    setReviews(prev => 
      prev.map(review => 
        review.id === reviewId ? { ...review, ...updates } : review
      )
    );
    if (selectedReview?.id === reviewId) {
      setSelectedReview(prev => prev ? { ...prev, ...updates } : prev);
    }
  };

  const handleDeleteReview = (reviewId: string) => {
    setReviews(prev => prev.filter(review => review.id !== reviewId));
    if (selectedReview?.id === reviewId) {
      setSelectedReview(null);
    }
  };

  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-900">
      {/* 左侧复盘列表 */}
      <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <ReviewList
          reviews={reviews}
          selectedReview={selectedReview}
          onSelectReview={handleSelectReview}
          onCreateReview={handleCreateReview}
          onDeleteReview={handleDeleteReview}
        />
      </div>

      {/* 中间编辑区域 */}
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