import React from 'react';
import { Plus, FileText, Calendar, Clock, Trash2 } from 'lucide-react';

interface Review {
  id: string;
  title: string;
  date: string;
  status: 'draft' | 'completed';
  summary?: string;
}

interface ReviewListProps {
  reviews: Review[];
  selectedReview: Review | null;
  onSelectReview: (review: Review) => void;
  onCreateReview: () => void;
  onDeleteReview: (reviewId: string) => void;
}

export const ReviewList: React.FC<ReviewListProps> = ({
  reviews,
  selectedReview,
  onSelectReview,
  onCreateReview,
  onDeleteReview
}) => {
  const getStatusColor = (status: Review['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30';
      case 'draft':
        return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30';
      default:
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/30';
    }
  };

  const getStatusText = (status: Review['status']) => {
    switch (status) {
      case 'completed':
        return '已完成';
      case 'draft':
        return '草稿';
      default:
        return '未知';
    }
  };

  return (
    <>
      {/* 顶部标题和新建按钮 */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            交易复盘
          </h2>
          <button
            onClick={onCreateReview}
            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center"
            title="新建复盘"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          共 {reviews.length} 篇复盘
        </div>
      </div>

      {/* 复盘列表 - 可滚动区域 */}
      <div className="flex-1 overflow-y-auto">
        {reviews.length === 0 ? (
          <div className="p-6 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 mb-2">暂无复盘记录</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              点击上方 + 按钮创建第一篇复盘
            </p>
          </div>
        ) : (
          <div className="p-2">
            {reviews.map((review) => (
              <div
                key={review.id}
                className={`relative p-3 mb-2 rounded-lg cursor-pointer transition-all duration-200 group ${
                  selectedReview?.id === review.id
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700'
                    : 'bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                onClick={() => onSelectReview(review)}
              >
                {/* 删除按钮 */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteReview(review.id);
                  }}
                  className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="删除复盘"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                {/* 标题 */}
                <h3 className="font-medium text-gray-900 dark:text-white mb-2 pr-8 line-clamp-1">
                  {review.title}
                </h3>

                {/* 日期和状态 */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <Calendar className="w-3 h-3 mr-1" />
                    {review.date}
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(review.status)}`}>
                    {getStatusText(review.status)}
                  </span>
                </div>

                {/* 摘要 */}
                {review.summary && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {review.summary}
                  </p>
                )}

                {/* 最后修改时间 */}
                <div className="flex items-center text-xs text-gray-500 dark:text-gray-500 mt-2">
                  <Clock className="w-3 h-3 mr-1" />
                  最后修改: {review.date}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default ReviewList; 