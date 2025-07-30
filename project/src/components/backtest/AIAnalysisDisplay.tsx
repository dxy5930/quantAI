import React from 'react';
import { Brain, TrendingUp, AlertTriangle, Lightbulb } from 'lucide-react';
import { AIAnalysis } from '../../services/api/types';
import { formatAnalysisText } from '../../utils/analysisHelpers';

interface AIAnalysisDisplayProps {
  aiAnalysis: AIAnalysis;
}

export const AIAnalysisDisplay: React.FC<AIAnalysisDisplayProps> = ({ aiAnalysis }) => {
  // 获取投资评级的颜色和图标
  const getRatingStyle = (rating: string) => {
    const ratingLower = rating.toLowerCase();
    if (ratingLower.includes('强烈推荐') || ratingLower.includes('strongly_buy')) {
      return {
        color: 'text-green-600 dark:text-green-400',
        bg: 'bg-green-50 dark:bg-green-900/20',
        border: 'border-green-200 dark:border-green-800',
        icon: '🚀'
      };
    } else if (ratingLower.includes('推荐') || ratingLower.includes('buy')) {
      return {
        color: 'text-green-600 dark:text-green-400',
        bg: 'bg-green-50 dark:bg-green-900/20',
        border: 'border-green-200 dark:border-green-800',
        icon: '📈'
      };
    } else if (ratingLower.includes('中性') || ratingLower.includes('hold')) {
      return {
        color: 'text-yellow-600 dark:text-yellow-400',
        bg: 'bg-yellow-50 dark:bg-yellow-900/20',
        border: 'border-yellow-200 dark:border-yellow-800',
        icon: '⚖️'
      };
    } else if (ratingLower.includes('谨慎') || ratingLower.includes('sell')) {
      return {
        color: 'text-red-600 dark:text-red-400',
        bg: 'bg-red-50 dark:bg-red-900/20',
        border: 'border-red-200 dark:border-red-800',
        icon: '⚠️'
      };
    } else {
      return {
        color: 'text-red-600 dark:text-red-400',
        bg: 'bg-red-50 dark:bg-red-900/20',
        border: 'border-red-200 dark:border-red-800',
        icon: '❌'
      };
    }
  };

  const ratingStyle = getRatingStyle(aiAnalysis.investment_rating);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-center space-x-2 mb-6">
        <Brain className="h-6 w-6 text-purple-600 dark:text-purple-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          AI 智能分析
        </h3>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {new Date(aiAnalysis.generated_at).toLocaleString('zh-CN')}
        </span>
      </div>

      {/* 投资评级 */}
      <div className={`${ratingStyle.bg} ${ratingStyle.border} border rounded-lg p-4 mb-6`}>
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{ratingStyle.icon}</span>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white">投资评级</h4>
            <p className={`text-lg font-semibold ${ratingStyle.color}`}>
              {aiAnalysis.investment_rating}
            </p>
          </div>
        </div>
      </div>

      {/* AI分析文本 */}
      <div className="mb-6">
        <div className="flex items-center space-x-2 mb-3">
          <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h4 className="font-medium text-gray-900 dark:text-white">专业分析</h4>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
            {formatAnalysisText(aiAnalysis.analysis_text)}
          </p>
        </div>
      </div>

      {/* 优化建议 */}
      {aiAnalysis.optimization_suggestions && aiAnalysis.optimization_suggestions.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center space-x-2 mb-3">
            <Lightbulb className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <h4 className="font-medium text-gray-900 dark:text-white">优化建议</h4>
          </div>
          <div className="space-y-2">
            {aiAnalysis.optimization_suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3"
              >
                <p className="text-amber-800 dark:text-amber-200 text-sm">
                  {suggestion}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 风险提示 */}
      {aiAnalysis.risk_warnings && aiAnalysis.risk_warnings.length > 0 && (
        <div>
          <div className="flex items-center space-x-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <h4 className="font-medium text-gray-900 dark:text-white">风险提示</h4>
          </div>
          <div className="space-y-2">
            {aiAnalysis.risk_warnings.map((warning, index) => (
              <div
                key={index}
                className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3"
              >
                <p className="text-red-800 dark:text-red-200 text-sm">
                  {warning}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAnalysisDisplay; 