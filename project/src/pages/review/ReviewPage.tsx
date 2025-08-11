import React, { useEffect, useMemo, useState } from 'react';
import { ReviewList } from './components/ReviewList';
import { ReviewEditor } from './components/ReviewEditor';
import { api } from '../../services/api';

interface Review {
  id: string;
  title: string;
  date: string;
  status: 'draft' | 'completed';
  summary?: string;
  content?: string;
  reviewId?: string;
}

export const ReviewPage: React.FC = () => {
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);

  const loadReviews = async () => {
    const res = await api.review.list();
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
      if (items.length && !selectedReview) setSelectedReview(items[0]);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const handleSelectReview = (review: Review) => {
    setSelectedReview(review);
  };

  const handleCreateReview = async () => {
    const res = await api.review.create();
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
    }
  };

  const handleUpdateReview = async (reviewId: string, updates: Partial<Review>) => {
    const res = await api.review.update(reviewId, {
      title: updates.title,
      summary: updates.summary,
      status: updates.status,
      content: updates.content,
      reviewDate: updates.date,
    } as any);
    if (res.success) {
      setReviews((prev) => prev.map((r) => (r.id === reviewId ? { ...r, ...updates } : r)));
      if (selectedReview?.id === reviewId) setSelectedReview((prev) => (prev ? { ...prev, ...updates } : prev));
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    const res = await api.review.remove(reviewId);
    if (res.success) {
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      if (selectedReview?.id === reviewId) setSelectedReview(null);
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
        <ReviewEditor review={selectedReview} onUpdateReview={handleUpdateReview} />
      </div>
    </div>
  );
};

export default ReviewPage; 