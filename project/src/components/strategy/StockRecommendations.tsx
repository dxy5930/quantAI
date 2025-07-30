import React from 'react';
import { StockRecommendation } from '../../types';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  AlertTriangle, 
  Shield, 
  ShieldCheck,
  Calendar,
  DollarSign,
  BarChart3,
  Building2
} from 'lucide-react';

interface StockRecommendationsProps {
  recommendations: StockRecommendation[];
  title?: string;
  className?: string;
}

const StockRecommendations: React.FC<StockRecommendationsProps> = ({ 
  recommendations, 
  title = "股票推荐",
  className = ""
}) => {
  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low':
        return <ShieldCheck className="w-4 h-4 text-green-500" />;
      case 'medium':
        return <Shield className="w-4 h-4 text-orange-500" />;
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Shield className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
      case 'medium':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300';
      case 'high':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
      default:
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300';
    }
  };

  const getRiskLabel = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low':
        return '低风险';
      case 'medium':
        return '中等风险';
      case 'high':
        return '高风险';
      default:
        return '未知风险';
    }
  };

  const formatMarketCap = (marketCap: number) => {
    if (!marketCap || marketCap === 0) {
      return '未知';
    }
    if (marketCap >= 1000000000000) {
      return `${(marketCap / 1000000000000).toFixed(1)}万亿`;
    } else if (marketCap >= 1000000000) {
      return `${(marketCap / 1000000000).toFixed(0)}亿`;
    } else if (marketCap >= 1000000) {
      return `${(marketCap / 1000000).toFixed(0)}百万`;
    }
    return marketCap.toString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!recommendations || recommendations.length === 0) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
          <Target className="w-5 h-5 text-purple-600" />
          <span>{title}</span>
        </h3>
        <div className="text-center py-8">
          <div className="text-gray-500 dark:text-gray-400">
            暂无股票推荐
          </div>
          <div className="text-sm text-gray-400 dark:text-gray-500 mt-2">
            请运行策略筛选以获取推荐股票
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
        <Target className="w-5 h-5 text-purple-600" />
        <span>{title}</span>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          ({recommendations.length}只股票)
        </span>
      </h3>

      <div className="space-y-4">
        {recommendations.map((stock, index) => (
          <div
            key={stock.symbol}
            className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                  {stock.symbol.slice(0, 2)}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {stock.name}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {stock.symbol}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-green-600 dark:text-green-400">
                  {stock.score}分
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  推荐评分
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">目标价格:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    ${stock.targetPrice?.toFixed(2) || '-'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Building2 className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">行业:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {stock.sector}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">市值:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatMarketCap(stock.marketCap)}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  {getRiskIcon(stock.riskLevel)}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(stock.riskLevel)}`}>
                    {getRiskLabel(stock.riskLevel)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mb-3">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>推荐理由:</strong> {stock.reason}
              </p>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-1">
                <Calendar className="w-3 h-3" />
                <span>更新时间: {formatDate(stock.updatedAt)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded text-xs">
                  #{index + 1}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-xs text-blue-800 dark:text-blue-200">
          <strong>风险提示:</strong> 以上推荐仅供参考，投资有风险，请根据自身风险承受能力谨慎投资。
        </p>
      </div>
    </div>
  );
};

export default StockRecommendations; 