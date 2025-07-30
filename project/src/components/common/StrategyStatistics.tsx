import React, { useState, useEffect } from 'react';
import { Share2, Users, Heart, Star } from 'lucide-react';
import { strategyApi } from '../../services/api/strategyApi';

interface StatisticsData {
  totalStrategies: number;
  totalUsageCount: number;
  totalLikes: number;
  avgRating: string;
}

const StrategyStatistics: React.FC = () => {
  const [statistics, setStatistics] = useState<StatisticsData>({
    totalStrategies: 0,
    totalUsageCount: 0,
    totalLikes: 0,
    avgRating: '0.0',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStatistics = async () => {
      try {
        const response = await strategyApi.getStatistics();
        if (response.success && response.data) {
          setStatistics(response.data);
        }
      } catch (error) {
        console.error('加载统计数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStatistics();
  }, []);

  const statisticsItems = [
    {
      icon: Share2,
      value: statistics.totalStrategies,
      label: '分享策略',
      gradient: 'from-blue-600 to-purple-600',
    },
    {
      icon: Users,
      value: statistics.totalUsageCount,
      label: '总使用次数',
      gradient: 'from-green-600 to-emerald-600',
    },
    {
      icon: Heart,
      value: statistics.totalLikes,
      label: '总点赞数',
      gradient: 'from-purple-600 to-pink-600',
    },
    {
      icon: Star,
      value: statistics.avgRating,
      label: '平均评分',
      gradient: 'from-yellow-600 to-orange-600',
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm animate-pulse"
          >
            <div className="flex items-center space-x-3">
              <div className="bg-gray-300 dark:bg-gray-600 p-3 rounded-lg w-12 h-12"></div>
              <div>
                <div className="bg-gray-300 dark:bg-gray-600 h-6 w-12 rounded mb-2"></div>
                <div className="bg-gray-300 dark:bg-gray-600 h-4 w-16 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {statisticsItems.map((item, index) => (
        <div
          key={index}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm"
        >
          <div className="flex items-center space-x-3">
            <div className={`bg-gradient-to-r ${item.gradient} p-3 rounded-lg`}>
              <item.icon className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {item.value}
              </div>
              <div className="text-gray-600 dark:text-gray-400 text-sm">
                {item.label}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StrategyStatistics; 