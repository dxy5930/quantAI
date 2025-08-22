/**
 * AI智能建议组件 - 模块化版本
 * AI Suggestions Component - Modular Version
 */

import React, { useState, useEffect } from 'react';
import { Lightbulb, TrendingUp, AlertTriangle, Target, CheckCircle, Loader2, RefreshCw } from 'lucide-react';
import { reviewAIService } from '../services/ai';
import { AISuggestionsProps, Suggestion, ReviewContext, MarketSentimentIndicators } from '../types';
import { pythonApiClient } from '../../../services/pythonApiClient';

export const AISuggestions: React.FC<AISuggestionsProps> = ({
  review,
  isVisible,
  onClose
}) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [marketSentiment, setMarketSentiment] = useState<MarketSentimentIndicators | null>(null);

  // 当组件可见且有复盘数据时生成建议
  useEffect(() => {
    if (isVisible && review) {
      generateSuggestions();
      fetchMarketSentiment();
    }
  }, [isVisible, review]);

  const generateSuggestions = async () => {
    if (!review) return;

    setIsLoading(true);
    try {
      const reviewContext: ReviewContext = {
        reviewId: review.id,
        title: review.title,
        date: review.date,
        personalNotes: review.summary
      };

      const result = await reviewAIService.generateInvestmentSuggestions(reviewContext);
      
      // 解析建议并转换为结构化格式
      const parsedSuggestions = parseSuggestionsFromContent(result.content, result.suggestions || []);
      setSuggestions(parsedSuggestions);
    } catch (error) {
      console.error('生成AI建议失败:', error);
      // 使用默认建议
      setSuggestions(getDefaultSuggestions());
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMarketSentiment = async () => {
    try {
      const response = await pythonApiClient.getMarketData();
      if (response.success && response.data) {
        const marketData = response.data;
        setMarketSentiment({
          overall: marketData.sentiment,
          confidence: 0.8,
          factors: analyzeFactors(marketData)
        });
      }
    } catch (error) {
      console.error('获取市场情绪失败:', error);
    }
  };

  const parseSuggestionsFromContent = (content: string, suggestions: string[]): Suggestion[] => {
    const parsed: Suggestion[] = [];
    
    // 从AI生成的内容中提取建议
    const lines = content.split('\n');
    let currentCategory = '';
    let currentType: Suggestion['type'] = 'strategy';
    
    for (const line of lines) {
      if (line.startsWith('##')) {
        currentCategory = line.replace('##', '').trim();
        // 根据标题确定建议类型
        if (currentCategory.includes('策略') || currentCategory.includes('优化')) {
          currentType = 'strategy';
        } else if (currentCategory.includes('风险') || currentCategory.includes('控制')) {
          currentType = 'risk';
        } else if (currentCategory.includes('学习') || currentCategory.includes('提升')) {
          currentType = 'learning';
        } else if (currentCategory.includes('行动') || currentCategory.includes('计划')) {
          currentType = 'action';
        }
      } else if (/^[-\d+]\.\s/.test(line.trim())) {
        const suggestionText = line.replace(/^[-\d+]\.\s/, '').trim();
        if (suggestionText.length > 10) {
          parsed.push({
            id: `suggestion-${Date.now()}-${Math.random()}`,
            type: currentType,
            title: suggestionText.substring(0, 50) + (suggestionText.length > 50 ? '...' : ''),
            content: suggestionText,
            priority: determinePriority(suggestionText),
            category: currentCategory
          });
        }
      }
    }

    // 如果解析的建议不够，添加原始建议列表
    suggestions.forEach((suggestion, index) => {
      if (!parsed.find(p => p.content === suggestion)) {
        parsed.push({
          id: `suggestion-fallback-${index}`,
          type: 'action',
          title: suggestion.substring(0, 50) + (suggestion.length > 50 ? '...' : ''),
          content: suggestion,
          priority: 'medium',
          category: '行动建议'
        });
      }
    });

    return parsed.slice(0, 8); // 最多显示8个建议
  };

  const determinePriority = (text: string): Suggestion['priority'] => {
    const highPriorityKeywords = ['立即', '紧急', '重要', '必须', '风险'];
    const lowPriorityKeywords = ['建议', '可以', '尝试', '考虑'];
    
    const lowerText = text.toLowerCase();
    
    if (highPriorityKeywords.some(keyword => lowerText.includes(keyword))) {
      return 'high';
    } else if (lowPriorityKeywords.some(keyword => lowerText.includes(keyword))) {
      return 'low';
    }
    
    return 'medium';
  };

  const getDefaultSuggestions = (): Suggestion[] => [
    {
      id: 'default-1',
      type: 'strategy',
      title: '完善交易策略',
      content: '建立清晰的买入和卖出标准，包括技术指标确认和基本面分析要求。',
      priority: 'high',
      category: '投资策略'
    },
    {
      id: 'default-2',
      type: 'risk',
      title: '设置止损位',
      content: '为每笔交易设置明确的止损位，控制单笔损失在总资金的2-3%以内。',
      priority: 'high',
      category: '风险控制'
    },
    {
      id: 'default-3',
      type: 'learning',
      title: '学习技术分析',
      content: '深入学习常用技术指标和图表模式，提高入场和出场时机的判断能力。',
      priority: 'medium',
      category: '能力提升'
    },
    {
      id: 'default-4',
      type: 'action',
      title: '建立交易日志',
      content: '记录每笔交易的理由、过程和结果，定期回顾和总结经验教训。',
      priority: 'medium',
      category: '行动计划'
    }
  ];

  const analyzeFactors = (marketData: any): string[] => {
    const factors: string[] = [];
    
    // 分析指数表现
    if (marketData.indices && marketData.indices.length > 0) {
      const majorIndices = marketData.indices.filter((index: any) => 
        index.name.includes('上证') || index.name.includes('深证') || index.name.includes('创业板')
      );
      
      const upIndices = majorIndices.filter((index: any) => index.change > 0).length;
      const downIndices = majorIndices.filter((index: any) => index.change < 0).length;
      
      if (upIndices > downIndices) {
        factors.push('主要指数多数上涨');
      } else if (downIndices > upIndices) {
        factors.push('主要指数多数下跌');
      } else {
        factors.push('主要指数涨跌互现');
      }
    }
    
    // 分析成交量
    if (marketData.volume && marketData.volume.changePercent > 10) {
      factors.push('成交量明显放大');
    } else if (marketData.volume && marketData.volume.changePercent < -10) {
      factors.push('成交量显著萎缩');
    }
    
    // 分析热点板块
    if (marketData.hotSectors && marketData.hotSectors.length > 0) {
      factors.push(`热点集中在${marketData.hotSectors.slice(0, 2).join('、')}等板块`);
    }
    
    return factors;
  };

  const getSuggestionIcon = (type: Suggestion['type']) => {
    switch (type) {
      case 'strategy': return <Target className="w-4 h-4" />;
      case 'risk': return <AlertTriangle className="w-4 h-4" />;
      case 'learning': return <Lightbulb className="w-4 h-4" />;
      case 'action': return <CheckCircle className="w-4 h-4" />;
      default: return <Lightbulb className="w-4 h-4" />;
    }
  };

  const getSuggestionColor = (type: Suggestion['type']) => {
    switch (type) {
      case 'strategy': return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30';
      case 'risk': return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30';
      case 'learning': return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30';
      case 'action': return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30';
      default: return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/30';
    }
  };

  const getPriorityColor = (priority: Suggestion['priority']) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30';
      case 'low': return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/30';
      default: return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/30';
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg">
              <Lightbulb className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                AI智能建议
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                基于您的复盘内容生成的专业投资建议
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={generateSuggestions}
              disabled={isLoading}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50"
              title="刷新建议"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>
        </div>

        {/* 市场情绪指标 */}
        {marketSentiment && (
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">当前市场情绪</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {marketSentiment.overall === 'bullish' ? '乐观' : 
                     marketSentiment.overall === 'bearish' ? '悲观' : '中性'} 
                    (置信度: {(marketSentiment.confidence * 100).toFixed(0)}%)
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  主要因素: {marketSentiment.factors.slice(0, 2).join(', ')}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 加载状态 */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400">AI正在分析您的复盘内容...</p>
            </div>
          </div>
        ) : (
          <>
            {/* 建议列表 */}
            <div className="space-y-4">
              {suggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${getSuggestionColor(suggestion.type)}`}>
                        {getSuggestionIcon(suggestion.type)}
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-900 dark:text-white">
                          {suggestion.title}
                        </h5>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {suggestion.category}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(suggestion.priority)}`}>
                            {suggestion.priority === 'high' ? '高优先级' : 
                             suggestion.priority === 'medium' ? '中优先级' : '低优先级'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed ml-11">
                    {suggestion.content}
                  </p>
                </div>
              ))}
            </div>

            {/* 底部提示 */}
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                💡 这些建议基于AI分析生成，请结合个人实际情况合理采纳
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AISuggestions;