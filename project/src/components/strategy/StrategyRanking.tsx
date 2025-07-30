import React from 'react';
import { Trophy, TrendingUp, Star, Users } from 'lucide-react';

const topStrategies = [
  {
    name: '移动平均交叉',
    author: 'AI智能',
    return: 0.234,
    users: 1240,
    rating: 4.8,
    rank: 1
  },
  {
    name: 'RSI超卖反弹',
    author: '量化专家',
    return: 0.198,
    users: 987,
    rating: 4.6,
    rank: 2
  },
  {
    name: 'MACD信号',
    author: '策略大师',
    return: 0.176,
    users: 856,
    rating: 4.5,
    rank: 3
  },
  {
    name: '布林带策略',
    author: '技术分析师',
    return: 0.154,
    users: 723,
    rating: 4.4,
    rank: 4
  },
  {
    name: '动量策略',
    author: '趋势猎手',
    return: 0.142,
    users: 612,
    rating: 4.3,
    rank: 5
  }
];

export const StrategyRanking: React.FC = () => {
  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'text-yellow-400';
      case 2: return 'text-gray-300';
      case 3: return 'text-orange-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm animate-slide-up">
      <div className="flex items-center space-x-2 mb-6">
        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-2 rounded-lg">
          <Trophy className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">策略排行榜</h2>
      </div>
      
      <div className="space-y-4">
        {topStrategies.map((strategy, index) => (
          <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 cursor-pointer group border border-gray-200 dark:border-gray-600">
            <div className="flex items-center space-x-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${getRankColor(strategy.rank)} bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-sm`}>
                #{strategy.rank}
              </div>
              <div>
                <p className="text-gray-900 dark:text-white font-medium group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors">{strategy.name}</p>
                <p className="text-gray-600 dark:text-gray-400 text-sm">by {strategy.author}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-1">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-green-500 font-medium">
                  {((strategy.return || 0) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400 text-sm">{strategy.users}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                <span className="text-gray-600 dark:text-gray-400 text-sm">{strategy.rating}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};