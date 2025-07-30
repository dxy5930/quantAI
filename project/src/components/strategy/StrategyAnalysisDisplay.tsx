import React from 'react';
import { MessageSquare, Tags, Info } from 'lucide-react';

interface KeywordTag {
  id: string;
  text: string;
  type?: string;
  confidence?: number;
}

interface StrategyAnalysisDisplayProps {
  originalQuery?: string;
  keywords?: KeywordTag[];
  className?: string;
}

const StrategyAnalysisDisplay: React.FC<StrategyAnalysisDisplayProps> = ({
  originalQuery,
  keywords = [],
  className = ''
}) => {
  // 根据关键词类型获取颜色
  const getTagColor = (type?: string) => {
    switch (type) {
      case 'technical':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'fundamental':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'sector':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'timeframe':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'condition':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  // 如果没有数据，不显示组件
  if (!originalQuery && (!keywords || keywords.length === 0)) {
    return null;
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm ${className}`}>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        <MessageSquare className="inline h-5 w-5 mr-2" />
        策略分析
      </h2>

      <div className="space-y-6">
        {/* 原始语句 */}
        {originalQuery && (
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                原始语句
              </h3>
              <Info className="h-4 w-4 text-gray-400" />
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
              <p className="text-gray-900 dark:text-white leading-relaxed">
                "{originalQuery}"
              </p>
            </div>
          </div>
        )}

        {/* 拆分关键词 */}
        {keywords && keywords.length > 0 && (
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                关键词解析
              </h3>
              <Tags className="h-4 w-4 text-gray-400" />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                ({keywords.length} 个关键词)
              </span>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {keywords.map((keyword) => (
                <span
                  key={keyword.id}
                  className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${getTagColor(keyword.type)}`}
                  title={keyword.confidence ? `置信度: ${(keyword.confidence * 100).toFixed(1)}%` : undefined}
                >
                  <Tags className="h-3 w-3 mr-1.5" />
                  {keyword.text}
                  {keyword.confidence && (
                    <span className="ml-1.5 text-xs opacity-75">
                      {(keyword.confidence * 100).toFixed(0)}%
                    </span>
                  )}
                </span>
              ))}
            </div>

            {/* 关键词类型说明 */}
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="text-xs text-blue-800 dark:text-blue-300">
                <div className="font-medium mb-1">关键词类型说明：</div>
                <div className="space-y-1">
                  <div><span className="inline-block w-3 h-3 bg-blue-500 rounded-full mr-2"></span>技术指标</div>
                  <div><span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span>基本面</div>
                  <div><span className="inline-block w-3 h-3 bg-purple-500 rounded-full mr-2"></span>行业板块</div>
                  <div><span className="inline-block w-3 h-3 bg-orange-500 rounded-full mr-2"></span>时间框架</div>
                  <div><span className="inline-block w-3 h-3 bg-indigo-500 rounded-full mr-2"></span>条件表达</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StrategyAnalysisDisplay; 