import React from 'react';
import { TrendingUp, Users, Star, Clock } from 'lucide-react';

interface Stat {
  label: string;
  value: string | number;
  icon: string;
}

interface StatsGridProps {
  stats: Stat[];
  loading?: boolean;
}

const iconMap = {
  TrendingUp,
  Users,
  Star,
  Clock
};

export const StatsGrid: React.FC<StatsGridProps> = ({ stats, loading = false }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-slide-up">
      {stats.map((stat, index) => {
        const IconComponent = iconMap[stat.icon as keyof typeof iconMap];
        const isLoading = loading || stat.value === '-';
        
        return (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 text-center hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-sm transition-all duration-300 group">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:shadow-glow transition-all duration-300">
              <IconComponent className="w-6 h-6 text-white" />
            </div>
            <div className={`text-2xl font-bold text-gray-900 dark:text-white ${isLoading ? 'animate-pulse' : ''}`}>
              {isLoading ? (
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mx-auto w-16"></div>
              ) : (
                stat.value
              )}
            </div>
            <div className="text-gray-600 dark:text-gray-400 text-sm mt-1">{stat.label}</div>
          </div>
        );
      })}
    </div>
  );
};